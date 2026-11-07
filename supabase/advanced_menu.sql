-- Xpress POS advanced menu module
-- Idempotent on PostgreSQL 16. Apply after schema.sql and existing menu tables.

create extension if not exists pgcrypto;

create table if not exists public.menu_variant_groups (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  name text not null,
  required boolean not null default false,
  min_select integer not null default 0 check (min_select >= 0),
  max_select integer not null default 1 check (max_select >= min_select),
  sort integer not null default 0,
  unique (menu_item_id, name)
);

alter table public.menu_variants add column if not exists price_paise bigint;
alter table public.menu_variants add column if not exists tax_rate numeric(5,2);
alter table public.menu_variants add column if not exists recipe_multiplier numeric(12,4) not null default 1 check (recipe_multiplier > 0);
alter table public.menu_variants add column if not exists hsn_sac text;
alter table public.menu_variants add column if not exists variant_group_id uuid references public.menu_variant_groups(id) on delete cascade;
alter table public.menu_variants add column if not exists sort integer not null default 0;
alter table public.menu_variants add column if not exists is_available boolean not null default true;

update public.menu_variants set price_paise = round(price * 100)::bigint where price_paise is null and price is not null;

create table if not exists public.combo_offers (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  description text,
  combo_price_paise bigint not null default 0 check (combo_price_paise >= 0),
  pricing_mode text not null default 'fixed' check (pricing_mode in ('fixed','discount_percent','discount_flat')),
  discount_value bigint not null default 0 check (discount_value >= 0),
  is_available boolean not null default true,
  valid_from timestamptz,
  valid_to timestamptz,
  image_path text,
  sort integer not null default 0
);

create table if not exists public.combo_items (
  id uuid primary key default gen_random_uuid(),
  combo_id uuid not null references public.combo_offers(id) on delete cascade,
  menu_item_id uuid not null references public.menu_items(id) on delete restrict,
  variant_id uuid references public.menu_variants(id) on delete restrict,
  quantity numeric(12,3) not null default 1 check (quantity > 0),
  choice_group text,
  min_choices integer not null default 0 check (min_choices >= 0),
  max_choices integer not null default 1 check (max_choices >= min_choices),
  sort integer not null default 0
);

create table if not exists public.price_schedules (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  days_of_week smallint[] not null default '{1,2,3,4,5,6,7}',
  start_time time not null,
  end_time time not null,
  timezone text not null default 'Asia/Kolkata',
  valid_from date,
  valid_to date,
  priority integer not null default 0,
  outlet_ids uuid[] not null default '{}'
);

create table if not exists public.price_schedule_rules (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.price_schedules(id) on delete cascade,
  target_type text not null check (target_type in ('item','category','variant','combo')),
  target_id uuid not null,
  action text not null check (action in ('set_price','percent_off','flat_off','buy_x_get_y')),
  value bigint not null default 0 check (value >= 0),
  buy_qty integer,
  get_qty integer
);

create table if not exists public.menu_item_audit (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  action text not null,
  before jsonb,
  after jsonb,
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists menu_variant_groups_item_idx on public.menu_variant_groups(menu_item_id, sort);
create index if not exists menu_variants_group_idx on public.menu_variants(variant_group_id, sort);
create index if not exists combo_items_combo_idx on public.combo_items(combo_id, sort);
create index if not exists price_schedule_rules_schedule_idx on public.price_schedule_rules(schedule_id);
create index if not exists menu_item_audit_item_idx on public.menu_item_audit(menu_item_id, created_at desc);

-- RLS: all members of the active outlet can read; only owners can write.
do $$ declare t text; begin
  foreach t in array array['menu_variant_groups','menu_variants','combo_offers','combo_items','price_schedules','price_schedule_rules','menu_item_audit'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_read', t);
    execute format('create policy %I on public.%I for select to authenticated using (restaurant_id = (select public.current_restaurant_id()))', t || '_read', t);
  end loop;
end $$;

-- Child tables without restaurant_id use parent outlet ownership.
drop policy if exists combo_items_read on public.combo_items;
create policy combo_items_read on public.combo_items for select to authenticated using (exists (select 1 from public.combo_offers c where c.id = combo_id and c.restaurant_id = (select public.current_restaurant_id())));
drop policy if exists price_schedule_rules_read on public.price_schedule_rules;
create policy price_schedule_rules_read on public.price_schedule_rules for select to authenticated using (exists (select 1 from public.price_schedules s where s.id = schedule_id and s.restaurant_id = (select public.current_restaurant_id())));

do $$ declare t text; begin
  foreach t in array array['menu_variant_groups','menu_variants','combo_offers','price_schedules'] loop
    execute format('drop policy if exists %I on public.%I', t || '_owner_write', t);
    execute format('create policy %I on public.%I for all to authenticated using (restaurant_id = (select public.current_restaurant_id()) and (select public.current_role_name()) = ''owner'') with check (restaurant_id = (select public.current_restaurant_id()) and (select public.current_role_name()) = ''owner'')', t || '_owner_write', t);
  end loop;
end $$;

drop policy if exists combo_items_owner_write on public.combo_items;
create policy combo_items_owner_write on public.combo_items for all to authenticated using (exists (select 1 from public.combo_offers c where c.id = combo_id and c.restaurant_id = (select public.current_restaurant_id()) and (select public.current_role_name()) = 'owner')) with check (exists (select 1 from public.combo_offers c where c.id = combo_id and c.restaurant_id = (select public.current_restaurant_id()) and (select public.current_role_name()) = 'owner'));
drop policy if exists price_schedule_rules_owner_write on public.price_schedule_rules;
create policy price_schedule_rules_owner_write on public.price_schedule_rules for all to authenticated using (exists (select 1 from public.price_schedules s where s.id = schedule_id and s.restaurant_id = (select public.current_restaurant_id()) and (select public.current_role_name()) = 'owner')) with check (exists (select 1 from public.price_schedules s where s.id = schedule_id and s.restaurant_id = (select public.current_restaurant_id()) and (select public.current_role_name()) = 'owner'));

drop policy if exists menu_item_audit_append on public.menu_item_audit;
create policy menu_item_audit_append on public.menu_item_audit for insert to authenticated with check (restaurant_id = (select public.current_restaurant_id()) and (select public.current_role_name()) = 'owner');

grant select, insert, update, delete on all tables in schema public to authenticated;

create or replace function public.set_variant_availability(p_variant uuid, p_available boolean)
returns void language plpgsql security definer set search_path = public as $$
declare v_rid uuid := public.current_restaurant_id();
begin
  if public.current_role_name() not in ('owner','chef') then raise exception 'Permission denied'; end if;
  update public.menu_variants set is_available = p_available where id = p_variant and restaurant_id = v_rid;
  if not found then raise exception 'Variant not found'; end if;
end $$;

grant execute on function public.set_variant_availability(uuid, boolean) to authenticated;

create or replace function public.get_availability(p_outlet uuid)
returns table(target_type text, target_id uuid, available boolean)
language sql stable security definer set search_path = public as $$
  select 'item', id, is_available from public.menu_items where restaurant_id = p_outlet
  union all
  select 'variant', id, is_available from public.menu_variants where restaurant_id = p_outlet
  union all
  select 'combo', id, is_available from public.combo_offers where restaurant_id = p_outlet
$$;
grant execute on function public.get_availability(uuid) to authenticated;

create or replace function public.get_effective_prices(p_outlet uuid, p_at timestamptz default now())
returns table(target_type text, target_id uuid, name text, price_paise bigint, reason text)
language sql stable security definer set search_path = public as $$
  select 'item', i.id, i.name, round(i.price * 100)::bigint, 'base'
  from public.menu_items i where i.restaurant_id = p_outlet and i.is_available
  union all
  select 'variant', v.id, v.name, coalesce(v.price_paise, round(v.price * 100)::bigint), 'variant'
  from public.menu_variants v where v.restaurant_id = p_outlet and v.is_available
  union all
  select 'combo', c.id, c.name, c.combo_price_paise, 'combo'
  from public.combo_offers c where c.restaurant_id = p_outlet and c.is_available
    and (c.valid_from is null or p_at >= c.valid_from) and (c.valid_to is null or p_at <= c.valid_to)
$$;
grant execute on function public.get_effective_prices(uuid, timestamptz) to authenticated;

create or replace function public.save_menu_item(p_input jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_rid uuid := public.current_restaurant_id(); v_id uuid; v_before jsonb; v_after jsonb;
begin
  if public.current_role_name() <> 'owner' then raise exception 'Permission denied. Only the outlet owner can manage the menu.'; end if;
  v_id := nullif(p_input ->> 'id', '')::uuid;
  if v_id is null then
    insert into public.menu_items(restaurant_id, name, description, category_id, is_veg, tax_rate, station, price, unit, is_available)
    values (v_rid, p_input ->> 'name', p_input ->> 'description', nullif(p_input ->> 'categoryId','')::uuid, coalesce((p_input ->> 'isVeg')::boolean, true), nullif(p_input ->> 'taxRate','')::numeric, p_input ->> 'station', ((p_input ->> 'pricePaise')::bigint / 100.0), p_input ->> 'unit', true) returning id into v_id;
    v_before := null;
  else
    select to_jsonb(m) into v_before from public.menu_items m where id = v_id and restaurant_id = v_rid for update;
    if not found then raise exception 'Menu item not found'; end if;
    update public.menu_items set name = p_input ->> 'name', description = p_input ->> 'description', category_id = nullif(p_input ->> 'categoryId','')::uuid, is_veg = coalesce((p_input ->> 'isVeg')::boolean, true), tax_rate = nullif(p_input ->> 'taxRate','')::numeric, station = p_input ->> 'station', price = ((p_input ->> 'pricePaise')::bigint / 100.0), unit = p_input ->> 'unit' where id = v_id and restaurant_id = v_rid;
  end if;
  select to_jsonb(m) into v_after from public.menu_items m where id = v_id;
  insert into public.menu_item_audit(restaurant_id, menu_item_id, action, before, after, actor_id) values (v_rid, v_id, case when v_before is null then 'created' else 'updated' end, v_before, v_after, auth.uid());
  return v_after;
end $$;

grant execute on function public.save_menu_item(jsonb) to authenticated;

create or replace function public.save_variant_group(p_input jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_rid uuid := public.current_restaurant_id(); v_group uuid; v jsonb;
begin
  if public.current_role_name() <> 'owner' then raise exception 'Permission denied'; end if;
  v_group := nullif(p_input ->> 'id', '')::uuid;
  if v_group is null then insert into public.menu_variant_groups(restaurant_id, menu_item_id, name, required, min_select, max_select, sort) values (v_rid, (p_input ->> 'menuItemId')::uuid, p_input ->> 'name', coalesce((p_input ->> 'required')::boolean,false), (p_input ->> 'minSelect')::int, (p_input ->> 'maxSelect')::int, coalesce((p_input ->> 'sort')::int,0)) returning id into v_group;
  else update public.menu_variant_groups set name=p_input->>'name', required=coalesce((p_input->>'required')::boolean,false), min_select=(p_input->>'minSelect')::int, max_select=(p_input->>'maxSelect')::int, sort=coalesce((p_input->>'sort')::int,0) where id=v_group and restaurant_id=v_rid; end if;
  delete from public.menu_variants where variant_group_id = v_group;
  for v in select value from jsonb_array_elements(coalesce(p_input -> 'variants','[]'::jsonb)) loop
    insert into public.menu_variants(restaurant_id, variant_group_id, menu_item_id, name, price_paise, tax_rate, recipe_multiplier, hsn_sac, is_available, sort) values (v_rid, v_group, (p_input ->> 'menuItemId')::uuid, v->>'name', (v->>'pricePaise')::bigint, nullif(v->>'taxRate','')::numeric, coalesce((v->>'recipeMultiplier')::numeric,1), nullif(v->>'hsnSac',''), coalesce((v->>'isAvailable')::boolean,true), coalesce((v->>'sort')::int,0));
  end loop;
  return jsonb_build_object('id', v_group);
end $$;
grant execute on function public.save_variant_group(jsonb) to authenticated;

create or replace function public.delete_variant(p_variant uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if public.current_role_name() <> 'owner' then raise exception 'Permission denied'; end if;
  delete from public.menu_variants where id = p_variant and restaurant_id = public.current_restaurant_id();
  if not found then raise exception 'Variant not found'; end if;
end $$;
grant execute on function public.delete_variant(uuid) to authenticated;

create or replace function public.save_combo(p_input jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_rid uuid := public.current_restaurant_id(); v_id uuid; v_line jsonb; v_full bigint := 0; v_price bigint;
begin
  if public.current_role_name() <> 'owner' then raise exception 'Permission denied'; end if;
  v_id := nullif(p_input ->> 'id','')::uuid;
  if v_id is null then insert into public.combo_offers(restaurant_id,name,description,combo_price_paise,pricing_mode,discount_value,is_available,valid_from,valid_to,image_path,sort) values (v_rid,p_input->>'name',p_input->>'description',(p_input->>'comboPricePaise')::bigint,p_input->>'pricingMode',coalesce((p_input->>'discountValue')::bigint,0),coalesce((p_input->>'isAvailable')::boolean,true),nullif(p_input->>'validFrom','')::timestamptz,nullif(p_input->>'validTo','')::timestamptz,p_input->>'imagePath',coalesce((p_input->>'sort')::int,0)) returning id into v_id;
  else update public.combo_offers set name=p_input->>'name',description=p_input->>'description',combo_price_paise=(p_input->>'comboPricePaise')::bigint,pricing_mode=p_input->>'pricingMode',discount_value=coalesce((p_input->>'discountValue')::bigint,0),is_available=coalesce((p_input->>'isAvailable')::boolean,true),valid_from=nullif(p_input->>'validFrom','')::timestamptz,valid_to=nullif(p_input->>'validTo','')::timestamptz,image_path=p_input->>'imagePath',sort=coalesce((p_input->>'sort')::int,0) where id=v_id and restaurant_id=v_rid; end if;
  delete from public.combo_items where combo_id=v_id;
  for v_line in select value from jsonb_array_elements(p_input->'items') loop
    insert into public.combo_items(combo_id,menu_item_id,variant_id,quantity,choice_group,min_choices,max_choices,sort) values(v_id,(v_line->>'menuItemId')::uuid,nullif(v_line->>'variantId','')::uuid,(v_line->>'quantity')::numeric,nullif(v_line->>'choiceGroup',''),coalesce((v_line->>'minChoices')::int,0),coalesce((v_line->>'maxChoices')::int,1),coalesce((v_line->>'sort')::int,0));
    select v_full + round(m.price * 100)::bigint * (v_line->>'quantity')::numeric into v_full from public.menu_items m where m.id=(v_line->>'menuItemId')::uuid;
  end loop;
  select combo_price_paise into v_price from public.combo_offers where id=v_id;
  return jsonb_build_object('id',v_id,'valueAtFullPricePaise',v_full,'comboPricePaise',v_price,'savingsPaise',greatest(v_full-v_price,0));
end $$;
grant execute on function public.save_combo(jsonb) to authenticated;

create or replace function public.save_price_schedule(p_input jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_rid uuid := public.current_restaurant_id(); v_id uuid; v_rule jsonb;
begin
  if public.current_role_name() <> 'owner' then raise exception 'Permission denied'; end if;
  v_id := nullif(p_input->>'id','')::uuid;
  if v_id is null then insert into public.price_schedules(restaurant_id,name,is_active,days_of_week,start_time,end_time,timezone,valid_from,valid_to,priority,outlet_ids) values(v_rid,p_input->>'name',coalesce((p_input->>'isActive')::boolean,true),array(select jsonb_array_elements_text(p_input->'daysOfWeek')::smallint),(p_input->>'startTime')::time,(p_input->>'endTime')::time,p_input->>'timezone',nullif(p_input->>'validFrom','')::date,nullif(p_input->>'validTo','')::date,coalesce((p_input->>'priority')::int,0),array(select jsonb_array_elements_text(p_input->'outletIds')::uuid)) returning id into v_id;
  else update public.price_schedules set name=p_input->>'name',is_active=coalesce((p_input->>'isActive')::boolean,true),days_of_week=array(select jsonb_array_elements_text(p_input->'daysOfWeek')::smallint),start_time=(p_input->>'startTime')::time,end_time=(p_input->>'endTime')::time,timezone=p_input->>'timezone',valid_from=nullif(p_input->>'validFrom','')::date,valid_to=nullif(p_input->>'validTo','')::date,priority=coalesce((p_input->>'priority')::int,0),outlet_ids=array(select jsonb_array_elements_text(p_input->'outletIds')::uuid) where id=v_id and restaurant_id=v_rid; end if;
  delete from public.price_schedule_rules where schedule_id=v_id;
  for v_rule in select value from jsonb_array_elements(p_input->'rules') loop insert into public.price_schedule_rules(schedule_id,target_type,target_id,action,value,buy_qty,get_qty) values(v_id,v_rule->>'targetType',(v_rule->>'targetId')::uuid,v_rule->>'action',(v_rule->>'value')::bigint,(v_rule->>'buyQty')::int,(v_rule->>'getQty')::int); end loop;
  return jsonb_build_object('id',v_id);
end $$;
grant execute on function public.save_price_schedule(jsonb) to authenticated;

create or replace function public.toggle_price_schedule(p_schedule uuid, p_active boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if public.current_role_name() <> 'owner' then raise exception 'Permission denied'; end if;
  update public.price_schedules set is_active=p_active where id=p_schedule and restaurant_id=public.current_restaurant_id();
end $$;
grant execute on function public.toggle_price_schedule(uuid, boolean) to authenticated;

create or replace function public.set_menu_availability(p_target_type text, p_target uuid, p_available boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if public.current_role_name() not in ('owner','chef') then raise exception 'Permission denied'; end if;
  if p_target_type='item' then update public.menu_items set is_available=p_available where id=p_target and restaurant_id=public.current_restaurant_id();
  elsif p_target_type='variant' then update public.menu_variants set is_available=p_available where id=p_target and restaurant_id=public.current_restaurant_id();
  elsif p_target_type='combo' then update public.combo_offers set is_available=p_available where id=p_target and restaurant_id=public.current_restaurant_id();
  else raise exception 'Invalid availability target'; end if;
end $$;
grant execute on function public.set_menu_availability(text, uuid, boolean) to authenticated;

notify pgrst, 'reload schema';

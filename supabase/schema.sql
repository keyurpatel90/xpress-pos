-- =====================================================================
--  Xpress POS  -  Supabase / PostgreSQL schema
--  Run this whole file once in:  Supabase Dashboard > SQL Editor > New query
--  It is safe to run again (idempotent).
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. PLATFORM (super admin)
-- ---------------------------------------------------------------------
create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.platform_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  level int not null default 1,
  price_monthly numeric(10,2) not null check (price_monthly >= 0),
  price_yearly numeric(10,2) check (price_yearly >= 0),
  highlights text[] not null default '{}',
  is_popular boolean not null default false,
  is_active boolean not null default true,
  sort int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.feature_flags (
  key text primary key,
  label text not null,
  description text,
  requires_subscription boolean not null default false,
  min_plan_level int not null default 1,
  sort int not null default 0
);

-- ---------------------------------------------------------------------
-- 2. TENANTS
-- ---------------------------------------------------------------------
create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid references auth.users(id) on delete set null,
  phone text, email text, address text, city text, state text, gstin text,
  bill_footer text not null default 'Thank you! Visit again.',
  timezone text not null default 'Asia/Kolkata',
  tax_rate numeric(5,2) not null default 5 check (tax_rate >= 0 and tax_rate <= 100),
  tax_inclusive boolean not null default false,
  service_charge_pct numeric(5,2) not null default 0 check (service_charge_pct >= 0 and service_charge_pct <= 100),
  invoice_prefix text not null default 'INV',
  order_seq int not null default 0,
  invoice_seq int not null default 0,
  loyalty_enabled boolean not null default false,
  points_per_100 numeric(6,2) not null default 5,
  point_value numeric(6,2) not null default 1,
  auto_print_kot boolean not null default false,
  subscription_status text not null default 'trialing' check (subscription_status in ('trialing','active','expired','cancelled')),
  trial_ends_at timestamptz not null default (now() + interval '30 days'),
  plan_id uuid references public.plans(id) on delete set null,
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  restaurant_id uuid references public.restaurants(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner','cashier','waiter','chef','kds')),
  full_name text, email text, phone text,
  status text not null default 'active' check (status in ('invited','active','disabled')),
  created_at timestamptz not null default now()
);
create index if not exists profiles_restaurant_idx on public.profiles(restaurant_id);

-- WhatsApp credentials live here. RLS is enabled with NO policies, so the browser can never read them.
create table if not exists public.restaurant_integrations (
  restaurant_id uuid primary key references public.restaurants(id) on delete cascade,
  wa_phone_number_id text,
  wa_access_token text,
  wa_template_name text,
  wa_template_lang text not null default 'en',
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. MENU, TABLES, CUSTOMERS
-- ---------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  sort int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  is_veg boolean not null default true,
  unit text not null default 'plate',
  tax_rate numeric(5,2) check (tax_rate >= 0 and tax_rate <= 100),
  station text not null default 'Kitchen',
  is_available boolean not null default true,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists menu_items_restaurant_idx on public.menu_items(restaurant_id, category_id);

create table if not exists public.modifier_groups (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  min_select int not null default 0,
  max_select int not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.modifier_options (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  group_id uuid not null references public.modifier_groups(id) on delete cascade,
  name text not null,
  price numeric(10,2) not null default 0,
  sort int not null default 0
);

create table if not exists public.menu_item_modifier_groups (
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  group_id uuid not null references public.modifier_groups(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  primary key (menu_item_id, group_id)
);

create table if not exists public.dining_tables (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  section text not null default 'Main',
  seats int not null default 4 check (seats > 0),
  status text not null default 'free' check (status in ('free','occupied','reserved')),
  sort int not null default 0,
  unique (restaurant_id, name)
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  phone text, email text, birthday date, notes text,
  loyalty_points int not null default 0,
  visits int not null default 0,
  total_spent numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (restaurant_id, phone)
);

-- ---------------------------------------------------------------------
-- 4. INVENTORY & RECIPES
-- ---------------------------------------------------------------------
create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  unit text not null default 'kg',
  quantity numeric(12,3) not null default 0,
  reorder_level numeric(12,3) not null default 0,
  cost_per_unit numeric(12,2) not null default 0,
  supplier text,
  created_at timestamptz not null default now(),
  unique (restaurant_id, name)
);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  inventory_item_id uuid not null references public.inventory_items(id) on delete cascade,
  change numeric(12,3) not null,
  reason text not null check (reason in ('purchase','wastage','correction','opening','sale','cancel')),
  note text,
  created_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists stock_movements_item_idx on public.stock_movements(inventory_item_id, created_at desc);

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  inventory_item_id uuid not null references public.inventory_items(id) on delete cascade,
  quantity numeric(12,4) not null check (quantity > 0),
  unique (menu_item_id, inventory_item_id)
);

-- ---------------------------------------------------------------------
-- 5. ORDERS
-- ---------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  order_no int not null,
  order_type text not null default 'dine_in' check (order_type in ('dine_in','takeaway','delivery')),
  table_id uuid references public.dining_tables(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text, customer_phone text, notes text,
  status text not null default 'open' check (status in ('open','paid','cancelled')),
  subtotal numeric(12,2) not null default 0,
  discount_type text not null default 'none' check (discount_type in ('none','percent','flat')),
  discount_value numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  loyalty_points_used int not null default 0,
  loyalty_discount numeric(12,2) not null default 0,
  service_charge numeric(12,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  round_off numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  invoice_no text,
  paid_at timestamptz,
  public_token uuid not null default gen_random_uuid(),
  kot_count int not null default 0,
  created_by uuid,
  created_at timestamptz not null default now(),
  unique (restaurant_id, order_no)
);
create index if not exists orders_restaurant_created_idx on public.orders(restaurant_id, created_at desc);
create index if not exists orders_restaurant_status_idx on public.orders(restaurant_id, status);
create unique index if not exists orders_one_open_per_table on public.orders(table_id) where status = 'open' and table_id is not null;
create unique index if not exists orders_public_token_idx on public.orders(public_token);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  name text not null,
  unit_price numeric(12,2) not null,
  qty int not null check (qty > 0),
  tax_rate numeric(5,2) not null default 0,
  modifiers jsonb not null default '[]'::jsonb,
  modifier_total numeric(12,2) not null default 0,
  notes text,
  station text not null default 'Kitchen',
  status text not null default 'new' check (status in ('new','preparing','ready','served','cancelled')),
  kot_no int not null default 1,
  is_veg boolean,
  created_at timestamptz not null default now()
);
create index if not exists order_items_order_idx on public.order_items(order_id);
create index if not exists order_items_kitchen_idx on public.order_items(restaurant_id, status);

create table if not exists public.order_payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  method text not null check (method in ('cash','card','upi','other')),
  amount numeric(12,2) not null check (amount > 0),
  reference text,
  created_at timestamptz not null default now()
);
create index if not exists order_payments_order_idx on public.order_payments(order_id);

-- ---------------------------------------------------------------------
-- 6. SUBSCRIPTIONS, WHATSAPP LOG, SUPPORT
-- ---------------------------------------------------------------------
create table if not exists public.subscription_payments (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  plan_id uuid references public.plans(id) on delete set null,
  plan_name text,
  months int not null check (months > 0),
  amount_paise bigint not null check (amount_paise > 0),
  razorpay_order_id text not null unique,
  razorpay_payment_id text,
  status text not null default 'created' check (status in ('created','paid','failed')),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index if not exists subscription_payments_restaurant_idx on public.subscription_payments(restaurant_id, created_at desc);

create table if not exists public.whatsapp_logs (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  to_phone text not null,
  status text not null,
  detail text,
  created_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  message text not null,
  restaurant_id uuid references public.restaurants(id) on delete set null,
  status text not null default 'open' check (status in ('open','closed')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 7. HELPERS: who is the caller, what plan are they on
-- ---------------------------------------------------------------------
create or replace function public.current_restaurant_id() returns uuid
language sql stable security definer set search_path = public as $$
  select restaurant_id from public.profiles where id = auth.uid() and status <> 'disabled'
$$;

create or replace function public.current_role_name() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and status <> 'disabled'
$$;

create or replace function public.is_super_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.platform_admins where user_id = auth.uid())
$$;

create or replace function public.platform_setting(p_key text, p_default jsonb) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce((select value from public.platform_settings where key = p_key), p_default)
$$;

-- trialing | active | expired
create or replace function public.restaurant_status(p_rid uuid) returns text
language sql stable security definer set search_path = public as $$
  select case
    when r.subscription_status = 'active' and r.current_period_end is not null and r.current_period_end > now() then 'active'
    when r.trial_ends_at > now() and r.subscription_status <> 'cancelled' then 'trialing'
    else 'expired' end
  from public.restaurants r where r.id = p_rid
$$;

-- When the trial/subscription has ended: is the whole app locked? (super admin setting "after_trial_mode")
create or replace function public.restaurant_locked(p_rid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    public.restaurant_status(p_rid) = 'expired'
    and (public.platform_setting('after_trial_mode', '"lock"'::jsonb) #>> '{}') = 'lock',
    false)
$$;

-- The single source of truth for feature gating (used by RLS policies, RPCs, API routes and the UI)
create or replace function public.feature_enabled(p_key text, p_rid uuid default null) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare
  v_rid uuid := coalesce(p_rid, public.current_restaurant_id());
  v_status text;
  f public.feature_flags%rowtype;
  v_level int;
begin
  if v_rid is null then return false; end if;
  v_status := public.restaurant_status(v_rid);
  if v_status is null then return false; end if;
  if v_status = 'expired' and public.restaurant_locked(v_rid) then return false; end if;
  select * into f from public.feature_flags where key = p_key;
  if not found or not f.requires_subscription then return true; end if;
  if v_status = 'active' then
    select coalesce(p.level, 99) into v_level
      from public.restaurants r left join public.plans p on p.id = r.plan_id where r.id = v_rid;
    return coalesce(v_level >= f.min_plan_level, false);
  end if;
  if v_status = 'trialing' then
    return coalesce((public.platform_setting('trial_premium_access', 'false'::jsonb) #>> '{}')::boolean, false);
  end if;
  return false;
end $$;

-- One call for the app shell: role, plan state, and every feature on/off
create or replace function public.get_access() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_rid uuid := public.current_restaurant_id();
  r public.restaurants%rowtype;
  p public.plans%rowtype;
  v_status text;
  v_feats jsonb;
begin
  if auth.uid() is null then return null; end if;
  if v_rid is not null then
    select * into r from public.restaurants where id = v_rid;
    v_status := public.restaurant_status(v_rid);
    select * into p from public.plans where id = r.plan_id;
    select coalesce(jsonb_object_agg(key, public.feature_enabled(key, v_rid)), '{}'::jsonb)
      into v_feats from public.feature_flags;
  end if;
  return jsonb_build_object(
    'restaurant_id', v_rid,
    'role', public.current_role_name(),
    'is_super_admin', public.is_super_admin(),
    'status', v_status,
    'locked', case when v_rid is null then false else public.restaurant_locked(v_rid) end,
    'trial_ends_at', r.trial_ends_at,
    'period_end', r.current_period_end,
    'plan_id', r.plan_id,
    'plan_name', p.name,
    'plan_level', p.level,
    'days_left', case
      when v_status = 'trialing' then greatest(0, ceil(extract(epoch from (r.trial_ends_at - now())) / 86400))::int
      when v_status = 'active' then greatest(0, ceil(extract(epoch from (r.current_period_end - now())) / 86400))::int
      else 0 end,
    'features', coalesce(v_feats, '{}'::jsonb));
end $$;

-- ---------------------------------------------------------------------
-- 8. SIGN-UP: every new owner gets their own restaurant + 30-day trial
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_name text := nullif(trim(new.raw_user_meta_data ->> 'restaurant_name'), '');
  v_phone text := nullif(trim(new.raw_user_meta_data ->> 'phone'), '');
  v_days int;
  v_rid uuid;
begin
  -- Staff (invited / created by an owner) have no restaurant_name: the server creates their profile.
  if v_name is null then return new; end if;
  select coalesce((value #>> '{}')::int, 30) into v_days from public.platform_settings where key = 'trial_days';
  insert into public.restaurants (name, owner_id, phone, email, trial_ends_at)
    values (v_name, new.id, v_phone, new.email, now() + make_interval(days => coalesce(v_days, 30)))
    returning id into v_rid;
  insert into public.profiles (id, restaurant_id, role, full_name, email, phone, status)
    values (new.id, v_rid, 'owner', coalesce(new.raw_user_meta_data ->> 'full_name', ''), new.email, v_phone, 'active');
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Owners can edit their restaurant row, but never billing / counters (those change only via server functions)
create or replace function public.protect_restaurant_columns() returns trigger
language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.owner_id := old.owner_id;
    new.subscription_status := old.subscription_status;
    new.trial_ends_at := old.trial_ends_at;
    new.plan_id := old.plan_id;
    new.current_period_end := old.current_period_end;
    new.order_seq := old.order_seq;
    new.invoice_seq := old.invoice_seq;
  end if;
  return new;
end $$;

drop trigger if exists protect_restaurant_columns on public.restaurants;
create trigger protect_restaurant_columns before update on public.restaurants
  for each row execute function public.protect_restaurant_columns();

create or replace function public.activate_my_profile() returns void
language sql security definer set search_path = public as $$
  update public.profiles set status = 'active' where id = auth.uid() and status = 'invited'
$$;

-- ---------------------------------------------------------------------
-- 9. STOCK AUTOMATION (recipe based)
-- ---------------------------------------------------------------------
create or replace function public.deduct_stock() returns trigger
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  if new.menu_item_id is null or not public.feature_enabled('recipes', new.restaurant_id) then return new; end if;
  for r in select inventory_item_id, quantity from public.recipes where menu_item_id = new.menu_item_id loop
    update public.inventory_items set quantity = quantity - r.quantity * new.qty where id = r.inventory_item_id;
    insert into public.stock_movements (restaurant_id, inventory_item_id, change, reason, note)
      values (new.restaurant_id, r.inventory_item_id, -(r.quantity * new.qty), 'sale', new.qty || ' x ' || new.name);
  end loop;
  return new;
end $$;

drop trigger if exists order_items_deduct_stock on public.order_items;
create trigger order_items_deduct_stock after insert on public.order_items
  for each row execute function public.deduct_stock();

create or replace function public.restore_stock() returns trigger
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  if new.menu_item_id is null or not public.feature_enabled('recipes', new.restaurant_id) then return new; end if;
  for r in select inventory_item_id, quantity from public.recipes where menu_item_id = new.menu_item_id loop
    update public.inventory_items set quantity = quantity + r.quantity * new.qty where id = r.inventory_item_id;
    insert into public.stock_movements (restaurant_id, inventory_item_id, change, reason, note)
      values (new.restaurant_id, r.inventory_item_id, r.quantity * new.qty, 'cancel', 'Cancelled ' || new.qty || ' x ' || new.name);
  end loop;
  return new;
end $$;

drop trigger if exists order_items_restore_stock on public.order_items;
create trigger order_items_restore_stock after update of status on public.order_items
  for each row when (new.status = 'cancelled' and old.status <> 'cancelled')
  execute function public.restore_stock();

-- ---------------------------------------------------------------------
-- 10. ORDER ENGINE  (all order writes go through these functions)
-- ---------------------------------------------------------------------
create or replace function public.recalc_order(p_order uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  o public.orders%rowtype;
  rest public.restaurants%rowtype;
  v_sub numeric; v_tax_ex numeric; v_tax_in numeric;
  v_disc numeric; v_ldisc numeric; v_base numeric; v_ratio numeric;
  v_sc numeric; v_tax numeric; v_tot numeric;
begin
  select * into o from public.orders where id = p_order;
  if not found then return; end if;
  select * into rest from public.restaurants where id = o.restaurant_id;

  select coalesce(sum((unit_price + modifier_total) * qty), 0),
         coalesce(sum((unit_price + modifier_total) * qty * tax_rate / 100), 0),
         coalesce(sum((unit_price + modifier_total) * qty * tax_rate / (100 + tax_rate)), 0)
    into v_sub, v_tax_ex, v_tax_in
    from public.order_items where order_id = p_order and status <> 'cancelled';

  v_disc := case o.discount_type
    when 'percent' then round(v_sub * least(o.discount_value, 100) / 100, 2)
    when 'flat' then least(o.discount_value, v_sub)
    else 0 end;
  v_ldisc := least(o.loyalty_discount, greatest(v_sub - v_disc, 0));
  v_base := v_sub - v_disc - v_ldisc;
  v_ratio := case when v_sub > 0 then v_base / v_sub else 0 end;
  v_sc := round(v_base * rest.service_charge_pct / 100, 2);
  if rest.tax_inclusive then
    v_tax := round(v_tax_in * v_ratio, 2);
    v_tot := v_base + v_sc;
  else
    v_tax := round(v_tax_ex * v_ratio, 2);
    v_tot := v_base + v_sc + v_tax;
  end if;

  update public.orders set
    subtotal = v_sub, discount_amount = v_disc, loyalty_discount = v_ldisc,
    loyalty_points_used = case when rest.point_value > 0 then least(o.loyalty_points_used, ceil(v_ldisc / rest.point_value)::int) else 0 end,
    service_charge = v_sc, tax_amount = v_tax,
    round_off = round(v_tot) - v_tot, total = round(v_tot)
  where id = p_order;
end $$;

-- Create an order (or add a new KOT to an open order). Prices always come from the database.
create or replace function public.send_kot(
  p_order_id uuid, p_type text, p_table_id uuid, p_customer_id uuid,
  p_customer_name text, p_customer_phone text, p_notes text, p_items jsonb
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_rid uuid := public.current_restaurant_id();
  v_role text := public.current_role_name();
  v_oid uuid := p_order_id;
  v_no int; v_kot int; v_qty int;
  v_rest public.restaurants%rowtype;
  v_el jsonb; v_opt jsonb;
  v_item public.menu_items%rowtype;
  v_mods jsonb; v_mtotal numeric;
  v_mo record;
  v_use_mods boolean;
begin
  if v_rid is null or v_role not in ('owner', 'cashier', 'waiter') then
    raise exception 'You are not allowed to create orders';
  end if;
  if public.restaurant_locked(v_rid) then
    raise exception 'Your plan has expired. Renew to keep taking orders.';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Add at least one item';
  end if;
  if p_type not in ('dine_in', 'takeaway', 'delivery') then raise exception 'Invalid order type'; end if;
  if v_oid is null and p_type = 'dine_in' and p_table_id is null then
    raise exception 'Select a table for dine-in orders';
  end if;

  select * into v_rest from public.restaurants where id = v_rid;
  v_use_mods := public.feature_enabled('modifiers', v_rid);

  if v_oid is null then
    update public.restaurants set order_seq = order_seq + 1 where id = v_rid returning order_seq into v_no;
    insert into public.orders (restaurant_id, order_no, order_type, table_id, customer_id, customer_name, customer_phone, notes, created_by)
    values (v_rid, v_no, p_type, case when p_type = 'dine_in' then p_table_id end, p_customer_id,
            nullif(trim(p_customer_name), ''), nullif(trim(p_customer_phone), ''), nullif(trim(p_notes), ''), auth.uid())
    returning id into v_oid;
  else
    update public.orders set
      customer_id = coalesce(p_customer_id, customer_id),
      customer_name = coalesce(nullif(trim(p_customer_name), ''), customer_name),
      customer_phone = coalesce(nullif(trim(p_customer_phone), ''), customer_phone),
      notes = coalesce(nullif(trim(p_notes), ''), notes)
    where id = v_oid and restaurant_id = v_rid and status = 'open';
    if not found then raise exception 'This order is closed or does not exist'; end if;
  end if;

  update public.orders set kot_count = kot_count + 1 where id = v_oid returning kot_count into v_kot;

  for v_el in select value from jsonb_array_elements(p_items) loop
    v_qty := greatest(1, coalesce((v_el ->> 'qty')::int, 1));
    select * into v_item from public.menu_items where id = (v_el ->> 'menu_item_id')::uuid and restaurant_id = v_rid;
    if not found then raise exception 'A menu item in this order no longer exists'; end if;
    if not v_item.is_available then raise exception '% is not available right now', v_item.name; end if;

    v_mods := '[]'::jsonb; v_mtotal := 0;
    if v_use_mods then
      for v_opt in select value from jsonb_array_elements(coalesce(v_el -> 'modifier_ids', '[]'::jsonb)) loop
        select mo.id, mo.name, mo.price into v_mo
          from public.modifier_options mo
          where mo.id = (v_opt #>> '{}')::uuid and mo.restaurant_id = v_rid;
        if found then
          v_mods := v_mods || jsonb_build_array(jsonb_build_object('id', v_mo.id, 'name', v_mo.name, 'price', v_mo.price));
          v_mtotal := v_mtotal + v_mo.price;
        end if;
      end loop;
    end if;

    insert into public.order_items (order_id, restaurant_id, menu_item_id, name, unit_price, qty, tax_rate,
                                    modifiers, modifier_total, notes, station, kot_no, is_veg)
    values (v_oid, v_rid, v_item.id, v_item.name, v_item.price, v_qty, coalesce(v_item.tax_rate, v_rest.tax_rate),
            v_mods, v_mtotal, nullif(trim(v_el ->> 'notes'), ''), v_item.station, v_kot, v_item.is_veg);
  end loop;

  perform public.recalc_order(v_oid);
  if p_type = 'dine_in' and p_table_id is not null then
    update public.dining_tables set status = 'occupied' where id = p_table_id and restaurant_id = v_rid;
  end if;
  return v_oid;
end $$;

-- Discount + loyalty redemption preview (order stays open). Returns the recalculated order.
create or replace function public.apply_discount(p_order uuid, p_type text, p_value numeric, p_points int)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_rid uuid := public.current_restaurant_id();
  o public.orders%rowtype;
  rest public.restaurants%rowtype;
  v_pts int := greatest(0, coalesce(p_points, 0));
  v_have int;
begin
  if v_rid is null or public.current_role_name() not in ('owner', 'cashier') then
    raise exception 'Only the owner or cashier can change discounts';
  end if;
  select * into o from public.orders where id = p_order and restaurant_id = v_rid and status = 'open';
  if not found then raise exception 'Order is not open'; end if;
  select * into rest from public.restaurants where id = v_rid;

  if v_pts > 0 then
    if not (rest.loyalty_enabled and public.feature_enabled('loyalty', v_rid)) or o.customer_id is null then
      v_pts := 0;
    else
      select loyalty_points into v_have from public.customers where id = o.customer_id;
      v_pts := least(v_pts, coalesce(v_have, 0));
    end if;
  end if;

  update public.orders set
    discount_type = case when p_type in ('percent', 'flat') and coalesce(p_value, 0) > 0 then p_type else 'none' end,
    discount_value = greatest(0, coalesce(p_value, 0)),
    loyalty_points_used = v_pts,
    loyalty_discount = v_pts * rest.point_value
  where id = p_order;
  perform public.recalc_order(p_order);
  return (select to_jsonb(x) from public.orders x where x.id = p_order);
end $$;

-- Take payment. p_payments = [{"method":"cash","amount":250}, ...]. Several rows = split payment.
create or replace function public.settle_order(p_order uuid, p_payments jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_rid uuid := public.current_restaurant_id();
  o public.orders%rowtype;
  rest public.restaurants%rowtype;
  cust public.customers%rowtype;
  v_el jsonb; v_sum numeric := 0; v_amt numeric; v_method text;
  v_seq int; v_inv text; v_earn int := 0;
begin
  if v_rid is null or public.current_role_name() not in ('owner', 'cashier') then
    raise exception 'Only the owner or cashier can collect payment';
  end if;
  if public.restaurant_locked(v_rid) then raise exception 'Your plan has expired. Renew to continue.'; end if;

  select * into o from public.orders where id = p_order and restaurant_id = v_rid for update;
  if not found or o.status <> 'open' then raise exception 'Order is not open'; end if;
  if not exists (select 1 from public.order_items where order_id = p_order and status <> 'cancelled') then
    raise exception 'The order has no items';
  end if;

  perform public.recalc_order(p_order);
  select * into o from public.orders where id = p_order;
  select * into rest from public.restaurants where id = v_rid;

  if p_payments is null or jsonb_typeof(p_payments) <> 'array' or jsonb_array_length(p_payments) = 0 then
    raise exception 'Add a payment';
  end if;
  if jsonb_array_length(p_payments) > 1 and not public.feature_enabled('split_billing', v_rid) then
    raise exception 'Split payments are available on a paid plan';
  end if;
  for v_el in select value from jsonb_array_elements(p_payments) loop
    v_method := v_el ->> 'method'; v_amt := (v_el ->> 'amount')::numeric;
    if v_method not in ('cash', 'card', 'upi', 'other') or coalesce(v_amt, 0) <= 0 then
      raise exception 'Invalid payment line';
    end if;
    v_sum := v_sum + v_amt;
  end loop;
  if abs(v_sum - o.total) > 0.009 then
    raise exception 'Payments (%) must add up to the bill total (%)', v_sum, o.total;
  end if;

  update public.restaurants set invoice_seq = invoice_seq + 1 where id = v_rid returning invoice_seq into v_seq;
  v_inv := rest.invoice_prefix || '-' || lpad(v_seq::text, 5, '0');

  for v_el in select value from jsonb_array_elements(p_payments) loop
    insert into public.order_payments (order_id, restaurant_id, method, amount, reference)
    values (p_order, v_rid, v_el ->> 'method', (v_el ->> 'amount')::numeric, nullif(trim(v_el ->> 'reference'), ''));
  end loop;

  update public.orders set status = 'paid', paid_at = now(), invoice_no = v_inv where id = p_order;

  if o.table_id is not null and not exists (
    select 1 from public.orders where table_id = o.table_id and status = 'open' and id <> p_order
  ) then
    update public.dining_tables set status = 'free' where id = o.table_id;
  end if;

  if o.customer_id is not null then
    select * into cust from public.customers where id = o.customer_id and restaurant_id = v_rid for update;
    if found then
      if rest.loyalty_enabled and public.feature_enabled('loyalty', v_rid) then
        if o.loyalty_points_used > cust.loyalty_points then raise exception 'Customer does not have enough points'; end if;
        v_earn := floor(o.total / 100.0 * rest.points_per_100)::int;
      end if;
      update public.customers set
        visits = visits + 1,
        total_spent = total_spent + o.total,
        loyalty_points = loyalty_points - o.loyalty_points_used + v_earn
      where id = cust.id;
    end if;
  end if;

  return jsonb_build_object('invoice_no', v_inv, 'total', o.total, 'points_earned', v_earn);
end $$;

create or replace function public.cancel_order(p_order uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_rid uuid := public.current_restaurant_id(); o public.orders%rowtype;
begin
  if v_rid is null or public.current_role_name() not in ('owner', 'cashier') then
    raise exception 'Only the owner or cashier can cancel orders';
  end if;
  select * into o from public.orders where id = p_order and restaurant_id = v_rid and status = 'open';
  if not found then raise exception 'Only open orders can be cancelled'; end if;
  update public.order_items set status = 'cancelled' where order_id = p_order and status <> 'cancelled';
  update public.orders set status = 'cancelled', subtotal = 0, discount_amount = 0, loyalty_discount = 0,
    service_charge = 0, tax_amount = 0, round_off = 0, total = 0 where id = p_order;
  if o.table_id is not null and not exists (
    select 1 from public.orders where table_id = o.table_id and status = 'open' and id <> p_order
  ) then
    update public.dining_tables set status = 'free' where id = o.table_id;
  end if;
end $$;

create or replace function public.cancel_order_item(p_item uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_rid uuid := public.current_restaurant_id(); v_order uuid;
begin
  if v_rid is null or public.current_role_name() not in ('owner', 'cashier') then
    raise exception 'Only the owner or cashier can cancel items';
  end if;
  select oi.order_id into v_order from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where oi.id = p_item and oi.restaurant_id = v_rid and o.status = 'open' and oi.status <> 'cancelled';
  if not found then raise exception 'Item cannot be cancelled'; end if;
  update public.order_items set status = 'cancelled' where id = p_item;
  perform public.recalc_order(v_order);
end $$;

-- Kitchen / floor status changes
create or replace function public.set_item_status(p_ids uuid[], p_status text) returns void
language plpgsql security definer set search_path = public as $$
declare v_rid uuid := public.current_restaurant_id(); v_role text := public.current_role_name();
begin
  if v_rid is null then raise exception 'Not signed in'; end if;
  if p_status not in ('new', 'preparing', 'ready', 'served') then raise exception 'Invalid status'; end if;
  if p_status = 'served' and v_role not in ('owner', 'cashier', 'waiter', 'chef', 'kds') then
    raise exception 'Not allowed';
  end if;
  if p_status <> 'served' and v_role not in ('owner', 'cashier', 'chef', 'kds') then
    raise exception 'Not allowed';
  end if;
  update public.order_items set status = p_status
    where id = any(p_ids) and restaurant_id = v_rid and status <> 'cancelled';
end $$;

create or replace function public.set_item_availability(p_item uuid, p_available boolean) returns void
language plpgsql security definer set search_path = public as $$
declare v_rid uuid := public.current_restaurant_id();
begin
  if v_rid is null or public.current_role_name() not in ('owner', 'cashier', 'chef') then
    raise exception 'Not allowed';
  end if;
  update public.menu_items set is_available = p_available where id = p_item and restaurant_id = v_rid;
end $$;

create or replace function public.adjust_stock(p_item uuid, p_change numeric, p_reason text, p_note text) returns void
language plpgsql security definer set search_path = public as $$
declare v_rid uuid := public.current_restaurant_id();
begin
  if v_rid is null or public.current_role_name() <> 'owner' then raise exception 'Only the owner can adjust stock'; end if;
  if not public.feature_enabled('inventory', v_rid) then raise exception 'Inventory is available on a paid plan'; end if;
  if p_reason not in ('purchase', 'wastage', 'correction', 'opening') then raise exception 'Invalid reason'; end if;
  update public.inventory_items set quantity = quantity + p_change where id = p_item and restaurant_id = v_rid;
  if not found then raise exception 'Inventory item not found'; end if;
  insert into public.stock_movements (restaurant_id, inventory_item_id, change, reason, note, created_by)
    values (v_rid, p_item, p_change, p_reason, nullif(trim(p_note), ''), auth.uid());
end $$;

-- ---------------------------------------------------------------------
-- 11. DASHBOARD & REPORTS
-- ---------------------------------------------------------------------
create or replace function public.dashboard_summary() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_rid uuid := public.current_restaurant_id();
  v_tz text; v_today date;
  v_sales numeric; v_orders int; v_week jsonb; v_top jsonb;
begin
  if v_rid is null then return '{}'::jsonb; end if;
  select timezone into v_tz from public.restaurants where id = v_rid;
  v_today := (now() at time zone v_tz)::date;

  select coalesce(sum(total), 0), count(*) into v_sales, v_orders
    from public.orders where restaurant_id = v_rid and status = 'paid' and (paid_at at time zone v_tz)::date = v_today;

  select coalesce(jsonb_agg(jsonb_build_object('day', g.d, 'sales', coalesce((
            select sum(total) from public.orders
            where restaurant_id = v_rid and status = 'paid' and (paid_at at time zone v_tz)::date = g.d), 0)) order by g.d), '[]'::jsonb)
    into v_week
    from (select (v_today - n)::date as d from generate_series(0, 6) n) g;

  select coalesce(jsonb_agg(t), '[]'::jsonb) into v_top from (
    select oi.name, sum(oi.qty)::int as qty
    from public.order_items oi join public.orders o on o.id = oi.order_id
    where o.restaurant_id = v_rid and o.status = 'paid' and oi.status <> 'cancelled'
      and (o.paid_at at time zone v_tz)::date >= v_today - 6
    group by oi.name order by sum(oi.qty) desc limit 5) t;

  return jsonb_build_object(
    'today_sales', v_sales,
    'today_orders', v_orders,
    'avg_bill', case when v_orders > 0 then round(v_sales / v_orders, 2) else 0 end,
    'open_orders', (select count(*) from public.orders where restaurant_id = v_rid and status = 'open'),
    'tables_total', (select count(*) from public.dining_tables where restaurant_id = v_rid),
    'tables_busy', (select count(*) from public.dining_tables where restaurant_id = v_rid and status = 'occupied'),
    'menu_items', (select count(*) from public.menu_items where restaurant_id = v_rid),
    'categories', (select count(*) from public.categories where restaurant_id = v_rid),
    'staff', (select count(*) from public.profiles where restaurant_id = v_rid and role <> 'owner'),
    'low_stock', (select count(*) from public.inventory_items where restaurant_id = v_rid and quantity <= reorder_level and reorder_level > 0),
    'week', v_week,
    'top_items', v_top);
end $$;

create or replace function public.sales_report(p_from date, p_to date) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_rid uuid := public.current_restaurant_id();
  v_tz text;
  v_totals jsonb; v_days jsonb; v_top jsonb; v_pay jsonb; v_type jsonb;
begin
  if v_rid is null or public.current_role_name() <> 'owner' then raise exception 'Only the owner can view reports'; end if;
  if not public.feature_enabled('reports', v_rid) then raise exception 'Reports are available on a paid plan'; end if;
  select timezone into v_tz from public.restaurants where id = v_rid;

  select jsonb_build_object(
      'orders', count(*), 'gross', coalesce(sum(subtotal), 0),
      'discount', coalesce(sum(discount_amount + loyalty_discount), 0),
      'service_charge', coalesce(sum(service_charge), 0), 'tax', coalesce(sum(tax_amount), 0),
      'total', coalesce(sum(total), 0))
    into v_totals
    from public.orders
    where restaurant_id = v_rid and status = 'paid' and (paid_at at time zone v_tz)::date between p_from and p_to;

  select coalesce(jsonb_agg(jsonb_build_object('day', day, 'orders', n, 'sales', sales) order by day), '[]'::jsonb) into v_days
    from (select (paid_at at time zone v_tz)::date as day, count(*) as n, sum(total) as sales
          from public.orders
          where restaurant_id = v_rid and status = 'paid' and (paid_at at time zone v_tz)::date between p_from and p_to
          group by 1) d;

  select coalesce(jsonb_agg(t), '[]'::jsonb) into v_top from (
    select oi.name, sum(oi.qty)::int as qty, sum((oi.unit_price + oi.modifier_total) * oi.qty) as revenue
    from public.order_items oi join public.orders o on o.id = oi.order_id
    where o.restaurant_id = v_rid and o.status = 'paid' and oi.status <> 'cancelled'
      and (o.paid_at at time zone v_tz)::date between p_from and p_to
    group by oi.name order by sum(oi.qty) desc limit 10) t;

  select coalesce(jsonb_agg(t), '[]'::jsonb) into v_pay from (
    select p.method, sum(p.amount) as amount, count(*) as n
    from public.order_payments p join public.orders o on o.id = p.order_id
    where o.restaurant_id = v_rid and o.status = 'paid' and (o.paid_at at time zone v_tz)::date between p_from and p_to
    group by p.method order by sum(p.amount) desc) t;

  select coalesce(jsonb_agg(t), '[]'::jsonb) into v_type from (
    select order_type, count(*) as n, sum(total) as sales
    from public.orders
    where restaurant_id = v_rid and status = 'paid' and (paid_at at time zone v_tz)::date between p_from and p_to
    group by order_type) t;

  return jsonb_build_object('totals', v_totals, 'by_day', v_days, 'top_items', v_top, 'by_payment', v_pay, 'by_type', v_type);
end $$;

-- ---------------------------------------------------------------------
-- 12. SAMPLE DATA (button on the Menu page)
-- ---------------------------------------------------------------------
create or replace function public.seed_sample_data() returns void
language plpgsql security definer set search_path = public as $$
declare
  v_rid uuid := public.current_restaurant_id();
  c1 uuid; c2 uuid; c3 uuid; c4 uuid; c5 uuid; c6 uuid; i int;
begin
  if v_rid is null or public.current_role_name() <> 'owner' then raise exception 'Only the owner can load sample data'; end if;
  if exists (select 1 from public.categories where restaurant_id = v_rid) then
    raise exception 'Your menu already has categories';
  end if;
  insert into public.categories (restaurant_id, name, sort) values (v_rid, 'Starters', 1) returning id into c1;
  insert into public.categories (restaurant_id, name, sort) values (v_rid, 'Main Course', 2) returning id into c2;
  insert into public.categories (restaurant_id, name, sort) values (v_rid, 'Breads', 3) returning id into c3;
  insert into public.categories (restaurant_id, name, sort) values (v_rid, 'Rice & Biryani', 4) returning id into c4;
  insert into public.categories (restaurant_id, name, sort) values (v_rid, 'Beverages', 5) returning id into c5;
  insert into public.categories (restaurant_id, name, sort) values (v_rid, 'Desserts', 6) returning id into c6;
  insert into public.menu_items (restaurant_id, category_id, name, price, is_veg, unit, station) values
    (v_rid, c1, 'Paneer Tikka', 240, true, 'plate', 'Tandoor'),
    (v_rid, c1, 'Veg Spring Roll', 160, true, 'plate', 'Kitchen'),
    (v_rid, c1, 'Chicken 65', 260, false, 'plate', 'Kitchen'),
    (v_rid, c2, 'Dal Makhani', 220, true, 'bowl', 'Kitchen'),
    (v_rid, c2, 'Paneer Butter Masala', 280, true, 'bowl', 'Kitchen'),
    (v_rid, c2, 'Butter Chicken', 320, false, 'bowl', 'Kitchen'),
    (v_rid, c3, 'Butter Naan', 50, true, 'piece', 'Tandoor'),
    (v_rid, c3, 'Tandoori Roti', 30, true, 'piece', 'Tandoor'),
    (v_rid, c4, 'Jeera Rice', 140, true, 'plate', 'Kitchen'),
    (v_rid, c4, 'Veg Biryani', 240, true, 'plate', 'Kitchen'),
    (v_rid, c5, 'Masala Chai', 30, true, 'cup', 'Bar'),
    (v_rid, c5, 'Fresh Lime Soda', 70, true, 'glass', 'Bar'),
    (v_rid, c6, 'Gulab Jamun', 90, true, 'portion', 'Kitchen'),
    (v_rid, c6, 'Ice Cream Scoop', 80, true, 'piece', 'Bar');
  if not exists (select 1 from public.dining_tables where restaurant_id = v_rid) then
    for i in 1..6 loop
      insert into public.dining_tables (restaurant_id, name, section, seats, sort) values (v_rid, 'T' || i, 'Main', 4, i);
    end loop;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 13. SUBSCRIPTION ACTIVATION (called only by the server, after Razorpay confirms payment)
-- ---------------------------------------------------------------------
create or replace function public.apply_payment(p_order text, p_payment text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  sp public.subscription_payments%rowtype;
  r public.restaurants%rowtype;
  v_old public.plans%rowtype;
  v_new public.plans%rowtype;
  v_end timestamptz; v_extra int := 0; v_left numeric;
begin
  select * into sp from public.subscription_payments where razorpay_order_id = p_order for update;
  if not found then raise exception 'Unknown payment order'; end if;
  if sp.status = 'paid' then
    return jsonb_build_object('already', true, 'restaurant_id', sp.restaurant_id);
  end if;
  select * into r from public.restaurants where id = sp.restaurant_id for update;
  select * into v_new from public.plans where id = sp.plan_id;

  if r.subscription_status = 'active' and r.current_period_end > now() then
    if r.plan_id is not distinct from sp.plan_id then
      v_end := r.current_period_end + make_interval(months => sp.months);              -- renewal: stack
    else
      select * into v_old from public.plans where id = r.plan_id;                      -- plan change: carry over remaining value
      v_left := extract(epoch from (r.current_period_end - now())) / 86400.0;
      if v_old.id is not null and coalesce(v_new.price_monthly, 0) > 0 then
        v_extra := floor(v_left * v_old.price_monthly / v_new.price_monthly)::int;
      end if;
      v_end := now() + make_interval(months => sp.months) + make_interval(days => v_extra);
    end if;
  else
    v_end := now() + make_interval(months => sp.months);
  end if;

  update public.restaurants set subscription_status = 'active', plan_id = sp.plan_id, current_period_end = v_end where id = r.id;
  update public.subscription_payments set status = 'paid', razorpay_payment_id = p_payment, paid_at = now() where id = sp.id;
  return jsonb_build_object('already', false, 'restaurant_id', r.id, 'period_end', v_end);
end $$;

-- ---------------------------------------------------------------------
-- 14. ROW LEVEL SECURITY  (every restaurant only ever sees its own rows)
-- ---------------------------------------------------------------------
do $$
declare
  t record;
  r record;
begin
  -- Everything is locked down by default
  for r in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', r.tablename);
  end loop;

  -- (table, roles that may INSERT/UPDATE/DELETE). Every staff member of the restaurant may SELECT.
  -- orders, order_items and order_payments have no write policy: they change only through the functions above.
  for t in select * from (values
    ('categories',                array['owner']),
    ('menu_items',                array['owner']),
    ('modifier_groups',           array['owner']),
    ('modifier_options',          array['owner']),
    ('menu_item_modifier_groups', array['owner']),
    ('dining_tables',             array['owner']),
    ('customers',                 array['owner','cashier','waiter']),
    ('inventory_items',           array['owner']),
    ('stock_movements',           array[]::text[]),
    ('recipes',                   array['owner']),
    ('orders',                    array[]::text[]),
    ('order_items',               array[]::text[]),
    ('order_payments',            array[]::text[]),
    ('whatsapp_logs',             array[]::text[])
  ) as v(tbl, roles)
  loop
    execute format('drop policy if exists %I on public.%I', t.tbl || '_select', t.tbl);
    execute format('create policy %I on public.%I for select to authenticated using (restaurant_id = (select public.current_restaurant_id()))',
                   t.tbl || '_select', t.tbl);
    execute format('drop policy if exists %I on public.%I', t.tbl || '_write', t.tbl);
    if coalesce(array_length(t.roles, 1), 0) > 0 then
      execute format($f$create policy %I on public.%I for all to authenticated
        using (restaurant_id = (select public.current_restaurant_id()) and (select public.current_role_name()) = any (%L::text[]))
        with check (restaurant_id = (select public.current_restaurant_id()) and (select public.current_role_name()) = any (%L::text[]))$f$,
        t.tbl || '_write', t.tbl, t.roles, t.roles);
    end if;
  end loop;
end $$;

-- Restaurants & profiles
drop policy if exists restaurants_select on public.restaurants;
create policy restaurants_select on public.restaurants for select to authenticated
  using (id = (select public.current_restaurant_id()));
drop policy if exists restaurants_update on public.restaurants;
create policy restaurants_update on public.restaurants for update to authenticated
  using (id = (select public.current_restaurant_id()) and (select public.current_role_name()) = 'owner')
  with check (id = (select public.current_restaurant_id()));

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or restaurant_id = (select public.current_restaurant_id()));

drop policy if exists subscription_payments_select on public.subscription_payments;
create policy subscription_payments_select on public.subscription_payments for select to authenticated
  using (restaurant_id = (select public.current_restaurant_id()) and (select public.current_role_name()) = 'owner');

-- Public, read-only catalogue used by the pricing page
drop policy if exists plans_select on public.plans;
create policy plans_select on public.plans for select to anon, authenticated using (is_active);
drop policy if exists feature_flags_select on public.feature_flags;
create policy feature_flags_select on public.feature_flags for select to anon, authenticated using (true);
drop policy if exists platform_settings_select on public.platform_settings;
create policy platform_settings_select on public.platform_settings for select to anon, authenticated using (true);

-- Premium tables: a restrictive policy that switches the whole table off when the feature is not available.
-- (Super admin controls this from the admin panel; no code change needed.)
do $$
declare g record;
begin
  for g in select * from (values
    ('inventory_items', 'inventory'), ('stock_movements', 'inventory'), ('recipes', 'recipes'),
    ('modifier_groups', 'modifiers'), ('modifier_options', 'modifiers'), ('menu_item_modifier_groups', 'modifiers')
  ) as v(tbl, feat)
  loop
    execute format('drop policy if exists %I on public.%I', g.tbl || '_feature_gate', g.tbl);
    execute format('create policy %I on public.%I as restrictive for all to authenticated using ((select public.feature_enabled(%L))) with check ((select public.feature_enabled(%L)))',
                   g.tbl || '_feature_gate', g.tbl, g.feat, g.feat);
  end loop;
end $$;

-- platform_admins, platform_settings (writes), restaurant_integrations, support_tickets: no client policies at all.

-- ---------------------------------------------------------------------
-- 14b. TABLE PRIVILEGES  (RLS above decides which rows; this only lets the API roles reach the tables)
--      Newer Supabase projects no longer expose new tables automatically, so we grant explicitly.
-- ---------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;
grant select on public.plans, public.feature_flags, public.platform_settings to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;

-- ---------------------------------------------------------------------
-- 15. FUNCTION PERMISSIONS
-- ---------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated, service_role;
revoke execute on function public.apply_payment(text, text) from authenticated;
revoke execute on function public.recalc_order(uuid) from authenticated;

-- ---------------------------------------------------------------------
-- 16. REALTIME (kitchen display, live floor)
-- ---------------------------------------------------------------------
do $$ begin
  begin alter publication supabase_realtime add table public.order_items; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.orders; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.dining_tables; exception when duplicate_object then null; end;
end $$;

-- ---------------------------------------------------------------------
-- 17. SEED DATA  (all editable later from the Super Admin panel)
-- ---------------------------------------------------------------------
insert into public.platform_settings (key, value) values
  ('trial_days', '30'::jsonb),
  ('trial_premium_access', 'false'::jsonb),   -- true = trial restaurants also get subscription-only features
  ('after_trial_mode', '"lock"'::jsonb)       -- "lock" = app locked until they subscribe, "free" = keep free features
on conflict (key) do nothing;

insert into public.feature_flags (key, label, description, requires_subscription, min_plan_level, sort) values
  ('pos',           'POS billing',               'Take orders, bill and collect payment',                 false, 1, 1),
  ('tables',        'Table management',          'Floor layout, table status and table-wise orders',      false, 1, 2),
  ('menu',          'Menu & categories',         'Categories, items, units, GST and kitchen stations',    false, 1, 3),
  ('kds',           'Kitchen display (KDS)',     'Live KOT tickets for the kitchen',                      false, 1, 4),
  ('customers',     'Customers',                 'Customer book with visit history',                      false, 1, 5),
  ('staff',         'Staff logins',              'Invite cashier, waiter, chef and KDS users',            false, 1, 6),
  ('modifiers',     'Menu modifiers',            'Add-ons, sizes and options on menu items',              false, 1, 7),
  ('inventory',     'Inventory & stock alerts',  'Stock levels, purchases, wastage and low-stock alerts', true,  1, 8),
  ('reports',       'Sales reports',             'Daily sales, top items, payment mode split',            true,  1, 9),
  ('split_billing', 'Split billing',             'Pay one bill with several payment modes',               true,  1, 10),
  ('whatsapp',      'WhatsApp bills',            'Send the bill to the customer on WhatsApp',             true,  2, 11),
  ('loyalty',       'Customer loyalty',          'Earn and redeem points on every bill',                  true,  2, 12),
  ('recipes',       'Recipe costing',            'Ingredient costing, margins and auto stock deduction',  true,  3, 13)
on conflict (key) do nothing;

do $$
begin
  if not exists (select 1 from public.plans) then
    insert into public.plans (name, description, level, price_monthly, price_yearly, highlights, is_popular, sort) values
      ('Starter', 'For a single counter or small cafe', 1, 300, 3000,
        array['Everything in the free plan', 'Inventory and low-stock alerts', 'Sales reports', 'Split billing and multiple payment modes'], false, 1),
      ('Professional', 'For busy restaurants', 2, 799, 7990,
        array['Everything in Starter', 'WhatsApp bills', 'Customer loyalty points'], true, 2),
      ('Enterprise', 'For multi-station kitchens', 3, 1199, 11990,
        array['Everything in Professional', 'Recipe costing and auto stock deduction', 'Priority support'], false, 3);
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 18. YOUR FIRST SUPER ADMIN
--   1) Sign up in the app with your own email and verify it.
--   2) Replace the email below and run this one statement:
--
--   insert into public.platform_admins (user_id)
--   select id from auth.users where email = 'you@example.com'
--   on conflict do nothing;
-- ---------------------------------------------------------------------

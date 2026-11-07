'use server';

import { createClient } from '@/lib/supabase/server';
import { availabilitySchema, comboSchema, menuFiltersSchema, saveMenuItemSchema, scheduleSchema, variantGroupSchema, type AvailabilityInput, type MenuFilters, type SaveComboInput, type SaveMenuItemInput, type SaveScheduleInput } from '@/lib/menu';

async function context() {
  const supabase = createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('You must be signed in.');
  const { data: access, error } = await supabase.rpc('get_access');
  if (error || !access?.restaurant_id) throw new Error('No active outlet was found.');
  return { supabase, user: user.user, access };
}

async function ownerContext() {
  const ctx = await context();
  if (ctx.access.role !== 'owner') throw new Error('Permission denied. Only the outlet owner can manage the menu.');
  return ctx;
}

export async function getMenuAdmin(input: Partial<MenuFilters> = {}) {
  const parsed = menuFiltersSchema.parse(input); const { supabase, access } = await context();
  const from = (parsed.page - 1) * parsed.pageSize; const to = from + parsed.pageSize - 1;
  let query = supabase.from('menu_items').select('*, categories(name), menu_variant_groups(*, menu_variants(*)), menu_item_combo_memberships:combo_items(count)', { count: 'exact' }).order('name').range(from, to);
  if (parsed.search) query = query.ilike('name', `%${parsed.search}%`);
  if (parsed.categoryId) query = query.eq('category_id', parsed.categoryId);
  const [{ data: items, count, error: itemError }, { data: categories, error: categoryError }] = await Promise.all([query, supabase.from('categories').select('id,name,sort,is_active').eq('restaurant_id', access.restaurant_id).order('sort').order('name')]);
  if (itemError || categoryError) throw new Error('Unable to load the menu.');
  return { categories: categories ?? [], items: items ?? [], total: count ?? 0, page: parsed.page, pageSize: parsed.pageSize };
}

export async function saveMenuItem(input: SaveMenuItemInput) {
  const parsed = saveMenuItemSchema.parse(input); const { supabase } = await ownerContext();
  const { data, error } = await supabase.rpc('save_menu_item', { p_input: parsed });
  if (error) throw new Error(error.message || 'Unable to save the menu item.');
  return data;
}

export async function saveVariantGroup(itemId: string, input: unknown) {
  const parsed = variantGroupSchema.parse({ ...(input as object), menuItemId: itemId }); const { supabase } = await ownerContext();
  const { data, error } = await supabase.rpc('save_variant_group', { p_input: parsed });
  if (error) throw new Error(error.message || 'Unable to save the variant group.');
  return data;
}

export async function deleteVariant(id: string) {
  const { supabase } = await ownerContext();
  const { data, error } = await supabase.rpc('delete_variant', { p_variant: id });
  if (error) throw new Error(error.message || 'Unable to delete the variant.');
  return data;
}

export async function saveCombo(input: SaveComboInput) {
  const parsed = comboSchema.parse(input); const { supabase } = await ownerContext();
  const { data, error } = await supabase.rpc('save_combo', { p_input: parsed });
  if (error) throw new Error(error.message || 'Unable to save the combo.');
  return data;
}

export async function previewSchedule(input: SaveScheduleInput & { sampleAt: string }) {
  const parsed = scheduleSchema.parse(input); const { supabase } = await ownerContext();
  const { data, error } = await supabase.rpc('preview_price_schedule', { p_input: parsed, p_sample_at: input.sampleAt });
  if (error) throw new Error(error.message || 'Unable to preview this schedule.');
  return data;
}

export async function saveSchedule(input: SaveScheduleInput) {
  const parsed = scheduleSchema.parse(input); const { supabase } = await ownerContext();
  const { data, error } = await supabase.rpc('save_price_schedule', { p_input: parsed });
  if (error) throw new Error(error.message || 'Unable to save the schedule.');
  return data;
}

export async function toggleSchedule(id: string, active: boolean) {
  const { supabase } = await ownerContext();
  const { data, error } = await supabase.rpc('toggle_price_schedule', { p_schedule: id, p_active: active });
  if (error) throw new Error(error.message || 'Unable to update the schedule.');
  return data;
}

export async function getEffectivePrices(outletId: string, at = new Date().toISOString()) {
  const { supabase, access } = await context();
  if (access.restaurant_id !== outletId) throw new Error('Menu not found.');
  const { data, error } = await supabase.rpc('get_effective_prices', { p_outlet: outletId, p_at: at });
  if (error) throw new Error(error.message || 'Unable to load effective prices.');
  return data ?? [];
}

export async function getAvailability(outletId: string) {
  const { supabase, access } = await context();
  if (access.restaurant_id !== outletId) throw new Error('Menu not found.');
  const { data, error } = await supabase.rpc('get_availability', { p_outlet: outletId });
  if (error) throw new Error(error.message || 'Unable to load availability.');
  return data ?? [];
}

export async function setAvailability(input: AvailabilityInput) {
  const parsed = availabilitySchema.parse(input); const { supabase, access } = await context();
  if (access.role !== 'owner' && access.role !== 'chef') throw new Error('Permission denied.');
  const { data, error } = await supabase.rpc('set_menu_availability', { p_target_type: parsed.targetType, p_target: parsed.targetId, p_available: parsed.available });
  if (error) throw new Error(error.message || 'Unable to update availability.');
  return data;
}

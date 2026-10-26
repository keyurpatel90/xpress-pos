'use server';
import { revalidatePath } from 'next/cache';
import { assertSuperAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

type Result = { ok: true } | { ok: false; error: string };
type Admin = ReturnType<typeof createAdminClient>;

async function guard(fn: (admin: Admin) => Promise<void>): Promise<Result> {
  try {
    await assertSuperAdmin();
    await fn(createAdminClient());
    revalidatePath('/admin', 'layout');
    revalidatePath('/pricing');
    revalidatePath('/');
    revalidatePath('/features');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
const must = (error: { message: string } | null) => { if (error) throw new Error(error.message); };

export type PlanInput = {
  id?: string; name: string; description: string; level: number; price_monthly: number; price_yearly: number | null;
  highlights: string[]; is_popular: boolean; is_active: boolean; sort: number;
};

export async function savePlan(p: PlanInput) {
  return guard(async (admin) => {
    if (!p.name.trim()) throw new Error('Plan name is required');
    if (!(p.price_monthly >= 0)) throw new Error('Monthly price must be zero or more');
    const row = {
      name: p.name.trim(), description: p.description.trim() || null, level: Math.max(1, Math.round(p.level)),
      price_monthly: p.price_monthly, price_yearly: p.price_yearly, highlights: p.highlights.map((h) => h.trim()).filter(Boolean),
      is_popular: p.is_popular, is_active: p.is_active, sort: Math.round(p.sort),
    };
    if (row.is_popular) must((await admin.from('plans').update({ is_popular: false }).neq('id', p.id ?? '00000000-0000-0000-0000-000000000000')).error);
    must((p.id ? await admin.from('plans').update(row).eq('id', p.id) : await admin.from('plans').insert(row)).error);
  });
}

export async function deletePlan(id: string) {
  return guard(async (admin) => must((await admin.from('plans').delete().eq('id', id)).error));
}

export async function saveFeature(key: string, requires_subscription: boolean, min_plan_level: number) {
  return guard(async (admin) => must((await admin.from('feature_flags').update({ requires_subscription, min_plan_level: Math.max(1, min_plan_level) }).eq('key', key)).error));
}

export async function saveSettings(s: { trial_days: number; trial_premium_access: boolean; after_trial_mode: 'lock' | 'free' }) {
  return guard(async (admin) => {
    if (!(s.trial_days >= 0 && s.trial_days <= 365)) throw new Error('Trial days must be between 0 and 365');
    const rows = [
      { key: 'trial_days', value: Math.round(s.trial_days) },
      { key: 'trial_premium_access', value: s.trial_premium_access },
      { key: 'after_trial_mode', value: s.after_trial_mode },
    ].map((r) => ({ ...r, updated_at: new Date().toISOString() }));
    must((await admin.from('platform_settings').upsert(rows)).error);
  });
}

const addMonths = (base: Date, m: number) => { const d = new Date(base); d.setMonth(d.getMonth() + m); return d; };

export async function restaurantAction(input: { id: string; action: 'extend_trial' | 'grant' | 'suspend' | 'restore'; days?: number; plan_id?: string; months?: number }) {
  return guard(async (admin) => {
    const { data: r, error } = await admin.from('restaurants').select('*').eq('id', input.id).single();
    must(error);
    if (!r) throw new Error('Restaurant not found');
    const now = new Date();
    let patch: Record<string, unknown> = {};
    if (input.action === 'extend_trial') {
      const days = Math.round(input.days ?? 0);
      if (days < 1 || days > 365) throw new Error('Enter between 1 and 365 days');
      const base = new Date(Math.max(now.getTime(), new Date(r.trial_ends_at).getTime()));
      patch = { trial_ends_at: new Date(base.getTime() + days * 86400000).toISOString(), ...(r.subscription_status === 'cancelled' ? { subscription_status: 'trialing' } : {}) };
    } else if (input.action === 'grant') {
      const months = Math.round(input.months ?? 0);
      if (!input.plan_id || months < 1 || months > 36) throw new Error('Choose a plan and 1 to 36 months');
      const active = r.subscription_status === 'active' && r.current_period_end && new Date(r.current_period_end) > now;
      patch = { subscription_status: 'active', plan_id: input.plan_id, current_period_end: addMonths(active ? new Date(r.current_period_end) : now, months).toISOString() };
    } else if (input.action === 'suspend') {
      patch = { subscription_status: 'cancelled', current_period_end: now.toISOString() };
    } else {
      patch = { subscription_status: 'trialing' };
    }
    must((await admin.from('restaurants').update(patch).eq('id', input.id)).error);
  });
}

export async function setTicketStatus(id: string, status: 'open' | 'closed') {
  return guard(async (admin) => must((await admin.from('support_tickets').update({ status }).eq('id', id)).error));
}

import { createClient } from '@supabase/supabase-js';
import { FALLBACK_PLANS, type PlanLite } from '@/lib/site';

export type CatalogFeature = { key: string; label: string; description: string | null; requires_subscription: boolean; min_plan_level: number };
export type Catalog = { plans: PlanLite[]; flags: CatalogFeature[]; trialDays: number; trialPremium: boolean; afterTrial: 'lock' | 'free' };

const FALLBACK_FLAGS: CatalogFeature[] = [
  ['pos', 'POS billing', false, 1], ['tables', 'Table management', false, 1], ['menu', 'Menu and categories', false, 1], ['kds', 'Kitchen display (KDS)', false, 1],
  ['customers', 'Customers', false, 1], ['staff', 'Staff logins', false, 1], ['modifiers', 'Menu modifiers', false, 1],
  ['inventory', 'Inventory and stock alerts', true, 1], ['reports', 'Sales reports', true, 1], ['split_billing', 'Split billing', true, 1],
  ['whatsapp', 'WhatsApp bills', true, 2], ['loyalty', 'Customer loyalty', true, 2], ['recipes', 'Recipe costing', true, 3],
].map(([key, label, req, lvl]) => ({ key: key as string, label: label as string, description: null, requires_subscription: req as boolean, min_plan_level: lvl as number }));

/** Public pricing data. Falls back to the seed values if the database cannot be reached (e.g. before setup). */
export async function getCatalog(): Promise<Catalog> {
  const fallback: Catalog = { plans: FALLBACK_PLANS, flags: FALLBACK_FLAGS, trialDays: 30, trialPremium: false, afterTrial: 'lock' };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return fallback;
  try {
    const sb = createClient(url, key, { auth: { persistSession: false } });
    const [p, f, s] = await Promise.all([
      sb.from('plans').select('*').eq('is_active', true).order('sort'),
      sb.from('feature_flags').select('*').order('sort'),
      sb.from('platform_settings').select('*'),
    ]);
    if (p.error || f.error || !p.data?.length) return fallback;
    const set = Object.fromEntries((s.data ?? []).map((r: { key: string; value: unknown }) => [r.key, r.value]));
    return {
      plans: p.data.map((x) => ({ ...x, price_monthly: Number(x.price_monthly), price_yearly: x.price_yearly == null ? null : Number(x.price_yearly) })) as PlanLite[],
      flags: (f.data as CatalogFeature[]) ?? fallback.flags,
      trialDays: Number(set.trial_days ?? 30),
      trialPremium: set.trial_premium_access === true,
      afterTrial: set.after_trial_mode === 'free' ? 'free' : 'lock',
    };
  } catch {
    return fallback;
  }
}

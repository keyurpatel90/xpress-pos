import type { Row } from '@/lib/types';

/** Mirrors public.restaurant_status() in the database; used only for display in the admin panel. */
export function effStatus(r: Row): 'active' | 'trialing' | 'expired' {
  const now = Date.now();
  if (r.subscription_status === 'active' && r.current_period_end && new Date(r.current_period_end).getTime() > now) return 'active';
  if (new Date(r.trial_ends_at).getTime() > now && r.subscription_status !== 'cancelled') return 'trialing';
  return 'expired';
}

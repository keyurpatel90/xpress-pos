import type { Row } from '@/lib/types';
import { effectiveSubscriptionStatus, type StoredSubscriptionStatus } from '@/lib/state-machines';

/** Mirrors public.restaurant_status() in the database; used only for display in the admin panel. */
export function effStatus(r: Row) {
  return effectiveSubscriptionStatus({
    storedStatus: r.subscription_status as StoredSubscriptionStatus,
    trialEndsAt: r.trial_ends_at,
    currentPeriodEnd: r.current_period_end,
  });
}

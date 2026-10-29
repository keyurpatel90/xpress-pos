'use client';
import { useApp } from '@/components/app/AppProvider';
import { FEATURES } from '@/lib/site';
import { LinkBtn } from '@/components/ui';
import { Icon } from '@/components/Icon';

export const featureName = (key: string) =>
  FEATURES.find((f) => f.key === key)?.title ?? (key === 'loyalty' ? 'Customer loyalty' : key.replace(/_/g, ' '));

export function UpgradeCard({ feature }: { feature: string }) {
  const { role, access } = useApp();
  return (
    <div className="mx-auto mt-10 max-w-md rounded-2xl border border-line bg-white p-8 text-center shadow-lift">
      <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600"><Icon name="lock" className="h-6 w-6" /></span>
      <h2 className="font-display text-xl font-bold">{featureName(feature)} is on a paid plan</h2>
      <p className="mt-2 text-sm text-ink-mute">
        {access.status === 'trialing'
          ? 'This feature is not part of the free trial. Subscribe to switch it on for your restaurant.'
          : 'Subscribe or upgrade your plan to switch this feature on for your restaurant.'}
      </p>
      <div className="mt-5">
        {role === 'owner'
          ? <LinkBtn href="/app/billing">See plans</LinkBtn>
          : <p className="text-sm font-medium text-ink-soft">Ask your restaurant owner to upgrade.</p>}
      </div>
    </div>
  );
}

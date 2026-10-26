import Link from 'next/link';
import { Icon } from '@/components/Icon';

import { btnClass, cn, inr } from '@/lib/utils';
import type { PlanLite } from '@/lib/site';

export function PlanCards({ plans, trialDays }: { plans: PlanLite[]; trialDays: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {plans.map((p) => (
        <div key={p.id} className={cn('flex flex-col rounded-2xl border bg-white p-6', p.is_popular ? 'border-pine-600 ring-2 ring-pine-600' : 'border-line')}>
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl font-bold">{p.name}</h3>
            {p.is_popular && <span className="rounded-md bg-pine-600 px-2 py-0.5 text-xs font-semibold text-white">Most popular</span>}
          </div>
          <p className="mt-1 text-sm text-ink-mute">{p.description}</p>
          <p className="mt-4 font-display text-4xl font-bold tracking-tight">{inr(p.price_monthly)}<span className="text-base font-medium text-ink-mute"> / month</span></p>
          {p.price_yearly != null && <p className="text-sm text-ink-mute">or {inr(p.price_yearly)} a year</p>}
          <ul className="my-5 flex-1 space-y-2 text-sm">
            {p.highlights.map((h) => <li key={h} className="flex gap-2"><Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-pine-600" />{h}</li>)}
          </ul>
          <Link href="/signup" className={btnClass(p.is_popular ? 'primary' : 'secondary', 'lg', 'w-full')}>Try free for {trialDays} days</Link>
        </div>
      ))}
    </div>
  );
}

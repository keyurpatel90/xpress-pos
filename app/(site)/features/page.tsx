import type { Metadata } from 'next';
import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { btnClass } from '@/lib/utils';

import { getCatalog } from '@/lib/catalog';
import { FEATURES } from '@/lib/site';

export const revalidate = 60;
export const metadata: Metadata = { title: 'Features', description: 'Billing, tables, kitchen display, inventory, recipe costing, loyalty, split billing and WhatsApp bills.' };

export default async function FeaturesPage() {
  const { flags, plans, trialDays, trialPremium } = await getCatalog();
  const planAt = (lvl: number) => plans.slice().sort((a, b) => a.level - b.level).find((p) => p.level >= lvl)?.name ?? 'a paid plan';
  const badge = (key: string) => {
    const f = flags.find((x) => x.key === key);
    if (!f || !f.requires_subscription) return { text: `Free during the ${trialDays}-day trial`, cls: 'bg-emerald-50 text-emerald-700' };
    return trialPremium
      ? { text: `Trial, then ${planAt(f.min_plan_level)} and above`, cls: 'bg-amber-50 text-amber-600' }
      : { text: `${planAt(f.min_plan_level)} plan and above`, cls: 'bg-amber-50 text-amber-600' };
  };
  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <h1 className="max-w-3xl font-display text-4xl font-extrabold tracking-tight md:text-5xl">Built for how a restaurant actually runs</h1>
      <p className="mt-4 max-w-2xl text-lg text-ink-soft">Every feature is set up by you: your tables, your menu, your tax, your team. Nothing is hard-coded to a single kind of restaurant.</p>
      <div className="mt-12 space-y-0">
        {FEATURES.map((f) => {
          const b = badge(f.key);
          return (
            <section key={f.key} className="grid gap-6 border-t border-line py-8 md:grid-cols-[1fr_1.3fr]">
              <div>
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><Icon name={f.icon} /></span>
                <h2 className="mt-3 font-display text-2xl font-extrabold tracking-tight">{f.title}</h2>
                <p className="mt-1 text-ink-soft">{f.text}</p>
                <span className={`mt-3 inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${b.cls}`}>{b.text}</span>
              </div>
              <ul className="space-y-2.5 self-center">
                {f.detail.map((d) => <li key={d} className="flex gap-3"><Icon name="check" className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /><span>{d}</span></li>)}
              </ul>
            </section>
          );
        })}
      </div>
      <div className="mt-6 flex flex-wrap gap-3 border-t border-line pt-10">
        <Link href="/signup" className={btnClass('primary', 'lg')}>Start free trial</Link>
        <Link href="/pricing" className={btnClass('secondary', 'lg')}>View pricing</Link>
      </div>
    </div>
  );
}

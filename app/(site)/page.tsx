import Link from 'next/link';
import { FaqList } from '@/components/marketing/FaqList';
import { PlanCards } from '@/components/marketing/PlanCards';
import { TicketStack } from '@/components/marketing/TicketStack';
import { Icon } from '@/components/Icon';
import { btnClass } from '@/lib/utils';

import { getCatalog } from '@/lib/catalog';
import { FAQS, FEATURES, ROLE_PANELS, STEPS } from '@/lib/site';

export const revalidate = 60;

export default async function HomePage() {
  const { plans, trialDays } = await getCatalog();
  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-12 md:grid-cols-[1.1fr_1fr] md:pt-20">
        <div>
          <p className="inline-block rounded-full bg-turmeric-100 px-3 py-1 text-sm font-semibold text-ink">Free for {trialDays} days. No card needed.</p>
          <h1 className="mt-5 font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl">One screen from first order to final bill.</h1>
          <p className="mt-5 max-w-xl text-lg text-ink-soft">
            Xpress POS runs billing, tables, kitchen tickets, stock and WhatsApp bills for your restaurant or cafe. Open it in a browser, add your menu, and start taking orders the same day.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup" className={btnClass('primary', 'lg')}>Start free trial</Link>
            <Link href="/features" className={btnClass('secondary', 'lg')}>See what is inside</Link>
          </div>
          <p className="mt-4 text-sm text-ink-mute">Works on a phone, tablet or laptop. No special hardware.</p>
        </div>
        <TicketStack />
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="max-w-2xl font-display text-3xl font-bold tracking-tight md:text-4xl">Everything the floor, the kitchen and the counter need</h2>
        <dl className="mt-10 grid gap-x-12 md:grid-cols-2">
          {FEATURES.slice(0, 8).map((f) => (
            <div key={f.key} className="flex gap-4 border-t border-line py-5">
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-pine-50 text-pine-600"><Icon name={f.icon} /></span>
              <div><dt className="font-display text-lg font-semibold">{f.title}</dt><dd className="mt-1 text-ink-soft">{f.text}</dd></div>
            </div>
          ))}
        </dl>
        <Link href="/features" className="mt-4 inline-block font-semibold text-pine-700 hover:underline">See all {FEATURES.length} features</Link>
      </section>

      <section className="bg-ink py-16 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 md:grid-cols-[1fr_1.2fr]">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Every person signs in to their own screen</h2>
            <p className="mt-4 text-white/70">There is no role switcher to fiddle with at a busy table. You invite your team by email, each person gets a login, and that login decides what they see and what they can do.</p>
          </div>
          <ul className="divide-y divide-white/15 border-y border-white/15">
            {ROLE_PANELS.map((r) => (
              <li key={r.role} className="grid gap-1 py-4 sm:grid-cols-[150px_1fr]">
                <span className="font-display text-lg font-semibold text-turmeric-400">{r.role}</span>
                <span className="text-white/80">{r.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Up and running in an afternoon</h2>
        <ol className="mt-10 grid gap-8 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <span className="font-display text-6xl font-bold text-pine-200">{i + 1}</span>
              <h3 className="mt-2 font-display text-xl font-semibold">{s.title}</h3>
              <p className="mt-1 text-ink-soft">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="mb-8 max-w-2xl">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Simple pricing after your free trial</h2>
          <p className="mt-3 text-ink-soft">Try everything in the free plan for {trialDays} days. Pick a paid plan when you need advanced features like inventory, reports and WhatsApp bills.</p>
        </div>
        <PlanCards plans={plans} trialDays={trialDays} />
        <Link href="/pricing" className="mt-4 inline-block font-semibold text-pine-700 hover:underline">Compare plans in detail</Link>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-16">
        <h2 className="mb-6 font-display text-3xl font-bold tracking-tight">Questions owners ask</h2>
        <FaqList items={FAQS.slice(0, 5)} />
        <Link href="/faq" className="mt-4 inline-block font-semibold text-pine-700 hover:underline">More questions</Link>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="rounded-3xl bg-pine-700 px-8 py-14 text-center text-white">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Take your first order today</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/80">Create your account, confirm your email and your restaurant is ready to set up.</p>
          <Link href="/signup" className={btnClass('accent', 'lg', 'mt-6')}>Start free trial</Link>
        </div>
      </section>
    </>
  );
}

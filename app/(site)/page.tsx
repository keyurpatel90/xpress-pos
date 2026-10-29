import Link from 'next/link';
import { FaqList } from '@/components/marketing/FaqList';
import { HeroPreview } from '@/components/marketing/HeroPreview';
import { PlanCards } from '@/components/marketing/PlanCards';
import { Icon } from '@/components/Icon';
import { getCatalog } from '@/lib/catalog';
import { FAQS, FEATURES, ROLE_PANELS, STEPS } from '@/lib/site';
import { btnClass } from '@/lib/utils';

export const revalidate = 60;

export default async function HomePage() {
  const { plans, trialDays } = await getCatalog();
  const trust = [`No card needed`, `${trialDays}-day free trial`, 'GST-ready billing', 'Works in any browser'];
  return (
    <>
      <section className="relative overflow-hidden pb-16">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[560px] bg-[radial-gradient(55%_60%_at_50%_0%,rgba(136,0,255,0.13),transparent_72%)]" />
        <div className="relative mx-auto max-w-4xl px-5 pt-14 text-center md:pt-20">
          <p className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3.5 py-1.5 text-sm font-bold text-brand-700 shadow-sm">
            <Icon name="sparkle" className="h-4 w-4" /> Free for {trialDays} days. No card needed.
          </p>
          <h1 className="mt-6 font-display text-5xl font-extrabold leading-[1.04] tracking-tight md:text-7xl">
            One screen from first order to <span className="text-brand-600">final bill.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-ink-soft">
            Xpress POS runs billing, tables, kitchen tickets, stock and WhatsApp bills for restaurants, cafes and food counters. Open it in a browser, add your menu, and take your first order the same day.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/signup" className={btnClass('primary', 'lg', 'btn-glow px-8')}>Start free trial <Icon name="send" className="h-4 w-4" /></Link>
            <Link href="/features" className={btnClass('secondary', 'lg')}>See what is inside</Link>
          </div>
          <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-medium text-ink-soft">
            {trust.map((t) => <li key={t} className="flex items-center gap-1.5"><Icon name="checkc" className="h-4 w-4 text-emerald-500" />{t}</li>)}
          </ul>
        </div>
        <div className="relative mx-auto mt-14 max-w-6xl px-5"><HeroPreview /></div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="max-w-2xl font-display text-3xl font-extrabold tracking-tight md:text-4xl">Everything the floor, the kitchen and the counter need</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.slice(0, 8).map((f) => (
            <div key={f.key} className="card p-5 transition-all hover:-translate-y-1 hover:shadow-lift">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><Icon name={f.icon} /></span>
              <h3 className="mt-4 font-display text-lg font-bold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-ink-soft">{f.text}</p>
            </div>
          ))}
        </div>
        <Link href="/features" className="mt-6 inline-block font-bold text-brand-700 hover:underline">See all {FEATURES.length} features</Link>
      </section>

      <section className="bg-slate-900 py-16 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 md:grid-cols-[1fr_1.2fr]">
          <div>
            <h2 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">Every person signs in to their own screen</h2>
            <p className="mt-4 text-slate-300">There is no role switcher to fiddle with at a busy table. You invite your team by email, each person gets a login, and that login decides what they see and what they can do.</p>
          </div>
          <ul className="divide-y divide-white/10 border-y border-white/10">
            {ROLE_PANELS.map((r) => (
              <li key={r.role} className="grid gap-1 py-4 sm:grid-cols-[160px_1fr]">
                <span className="font-display text-lg font-bold text-brand-300">{r.role}</span>
                <span className="text-slate-300">{r.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">Up and running in an afternoon</h2>
        <ol className="mt-10 grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="card p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 font-display text-lg font-extrabold text-white">{i + 1}</span>
              <h3 className="mt-4 font-display text-xl font-bold">{s.title}</h3>
              <p className="mt-1 text-ink-soft">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="mb-8 max-w-2xl">
          <h2 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">Simple pricing after your free trial</h2>
          <p className="mt-3 text-ink-soft">Try everything in the free plan for {trialDays} days. Pick a paid plan when you need advanced features like inventory, reports and WhatsApp bills.</p>
        </div>
        <PlanCards plans={plans} trialDays={trialDays} />
        <Link href="/pricing" className="mt-6 inline-block font-bold text-brand-700 hover:underline">Compare plans in detail</Link>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-16">
        <h2 className="mb-6 font-display text-3xl font-extrabold tracking-tight">Questions owners ask</h2>
        <FaqList items={FAQS.slice(0, 5)} />
        <Link href="/faq" className="mt-6 inline-block font-bold text-brand-700 hover:underline">More questions</Link>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 px-8 py-14 text-center text-white shadow-glow">
          <h2 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">Take your first order today</h2>
          <p className="mx-auto mt-3 max-w-xl text-brand-100">Create your account, confirm your email and your restaurant is ready to set up.</p>
          <Link href="/signup" className={btnClass('secondary', 'lg', 'mt-6 !border-white !text-brand-700')}>Start free trial</Link>
        </div>
      </section>
    </>
  );
}

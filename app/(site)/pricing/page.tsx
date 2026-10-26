import type { Metadata } from 'next';
import { Icon } from '@/components/Icon';
import { PlanCards } from '@/components/marketing/PlanCards';
import { getCatalog } from '@/lib/catalog';

export const revalidate = 60;
export const metadata: Metadata = { title: 'Pricing', description: 'Start free, then choose a plan when you need advanced features.' };

export default async function PricingPage() {
  const { plans, flags, trialDays, trialPremium, afterTrial } = await getCatalog();
  const sorted = plans.slice().sort((a, b) => a.level - b.level);
  const Yes = () => <Icon name="check" className="mx-auto h-5 w-5 text-pine-600" />;
  const No = () => <span className="text-ink-mute" aria-label="Not included">-</span>;
  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">Start free, upgrade when you need more</h1>
      <p className="mt-4 max-w-2xl text-lg text-ink-soft">Every new restaurant gets {trialDays} days free with no card. {afterTrial === 'free' ? 'After the trial the free features keep working.' : 'To keep using Xpress POS after the trial, choose a plan.'}</p>
      <div className="mt-10"><PlanCards plans={plans} trialDays={trialDays} /></div>

      <h2 className="mb-4 mt-16 font-display text-2xl font-bold tracking-tight">What each plan includes</h2>
      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-line bg-field/60">
            <tr>
              <th className="px-4 py-3 font-display font-semibold">Feature</th>
              <th className="px-4 py-3 text-center font-display font-semibold">Free trial</th>
              {sorted.map((p) => <th key={p.id} className="px-4 py-3 text-center font-display font-semibold">{p.name}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {flags.map((f) => (
              <tr key={f.key}>
                <td className="px-4 py-3 font-medium">{f.label}</td>
                <td className="px-4 py-3 text-center">{!f.requires_subscription || trialPremium ? <Yes /> : <No />}</td>
                {sorted.map((p) => <td key={p.id} className="px-4 py-3 text-center">{!f.requires_subscription || p.level >= f.min_plan_level ? <Yes /> : <No />}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-sm text-ink-mute">Payments are processed securely by Razorpay (UPI, cards and net banking). Plans are prepaid for the period you choose. Prices are in Indian rupees.</p>
    </div>
  );
}

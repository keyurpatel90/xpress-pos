'use client';
import { useState } from 'react';
import { api, unwrap, useData } from '@/lib/hooks';
import { useApp, useToast } from '@/components/app/AppProvider';
import { Badge, Btn, Card, Loading, PageHeader, Segmented, Table } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { cn, fmtDate, inr } from '@/lib/utils';
import type { Row } from '@/lib/types';

declare global {
  interface Window { Razorpay?: new (opts: Record<string, unknown>) => { open: () => void; on: (e: string, cb: (r: Row) => void) => void } }
}

function loadRazorpay() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function BillingPage() {
  const { access, restaurant, email, profile, refresh } = useApp();
  const toast = useToast();
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [busy, setBusy] = useState<string | null>(null);
  const { data, loading, reload } = useData<{ plans: Row[]; payments: Row[] }>(async (sb) => {
    const [p, h] = await Promise.all([
      sb.from('plans').select('*').eq('is_active', true).order('sort'),
      sb.from('subscription_payments').select('*').order('created_at', { ascending: false }).limit(20),
    ]);
    return { plans: unwrap(p) ?? [], payments: unwrap(h) ?? [] };
  }, { plans: [], payments: [] });

  async function pay(plan: Row) {
    setBusy(plan.id);
    try {
      if (!(await loadRazorpay())) throw new Error('Could not load Razorpay. Check your internet connection.');
      const o = await api<Row>('/api/billing/order', 'POST', { plan_id: plan.id, cycle });
      const rz = new window.Razorpay!({
        key: o.key_id, amount: o.amount, currency: o.currency, order_id: o.order_id, name: 'Xpress POS',
        description: `${plan.name} plan (${cycle})`, prefill: { name: profile.full_name, email, contact: restaurant.phone ?? '' },
        theme: { color: '#0E6B52' },
        modal: { ondismiss: () => setBusy(null) },
        handler: async (resp: Row) => {
          try {
            await api('/api/billing/verify', 'POST', resp);
            toast('Payment received. Your plan is active.', 'success');
            await refresh();
            reload();
          } catch (e) {
            toast((e as Error).message, 'error');
          } finally { setBusy(null); }
        },
      });
      rz.on('payment.failed', (r: Row) => { toast(r?.error?.description || 'Payment failed. You were not charged.', 'error'); setBusy(null); });
      rz.open();
    } catch (e) {
      toast((e as Error).message, 'error');
      setBusy(null);
    }
  }

  if (loading) return <Loading />;
  const label = (p: Row) => {
    if (access.status !== 'active') return 'Subscribe';
    if (access.plan_id === p.id) return 'Renew';
    return p.level > (access.plan_level ?? 0) ? 'Upgrade' : 'Switch to this plan';
  };
  const status = access.status === 'active'
    ? { tone: 'green' as const, title: `${access.plan_name ?? 'Paid'} plan`, text: `Active until ${fmtDate(access.period_end)} (${access.days_left} days left)` }
    : access.status === 'trialing'
      ? { tone: 'yellow' as const, title: 'Free trial', text: `${access.days_left} day${access.days_left === 1 ? '' : 's'} left, ends ${fmtDate(access.trial_ends_at)}` }
      : { tone: 'red' as const, title: 'Plan ended', text: 'Choose a plan to continue.' };

  return (
    <>
      <PageHeader title="Plan and billing" />
      <Card className="mb-5 flex flex-wrap items-center justify-between gap-3 p-4">
        <div><Badge tone={status.tone}>{status.title}</Badge><p className="mt-1 text-sm text-ink-soft">{status.text}</p></div>
        <Segmented value={cycle} onChange={setCycle} options={[{ id: 'monthly', label: 'Monthly' }, { id: 'yearly', label: 'Yearly' }]} />
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        {data.plans.map((p) => {
          const price = cycle === 'yearly' ? Number(p.price_yearly ?? p.price_monthly * 12) : Number(p.price_monthly);
          const current = access.status === 'active' && access.plan_id === p.id;
          return (
            <Card key={p.id} className={cn('flex flex-col p-5', p.is_popular && 'border-pine-500 ring-1 ring-pine-500')}>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold">{p.name}</h2>
                {p.is_popular && <Badge tone="green">Most popular</Badge>}
                {current && !p.is_popular && <Badge tone="green">Current</Badge>}
              </div>
              <p className="text-sm text-ink-mute">{p.description}</p>
              <p className="mt-3 font-display text-3xl font-bold">{inr(price)}<span className="text-sm font-medium text-ink-mute"> / {cycle === 'yearly' ? 'year' : 'month'}</span></p>
              <ul className="my-4 flex-1 space-y-1.5 text-sm">
                {(p.highlights as string[]).map((h) => <li key={h} className="flex gap-2"><Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-pine-600" />{h}</li>)}
              </ul>
              <Btn onClick={() => pay(p)} loading={busy === p.id} disabled={!!busy} variant={p.is_popular ? 'primary' : 'secondary'}>{label(p)}</Btn>
            </Card>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-ink-mute">Plans are prepaid for the period you choose and do not renew automatically. Pay with UPI, cards or net banking through Razorpay. When you change plans, the time left on your current plan is carried over.</p>

      <h2 className="mb-2 mt-8 font-display text-lg font-semibold">Payment history</h2>
      {data.payments.length === 0 ? <p className="text-sm text-ink-mute">No payments yet.</p> : (
        <Table head={['Date', 'Plan', 'Period', 'Amount', 'Status', 'Reference']}>
          {data.payments.map((p) => (
            <tr key={p.id}>
              <td className="px-4 py-2.5">{fmtDate(p.created_at, true)}</td>
              <td className="px-4 py-2.5">{p.plan_name}</td>
              <td className="px-4 py-2.5">{p.months === 12 ? 'Yearly' : `${p.months} month${p.months > 1 ? 's' : ''}`}</td>
              <td className="px-4 py-2.5 font-semibold">{inr(p.amount_paise / 100, 2)}</td>
              <td className="px-4 py-2.5"><Badge tone={p.status === 'paid' ? 'green' : p.status === 'failed' ? 'red' : 'gray'}>{p.status === 'created' ? 'not completed' : p.status}</Badge></td>
              <td className="px-4 py-2.5 font-slip text-xs text-ink-mute">{p.razorpay_payment_id ?? p.razorpay_order_id}</td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}

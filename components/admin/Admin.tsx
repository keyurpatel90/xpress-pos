'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Btn, Field, Input, Modal, Select, Textarea, Toggle } from '@/components/ui';
import { cn, fmtDate, inr } from '@/lib/utils';
import type { Row } from '@/lib/types';
import { deletePlan, restaurantAction, savePlan, saveFeature, saveSettings, setTicketStatus, type PlanInput } from '@/app/admin/actions';

type Res = { ok: true } | { ok: false; error: string };

function useRun() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const run = (fn: () => Promise<Res>, ok = 'Saved', after?: () => void) =>
    start(async () => {
      const r = await fn();
      setMsg(r.ok ? { ok: true, text: ok } : { ok: false, text: r.error });
      if (r.ok) { after?.(); router.refresh(); }
    });
  const note = msg && <p role="status" className={cn('text-sm', msg.ok ? 'text-brand-700' : 'text-rose-600')}>{msg.text}</p>;
  return { run, pending, note };
}

export function RestaurantActions({ r, plans }: { r: Row; plans: Row[] }) {
  const { run, pending, note } = useRun();
  const [mode, setMode] = useState<null | 'extend' | 'grant'>(null);
  const [days, setDays] = useState('14');
  const [months, setMonths] = useState('1');
  const [planId, setPlanId] = useState(plans[0]?.id ?? '');
  const suspended = r.subscription_status === 'cancelled';
  return (
    <>
      <div className="flex flex-wrap justify-end gap-1">
        <Btn size="sm" variant="secondary" onClick={() => setMode('extend')}>Extend trial</Btn>
        <Btn size="sm" variant="secondary" onClick={() => setMode('grant')}>Grant plan</Btn>
        <Btn size="sm" variant={suspended ? 'primary' : 'ghost'} loading={pending}
          onClick={() => { if (suspended || confirm(`Suspend ${r.name}? They lose paid access immediately.`)) run(() => restaurantAction({ id: r.id, action: suspended ? 'restore' : 'suspend' }), suspended ? 'Restored' : 'Suspended'); }}>
          {suspended ? 'Restore' : 'Suspend'}
        </Btn>
      </div>
      <Modal open={mode === 'extend'} onClose={() => setMode(null)} title={`Extend trial: ${r.name}`}
        footer={<><Btn variant="secondary" onClick={() => setMode(null)}>Cancel</Btn><Btn loading={pending} onClick={() => run(() => restaurantAction({ id: r.id, action: 'extend_trial', days: Number(days) }), 'Trial extended', () => setMode(null))}>Extend</Btn></>}>
        <Field label="Add days"><Input type="number" min="1" max="365" value={days} onChange={(e) => setDays(e.target.value)} /></Field>
        {note}
      </Modal>
      <Modal open={mode === 'grant'} onClose={() => setMode(null)} title={`Grant plan: ${r.name}`}
        footer={<><Btn variant="secondary" onClick={() => setMode(null)}>Cancel</Btn><Btn loading={pending} onClick={() => run(() => restaurantAction({ id: r.id, action: 'grant', plan_id: planId, months: Number(months) }), 'Plan granted', () => setMode(null))}>Grant</Btn></>}>
        <div className="space-y-3">
          <p className="text-sm text-ink-mute">Activates a plan without a payment, for example for a manual bank transfer or a partner account.</p>
          <Field label="Plan"><Select value={planId} onChange={(e) => setPlanId(e.target.value)}>{plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
          <Field label="Months"><Input type="number" min="1" max="36" value={months} onChange={(e) => setMonths(e.target.value)} /></Field>
          {note}
        </div>
      </Modal>
    </>
  );
}

export function PlanManager({ plans }: { plans: Row[] }) {
  const { run, pending, note } = useRun();
  const [p, setP] = useState<Row | null>(null);
  const open = (x: Row | null) => setP(x
    ? { ...x, highlights: (x.highlights as string[]).join('\n'), price_yearly: x.price_yearly ?? '' }
    : { id: null, name: '', description: '', level: plans.length + 1, price_monthly: '', price_yearly: '', highlights: '', is_popular: false, is_active: true, sort: plans.length + 1 });

  function save() {
    if (!p) return;
    const input: PlanInput = {
      id: p.id ?? undefined, name: p.name, description: p.description ?? '', level: Number(p.level) || 1, price_monthly: Number(p.price_monthly),
      price_yearly: p.price_yearly === '' ? null : Number(p.price_yearly), highlights: String(p.highlights).split('\n'),
      is_popular: !!p.is_popular, is_active: !!p.is_active, sort: Number(p.sort) || 0,
    };
    run(() => savePlan(input), 'Plan saved', () => setP(null));
  }
  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-ink-mute">Plans appear on the pricing page and in each restaurant’s billing screen. The level decides which feature-access rows a plan unlocks.</p>
        <Btn onClick={() => open(null)}>New plan</Btn>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((x) => (
          <div key={x.id} className="card p-5">
            <div className="flex items-center justify-between"><h2 className="font-display text-xl font-bold">{x.name}</h2><Badge tone={x.is_active ? 'green' : 'gray'}>{x.is_active ? 'Active' : 'Hidden'}</Badge></div>
            <p className="text-sm text-ink-mute">Level {x.level}{x.is_popular ? ' · Most popular' : ''}</p>
            <p className="mt-2 font-display text-2xl font-bold">{inr(x.price_monthly)}<span className="text-sm font-medium text-ink-mute"> / month</span></p>
            {x.price_yearly != null && <p className="text-sm text-ink-mute">{inr(x.price_yearly)} / year</p>}
            <ul className="my-3 list-disc space-y-1 pl-5 text-sm">{(x.highlights as string[]).map((h) => <li key={h}>{h}</li>)}</ul>
            <div className="flex gap-2">
              <Btn size="sm" variant="secondary" onClick={() => open(x)}>Edit</Btn>
              <Btn size="sm" variant="ghost" onClick={() => confirm(`Delete ${x.name}? Restaurants on it keep access until their period ends.`) && run(() => deletePlan(x.id), 'Plan deleted')}>Delete</Btn>
            </div>
          </div>
        ))}
      </div>
      <Modal open={!!p} onClose={() => setP(null)} title={p?.id ? 'Edit plan' : 'New plan'} wide
        footer={<><Btn variant="secondary" onClick={() => setP(null)}>Cancel</Btn><Btn loading={pending} onClick={save}>Save plan</Btn></>}>
        {p && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name"><Input value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} /></Field>
            <Field label="Level" hint="Higher levels unlock more features"><Input type="number" min="1" value={p.level} onChange={(e) => setP({ ...p, level: e.target.value })} /></Field>
            <Field label="Monthly price (₹)"><Input type="number" min="0" value={p.price_monthly} onChange={(e) => setP({ ...p, price_monthly: e.target.value })} /></Field>
            <Field label="Yearly price (₹)" hint="Blank = 12 × monthly"><Input type="number" min="0" value={p.price_yearly} onChange={(e) => setP({ ...p, price_yearly: e.target.value })} /></Field>
            <Field label="Short description" className="sm:col-span-2"><Input value={p.description ?? ''} onChange={(e) => setP({ ...p, description: e.target.value })} /></Field>
            <Field label="Highlights (one per line)" className="sm:col-span-2"><Textarea rows={5} value={p.highlights} onChange={(e) => setP({ ...p, highlights: e.target.value })} /></Field>
            <Field label="Sort order"><Input type="number" value={p.sort} onChange={(e) => setP({ ...p, sort: e.target.value })} /></Field>
            <div className="flex items-end gap-6 pb-1">
              <Toggle checked={!!p.is_popular} onChange={(v) => setP({ ...p, is_popular: v })} label="Most popular" />
              <Toggle checked={!!p.is_active} onChange={(v) => setP({ ...p, is_active: v })} label="Active" />
            </div>
            <div className="sm:col-span-2">{note}</div>
          </div>
        )}
      </Modal>
    </>
  );
}

export function FeatureTable({ features, maxLevel, planNames }: { features: Row[]; maxLevel: number; planNames: Record<number, string> }) {
  const { run, note } = useRun();
  return (
    <div className="space-y-3">
      {note}
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-line bg-field/60 text-ink-mute">
            <tr><th className="px-4 py-2.5 font-medium">Feature</th><th className="px-4 py-2.5 font-medium">Needs a subscription</th><th className="px-4 py-2.5 font-medium">Lowest plan level</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {features.map((f) => (
              <tr key={f.key}>
                <td className="px-4 py-3"><span className="font-medium">{f.label}</span><span className="block text-xs text-ink-mute">{f.description}</span></td>
                <td className="px-4 py-3"><Toggle checked={f.requires_subscription} onChange={(v) => run(() => saveFeature(f.key, v, f.min_plan_level))} label={f.requires_subscription ? 'Paid only' : 'Free'} /></td>
                <td className="px-4 py-3">
                  <div className="w-48">
                    <Select disabled={!f.requires_subscription} value={f.min_plan_level} onChange={(e) => run(() => saveFeature(f.key, true, Number(e.target.value)))}>
                      {Array.from({ length: Math.max(maxLevel, f.min_plan_level) }, (_, i) => i + 1).map((l) => <option key={l} value={l}>Level {l}{planNames[l] ? ` (${planNames[l]})` : ''}</option>)}
                    </Select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SettingsForm({ initial }: { initial: { trial_days: number; trial_premium_access: boolean; after_trial_mode: 'lock' | 'free' } }) {
  const { run, pending, note } = useRun();
  const [s, setS] = useState({ ...initial, trial_days: String(initial.trial_days) });
  return (
    <div className="card max-w-xl space-y-5 p-5">
      <Field label="Free trial length (days)" hint="Applies to restaurants that sign up from now on"><Input type="number" min="0" max="365" value={s.trial_days} onChange={(e) => setS({ ...s, trial_days: e.target.value })} /></Field>
      <div>
        <Toggle checked={s.trial_premium_access} onChange={(v) => setS({ ...s, trial_premium_access: v })} label="Give trial restaurants the subscription-only features too" />
        <p className="mt-1 text-xs text-ink-mute">Off: during the trial only free features work, and paid features show an upgrade prompt.</p>
      </div>
      <Field label="When a trial or plan ends" hint="Restaurants keep all their data either way">
        <Select value={s.after_trial_mode} onChange={(e) => setS({ ...s, after_trial_mode: e.target.value as 'lock' | 'free' })}>
          <option value="lock">Lock the app until they subscribe</option>
          <option value="free">Keep free features working, switch off paid ones</option>
        </Select>
      </Field>
      <div className="flex items-center gap-3">
        <Btn loading={pending} onClick={() => run(() => saveSettings({ ...s, trial_days: Number(s.trial_days) }), 'Settings saved')}>Save settings</Btn>
        {note}
      </div>
    </div>
  );
}

export function TicketStatus({ t }: { t: Row }) {
  const { run, pending } = useRun();
  return (
    <div className="flex items-center gap-2">
      <Badge tone={t.status === 'open' ? 'yellow' : 'gray'}>{t.status}</Badge>
      <Btn size="sm" variant="secondary" loading={pending} onClick={() => run(() => setTicketStatus(t.id, t.status === 'open' ? 'closed' : 'open'))}>{t.status === 'open' ? 'Close' : 'Reopen'}</Btn>
      <span className="text-xs text-ink-mute">{fmtDate(t.created_at, true)}</span>
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { api, unwrap, useAction, useSupabase } from '@/lib/hooks';
import { useApp } from '@/components/app/AppProvider';
import { Badge, Btn, Card, Field, Input, LinkBtn, PageHeader, Toggle } from '@/components/ui';
import type { Row } from '@/lib/types';

export default function SettingsPage() {
  const { restaurant, refresh, has } = useApp();
  const sb = useSupabase();
  const act = useAction();
  const [f, setF] = useState<Row>({ ...restaurant });
  const set = (k: string, v: unknown) => setF((x) => ({ ...x, [k]: v }));

  async function save() {
    if (!String(f.name).trim()) return;
    const payload = {
      name: f.name.trim(), phone: f.phone || null, email: f.email || null, address: f.address || null, city: f.city || null, state: f.state || null,
      gstin: f.gstin || null, bill_footer: f.bill_footer || '', tax_rate: Number(f.tax_rate) || 0, tax_inclusive: !!f.tax_inclusive,
      service_charge_pct: Number(f.service_charge_pct) || 0, invoice_prefix: (f.invoice_prefix || 'INV').trim(), auto_print_kot: !!f.auto_print_kot,
      loyalty_enabled: !!f.loyalty_enabled, points_per_100: Number(f.points_per_100) || 0, point_value: Number(f.point_value) || 0,
    };
    const ok = await act(async () => unwrap(await sb.from('restaurants').update(payload).eq('id', restaurant.id)) ?? true, 'Settings saved');
    if (ok) refresh();
  }

  return (
    <>
      <PageHeader title="Settings" actions={<Btn onClick={save}>Save settings</Btn>} />
      <div className="space-y-4">
        <Card className="p-5">
          <h2 className="mb-3 font-display text-lg font-semibold">Restaurant details</h2>
          <p className="mb-3 text-sm text-ink-mute">Printed at the top of every bill.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Restaurant name"><Input value={f.name ?? ''} onChange={(e) => set('name', e.target.value)} /></Field>
            <Field label="Phone"><Input value={f.phone ?? ''} onChange={(e) => set('phone', e.target.value)} /></Field>
            <Field label="Email"><Input type="email" value={f.email ?? ''} onChange={(e) => set('email', e.target.value)} /></Field>
            <Field label="GSTIN"><Input value={f.gstin ?? ''} onChange={(e) => set('gstin', e.target.value.toUpperCase())} /></Field>
            <Field label="Address" className="sm:col-span-2"><Input value={f.address ?? ''} onChange={(e) => set('address', e.target.value)} /></Field>
            <Field label="City"><Input value={f.city ?? ''} onChange={(e) => set('city', e.target.value)} /></Field>
            <Field label="State"><Input value={f.state ?? ''} onChange={(e) => set('state', e.target.value)} /></Field>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 font-display text-lg font-semibold">Billing and tax</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Default GST %" hint="Items can override this"><Input type="number" min="0" max="100" step="0.01" value={f.tax_rate ?? 0} onChange={(e) => set('tax_rate', e.target.value)} /></Field>
            <Field label="Service charge %"><Input type="number" min="0" max="100" step="0.01" value={f.service_charge_pct ?? 0} onChange={(e) => set('service_charge_pct', e.target.value)} /></Field>
            <Field label="Invoice prefix" hint="Bills read PREFIX-00001"><Input value={f.invoice_prefix ?? ''} onChange={(e) => set('invoice_prefix', e.target.value)} /></Field>
            <div className="sm:col-span-3"><Toggle checked={!!f.tax_inclusive} onChange={(v) => set('tax_inclusive', v)} label="Menu prices already include GST" /></div>
            <div className="sm:col-span-3"><Toggle checked={!!f.auto_print_kot} onChange={(v) => set('auto_print_kot', v)} label="Print a KOT slip automatically when an order is sent to the kitchen" /></div>
            <Field label="Bill footer message" className="sm:col-span-3"><Input value={f.bill_footer ?? ''} onChange={(e) => set('bill_footer', e.target.value)} /></Field>
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2"><h2 className="font-display text-lg font-semibold">Customer loyalty</h2>{!has('loyalty') && <Badge tone="yellow">Paid plan</Badge>}</div>
          {has('loyalty') ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-3"><Toggle checked={!!f.loyalty_enabled} onChange={(v) => set('loyalty_enabled', v)} label="Reward customers with points" /></div>
              <Field label="Points earned per ₹100 spent"><Input type="number" min="0" step="0.01" value={f.points_per_100 ?? 0} onChange={(e) => set('points_per_100', e.target.value)} /></Field>
              <Field label="Value of one point (₹)"><Input type="number" min="0" step="0.01" value={f.point_value ?? 0} onChange={(e) => set('point_value', e.target.value)} /></Field>
            </div>
          ) : <p className="text-sm text-ink-mute">Loyalty points are available on a paid plan. <LinkBtn href="/app/billing" variant="ghost" size="sm">See plans</LinkBtn></p>}
        </Card>

        <WhatsAppCard />
      </div>
    </>
  );
}

function WhatsAppCard() {
  const { has } = useApp();
  const act = useAction();
  const [s, setS] = useState<Row | null>(null);
  const [f, setF] = useState({ phone_number_id: '', access_token: '', template: '', lang: 'en' });

  useEffect(() => {
    if (!has('whatsapp')) return;
    api<Row>('/api/settings/whatsapp', 'GET').then((r) => {
      setS(r);
      setF((x) => ({ ...x, phone_number_id: r.phone_number_id ?? '', template: r.template ?? '', lang: r.lang ?? 'en' }));
    }).catch(() => setS({}));
  }, [has]);

  async function save() {
    const r = await act(() => api<Row>('/api/settings/whatsapp', 'PUT', f), 'WhatsApp settings saved');
    if (r) { setS(r); setF((x) => ({ ...x, access_token: '' })); }
  }

  return (
    <Card className="p-5">
      <div className="mb-1 flex items-center gap-2">
        <h2 className="font-display text-lg font-semibold">WhatsApp bills</h2>
        {!has('whatsapp') ? <Badge tone="yellow">Paid plan</Badge> : s?.configured ? <Badge tone="green">Connected</Badge> : <Badge>Not connected</Badge>}
      </div>
      {!has('whatsapp') ? (
        <p className="text-sm text-ink-mute">Sending bills on WhatsApp is available on a paid plan. <LinkBtn href="/app/billing" variant="ghost" size="sm">See plans</LinkBtn></p>
      ) : (
        <>
          <p className="mb-3 text-sm text-ink-mute">
            Use your WhatsApp Business Cloud API details from Meta. Without a template, messages only reach customers who messaged you in the last 24 hours, so for bills to new customers create and approve a template with 5 body variables: customer name, restaurant, bill number, amount, bill link.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Phone number ID"><Input value={f.phone_number_id} onChange={(e) => setF({ ...f, phone_number_id: e.target.value })} /></Field>
            <Field label="Permanent access token" hint={s?.token_saved ? 'A token is saved. Leave blank to keep it.' : undefined}>
              <Input type="password" autoComplete="off" value={f.access_token} onChange={(e) => setF({ ...f, access_token: e.target.value })} />
            </Field>
            <Field label="Template name (recommended)"><Input value={f.template} onChange={(e) => setF({ ...f, template: e.target.value })} placeholder="bill_ready" /></Field>
            <Field label="Template language"><Input value={f.lang} onChange={(e) => setF({ ...f, lang: e.target.value })} placeholder="en" /></Field>
          </div>
          <div className="mt-3"><Btn onClick={save}>Save WhatsApp settings</Btn></div>
        </>
      )}
    </Card>
  );
}

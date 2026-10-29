'use client';
import { useEffect, useState } from 'react';
import { unwrap, useAction, useSupabase } from '@/lib/hooks';
import { useApp, useToast } from '@/components/app/AppProvider';
import { Invoice } from '@/components/app/Invoice';
import { SendWhatsApp } from '@/components/app/SendWhatsApp';
import { Btn, Field, Input, Modal, Segmented, Select } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { PAY_METHODS, inr } from '@/lib/utils';
import type { Row } from '@/lib/types';

type Pay = { method: string; amount: string };

export function BillDialog({ orderId, onClose, onPaid }: { orderId: string; onClose: () => void; onPaid: () => void }) {
  const { restaurant, has, print } = useApp();
  const sb = useSupabase();
  const act = useAction();
  const toast = useToast();
  const [order, setOrder] = useState<Row | null>(null);
  const [items, setItems] = useState<Row[]>([]);
  const [customer, setCustomer] = useState<Row | null>(null);
  const [ready, setReady] = useState(false);
  const [dtype, setDtype] = useState<'none' | 'percent' | 'flat'>('none');
  const [dval, setDval] = useState('');
  const [pts, setPts] = useState('');
  const [pays, setPays] = useState<Pay[]>([{ method: 'cash', amount: '' }]);
  const [cashIn, setCashIn] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Row | null>(null);

  const splitOk = has('split_billing');
  const loyaltyOk = has('loyalty') && !!restaurant.loyalty_enabled;

  useEffect(() => {
    let alive = true;
    (async () => {
      const [o, its] = await Promise.all([
        sb.from('orders').select('*').eq('id', orderId).single(),
        sb.from('order_items').select('*').eq('order_id', orderId).order('created_at'),
      ]);
      if (!alive) return;
      if (o.error || !o.data) { toast(o.error?.message ?? 'Order not found', 'error'); return; }
      const ord = o.data as Row;
      if (ord.customer_id) {
        const { data: c } = await sb.from('customers').select('*').eq('id', ord.customer_id).maybeSingle();
        if (alive) setCustomer(c as Row | null);
      }
      setItems((its.data as Row[]) ?? []);
      setDtype(ord.discount_type);
      setDval(Number(ord.discount_value) > 0 ? String(ord.discount_value) : '');
      setPts(ord.loyalty_points_used > 0 ? String(ord.loyalty_points_used) : '');
      setOrder(ord);
      setReady(true);
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  useEffect(() => {
    if (!ready || done) return;
    const t = setTimeout(async () => {
      const r = await sb.rpc('apply_discount', { p_order: orderId, p_type: dtype, p_value: Number(dval) || 0, p_points: Number(pts) || 0 });
      if (r.error) toast(r.error.message, 'error'); else setOrder(r.data as Row);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, dtype, dval, pts]);

  const total = Number(order?.total ?? 0);
  useEffect(() => {
    setPays((p) => (p.length === 1 ? [{ ...p[0], amount: String(total) }] : p));
  }, [total]);

  const paySum = pays.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const remaining = Math.round((total - paySum) * 100) / 100;
  const canPay = ready && total > 0 && Math.abs(remaining) < 0.01 && pays.every((p) => Number(p.amount) > 0);
  const change = pays.length === 1 && pays[0].method === 'cash' && Number(cashIn) > total ? Number(cashIn) - total : 0;

  async function settle() {
    setBusy(true);
    const r = await act(async () => unwrap(await sb.rpc('settle_order', {
      p_order: orderId, p_payments: pays.map((p) => ({ method: p.method, amount: Number(p.amount) })),
    })) as Row);
    if (!r) { setBusy(false); return; }
    const [o, its, pp] = await Promise.all([
      sb.from('orders').select('*').eq('id', orderId).single(),
      sb.from('order_items').select('*').eq('order_id', orderId).order('created_at'),
      sb.from('order_payments').select('*').eq('order_id', orderId),
    ]);
    setDone({ ...r, order: o.data, items: its.data ?? [], payments: pp.data ?? [] });
    setBusy(false);
    onPaid();
  }

  if (done) {
    const o = done.order as Row;
    return (
      <Modal open onClose={onClose} title="Payment received" footer={<Btn onClick={onClose}>Done</Btn>}>
        <div className="space-y-4">
          <div className="text-center">
            <span className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><Icon name="check" className="h-6 w-6" /></span>
            <p className="font-display text-2xl font-bold">{inr(o.total)}</p>
            <p className="text-sm text-ink-mute">Invoice {done.invoice_no}</p>
            {done.points_earned > 0 && <p className="mt-1 text-sm font-medium text-emerald-700">Customer earned {done.points_earned} points</p>}
          </div>
          <Btn variant="secondary" className="w-full" onClick={() => print(<Invoice restaurant={restaurant} order={o} items={done.items} payments={done.payments} />)}>
            <Icon name="print" className="h-4 w-4" /> Print bill
          </Btn>
          <SendWhatsApp orderId={orderId} defaultPhone={o.customer_phone || customer?.phone} />
        </div>
      </Modal>
    );
  }

  const live = items.filter((i) => i.status !== 'cancelled');
  return (
    <Modal open onClose={onClose} title={order ? `Bill for order #${order.order_no}` : 'Bill'} wide
      footer={<><Btn variant="secondary" onClick={onClose}>Back</Btn><Btn onClick={settle} loading={busy} disabled={!canPay}>Collect {inr(total)}</Btn></>}>
      {!order ? <p className="py-8 text-center text-sm text-ink-mute">Loading bill…</p> : (
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-line text-sm">
              {live.map((i) => (
                <div key={i.id} className="flex justify-between gap-2 border-b border-line px-3 py-1.5 last:border-0">
                  <span>{i.qty} × {i.name}{(i.modifiers ?? []).length > 0 && <span className="text-ink-mute"> ({(i.modifiers as Row[]).map((m) => m.name).join(', ')})</span>}</span>
                  <span>{inr((Number(i.unit_price) + Number(i.modifier_total)) * i.qty, 2)}</span>
                </div>
              ))}
            </div>
            <dl className="mt-3 space-y-1 text-sm">
              <Row2 l="Subtotal" r={inr(order.subtotal, 2)} />
              {Number(order.discount_amount) > 0 && <Row2 l="Discount" r={'-' + inr(order.discount_amount, 2)} />}
              {Number(order.loyalty_discount) > 0 && <Row2 l="Points redeemed" r={'-' + inr(order.loyalty_discount, 2)} />}
              {Number(order.service_charge) > 0 && <Row2 l="Service charge" r={inr(order.service_charge, 2)} />}
              {Number(order.tax_amount) > 0 && <Row2 l={restaurant.tax_inclusive ? 'GST (included)' : 'GST'} r={inr(order.tax_amount, 2)} />}
              {Number(order.round_off) !== 0 && <Row2 l="Round off" r={inr(order.round_off, 2)} />}
              <div className="flex justify-between border-t border-line pt-2 font-display text-xl font-bold"><dt>Total</dt><dd>{inr(order.total)}</dd></div>
            </dl>
          </div>
          <div className="space-y-4">
            <Field label="Discount">
              <div className="flex gap-2">
                <Segmented value={dtype} onChange={setDtype} options={[{ id: 'none', label: 'None' }, { id: 'percent', label: '%' }, { id: 'flat', label: '₹' }]} />
                {dtype !== 'none' && <Input type="number" min="0" inputMode="decimal" value={dval} onChange={(e) => setDval(e.target.value)} placeholder={dtype === 'percent' ? 'Percent' : 'Amount'} />}
              </div>
            </Field>
            {loyaltyOk && customer && (
              <Field label={`Redeem points (${customer.loyalty_points} available, ₹${restaurant.point_value} each)`}>
                <Input type="number" min="0" max={customer.loyalty_points} value={pts} onChange={(e) => setPts(e.target.value)} placeholder="0" />
              </Field>
            )}
            <div>
              <p className="mb-1 text-sm font-medium text-ink-soft">Payment</p>
              <div className="space-y-2">
                {pays.map((p, idx) => (
                  <div key={idx} className="flex gap-2">
                    <div className="w-28 shrink-0">
                      <Select value={p.method} onChange={(e) => setPays(pays.map((x, i) => (i === idx ? { ...x, method: e.target.value } : x)))}>
                        {PAY_METHODS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                      </Select>
                    </div>
                    <Input type="number" min="0" inputMode="decimal" value={p.amount} disabled={pays.length === 1}
                      onChange={(e) => setPays(pays.map((x, i) => (i === idx ? { ...x, amount: e.target.value } : x)))} />
                    {pays.length > 1 && <Btn variant="ghost" size="md" onClick={() => setPays(pays.filter((_, i) => i !== idx))} aria-label="Remove payment"><Icon name="x" className="h-4 w-4" /></Btn>}
                  </div>
                ))}
              </div>
              {splitOk ? (
                <div className="mt-2 flex items-center justify-between text-sm">
                  <Btn variant="ghost" size="sm" onClick={() => setPays([...pays.map((p, i) => (i === 0 && pays.length === 1 ? { ...p, amount: '' } : p)), { method: 'upi', amount: '' }])}>
                    <Icon name="plus" className="h-4 w-4" /> Split payment
                  </Btn>
                  {pays.length > 1 && <span className={Math.abs(remaining) < 0.01 ? 'text-emerald-700' : 'text-rose-600'}>{Math.abs(remaining) < 0.01 ? 'Matches total' : `Remaining ${inr(remaining, 2)}`}</span>}
                </div>
              ) : <p className="mt-2 text-xs text-ink-mute">Split payments are available on a paid plan.</p>}
              {pays.length === 1 && pays[0].method === 'cash' && (
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <Input type="number" inputMode="decimal" placeholder="Cash received" value={cashIn} onChange={(e) => setCashIn(e.target.value)} />
                  <span className="shrink-0 font-semibold">{change > 0 ? `Change ${inr(change, 2)}` : ''}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Row2({ l, r }: { l: string; r: string }) {
  return <div className="flex justify-between"><dt className="text-ink-mute">{l}</dt><dd>{r}</dd></div>;
}

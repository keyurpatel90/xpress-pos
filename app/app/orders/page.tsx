'use client';
import Link from 'next/link';
import { useState } from 'react';
import { unwrap, useAction, useData, useSupabase } from '@/lib/hooks';
import { useApp } from '@/components/app/AppProvider';
import { Invoice } from '@/components/app/Invoice';
import { SendWhatsApp } from '@/components/app/SendWhatsApp';
import { Badge, Btn, Empty, Input, Loading, Modal, PageHeader, Select, Table } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { fmtDate, inr, isoDate, typeLabel } from '@/lib/utils';
import type { Row } from '@/lib/types';

const TONE: Record<string, 'green' | 'yellow' | 'red'> = { paid: 'green', open: 'yellow', cancelled: 'red' };

export default function OrdersPage() {
  const { role, restaurant, print } = useApp();
  const sb = useSupabase();
  const act = useAction();
  const [date, setDate] = useState(isoDate());
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<Row | null>(null);
  const [detail, setDetail] = useState<{ items: Row[]; payments: Row[] }>({ items: [], payments: [] });

  const { data: orders, loading, reload } = useData<Row[]>(async (c) => {
    const from = new Date(date + 'T00:00:00');
    const to = new Date(from.getTime() + 86400000);
    return unwrap(await c.from('orders').select('*, dining_tables(name)')
      .gte('created_at', from.toISOString()).lt('created_at', to.toISOString()).order('created_at', { ascending: false })) ?? [];
  }, [], [date]);

  async function openOrder(o: Row) {
    setSel(o);
    const [i, p] = await Promise.all([
      sb.from('order_items').select('*').eq('order_id', o.id).order('created_at'),
      sb.from('order_payments').select('*').eq('order_id', o.id),
    ]);
    setDetail({ items: (i.data as Row[]) ?? [], payments: (p.data as Row[]) ?? [] });
  }
  async function cancel() {
    if (!sel || !confirm('Cancel this order?')) return;
    const ok = await act(async () => unwrap(await sb.rpc('cancel_order', { p_order: sel.id })) ?? true, 'Order cancelled');
    if (ok) { setSel(null); reload(); }
  }

  const rows = orders.filter((o) => (status === 'all' || o.status === status) &&
    (!q || String(o.order_no).includes(q) || (o.invoice_no ?? '').toLowerCase().includes(q.toLowerCase()) || (o.customer_name ?? '').toLowerCase().includes(q.toLowerCase())));
  const canAct = role === 'owner' || role === 'cashier';

  return (
    <>
      <PageHeader title="Orders" actions={<Btn variant="secondary" onClick={reload}><Icon name="refresh" className="h-4 w-4" /> Refresh</Btn>} />
      <div className="mb-4 flex flex-wrap gap-2">
        <Input type="date" className="w-44" value={date} onChange={(e) => setDate(e.target.value)} />
        <div className="w-40"><Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option><option value="open">Open</option><option value="paid">Paid</option><option value="cancelled">Cancelled</option>
        </Select></div>
        <Input className="w-56" placeholder="Search order, bill or customer" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {loading ? <Loading /> : rows.length === 0 ? <Empty icon="receipt" title="No orders found" text="Try another date or status." /> : (
        <Table head={['Order', 'Time', 'Type', 'Customer', 'Total', 'Status']}>
          {rows.map((o) => (
            <tr key={o.id} onClick={() => openOrder(o)} className="cursor-pointer hover:bg-field/60">
              <td className="px-4 py-2.5 font-semibold">#{o.order_no}{o.invoice_no && <span className="ml-2 text-xs font-normal text-ink-mute">{o.invoice_no}</span>}</td>
              <td className="px-4 py-2.5">{new Date(o.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td>
              <td className="px-4 py-2.5">{o.dining_tables?.name ? `Table ${o.dining_tables.name}` : typeLabel(o.order_type)}</td>
              <td className="px-4 py-2.5">{o.customer_name ?? '-'}</td>
              <td className="px-4 py-2.5 font-semibold">{inr(o.total)}</td>
              <td className="px-4 py-2.5"><Badge tone={TONE[o.status]}>{o.status}</Badge></td>
            </tr>
          ))}
        </Table>
      )}
      <Modal open={!!sel} onClose={() => setSel(null)} title={sel ? `Order #${sel.order_no}` : ''}
        footer={sel && <>
          {sel.status === 'open' && canAct && <Btn variant="danger" className="mr-auto" onClick={cancel}>Cancel order</Btn>}
          {sel.status === 'open' && <Link href={`/app/pos?order=${sel.id}`} className="btn btn-secondary btn-md">Open in POS</Link>}
          <Btn onClick={() => print(<Invoice restaurant={restaurant} order={sel} items={detail.items} payments={detail.payments} tableName={sel.dining_tables?.name} />)}>
            <Icon name="print" className="h-4 w-4" /> Print bill
          </Btn>
        </>}>
        {sel && (
          <div className="space-y-4">
            <div className="rounded-lg border border-line bg-field/50 p-3"><Invoice restaurant={restaurant} order={sel} items={detail.items} payments={detail.payments} tableName={sel.dining_tables?.name} /></div>
            <p className="text-xs text-ink-mute">Created {fmtDate(sel.created_at, true)}</p>
            {sel.status !== 'cancelled' && canAct && <SendWhatsApp orderId={sel.id} defaultPhone={sel.customer_phone} />}
          </div>
        )}
      </Modal>
    </>
  );
}

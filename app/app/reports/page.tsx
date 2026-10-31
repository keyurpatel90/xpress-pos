'use client';
import { useState } from 'react';
import { unwrap, useData } from '@/lib/hooks';
import { BarChart } from '@/components/BarChart';
import { Btn, Card, Input, Loading, PageHeader, Segmented, Stat } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { GstReconciliation } from '@/components/reports/GstReconciliation';
import { inr, isoDate, typeLabel } from '@/lib/utils';
import type { Row } from '@/lib/types';

const addDays = (n: number) => isoDate(new Date(Date.now() + n * 86400000));

export default function ReportsPage() {
  const [preset, setPreset] = useState('7');
  const [from, setFrom] = useState(addDays(-6));
  const [to, setTo] = useState(addDays(0));
  const pick = (p: string) => {
    setPreset(p);
    if (p !== 'custom') { setFrom(addDays(-(Number(p) - 1))); setTo(addDays(0)); }
  };
  const { data: r, loading } = useData<Row>(async (sb) => unwrap(await sb.rpc('sales_report', { p_from: from, p_to: to })) ?? {}, {}, [from, to]);

  function csv() {
    const lines = ['Date,Bills,Sales', ...(r.by_day ?? []).map((d: Row) => `${d.day},${d.orders},${d.sales}`), '', 'Item,Qty,Revenue', ...(r.top_items ?? []).map((t: Row) => `"${String(t.name).replace(/"/g, '""')}",${t.qty},${t.revenue}`)];
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }));
    a.download = `sales-${from}-to-${to}.csv`;
    a.click();
  }

  const t: Row = r.totals ?? {};
  const days: { label: string; value: number }[] = (r.by_day ?? []).map((d: Row) => ({
    label: new Date(d.day + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), value: Number(d.sales),
  }));

  return (
    <>
      <PageHeader title="Reports" subtitle="Paid bills only" actions={<Btn variant="secondary" onClick={csv} disabled={!r.by_day}><Icon name="download" className="h-4 w-4" /> Download CSV</Btn>} />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Segmented value={preset} onChange={pick} options={[{ id: '1', label: 'Today' }, { id: '7', label: '7 days' }, { id: '30', label: '30 days' }, { id: 'custom', label: 'Custom' }]} />
        {preset === 'custom' && <>
          <Input type="date" className="w-40" value={from} onChange={(e) => setFrom(e.target.value)} />
          <span className="text-ink-mute">to</span>
          <Input type="date" className="w-40" value={to} onChange={(e) => setTo(e.target.value)} />
        </>}
      </div>
      {loading ? <Loading variant="report" /> : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Sales" value={inr(t.total)} />
            <Stat label="Bills" value={t.orders ?? 0} sub={`Average ${inr(t.orders ? Number(t.total) / Number(t.orders) : 0)}`} />
            <Stat label="Discounts given" value={inr(t.discount)} />
            <Stat label="GST collected" value={inr(t.tax)} sub={Number(t.service_charge) > 0 ? `Service charge ${inr(t.service_charge)}` : undefined} />
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Card className="p-4 lg:col-span-2">
              <p className="mb-3 font-display font-semibold">Sales by day</p>
              {days.length === 0 ? <p className="py-8 text-center text-sm text-ink-mute">No paid bills in this range.</p> : <BarChart data={days.slice(-31)} format={(n) => inr(n)} />}
            </Card>
            <Card className="p-4">
              <p className="mb-3 font-display font-semibold">By payment mode</p>
              <ul className="divide-y divide-line text-sm">
                {(r.by_payment ?? []).map((p: Row) => <li key={p.method} className="flex justify-between py-2"><span className="capitalize">{p.method}</span><b>{inr(p.amount)}</b></li>)}
                {(r.by_payment ?? []).length === 0 && <li className="py-2 text-ink-mute">No data</li>}
              </ul>
              <p className="mb-2 mt-5 font-display font-semibold">By order type</p>
              <ul className="divide-y divide-line text-sm">
                {(r.by_type ?? []).map((p: Row) => <li key={p.order_type} className="flex justify-between py-2"><span>{typeLabel(p.order_type)} <span className="text-ink-mute">({p.n})</span></span><b>{inr(p.sales)}</b></li>)}
                {(r.by_type ?? []).length === 0 && <li className="py-2 text-ink-mute">No data</li>}
              </ul>
            </Card>
          </div>
          <Card className="mt-4 p-4">
            <p className="mb-2 font-display font-semibold">Top items</p>
            <ul className="divide-y divide-line text-sm">
              {(r.top_items ?? []).map((i: Row, n: number) => (
                <li key={i.name} className="flex items-center justify-between py-2"><span>{n + 1}. {i.name}</span><span><b>{i.qty}</b> sold · {inr(i.revenue)}</span></li>
              ))}
              {(r.top_items ?? []).length === 0 && <li className="py-2 text-ink-mute">No data</li>}
            </ul>
          </Card>
          <GstReconciliation />
        </>
      )}
    </>
  );
}

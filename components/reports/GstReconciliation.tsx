'use client';
import { useState } from 'react';
import { Btn, Card, Field, Input, Loading, Stat, Table } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { inr } from '@/lib/utils';

type GstRow = { taxRate: number; taxableValue: number; cgst: number; sgst: number; igst: number; tax: number; grossSales: number };
type GstResponse = { rows: GstRow[]; totals: Omit<GstRow, 'taxRate' | 'orderCount'>; status: { cancelledOrders: number; cancelledAmount: number; refundedAmount: number; modifiedBills: number }; notes: string[] };
const format = (value: number) => Number(value || 0).toFixed(2);

export function GstReconciliation() {
  const now = new Date();
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  const [data, setData] = useState<GstResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const load = async () => {
    const [year, monthNumber] = month.split('-').map(Number);
    const start = `${month}-01`;
    const end = new Date(Date.UTC(year, monthNumber, 0)).toISOString().slice(0, 10);
    setLoading(true); setError('');
    try { const response = await fetch(`/api/reports/gst-reconciliation?startDate=${start}&endDate=${end}`); const json = await response.json(); if (!response.ok) throw new Error(json.error); setData(json); } catch (e) { setError((e as Error).message); } finally { setLoading(false); }
  };
  const download = () => {
    if (!data) return;
    const lines = [['GSTIN/Recipient', 'Invoice Date', 'Tax Rate', 'Taxable Value', 'CGST', 'SGST', 'IGST', 'Gross Sales'], ...data.rows.map((row) => ['', month, `${row.taxRate}%`, format(row.taxableValue), format(row.cgst), format(row.sgst), format(row.igst), format(row.grossSales)])];
    const csv = lines.map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); link.download = `gstr-1-b2c-${month}.csv`; link.click(); URL.revokeObjectURL(link.href);
  };
  return <section className="mt-6 flex flex-col gap-4">
    <Card className="p-4"><div className="flex flex-wrap items-end justify-between gap-3"><Field label="Return month"><Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} /></Field><div className="flex gap-2"><Btn variant="secondary" onClick={load} loading={loading}>Generate reconciliation</Btn><Btn onClick={download} disabled={!data}><Icon name="download" className="h-4 w-4" /> Export GSTR-1 CSV</Btn></div></div>{error && <p className="mt-3 text-sm text-rose-600">{error}</p>}</Card>
    {loading && <Loading />}
    {data && !loading && <><div className="grid grid-cols-2 gap-3 lg:grid-cols-5"><Stat label="Taxable value" value={inr(data.totals.taxableValue)} /><Stat label="CGST" value={inr(data.totals.cgst)} /><Stat label="SGST" value={inr(data.totals.sgst)} /><Stat label="IGST" value={inr(data.totals.igst)} /><Stat label="Gross sales" value={inr(data.totals.grossSales)} /></div><Table head={['Tax rate', 'Taxable value', 'CGST', 'SGST', 'IGST', 'Gross sales']}>{data.rows.map((row) => <tr key={row.taxRate}><td className="px-4 py-3 font-semibold">{row.taxRate}%</td><td className="px-4 py-3">{inr(row.taxableValue)}</td><td className="px-4 py-3">{inr(row.cgst)}</td><td className="px-4 py-3">{inr(row.sgst)}</td><td className="px-4 py-3">{inr(row.igst)}</td><td className="px-4 py-3">{inr(row.grossSales)}</td></tr>)}</Table><Card className="p-4 text-sm"><p className="font-semibold">Reconciliation exceptions</p><p className="mt-1 text-ink-mute">Cancelled orders: {data.status.cancelledOrders} ({inr(data.status.cancelledAmount)}). Refunded amounts and credit/debit notes are not present in the current order schema.</p></Card></>}
  </section>;
}

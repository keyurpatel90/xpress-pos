import type { Row } from '@/lib/types';
import { fmtDate, inr, typeLabel } from '@/lib/utils';

const Dash = () => <div className="my-2 border-t border-dashed border-black/60" />;
const Line = ({ l, r, bold }: { l: string; r: string; bold?: boolean }) => (
  <div className={`flex justify-between gap-2 ${bold ? 'font-bold' : ''}`}><span>{l}</span><span>{r}</span></div>
);

export function Invoice({ restaurant: r, order: o, items, payments, tableName }:
  { restaurant: Row; order: Row; items: Row[]; payments: Row[]; tableName?: string | null }) {
  const live = items.filter((i) => i.status !== 'cancelled');
  const half = Number(o.tax_amount) / 2;
  return (
    <div className="mx-auto w-full max-w-[340px] bg-white font-slip text-[12px] leading-5 text-black">
      <div className="text-center">
        <div className="text-[15px] font-bold">{r.name}</div>
        {r.address && <div>{[r.address, r.city, r.state].filter(Boolean).join(', ')}</div>}
        {r.phone && <div>Ph: {r.phone}</div>}
        {r.gstin && <div>GSTIN: {r.gstin}</div>}
      </div>
      <Dash />
      <Line l={o.invoice_no ? `Bill: ${o.invoice_no}` : 'Bill (unpaid)'} r={`Order #${o.order_no}`} />
      <Line l={fmtDate(o.paid_at || o.created_at, true)} r={tableName ? `Table ${tableName}` : typeLabel(o.order_type)} />
      {o.customer_name && <div>Customer: {o.customer_name}</div>}
      <Dash />
      <div className="grid grid-cols-[1fr_28px_56px_64px] gap-1 font-bold">
        <span>Item</span><span className="text-right">Qty</span><span className="text-right">Rate</span><span className="text-right">Amt</span>
      </div>
      {live.map((i) => {
        const rate = Number(i.unit_price) + Number(i.modifier_total);
        return (
          <div key={i.id} className="mt-1">
            <div className="grid grid-cols-[1fr_28px_56px_64px] gap-1">
              <span>{i.name}</span><span className="text-right">{i.qty}</span>
              <span className="text-right">{rate.toFixed(2)}</span><span className="text-right">{(rate * i.qty).toFixed(2)}</span>
            </div>
            {(i.modifiers ?? []).map((m: Row) => <div key={m.id} className="pl-2 text-[11px]">+ {m.name}</div>)}
          </div>
        );
      })}
      <Dash />
      <Line l="Subtotal" r={inr(o.subtotal, 2)} />
      {Number(o.discount_amount) > 0 && <Line l="Discount" r={'-' + inr(o.discount_amount, 2)} />}
      {Number(o.loyalty_discount) > 0 && <Line l={`Points used (${o.loyalty_points_used})`} r={'-' + inr(o.loyalty_discount, 2)} />}
      {Number(o.service_charge) > 0 && <Line l="Service charge" r={inr(o.service_charge, 2)} />}
      {Number(o.tax_amount) > 0 && (r.tax_inclusive
        ? <Line l="GST (included)" r={inr(o.tax_amount, 2)} />
        : <><Line l="CGST" r={inr(half, 2)} /><Line l="SGST" r={inr(half, 2)} /></>)}
      {Number(o.round_off) !== 0 && <Line l="Round off" r={inr(o.round_off, 2)} />}
      <Dash />
      <div className="text-[15px]"><Line l="TOTAL" r={inr(o.total, 2)} bold /></div>
      {payments.length > 0 && (
        <>
          <Dash />
          {payments.map((p) => <Line key={p.id} l={`Paid by ${String(p.method).toUpperCase()}`} r={inr(p.amount, 2)} />)}
        </>
      )}
      <Dash />
      <div className="text-center">{r.bill_footer}</div>
    </div>
  );
}

export function KotSlip({ restaurant: r, order: o, items, tableName }: { restaurant: Row; order: Row; items: Row[]; tableName?: string | null }) {
  return (
    <div className="mx-auto w-full max-w-[340px] bg-white font-slip text-[13px] leading-5 text-black">
      <div className="text-center text-[15px] font-bold">KITCHEN ORDER</div>
      <div className="text-center">{r.name}</div>
      <Dash />
      <Line l={`KOT #${o.kot_count}  Order #${o.order_no}`} r={tableName ? `Table ${tableName}` : typeLabel(o.order_type)} bold />
      <div>{fmtDate(new Date(), true)}</div>
      <Dash />
      {items.map((i) => (
        <div key={i.id} className="mb-1">
          <div className="font-bold">{i.qty} x {i.name}</div>
          {(i.modifiers ?? []).map((m: Row) => <div key={m.id} className="pl-3">+ {m.name}</div>)}
          {i.notes && <div className="pl-3">Note: {i.notes}</div>}
        </div>
      ))}
      {o.notes && <><Dash /><div>Order note: {o.notes}</div></>}
    </div>
  );
}

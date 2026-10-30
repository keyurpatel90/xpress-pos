import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateGst } from '@/lib/gst';

const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const locationId = searchParams.get('locationId');
  if (!startDate || !endDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    return NextResponse.json({ error: 'startDate and endDate must be YYYY-MM-DD.' }, { status: 400 });
  }

  const supabase = createClient();
  const { data: restaurantId, error: restaurantError } = await supabase.rpc('current_restaurant_id');
  if (restaurantError || !restaurantId) return NextResponse.json({ error: 'You must be signed in to export GST data.' }, { status: 401 });
  if (locationId && locationId !== restaurantId) return NextResponse.json({ error: 'The selected location is not available.' }, { status: 403 });

  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, order_no, order_type, status, subtotal, discount_amount, total, paid_at, created_at, order_items(unit_price, qty, tax_rate, modifier_total, status)')
    .eq('restaurant_id', restaurantId)
    .gte('created_at', `${startDate}T00:00:00.000Z`)
    .lt('created_at', `${endDate}T23:59:59.999Z`)
    .in('status', ['paid', 'cancelled']);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const byRate = new Map<number, { taxRate: number; taxableValue: number; cgst: number; sgst: number; igst: number; tax: number; grossSales: number; orderCount: number }>();
  const status = { cancelledOrders: 0, cancelledAmount: 0, refundedAmount: 0, modifiedBills: 0 };
  for (const order of orders ?? []) {
    if (order.status === 'cancelled') {
      status.cancelledOrders += 1;
      status.cancelledAmount = money(status.cancelledAmount + Number(order.total ?? 0));
      continue;
    }
    const items = (order.order_items ?? []).filter((item: { status: string }) => item.status !== 'cancelled');
    const result = calculateGst(items.map((item: { unit_price: number; qty: number; tax_rate: number; modifier_total: number }) => ({ unitPrice: Number(item.unit_price) + Number(item.modifier_total ?? 0), quantity: Number(item.qty), taxRate: Number(item.tax_rate ?? 0) })), order.order_type, Number(order.discount_amount ?? 0));
    result.lines.forEach((line) => {
      const current = byRate.get(line.taxRate) ?? { taxRate: line.taxRate, taxableValue: 0, cgst: 0, sgst: 0, igst: 0, tax: 0, grossSales: 0, orderCount: 0 };
      current.taxableValue = money(current.taxableValue + line.taxableValue);
      current.cgst = money(current.cgst + line.cgst);
      current.sgst = money(current.sgst + line.sgst);
      current.igst = money(current.igst + line.igst);
      current.tax = money(current.tax + line.tax);
      current.grossSales = money(current.grossSales + line.gross);
      current.orderCount += 1;
      byRate.set(line.taxRate, current);
    });
  }
  const rows = [...byRate.values()].sort((a, b) => a.taxRate - b.taxRate);
  return NextResponse.json({ startDate, endDate, locationId: locationId ?? restaurantId, rows, totals: rows.reduce((sum, row) => ({ taxableValue: money(sum.taxableValue + row.taxableValue), cgst: money(sum.cgst + row.cgst), sgst: money(sum.sgst + row.sgst), igst: money(sum.igst + row.igst), tax: money(sum.tax + row.tax), grossSales: money(sum.grossSales + row.grossSales) }), { taxableValue: 0, cgst: 0, sgst: 0, igst: 0, tax: 0, grossSales: 0 }), status, notes: ['Refunds and credit/debit notes require a source transaction table; the current schema exposes cancelled orders only.'] });
}

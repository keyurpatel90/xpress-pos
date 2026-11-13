import { NextResponse } from 'next/server';
import { HttpError, fail, requireUser } from '@/lib/auth';
import { calculateGst } from '@/lib/gst';

export const dynamic = 'force-dynamic';

const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function validDate(value: string) {
  if (!DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  return year >= 1000 && month >= 1 && month <= 12 && day >= 1 && day <= new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function indiaMidnight(value: string) {
  return new Date(`${value}T00:00:00+05:30`);
}

export async function GET(request: Request) {
  try {
    const { sb, profile } = await requireUser();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') ?? '';
    const endDate = searchParams.get('endDate') ?? '';
    const locationId = searchParams.get('locationId');

    if (!validDate(startDate) || !validDate(endDate) || startDate > endDate) {
      throw new HttpError(400, 'startDate and endDate must be valid YYYY-MM-DD dates, with startDate no later than endDate.');
    }
    const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
    const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
    const startUtc = Date.UTC(startYear, startMonth - 1, startDay);
    const endUtc = Date.UTC(endYear, endMonth - 1, endDay);
    if ((endUtc - startUtc) / 86400000 > 365) throw new HttpError(400, 'Choose a date range of 366 days or less.');
    if (locationId && locationId !== profile.restaurant_id) throw new HttpError(403, 'The selected location is not available.');

    const from = indiaMidnight(startDate).toISOString();
    const to = indiaMidnight(endDate);
    to.setUTCDate(to.getUTCDate() + 1);
    const toExclusive = to.toISOString();
    const select = 'id, order_no, order_type, status, subtotal, discount_amount, total, paid_at, created_at, order_items(unit_price, qty, tax_rate, modifier_total, status)';
    const [paidResult, cancelledResult] = await Promise.all([
      sb.from('orders').select(select).eq('restaurant_id', profile.restaurant_id).eq('status', 'paid').gte('paid_at', from).lt('paid_at', toExclusive),
      sb.from('orders').select(select).eq('restaurant_id', profile.restaurant_id).eq('status', 'cancelled').gte('created_at', from).lt('created_at', toExclusive),
    ]);
    if (paidResult.error) throw new HttpError(500, 'Unable to load paid orders for GST reconciliation.');
    if (cancelledResult.error) throw new HttpError(500, 'Unable to load cancelled orders for GST reconciliation.');
    const orders = [...(paidResult.data ?? []), ...(cancelledResult.data ?? [])];

    const byRate = new Map<number, { taxRate: number; taxableValue: number; cgst: number; sgst: number; igst: number; tax: number; grossSales: number; orderCount: number }>();
    const status = { cancelledOrders: 0, cancelledAmount: 0, refundedAmount: 0, modifiedBills: 0 };
    for (const order of orders) {
      if (order.status === 'cancelled') {
        status.cancelledOrders += 1;
        status.cancelledAmount = money(status.cancelledAmount + Number(order.total ?? 0));
        continue;
      }
      const items = (order.order_items ?? []).filter((item: { status: string }) => item.status !== 'cancelled');
      const result = calculateGst(items.map((item: { unit_price: number; qty: number; tax_rate: number; modifier_total: number }) => ({ unitPrice: Number(item.unit_price) + Number(item.modifier_total ?? 0), quantity: Number(item.qty), taxRate: Number(item.tax_rate ?? 0) })), order.order_type, Number(order.discount_amount ?? 0));
      const orderRates = new Set<number>();
      result.lines.forEach((line) => {
        orderRates.add(line.taxRate);
        const current = byRate.get(line.taxRate) ?? { taxRate: line.taxRate, taxableValue: 0, cgst: 0, sgst: 0, igst: 0, tax: 0, grossSales: 0, orderCount: 0 };
        current.taxableValue = money(current.taxableValue + line.taxableValue);
        current.cgst = money(current.cgst + line.cgst);
        current.sgst = money(current.sgst + line.sgst);
        current.igst = money(current.igst + line.igst);
        current.tax = money(current.tax + line.tax);
        current.grossSales = money(current.grossSales + line.gross);
        byRate.set(line.taxRate, current);
      });
      orderRates.forEach((rate) => {
        const current = byRate.get(rate);
        if (current) current.orderCount += 1;
      });
    }
    const rows = [...byRate.values()].sort((a, b) => a.taxRate - b.taxRate);
    return NextResponse.json({ startDate, endDate, locationId: locationId ?? profile.restaurant_id, rows, totals: rows.reduce((sum, row) => ({ taxableValue: money(sum.taxableValue + row.taxableValue), cgst: money(sum.cgst + row.cgst), sgst: money(sum.sgst + row.sgst), igst: money(sum.igst + row.igst), tax: money(sum.tax + row.tax), grossSales: money(sum.grossSales + row.grossSales) }), { taxableValue: 0, cgst: 0, sgst: 0, igst: 0, tax: 0, grossSales: 0 }), status, notes: ['Refunds and credit/debit notes require a source transaction table; the current schema exposes cancelled orders only.'] });
  } catch (error) {
    return fail(error);
  }
}

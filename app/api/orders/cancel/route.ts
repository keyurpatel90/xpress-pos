import { NextResponse } from 'next/server';
import { HttpError, fail, requireUser } from '@/lib/auth';
import { canTransitionOrder, type OrderStatus } from '@/lib/state-machines';

export const dynamic = 'force-dynamic';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  try {
    const { sb, profile } = await requireUser(['owner', 'cashier']);
    const body = await req.json();
    const orderId = body.order_id;
    if (typeof orderId !== 'string' || !UUID.test(orderId)) throw new HttpError(400, 'Invalid order ID');

    const { data: order, error: orderError } = await sb.from('orders')
      .select('id, status').eq('id', orderId).eq('restaurant_id', profile.restaurant_id).maybeSingle();
    if (orderError) throw new HttpError(500, orderError.message);
    if (!order) throw new HttpError(404, 'Order not found');
    if (!canTransitionOrder(order.status as OrderStatus, 'cancelled')) {
      throw new HttpError(409, 'Only open orders can be cancelled');
    }

    const { data: items, error: itemsError } = await sb.from('order_items')
      .select('status').eq('order_id', orderId).eq('restaurant_id', profile.restaurant_id);
    if (itemsError) throw new HttpError(500, itemsError.message);
    if (items?.some((item) => item.status === 'served')) {
      throw new HttpError(409, 'An order with served items cannot be cancelled');
    }

    const { error } = await sb.rpc('cancel_order', { p_order: orderId });
    if (error) throw new HttpError(409, error.message);
    return NextResponse.json({ ok: true, status: 'cancelled' });
  } catch (error) {
    return fail(error);
  }
}

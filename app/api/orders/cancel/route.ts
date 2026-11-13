import { NextResponse } from 'next/server';
import { HttpError, fail, readJson, requireUser } from '@/lib/auth';
import { canTransitionOrder, type OrderStatus } from '@/lib/state-machines';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
const cancelSchema = z.object({ order_id: z.string().uuid() });

export async function POST(req: Request) {
  try {
    const { sb, profile } = await requireUser(['owner', 'cashier']);
    const parsed = cancelSchema.safeParse(await readJson(req));
    if (!parsed.success) throw new HttpError(400, 'Invalid order ID');
    const orderId = parsed.data.order_id;

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
    if (error) {
      console.error('Order cancellation failed:', error.message);
      throw new HttpError(409, 'This order could not be cancelled. Refresh and try again.');
    }
    return NextResponse.json({ ok: true, status: 'cancelled' });
  } catch (error) {
    return fail(error);
  }
}

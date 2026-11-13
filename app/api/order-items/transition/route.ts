import { NextResponse } from 'next/server';
import { HttpError, fail, readJson, requireUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { canTransitionOrderItem, nextOrderItemStatus, ORDER_ITEM_STATUSES } from '@/lib/state-machines';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
const transitionSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100).refine((ids) => new Set(ids).size === ids.length),
  from_status: z.enum(ORDER_ITEM_STATUSES),
  action: z.enum(['advance', 'cancel']).optional(),
});

export async function POST(req: Request) {
  try {
    const { sb, profile } = await requireUser();
    const parsed = transitionSchema.safeParse(await readJson(req));
    if (!parsed.success) throw new HttpError(400, 'Invalid item transition request');
    const { ids, from_status: fromStatus, action = 'advance' } = parsed.data;

    const toStatus = action === 'cancel' ? 'cancelled' : nextOrderItemStatus(fromStatus);
    if (!toStatus || !canTransitionOrderItem(fromStatus, toStatus)) {
      throw new HttpError(409, action === 'cancel' ? 'This item can no longer be cancelled' : 'This item cannot advance to another kitchen stage');
    }

    const allowedRoles = action === 'cancel'
      ? ['owner', 'cashier']
      : toStatus === 'served'
        ? ['owner', 'cashier', 'waiter', 'chef', 'kds']
        : ['owner', 'cashier', 'chef', 'kds'];
    if (!allowedRoles.includes(profile.role)) throw new HttpError(403, 'You do not have permission to update these items');

    const { data: items, error: itemError } = await sb.from('order_items')
      .select('id, status, order_id')
      .eq('restaurant_id', profile.restaurant_id)
      .in('id', ids);
    if (itemError) throw new HttpError(500, 'Unable to load order items');
    if (!items || items.length !== ids.length) throw new HttpError(404, 'One or more items were not found');
    if (items.some((item) => item.status !== fromStatus)) {
      throw new HttpError(409, 'One or more items have already moved. Refresh and try again.');
    }

    const orderIds = Array.from(new Set(items.map((item) => item.order_id)));
    const { data: orders, error: orderError } = await sb.from('orders')
      .select('id, status')
      .eq('restaurant_id', profile.restaurant_id)
      .in('id', orderIds);
    if (orderError) throw new HttpError(500, 'Unable to load the related orders');
    if (!orders || orders.length !== orderIds.length || orders.some((order) =>
      action === 'cancel' ? order.status !== 'open' : order.status === 'cancelled')) {
      throw new HttpError(409, action === 'cancel'
        ? 'Items in a closed or missing order cannot be cancelled'
        : 'Items in a cancelled or missing order cannot advance');
    }

    const { data: updated, error: updateError } = await createAdminClient().from('order_items')
      .update({ status: toStatus })
      .eq('restaurant_id', profile.restaurant_id)
      .eq('status', fromStatus)
      .in('id', ids)
      .in('order_id', orderIds)
      .select('id');
    if (updateError) throw new HttpError(500, 'Unable to update order item state');
    if (!updated || updated.length !== ids.length) {
      throw new HttpError(409, 'Some items changed at the same time. Refresh to see their current stages.');
    }

    return NextResponse.json({ ok: true, status: toStatus });
  } catch (error) {
    return fail(error);
  }
}

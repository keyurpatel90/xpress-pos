import { NextResponse } from 'next/server';
import { HttpError, fail, requireUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { canTransitionOrderItem, isOrderItemStatus, nextOrderItemStatus } from '@/lib/state-machines';

export const dynamic = 'force-dynamic';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  try {
    const { sb, profile } = await requireUser();
    const body = await req.json();
    const ids: unknown = body.ids;
    const fromStatus: unknown = body.from_status;
    const action = body.action === undefined ? 'advance' : body.action;

    if (action !== 'advance' && action !== 'cancel') throw new HttpError(400, 'Invalid item action');
    if (!Array.isArray(ids) || ids.length === 0 || ids.length > 100 || !ids.every((id) => typeof id === 'string' && UUID.test(id))) {
      throw new HttpError(400, 'Provide between 1 and 100 valid item IDs');
    }
    if (new Set(ids).size !== ids.length) throw new HttpError(400, 'Duplicate item IDs are not allowed');
    if (!isOrderItemStatus(fromStatus)) throw new HttpError(400, 'Invalid item state');

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
    if (itemError) throw new HttpError(500, itemError.message);
    if (!items || items.length !== ids.length) throw new HttpError(404, 'One or more items were not found');
    if (items.some((item) => item.status !== fromStatus)) {
      throw new HttpError(409, 'One or more items have already moved. Refresh and try again.');
    }

    const orderIds = Array.from(new Set(items.map((item) => item.order_id)));
    const { data: orders, error: orderError } = await sb.from('orders')
      .select('id, status')
      .eq('restaurant_id', profile.restaurant_id)
      .in('id', orderIds);
    if (orderError) throw new HttpError(500, orderError.message);
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
    if (updateError) throw new HttpError(500, updateError.message);
    if (!updated || updated.length !== ids.length) {
      throw new HttpError(409, 'Some items changed at the same time. Refresh to see their current stages.');
    }

    return NextResponse.json({ ok: true, status: toStatus });
  } catch (error) {
    return fail(error);
  }
}

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyWebhookSignature } from '@/lib/razorpay';

export const dynamic = 'force-dynamic';

// Safety net: activates the plan even if the browser closed before the checkout callback ran.
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWebhookSignature(raw, req.headers.get('x-razorpay-signature') || '')) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }
  try {
    const evt = JSON.parse(raw);
    if (evt.event === 'payment.captured' || evt.event === 'order.paid') {
      const pay = evt.payload?.payment?.entity;
      const orderId = pay?.order_id ?? evt.payload?.order?.entity?.id;
      if (orderId && pay?.id) {
        const { error } = await createAdminClient().rpc('apply_payment', { p_order: orderId, p_payment: pay.id });
        // Unknown orders (e.g. other products on the same Razorpay account) are acknowledged, real failures are retried
        if (error && !/Unknown payment order/i.test(error.message)) return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

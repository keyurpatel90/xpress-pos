import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyWebhookSignature } from '@/lib/razorpay';

export const dynamic = 'force-dynamic';

// Safety net: activates the plan even if the browser closed before the checkout callback ran.
export async function POST(req: Request) {
  const declaredSize = Number(req.headers.get('content-length') ?? 0);
  if (declaredSize > 512 * 1024) return NextResponse.json({ error: 'Webhook payload is too large' }, { status: 413 });
  const raw = await req.text();
  if (raw.length > 512 * 1024) return NextResponse.json({ error: 'Webhook payload is too large' }, { status: 413 });
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
        if (error && !/Unknown payment order/i.test(error.message)) {
          console.error('Razorpay webhook processing failed:', error.message);
          return NextResponse.json({ error: 'Could not process payment event' }, { status: 500 });
        }
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Razorpay webhook payload processing failed:', e);
    return NextResponse.json({ error: 'Could not process payment event' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { HttpError, fail, requireUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { capturePayment, fetchPayment, verifyCheckoutSignature } from '@/lib/razorpay';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { profile } = await requireUser(['owner']);
    const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = await req.json();
    if (!orderId || !paymentId || !signature) throw new HttpError(400, 'Missing payment details');
    if (!verifyCheckoutSignature(orderId, paymentId, signature)) throw new HttpError(400, 'Payment signature could not be verified');

    const admin = createAdminClient();
    const { data: sp } = await admin.from('subscription_payments').select('*').eq('razorpay_order_id', orderId).maybeSingle();
    if (!sp || sp.restaurant_id !== profile.restaurant_id) throw new HttpError(404, 'Payment order not found');

    // Make sure the money is really captured (accounts with manual capture leave payments "authorized")
    let pay = await fetchPayment(paymentId);
    if (pay.order_id !== orderId || Number(pay.amount) !== Number(sp.amount_paise)) throw new HttpError(400, 'Payment does not match this order');
    if (pay.status === 'authorized') {
      try { pay = await capturePayment(paymentId, pay.amount); } catch { pay = await fetchPayment(paymentId); }
    }
    if (pay.status !== 'captured') throw new HttpError(402, `Payment is ${pay.status}. If money was debited it will be refunded by your bank.`);

    const { data, error } = await admin.rpc('apply_payment', { p_order: orderId, p_payment: paymentId });
    if (error) throw new HttpError(500, `Payment received but activation failed (${error.message}). Please contact support with payment id ${paymentId}.`);
    return NextResponse.json({ ok: true, ...(data as object) });
  } catch (e) {
    return fail(e);
  }
}

import { NextResponse } from 'next/server';
import { HttpError, fail, readJson, requireUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { capturePayment, fetchPayment, verifyCheckoutSignature } from '@/lib/razorpay';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { profile } = await requireUser(['owner']);
    const input = z.object({
      razorpay_order_id: z.string().min(1).max(100),
      razorpay_payment_id: z.string().min(1).max(100),
      razorpay_signature: z.string().min(1).max(256),
    }).safeParse(await readJson(req));
    if (!input.success) throw new HttpError(400, 'Missing or invalid payment details');
    const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = input.data;
    if (!verifyCheckoutSignature(orderId, paymentId, signature)) throw new HttpError(400, 'Payment signature could not be verified');

    const admin = createAdminClient();
    const { data: sp, error: paymentOrderError } = await admin.from('subscription_payments').select('id,restaurant_id,amount_paise,status').eq('razorpay_order_id', orderId).maybeSingle();
    if (paymentOrderError) throw new HttpError(500, 'Unable to verify the payment order');
    if (!sp || sp.restaurant_id !== profile.restaurant_id) throw new HttpError(404, 'Payment order not found');

    // Make sure the money is really captured (accounts with manual capture leave payments "authorized")
    let pay = await fetchPayment(paymentId);
    if (pay.order_id !== orderId || Number(pay.amount) !== Number(sp.amount_paise)) throw new HttpError(400, 'Payment does not match this order');
    if (pay.status === 'authorized') {
      try { pay = await capturePayment(paymentId, pay.amount); } catch { pay = await fetchPayment(paymentId); }
    }
    if (pay.status !== 'captured') throw new HttpError(402, `Payment is ${pay.status}. If money was debited it will be refunded by your bank.`);

    const { data, error } = await admin.rpc('apply_payment', { p_order: orderId, p_payment: paymentId });
    if (error) {
      console.error('Payment activation failed:', { paymentId, message: error.message });
      throw new HttpError(500, `Payment was received but could not be activated. Contact support with payment ID ${paymentId}.`);
    }
    return NextResponse.json({ ok: true, ...(data as object) });
  } catch (e) {
    return fail(e);
  }
}

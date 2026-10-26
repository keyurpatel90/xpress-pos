import { NextResponse } from 'next/server';
import { HttpError, fail, requireUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { createRazorpayOrder } from '@/lib/razorpay';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { sb, profile } = await requireUser(['owner']);
    const { plan_id, cycle } = await req.json();
    const { data: plan } = await sb.from('plans').select('*').eq('id', plan_id).eq('is_active', true).maybeSingle();
    if (!plan) throw new HttpError(404, 'That plan is not available');

    const months = cycle === 'yearly' ? 12 : 1;
    const price = months === 12 ? Number(plan.price_yearly ?? Number(plan.price_monthly) * 12) : Number(plan.price_monthly);
    const paise = Math.round(price * 100);
    if (!Number.isFinite(paise) || paise < 100) throw new HttpError(400, 'This plan has no valid price');

    const order = await createRazorpayOrder(paise, `xp_${String(profile.restaurant_id).slice(0, 8)}_${Date.now()}`, {
      restaurant_id: profile.restaurant_id, plan_id: plan.id, months: String(months),
    });
    const admin = createAdminClient();
    const { error } = await admin.from('subscription_payments').insert({
      restaurant_id: profile.restaurant_id, plan_id: plan.id, plan_name: plan.name, months, amount_paise: paise, razorpay_order_id: order.id,
    });
    if (error) throw new Error(error.message);

    return NextResponse.json({
      order_id: order.id, amount: order.amount, currency: order.currency,
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
    });
  } catch (e) {
    return fail(e);
  }
}

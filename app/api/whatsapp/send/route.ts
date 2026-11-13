import { NextResponse } from 'next/server';
import { HttpError, fail, readJson, requireUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendWhatsApp, type WaConfig } from '@/lib/whatsapp';
import { z } from 'zod';
import { inr, normalizePhone } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { sb, profile } = await requireUser(['owner', 'cashier']);
    const { data: allowed, error: featureError } = await sb.rpc('feature_enabled', { p_key: 'whatsapp' });
    if (featureError) throw new HttpError(500, 'Unable to check WhatsApp plan access');
    if (!allowed) throw new HttpError(402, 'WhatsApp bills are available on a paid plan');

    const input = z.object({ order_id: z.string().uuid(), phone: z.string().trim().min(8).max(32) }).safeParse(await readJson(req));
    if (!input.success) throw new HttpError(400, 'Provide a valid order and mobile number');
    const { order_id, phone } = input.data;
    const to = normalizePhone(phone);
    if (to.length < 11 || to.length > 15) throw new HttpError(400, 'Enter a valid mobile number');

    // RLS guarantees the order belongs to this restaurant
    const { data: order, error: orderError } = await sb.from('orders')
      .select('id,public_token,customer_name,invoice_no,order_no,total,status')
      .eq('id', order_id).maybeSingle();
    if (orderError) throw new HttpError(500, 'Unable to load this bill');
    if (!order) throw new HttpError(404, 'Order not found');
    const { data: rest, error: restaurantError } = await sb.from('restaurants')
      .select('name').eq('id', profile.restaurant_id).single();
    if (restaurantError) throw new HttpError(500, 'Unable to load restaurant details');

    const base = (process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin).replace(/\/$/, '');
    const link = `${base}/b/${order.public_token}`;
    const name = order.customer_name || 'there';
    const billNo = order.invoice_no || `#${order.order_no}`;
    const amount = inr(order.total, 2);
    const text = `Hi ${name}, thank you for visiting ${rest?.name}!\nYour bill ${billNo} is ${amount}.\nView your bill: ${link}`;

    const admin = createAdminClient();
    const { data: integ, error: integrationError } = await admin.from('restaurant_integrations')
      .select('wa_phone_number_id,wa_access_token,wa_template_name,wa_template_lang')
      .eq('restaurant_id', profile.restaurant_id).maybeSingle();
    if (integrationError) throw new HttpError(500, 'Unable to load WhatsApp configuration');
    const cfg: WaConfig | null = integ?.wa_phone_number_id && integ?.wa_access_token
      ? { phoneNumberId: integ.wa_phone_number_id, token: integ.wa_access_token, template: integ.wa_template_name, lang: integ.wa_template_lang }
      : process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN
        ? { phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID, token: process.env.WHATSAPP_ACCESS_TOKEN, template: process.env.WHATSAPP_TEMPLATE_NAME, lang: process.env.WHATSAPP_TEMPLATE_LANG }
        : null;

    if (!cfg) {
      return NextResponse.json({
        ok: false, fallback_url: `https://wa.me/${to}?text=${encodeURIComponent(text)}`,
        message: 'WhatsApp API is not connected yet, so WhatsApp was opened with the message ready to send. Add your Cloud API details in Settings.',
      });
    }

    const result = await sendWhatsApp(cfg, to, { text, params: [name, rest?.name ?? '', billNo, amount, link] });
    await admin.from('whatsapp_logs').insert({
      restaurant_id: profile.restaurant_id, order_id: order.id, to_phone: to,
      status: result.ok ? 'sent' : 'failed', detail: result.ok ? result.id : result.error,
    });
    if (!result.ok) throw new HttpError(502, result.error);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}

import { NextResponse } from 'next/server';
import { HttpError, fail, requireUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendWhatsApp, type WaConfig } from '@/lib/whatsapp';
import { inr, normalizePhone } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { sb, profile } = await requireUser(['owner', 'cashier']);
    const { data: allowed } = await sb.rpc('feature_enabled', { p_key: 'whatsapp' });
    if (!allowed) throw new HttpError(402, 'WhatsApp bills are available on a paid plan');

    const { order_id, phone } = await req.json();
    const to = normalizePhone(String(phone || ''));
    if (to.length < 11 || to.length > 15) throw new HttpError(400, 'Enter a valid mobile number');

    // RLS guarantees the order belongs to this restaurant
    const { data: order } = await sb.from('orders').select('*').eq('id', order_id).maybeSingle();
    if (!order) throw new HttpError(404, 'Order not found');
    const { data: rest } = await sb.from('restaurants').select('name').eq('id', profile.restaurant_id).single();

    const base = (process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin).replace(/\/$/, '');
    const link = `${base}/b/${order.public_token}`;
    const name = order.customer_name || 'there';
    const billNo = order.invoice_no || `#${order.order_no}`;
    const amount = inr(order.total, 2);
    const text = `Hi ${name}, thank you for visiting ${rest?.name}!\nYour bill ${billNo} is ${amount}.\nView your bill: ${link}`;

    const admin = createAdminClient();
    const { data: integ } = await admin.from('restaurant_integrations').select('*').eq('restaurant_id', profile.restaurant_id).maybeSingle();
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

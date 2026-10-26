import { NextResponse } from 'next/server';
import { HttpError, fail, requireUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { profile } = await requireUser(['owner']);
    const { data } = await createAdminClient().from('restaurant_integrations').select('*').eq('restaurant_id', profile.restaurant_id).maybeSingle();
    return NextResponse.json({
      configured: !!(data?.wa_phone_number_id && data?.wa_access_token) || !!(process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN),
      phone_number_id: data?.wa_phone_number_id ?? '', token_saved: !!data?.wa_access_token,
      template: data?.wa_template_name ?? '', lang: data?.wa_template_lang ?? 'en',
    });
  } catch (e) {
    return fail(e);
  }
}

export async function PUT(req: Request) {
  try {
    const { sb, profile } = await requireUser(['owner']);
    const { data: allowed } = await sb.rpc('feature_enabled', { p_key: 'whatsapp' });
    if (!allowed) throw new HttpError(402, 'WhatsApp bills are available on a paid plan');
    const b = await req.json();
    const admin = createAdminClient();
    const { data: current } = await admin.from('restaurant_integrations').select('wa_access_token').eq('restaurant_id', profile.restaurant_id).maybeSingle();
    const token = String(b.access_token || '').trim() || current?.wa_access_token || null;
    const row = {
      restaurant_id: profile.restaurant_id,
      wa_phone_number_id: String(b.phone_number_id || '').trim() || null,
      wa_access_token: token,
      wa_template_name: String(b.template || '').trim() || null,
      wa_template_lang: String(b.lang || 'en').trim() || 'en',
      updated_at: new Date().toISOString(),
    };
    const { error } = await admin.from('restaurant_integrations').upsert(row);
    if (error) throw new Error(error.message);
    return NextResponse.json({
      configured: !!(row.wa_phone_number_id && row.wa_access_token), phone_number_id: row.wa_phone_number_id ?? '',
      token_saved: !!row.wa_access_token, template: row.wa_template_name ?? '', lang: row.wa_template_lang,
    });
  } catch (e) {
    return fail(e);
  }
}

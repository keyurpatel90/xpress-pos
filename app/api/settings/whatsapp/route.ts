import { NextResponse } from 'next/server';
import { HttpError, fail, readJson, requireUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { profile } = await requireUser(['owner']);
    const { data, error } = await createAdminClient().from('restaurant_integrations')
      .select('wa_phone_number_id,wa_access_token,wa_template_name,wa_template_lang')
      .eq('restaurant_id', profile.restaurant_id).maybeSingle();
    if (error) throw new HttpError(500, 'Unable to load WhatsApp settings');
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
    const { data: allowed, error: featureError } = await sb.rpc('feature_enabled', { p_key: 'whatsapp' });
    if (featureError) throw new HttpError(500, 'Unable to check WhatsApp plan access');
    if (!allowed) throw new HttpError(402, 'WhatsApp bills are available on a paid plan');
    const input = z.object({
      phone_number_id: z.string().trim().max(100).optional().default(''),
      access_token: z.string().max(4096).optional().default(''),
      template: z.string().trim().max(512).optional().default(''),
      lang: z.string().trim().min(2).max(35).optional().default('en'),
    }).safeParse(await readJson(req));
    if (!input.success) throw new HttpError(400, 'Invalid WhatsApp settings');
    const b = input.data;
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

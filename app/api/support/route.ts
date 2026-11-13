import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { HttpError, fail, readJson } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const supportSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(30).optional().default(''),
  message: z.string().trim().min(10).max(4000),
  website: z.string().max(200).optional().default(''),
});

export async function POST(req: Request) {
  try {
    const input = supportSchema.safeParse(await readJson(req));
    if (!input.success) throw new HttpError(400, 'Please provide your name, a valid email, and a message of at least 10 characters.');
    if (input.data.website) return NextResponse.json({ ok: true });

    const { name, email, phone, message } = input.data;
    const { error } = await createAdminClient().from('support_tickets').insert({ name, email, phone: phone || null, message });
    if (error) throw new HttpError(500, 'Could not send your message');
    return NextResponse.json({ ok: true });
  } catch (error) {
    return fail(error);
  }
}

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { HttpError, fail, requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const querySchema = z.object({ outletId: z.string().uuid(), at: z.string().datetime().optional() });

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const input = querySchema.parse({ outletId: url.searchParams.get('outletId'), at: url.searchParams.get('at') ?? undefined });
    const { sb, profile } = await requireUser();
    if (profile.restaurant_id !== input.outletId) throw new HttpError(403, 'The selected outlet is not available.');

    const { data, error } = await sb.rpc('get_effective_prices', {
      p_outlet: input.outletId,
      p_at: input.at ?? new Date().toISOString(),
    });
    if (error) throw new HttpError(500, 'Unable to load effective prices.');
    return NextResponse.json({ prices: data ?? [] });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Invalid price request.' }, { status: 400 });
    return fail(error);
  }
}

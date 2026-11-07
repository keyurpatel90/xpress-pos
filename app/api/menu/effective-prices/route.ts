import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getEffectivePrices } from '@/app/app/menu/actions';

const querySchema = z.object({ outletId: z.string().uuid(), at: z.string().datetime().optional() });

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const input = querySchema.parse({ outletId: url.searchParams.get('outletId'), at: url.searchParams.get('at') ?? undefined });
    const prices = await getEffectivePrices(input.outletId, input.at);
    return NextResponse.json({ prices });
  } catch (error) {
    const message = error instanceof z.ZodError ? 'Invalid price request.' : error instanceof Error ? error.message : 'Unable to load prices.';
    const status = message.includes('signed in') || message.includes('Permission') ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

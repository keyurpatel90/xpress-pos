import { NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Landing for custom email templates that use {{ .TokenHash }} (recommended, works on any device)
export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  if (tokenHash && type) {
    const { error } = await createClient().auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      const next = searchParams.get('next');
      const fallback = type === 'invite' || type === 'recovery' ? '/auth/set-password' : '/app';
      return NextResponse.redirect(origin + (next && next.startsWith('/') && !next.startsWith('//') ? next : fallback));
    }
  }
  return NextResponse.redirect(`${origin}/login?error=expired`);
}

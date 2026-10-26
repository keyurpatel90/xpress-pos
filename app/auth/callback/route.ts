import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const safe = (n: string | null) => (n && n.startsWith('/') && !n.startsWith('//') ? n : '/app');

// Email link landing (PKCE): signup verification and password reset
export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  if (searchParams.get('error') || searchParams.get('error_code')) return NextResponse.redirect(`${origin}/login?error=expired`);
  const code = searchParams.get('code');
  if (code) {
    const { error } = await createClient().auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(origin + safe(searchParams.get('next')));
  }
  // The email was confirmed but a session could not be started here (for example the link was opened on another device)
  return NextResponse.redirect(`${origin}/login?verified=1`);
}

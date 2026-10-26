import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Row } from '@/lib/types';

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function fail(e: unknown) {
  if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
  console.error(e);
  return NextResponse.json({ error: (e as Error).message || 'Server error' }, { status: 500 });
}

/** Signed-in staff member of a restaurant (optionally restricted to some roles). */
export async function requireUser(roles?: string[]) {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new HttpError(401, 'Please sign in again');
  const { data } = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle();
  const profile = data as Row | null;
  if (!profile || profile.status === 'disabled' || !profile.restaurant_id) throw new HttpError(403, 'No access to a restaurant');
  if (roles && !roles.includes(profile.role)) throw new HttpError(403, 'You do not have permission to do this');
  return { sb, user, profile };
}

export async function assertSuperAdmin() {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new HttpError(401, 'Please sign in again');
  const { data } = await sb.rpc('is_super_admin');
  if (!data) throw new HttpError(403, 'Super admin access only');
  return user;
}

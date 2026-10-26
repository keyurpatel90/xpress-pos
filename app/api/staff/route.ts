import { NextResponse } from 'next/server';
import { HttpError, fail, requireUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { STAFF_ROLES } from '@/lib/roles';

export const dynamic = 'force-dynamic';

const origin = (req: Request) => (process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin).replace(/\/$/, '');
const friendly = (m: string) => (/already|registered|exists/i.test(m) ? 'This email already has an Xpress POS login.' : m);

export async function POST(req: Request) {
  try {
    const { sb, profile } = await requireUser(['owner']);
    const { data: allowed } = await sb.rpc('feature_enabled', { p_key: 'staff' });
    if (!allowed) throw new HttpError(402, 'Staff logins are not available on your plan right now');

    const body = await req.json();
    const email = String(body.email || '').trim().toLowerCase();
    const fullName = String(body.full_name || '').trim();
    const role = String(body.role || '');
    const mode = body.mode === 'password' ? 'password' : 'invite';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Enter a valid email address');
    if (!fullName) throw new HttpError(400, 'Enter the staff member’s name');
    if (!STAFF_ROLES.includes(role as never)) throw new HttpError(400, 'Choose a valid role');

    const admin = createAdminClient();
    let userId: string;
    if (mode === 'password') {
      const password = String(body.password || '');
      if (password.length < 8) throw new HttpError(400, 'Password must be at least 8 characters');
      const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: fullName } });
      if (error || !data.user) throw new HttpError(400, friendly(error?.message || 'Could not create the login'));
      userId = data.user.id;
    } else {
      const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
        data: { full_name: fullName }, redirectTo: `${origin(req)}/auth/set-password`,
      });
      if (error || !data.user) throw new HttpError(400, friendly(error?.message || 'Could not send the invitation'));
      userId = data.user.id;
    }

    const { error: pe } = await admin.from('profiles').insert({
      id: userId, restaurant_id: profile.restaurant_id, role, full_name: fullName, email, status: mode === 'password' ? 'active' : 'invited',
    });
    if (pe) {
      await admin.auth.admin.deleteUser(userId);
      throw new HttpError(500, pe.message);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}

async function target(id: string, restaurantId: string, selfId: string) {
  const admin = createAdminClient();
  const { data } = await admin.from('profiles').select('*').eq('id', id).maybeSingle();
  if (!data || data.restaurant_id !== restaurantId) throw new HttpError(404, 'Staff member not found');
  if (data.role === 'owner' || data.id === selfId) throw new HttpError(400, 'The owner login cannot be changed here');
  return admin;
}

export async function PATCH(req: Request) {
  try {
    const { profile } = await requireUser(['owner']);
    const { id, role, status } = await req.json();
    const admin = await target(id, profile.restaurant_id, profile.id);
    const patch: Record<string, string> = {};
    if (role !== undefined) {
      if (!STAFF_ROLES.includes(role)) throw new HttpError(400, 'Choose a valid role');
      patch.role = role;
    }
    if (status !== undefined) {
      if (!['active', 'disabled'].includes(status)) throw new HttpError(400, 'Invalid status');
      patch.status = status;
      await admin.auth.admin.updateUserById(id, { ban_duration: status === 'disabled' ? '876000h' : 'none' });
    }
    const { error } = await admin.from('profiles').update(patch).eq('id', id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(req: Request) {
  try {
    const { profile } = await requireUser(['owner']);
    const { id } = await req.json();
    const admin = await target(id, profile.restaurant_id, profile.id);
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}

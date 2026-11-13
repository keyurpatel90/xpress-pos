import { NextResponse } from 'next/server';
import { HttpError, fail, readJson, requireUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { STAFF_ROLES } from '@/lib/roles';
import { canTransitionProfile, type ProfileStatus } from '@/lib/state-machines';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const origin = (req: Request) => (process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin).replace(/\/$/, '');
const friendly = (m: string) => (/already|registered|exists/i.test(m) ? 'This email already has an Xpress POS login.' : m);

export async function POST(req: Request) {
  try {
    const { sb, profile } = await requireUser(['owner']);
    const { data: allowed, error: featureError } = await sb.rpc('feature_enabled', { p_key: 'staff' });
    if (featureError) throw new HttpError(500, 'Unable to check staff plan access');
    if (!allowed) throw new HttpError(402, 'Staff logins are not available on your plan right now');

    const input = z.object({
      email: z.string().trim().email().max(200),
      full_name: z.string().trim().min(1).max(120),
      role: z.enum(['cashier', 'waiter', 'chef', 'kds']),
      mode: z.enum(['invite', 'password']).optional().default('invite'),
      password: z.string().max(128).optional(),
    }).safeParse(await readJson(req));
    if (!input.success) throw new HttpError(400, 'Provide a valid staff name, email, role, and invitation mode');
    const email = input.data.email.toLowerCase();
    const fullName = input.data.full_name;
    const role = input.data.role;
    const mode = input.data.mode;

    const admin = createAdminClient();
    let userId: string;
    if (mode === 'password') {
      const password = input.data.password ?? '';
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
      const { error: cleanupError } = await admin.auth.admin.deleteUser(userId);
      console.error('Unable to create staff profile:', { profileError: pe.message, cleanupError: cleanupError?.message });
      throw new HttpError(500, cleanupError
        ? 'Could not finish creating the staff login; contact support before inviting this address again.'
        : 'Could not finish creating the staff login');
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
  return { admin, member: data };
}

export async function PATCH(req: Request) {
  try {
    const { profile } = await requireUser(['owner']);
    const input = z.object({
      id: z.string().uuid(),
      role: z.enum(['cashier', 'waiter', 'chef', 'kds']).optional(),
      status: z.enum(['active', 'disabled']).optional(),
    }).refine((value) => value.role !== undefined || value.status !== undefined).safeParse(await readJson(req));
    if (!input.success) throw new HttpError(400, 'Invalid staff update');
    const { id, role, status } = input.data;
    const { admin, member } = await target(id, profile.restaurant_id, profile.id);
    const patch: Record<string, string> = {};
    if (role !== undefined) {
      if (!STAFF_ROLES.includes(role)) throw new HttpError(400, 'Choose a valid role');
      patch.role = role;
    }
    if (status !== undefined) {
      if (!['active', 'disabled'].includes(status)) throw new HttpError(400, 'Invalid status');
      if (!canTransitionProfile(member.status as ProfileStatus, status as ProfileStatus)) {
        throw new HttpError(409, 'This staff status transition is not allowed');
      }
      patch.status = status;
    }
    if (Object.keys(patch).length === 0) throw new HttpError(400, 'No staff changes were provided');

    const { data: updated, error } = await admin.from('profiles').update(patch)
      .eq('id', id).eq('status', member.status).select('id');
    if (error) throw new Error(error.message);
    if (!updated?.length) throw new HttpError(409, 'This staff member changed. Refresh and try again.');

    if (status !== undefined) {
      const { error: authError } = await admin.auth.admin.updateUserById(id, {
        ban_duration: status === 'disabled' ? '876000h' : 'none',
      });
      if (authError) {
        const { error: rollbackError } = await admin.from('profiles')
          .update({ role: member.role, status: member.status }).eq('id', id).eq('status', status);
        throw new Error(rollbackError ? `${authError.message}; profile rollback failed` : authError.message);
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(req: Request) {
  try {
    const { profile } = await requireUser(['owner']);
    const input = z.object({ id: z.string().uuid() }).safeParse(await readJson(req));
    if (!input.success) throw new HttpError(400, 'Invalid staff member ID');
    const { id } = input.data;
    const { admin } = await target(id, profile.restaurant_id, profile.id);
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}

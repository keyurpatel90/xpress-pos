import { createClient } from '@supabase/supabase-js';

/** Service-role client. Server only: bypasses RLS. Never import this from a client component. */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL are not set');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

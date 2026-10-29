import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppProvider } from '@/components/app/AppProvider';
import { AppShell, NoAccess } from '@/components/app/AppShell';
import type { Access, Row } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect('/login');

  const { data } = await sb.rpc('get_access');
  const access = data as Access | null;
  if (!access?.restaurant_id || !access.role) {
    if (access?.is_super_admin) redirect('/admin');
    return <NoAccess />;
  }
  const [{ data: restaurant }, { data: profile }] = await Promise.all([
    sb.from('restaurants').select('*').eq('id', access.restaurant_id).single(),
    sb.from('profiles').select('*').eq('id', user.id).single(),
  ]);
  if (!restaurant || !profile) return <NoAccess />;

  return (
    <AppProvider initial={{ access, restaurant: restaurant as Row, profile: profile as Row, email: user.email ?? '', verified: !!user.email_confirmed_at }}>
      <AppShell>{children}</AppShell>
    </AppProvider>
  );
}

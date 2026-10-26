import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { AdminNav } from '@/components/admin/AdminNav';
import { Logo } from '@/components/Logo';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Super admin', robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login?next=/admin');
  const { data: isAdmin } = await sb.rpc('is_super_admin');
  if (!isAdmin) redirect('/app');
  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-3">
          <div className="flex items-center gap-3"><Logo href="/admin" /><span className="rounded-md bg-ink px-2 py-0.5 text-xs font-semibold text-white">Super admin</span></div>
          <AdminNav />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-6">{children}</main>
    </div>
  );
}

'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/admin', label: 'Restaurants' },
  { href: '/admin/plans', label: 'Plans' },
  { href: '/admin/features', label: 'Feature access' },
  { href: '/admin/settings', label: 'Platform settings' },
  { href: '/admin/support', label: 'Support inbox' },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav className="flex flex-wrap items-center gap-1" aria-label="Admin">
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} className={cn('rounded-lg px-3 py-1.5 text-sm font-medium', (l.href === '/admin' ? path === '/admin' : path.startsWith(l.href)) ? 'bg-brand-600 text-white' : 'text-ink-soft hover:bg-white')}>{l.label}</Link>
      ))}
      <Link href="/app" className="ml-auto rounded-lg px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-white">My restaurant</Link>
      <button onClick={async () => { await createClient().auth.signOut(); window.location.href = '/login'; }} className="rounded-lg px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-white">Sign out</button>
    </nav>
  );
}

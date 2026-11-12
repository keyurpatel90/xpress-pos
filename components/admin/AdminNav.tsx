'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { isLanguageCode, LANGUAGES } from '@/lib/i18n';
import { useLocale } from '@/components/app/AppProvider';
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
  const { language, setLanguage } = useLocale();

  async function changeLanguage(value: string) {
    if (isLanguageCode(value)) await setLanguage(value);
  }

  return (
    <nav className="flex flex-wrap items-center gap-1" aria-label="Admin">
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} className={cn('rounded-lg px-3 py-1.5 text-sm font-medium', (l.href === '/admin' ? path === '/admin' : path.startsWith(l.href)) ? 'bg-brand-600 text-white' : 'text-ink-soft hover:bg-white')}>{l.label}</Link>
      ))}
      <label className="ml-auto flex items-center gap-2 px-2 text-xs font-medium text-ink-mute">
        Language
        <select aria-label="Language" className="input h-9 w-auto min-w-32" value={language} onChange={(event) => void changeLanguage(event.target.value)}>
          {LANGUAGES.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
        </select>
      </label>
      <Link href="/app" className="rounded-lg px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-white">My restaurant</Link>
      <button onClick={async () => { await createClient().auth.signOut(); window.location.href = '/login'; }} className="rounded-lg px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-white">Sign out</button>
    </nav>
  );
}

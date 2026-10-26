'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Logo } from '@/components/Logo';
import { Icon } from '@/components/Icon';
import { btnClass } from '@/lib/utils';


const LINKS = [
  { href: '/features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/faq', label: 'FAQ' },
  { href: '/support', label: 'Support' },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-field/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {LINKS.map((l) => <Link key={l.href} href={l.href} className="rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-white">{l.label}</Link>)}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login" className={btnClass('ghost', 'md')}>Log in</Link>
          <Link href="/signup" className={btnClass('primary', 'md')}>Start free trial</Link>
        </div>
        <button className="rounded-lg p-2 md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open}><Icon name={open ? 'x' : 'bars'} /></button>
      </div>
      {open && (
        <div className="border-t border-line bg-white px-5 py-3 md:hidden">
          {LINKS.map((l) => <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="block rounded-lg px-2 py-2.5 font-medium">{l.label}</Link>)}
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Link href="/login" className={btnClass('secondary', 'md')}>Log in</Link>
            <Link href="/signup" className={btnClass('primary', 'md')}>Free trial</Link>
          </div>
        </div>
      )}
    </header>
  );
}

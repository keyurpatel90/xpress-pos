import type { ReactNode } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-slate-900 p-10 text-white lg:flex">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-600/30 blur-3xl" />
        <Logo light />
        <div className="max-w-md">
          <p className="font-display text-4xl font-extrabold leading-tight tracking-tight">Your whole restaurant on one screen.</p>
          <p className="mt-4 text-slate-300">Billing, tables, the kitchen board, stock and WhatsApp bills. Each person on your team signs in and sees only what their job needs.</p>
          <div className="mt-8 w-64 rotate-[-3deg] bg-white font-slip text-[12px] text-ink shadow-lift">
            <div className="p-4 leading-5">
              <p className="font-bold">KITCHEN ORDER</p>
              <p>KOT #3 · Table T4</p>
              <p className="mt-2">2 x Paneer Tikka</p>
              <p>4 x Butter Naan</p>
              <p className="pl-3 text-brand-700">+ extra butter</p>
            </div>
            <div className="slip-teeth" />
          </div>
        </div>
        <p className="text-sm text-white/50"><Link href="/" className="hover:text-white">Back to home</Link></p>
      </aside>
      <main className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden"><Logo /></div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-ink-mute">{subtitle}</p>}
          <div className="mt-6">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-ink-mute">{footer}</div>}
        </div>
      </main>
    </div>
  );
}

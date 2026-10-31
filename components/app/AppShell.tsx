'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useTransition, type ReactNode } from 'react';
import LinearProgress from '@mui/material/LinearProgress';
import { createClient } from '@/lib/supabase/client';
import { NAV, ROLE_LABEL, landingFor, navFor } from '@/lib/roles';
import { useApp } from '@/components/app/AppProvider';
import { UpgradeCard } from '@/components/app/Upgrade';
import { Icon } from '@/components/Icon';
import { Logo } from '@/components/Logo';
import { Badge, LinkBtn } from '@/components/ui';
import { HelpFab } from '@/components/HelpFab';
import { cn } from '@/lib/utils';
import { subscribeApiLoading } from '@/lib/hooks';

async function signOut() {
  await createClient().auth.signOut();
  window.location.href = '/login';
}

export function NoAccess() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md rounded-2xl border border-line bg-white p-8 text-center">
        <h1 className="font-display text-2xl font-bold">No restaurant access</h1>
        <p className="mt-2 text-sm text-ink-mute">This login is not linked to an active restaurant. It may have been disabled by the owner. Contact the owner, or sign in with a different account.</p>
        <button onClick={signOut} className="btn btn-primary btn-md mt-5">Sign out</button>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { access, role, restaurant, email, has, verified } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [apiPending, setApiPending] = useState(false);
  const [progress, setProgress] = useState(0);

  const current = navFor(pathname);
  const notAllowed = !!current && !current.roles.includes(role);
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    const unsubscribe = subscribeApiLoading(setApiPending);
    return () => { unsubscribe(); };
  }, []);
  useEffect(() => {
    if (isPending || apiPending) {
      setProgress((value) => Math.max(value, 18));
      const timer = window.setInterval(() => setProgress((value) => Math.min(value + 8, 88)), 180);
      return () => window.clearInterval(timer);
    }
    if (progress > 0) {
      setProgress(100);
      const timer = window.setTimeout(() => setProgress(0), 220);
      return () => window.clearTimeout(timer);
    }
  }, [apiPending, isPending, progress]);
  useEffect(() => { if (notAllowed) router.replace(landingFor(role, false)); }, [notAllowed, role, router]);

  const navigate = (href: string) => {
    setOpen(false);
    setProgress(18);
    startTransition(() => router.push(href));
  };

  const onBilling = pathname.startsWith('/app/billing') || pathname.startsWith('/app/settings');
  const lockedOut = access.locked && !(role === 'owner' && onBilling);
  const featureOff = !!current?.feature && !has(current.feature) && !access.locked;
  const items = NAV.filter((n) => n.roles.includes(role) && (!access.locked || n.href === '/app/billing' || n.href === '/app/settings'));
  const full = pathname.startsWith('/app/pos') || pathname.startsWith('/app/kds');

  let body: ReactNode = children;
  if (notAllowed) body = null;
  else if (lockedOut) {
    body = (
      <div className="mx-auto mt-10 max-w-md rounded-2xl border border-line bg-white p-8 text-center shadow-lift">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600"><Icon name="lock" className="h-6 w-6" /></span>
        <h2 className="font-display text-xl font-bold">Your free trial or plan has ended</h2>
        <p className="mt-2 text-sm text-ink-mute">Your data is safe. {role === 'owner' ? 'Choose a plan to continue taking orders.' : 'Please ask the restaurant owner to renew the plan.'}</p>
        {role === 'owner' && <div className="mt-5"><LinkBtn href="/app/billing">Choose a plan</LinkBtn></div>}
      </div>
    );
  } else if (featureOff && current?.feature) body = <UpgradeCard feature={current.feature} />;

  const banner = role === 'owner' && (
    access.status === 'trialing' ? { tone: 'bg-amber-50 text-ink', text: `Free trial: ${access.days_left} day${access.days_left === 1 ? '' : 's'} left.` } :
    access.status === 'expired' && !access.locked ? { tone: 'bg-rose-50 text-rose-600', text: 'Your plan has ended. Free features still work; paid features are switched off.' } :
    access.status === 'active' && access.days_left <= 7 ? { tone: 'bg-amber-50 text-ink', text: `Your plan ends in ${access.days_left} day${access.days_left === 1 ? '' : 's'}.` } : null
  );

  return (
    <div className="relative flex h-dvh overflow-hidden">
      {progress > 0 && <LinearProgress variant="determinate" value={progress} color="secondary" className="absolute inset-x-0 top-0 z-50 h-1" />}
      {open && <div className="fixed inset-0 z-30 bg-ink/40 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-white transition-transform lg:static lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex h-14 shrink-0 items-center border-b border-line px-4"><Logo href={landingFor(role, false)} /></div>
        <div className="border-b border-line px-4 py-3">
          <p className="truncate font-display font-bold">{restaurant.name}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-ink-mute">
            {verified && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />}
            {verified ? `Verified ${ROLE_LABEL[role]}` : ROLE_LABEL[role]}
          </p>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {items.map((n) => {
            const active = n.href === '/app' ? pathname === '/app' : pathname.startsWith(n.href);
            const locked = !!n.feature && !has(n.feature);
            return (
              <Link key={n.href} href={n.href} onClick={(event) => { event.preventDefault(); if (n.href !== pathname) navigate(n.href); }}
                className={cn('flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                  active ? 'bg-brand-600 text-white shadow-sm' : 'text-ink-soft hover:bg-slate-100')}>
                <Icon name={n.icon} className="h-[18px] w-[18px]" />
                <span className="flex-1">{n.label}</span>
                {locked && !access.locked && <Icon name="lock" className={cn('h-3.5 w-3.5', active ? 'text-white/80' : 'text-amber-600')} />}
              </Link>
            );
          })}
          {access.is_super_admin && (
            <Link href="/admin" onClick={(event) => { event.preventDefault(); navigate('/admin'); }} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-field">
              <Icon name="shield" className="h-[18px] w-[18px]" /> Super admin
            </Link>
          )}
        </nav>
        <div className="border-t border-line p-3">
          <p className="truncate px-1 text-xs text-ink-mute">{email}</p>
          <button onClick={signOut} className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-ink-soft hover:bg-field">
            <Icon name="logout" className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-white px-3 lg:hidden">
          <button onClick={() => setOpen(true)} className="rounded-lg p-2 hover:bg-field" aria-label="Open menu"><Icon name="bars" /></button>
          <span className="truncate font-display font-semibold">{current?.label ?? restaurant.name}</span>
          <span className="ml-auto"><Badge tone="brand">{ROLE_LABEL[role]}</Badge></span>
        </header>
        {banner && (
          <div className={cn('flex shrink-0 flex-wrap items-center justify-center gap-x-3 px-4 py-1.5 text-center text-sm font-medium', banner.tone)}>
            {banner.text}
            <Link href="/app/billing" className="font-semibold underline underline-offset-2">{access.status === 'trialing' ? 'Choose a plan' : 'Renew now'}</Link>
          </div>
        )}
        <main className={cn('min-h-0 flex-1', full && !lockedOut && !featureOff ? 'flex flex-col overflow-hidden' : 'overflow-y-auto')}>
          {full && !lockedOut && !featureOff && !notAllowed ? body : <div className="mx-auto max-w-6xl p-4 sm:p-6">{body}</div>}
        </main>
      </div>
      {!full && <HelpFab newTab />}
    </div>
  );
}

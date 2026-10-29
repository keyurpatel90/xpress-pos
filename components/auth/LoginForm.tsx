'use client';
import Link from 'next/link';
import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Btn, Field, Input } from '@/components/ui';

const configured = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

export function LoginForm({ next, verified, error: initialError }: { next?: string; verified?: boolean; error?: string }) {
  const sb = useMemo(() => createClient(), []);
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError === 'expired' ? 'That link has expired or was already used. Sign in, or request a new link.' : '');
  const [unverified, setUnverified] = useState(false);
  const [notice, setNotice] = useState(verified ? 'Your email is verified. Sign in to continue.' : '');

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError(''); setNotice(''); setUnverified(false);
    const { error: err } = await sb.auth.signInWithPassword({ email: email.trim(), password });
    if (err) {
      if (/not confirmed/i.test(err.message)) { setUnverified(true); setError('Please verify your email before signing in. Check your inbox for the verification link.'); }
      else if (/invalid login/i.test(err.message)) setError('Email or password is incorrect.');
      else setError(err.message);
      setBusy(false);
      return;
    }
    const target = next && next.startsWith('/') && !next.startsWith('//') ? next : '/app';
    router.replace(target);
    router.refresh();
  }

  async function resend() {
    const { error: err } = await sb.auth.resend({ type: 'signup', email: email.trim(), options: { emailRedirectTo: `${location.origin}/auth/callback` } });
    setNotice(err ? '' : 'Verification email sent. Check your inbox (and spam).');
    if (err) setError(err.message);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {!configured && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-600">Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.</p>}
      {notice && <p role="status" className="rounded-lg bg-brand-50 p-3 text-sm text-brand-700">{notice}</p>}
      {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-600">{error}</p>}
      <Field label="Email"><Input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
      <Field label="Password"><Input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
      <div className="text-right text-sm"><Link href="/forgot-password" className="font-medium text-brand-700 hover:underline">Forgot password?</Link></div>
      <Btn type="submit" size="lg" className="w-full" loading={busy}>Sign in</Btn>
      {unverified && email && <Btn variant="secondary" className="w-full" onClick={resend}>Resend verification email</Btn>}
    </form>
  );
}

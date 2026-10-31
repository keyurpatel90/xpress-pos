'use client';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Btn, Field, Input, Loading } from '@/components/ui';

export function SetPasswordForm() {
  const sb = useMemo(() => createClient(), []);
  const router = useRouter();
  const [state, setState] = useState<'checking' | 'ok' | 'none'>('checking');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => { if (session) setState('ok'); });
    sb.auth.getSession().then(({ data }) => {
      if (data.session) setState('ok');
      else setTimeout(() => setState((s) => (s === 'checking' ? 'none' : s)), 1500);
    });
    return () => sub.subscription.unsubscribe();
  }, [sb]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (pw.length < 8) return setError('Use at least 8 characters.');
    if (pw !== pw2) return setError('The two passwords do not match.');
    setBusy(true);
    const { error: err } = await sb.auth.updateUser({ password: pw });
    if (err) { setError(err.message); setBusy(false); return; }
    await sb.rpc('activate_my_profile');
    router.replace('/app');
    router.refresh();
  }

  if (state === 'checking') return <Loading variant="auth" />;
  if (state === 'none') {
    return <p className="rounded-lg bg-rose-50 p-4 text-sm text-rose-600">This link has expired or was already used. <Link href="/forgot-password" className="font-semibold underline">Request a new one</Link> or ask your restaurant owner to resend your invitation.</p>;
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-600">{error}</p>}
      <Field label="New password" hint="At least 8 characters"><Input type="password" required autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
      <Field label="Confirm password"><Input type="password" required autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></Field>
      <Btn type="submit" size="lg" className="w-full" loading={busy}>Save password and continue</Btn>
    </form>
  );
}

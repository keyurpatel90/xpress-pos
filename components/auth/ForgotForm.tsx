'use client';
import { useMemo, useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Btn, Field, Input } from '@/components/ui';

export function ForgotForm() {
  const sb = useMemo(() => createClient(), []);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError('');
    const { error: err } = await sb.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent('/auth/set-password')}`,
    });
    setBusy(false);
    if (err) setError(err.message); else setSent(true);
  }

  if (sent) return <p role="status" className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">If an account exists for {email}, a reset link is on its way. Check your inbox and spam folder.</p>;
  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-600">{error}</p>}
      <Field label="Email"><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
      <Btn type="submit" size="lg" className="w-full" loading={busy}>Send reset link</Btn>
    </form>
  );
}

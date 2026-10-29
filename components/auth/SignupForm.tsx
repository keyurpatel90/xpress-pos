'use client';
import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Btn, Field, Input } from '@/components/ui';

export function SignupForm() {
  const sb = useMemo(() => createClient(), []);
  const router = useRouter();
  const [f, setF] = useState({ full_name: '', restaurant_name: '', phone: '', email: '', password: '' });
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (f.password.length < 8) return setError('Use a password of at least 8 characters.');
    if (!agree) return setError('Please accept the terms to continue.');
    setBusy(true);
    const email = f.email.trim().toLowerCase();
    const { data, error: err } = await sb.auth.signUp({
      email, password: f.password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
        data: { full_name: f.full_name.trim(), restaurant_name: f.restaurant_name.trim(), phone: f.phone.trim() },
      },
    });
    if (err) { setError(err.message); setBusy(false); return; }
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setError('An account with this email already exists. Try signing in instead.');
      setBusy(false);
      return;
    }
    router.push(`/verify-email?email=${encodeURIComponent(email)}`);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-600">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name"><Input required autoComplete="name" value={f.full_name} onChange={set('full_name')} /></Field>
        <Field label="Mobile number"><Input required inputMode="tel" autoComplete="tel" value={f.phone} onChange={set('phone')} /></Field>
      </div>
      <Field label="Restaurant name"><Input required value={f.restaurant_name} onChange={set('restaurant_name')} /></Field>
      <Field label="Email" hint="We will send a verification link here"><Input type="email" required autoComplete="email" value={f.email} onChange={set('email')} /></Field>
      <Field label="Password" hint="At least 8 characters"><Input type="password" required minLength={8} autoComplete="new-password" value={f.password} onChange={set('password')} /></Field>
      <label className="flex items-start gap-2 text-sm text-ink-soft">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 h-4 w-4 accent-brand-600" />
        <span>I agree to the <Link href="/legal/terms" className="font-medium text-brand-700 underline">terms</Link> and <Link href="/legal/privacy" className="font-medium text-brand-700 underline">privacy policy</Link>.</span>
      </label>
      <Btn type="submit" size="lg" className="w-full" loading={busy}>Create my account</Btn>
    </form>
  );
}

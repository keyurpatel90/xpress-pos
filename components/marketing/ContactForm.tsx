'use client';
import { useState, type FormEvent } from 'react';
import { Btn, Field, Input, Textarea } from '@/components/ui';

export function ContactForm() {
  const [f, setF] = useState({ name: '', email: '', phone: '', message: '', website: '' });
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    setState('sending'); setError('');
    const res = await fetch('/api/support', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { setError(json.error || 'Something went wrong. Please try again.'); setState('idle'); return; }
    setState('sent');
  }

  if (state === 'sent') {
    return <div role="status" className="rounded-2xl bg-brand-50 p-6 text-brand-800"><p className="font-display text-xl font-bold">Thanks, we have your message.</p><p className="mt-1 text-sm">We will reply to {f.email} by email.</p></div>;
  }
  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-line bg-white p-6">
      {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-600">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name"><Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Mobile (optional)"><Input inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
      </div>
      <Field label="Email"><Input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
      <Field label="How can we help?"><Textarea required rows={5} minLength={10} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} /></Field>
      <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} />
      <Btn type="submit" size="lg" loading={state === 'sending'}>Send message</Btn>
    </form>
  );
}

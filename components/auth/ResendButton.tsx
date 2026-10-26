'use client';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Btn } from '@/components/ui';

export function ResendButton({ email }: { email: string }) {
  const sb = useMemo(() => createClient(), []);
  const [wait, setWait] = useState(30);
  const [msg, setMsg] = useState('');
  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait(wait - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  async function resend() {
    setMsg('');
    const { error } = await sb.auth.resend({ type: 'signup', email, options: { emailRedirectTo: `${location.origin}/auth/callback` } });
    setMsg(error ? error.message : 'Sent again. Check your inbox and spam folder.');
    if (!error) setWait(60);
  }
  return (
    <div>
      <Btn variant="secondary" className="w-full" onClick={resend} disabled={wait > 0 || !email}>{wait > 0 ? `Resend email in ${wait}s` : 'Resend verification email'}</Btn>
      {msg && <p role="status" className="mt-2 text-center text-sm text-ink-mute">{msg}</p>}
    </div>
  );
}

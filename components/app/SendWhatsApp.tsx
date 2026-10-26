'use client';
import { useState } from 'react';
import { api } from '@/lib/hooks';
import { useApp, useToast } from '@/components/app/AppProvider';
import { Btn, Input } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { LinkBtn } from '@/components/ui';

type Res = { ok: boolean; message?: string; fallback_url?: string };

export function SendWhatsApp({ orderId, defaultPhone }: { orderId: string; defaultPhone?: string | null }) {
  const { has, role } = useApp();
  const toast = useToast();
  const [phone, setPhone] = useState(defaultPhone ?? '');
  const [busy, setBusy] = useState(false);

  if (!has('whatsapp')) {
    return (
      <div className="rounded-lg border border-dashed border-line p-3 text-sm text-ink-mute">
        <Icon name="lock" className="mr-1 inline h-4 w-4" /> WhatsApp bills are on a paid plan.{' '}
        {role === 'owner' && <LinkBtn href="/app/billing" variant="ghost" size="sm">See plans</LinkBtn>}
      </div>
    );
  }

  async function send() {
    if (phone.replace(/\D/g, '').length < 10) return toast('Enter a valid mobile number', 'error');
    setBusy(true);
    try {
      const res = await api<Res>('/api/whatsapp/send', 'POST', { order_id: orderId, phone });
      if (res.fallback_url) {
        window.open(res.fallback_url, '_blank');
        toast(res.message || 'WhatsApp API is not set up, so WhatsApp Web was opened instead.', 'info');
      } else {
        toast('Bill sent on WhatsApp', 'success');
      }
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex gap-2">
      <Input inputMode="tel" placeholder="Customer mobile number" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <Btn onClick={send} loading={busy} className="shrink-0 bg-[#1FA855] hover:bg-[#188a45]">
        <Icon name="chat" className="h-4 w-4" /> Send on WhatsApp
      </Btn>
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { unwrap, useAction, useSupabase } from '@/lib/hooks';
import { useApp } from '@/components/app/AppProvider';
import { Btn, Field, Input, Modal } from '@/components/ui';
import { Icon } from '@/components/Icon';
import type { Row } from '@/lib/types';

export function CustomerPicker({ value, onChange }: { value: Row | null; onChange: (c: Row | null) => void }) {
  const sb = useSupabase();
  const act = useAction();
  const { has, access } = useApp();
  const [q, setQ] = useState('');
  const [res, setRes] = useState<Row[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '' });

  useEffect(() => {
    const s = q.trim().replace(/[%,()]/g, '');
    if (s.length < 2) { setRes([]); return; }
    const t = setTimeout(async () => {
      const { data } = await sb.from('customers').select('*').or(`name.ilike.%${s}%,phone.ilike.%${s}%`).limit(6);
      setRes((data as Row[]) ?? []);
    }, 250);
    return () => clearTimeout(t);
  }, [q, sb]);

  if (!has('customers')) return null;

  if (value) {
    return (
      <div className="flex items-center justify-between rounded-lg bg-pine-50 px-3 py-2 text-sm">
        <span className="min-w-0 truncate"><b>{value.name}</b>{value.phone ? ` · ${value.phone}` : ''}{value.loyalty_points > 0 ? ` · ${value.loyalty_points} pts` : ''}</span>
        <button onClick={() => onChange(null)} className="ml-2 text-ink-mute hover:text-ink" aria-label="Remove customer"><Icon name="x" className="h-4 w-4" /></button>
      </div>
    );
  }

  async function create() {
    if (!form.name.trim()) return;
    const c = await act(async () => unwrap(await sb.from('customers').insert({
      restaurant_id: access.restaurant_id, name: form.name.trim(), phone: form.phone.trim() || null,
    }).select('*').single()) as Row, 'Customer added');
    if (c) { onChange(c); setAdding(false); setQ(''); setForm({ name: '', phone: '' }); }
  }

  return (
    <div className="relative">
      <Input placeholder="Add customer: name or mobile" value={q} onChange={(e) => setQ(e.target.value)} />
      {q.trim().length >= 2 && (
        <div className="absolute inset-x-0 bottom-11 z-10 max-h-56 overflow-y-auto rounded-lg border border-line bg-white shadow-lift">
          {res.map((c) => (
            <button key={c.id} onClick={() => { onChange(c); setQ(''); }} className="block w-full px-3 py-2 text-left text-sm hover:bg-field">
              <b>{c.name}</b> <span className="text-ink-mute">{c.phone}</span>
            </button>
          ))}
          <button
            onClick={() => { setForm({ name: /\d{5,}/.test(q) ? '' : q, phone: /\d{5,}/.test(q) ? q : '' }); setAdding(true); }}
            className="block w-full border-t border-line px-3 py-2 text-left text-sm font-medium text-pine-700 hover:bg-field">
            + Add “{q.trim()}” as a new customer
          </button>
        </div>
      )}
      <Modal open={adding} onClose={() => setAdding(false)} title="New customer"
        footer={<><Btn variant="secondary" onClick={() => setAdding(false)}>Cancel</Btn><Btn onClick={create}>Save customer</Btn></>}>
        <div className="space-y-3">
          <Field label="Name"><Input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Mobile number"><Input inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
        </div>
      </Modal>
    </div>
  );
}

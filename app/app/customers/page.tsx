'use client';
import { useState } from 'react';
import { unwrap, useAction, useData, useSupabase } from '@/lib/hooks';
import { useApp } from '@/components/app/AppProvider';
import { Btn, Empty, Field, Input, Loading, Modal, PageHeader, Table, Textarea } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { fmtDate, inr } from '@/lib/utils';
import type { Row } from '@/lib/types';

export default function CustomersPage() {
  const { access, role, restaurant, has } = useApp();
  const sb = useSupabase();
  const act = useAction();
  const { data: list, loading, reload } = useData<Row[]>(async (c) => unwrap(await c.from('customers').select('*').order('created_at', { ascending: false }).limit(500)) ?? [], []);
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState<Row | null>(null);
  const [recent, setRecent] = useState<Row[]>([]);

  async function open(c: Row | null) {
    setEdit(c ? { ...c, phone: c.phone ?? '', email: c.email ?? '', birthday: c.birthday ?? '', notes: c.notes ?? '' } : { id: null, name: '', phone: '', email: '', birthday: '', notes: '' });
    setRecent([]);
    if (c) {
      const { data } = await sb.from('orders').select('order_no, total, status, created_at, invoice_no').eq('customer_id', c.id).order('created_at', { ascending: false }).limit(5);
      setRecent((data as Row[]) ?? []);
    }
  }
  async function save() {
    if (!edit?.name.trim()) return;
    const payload = {
      restaurant_id: access.restaurant_id, name: edit.name.trim(), phone: edit.phone.trim() || null, email: edit.email.trim() || null,
      birthday: edit.birthday || null, notes: edit.notes.trim() || null,
    };
    const ok = await act(async () => unwrap(edit.id ? await sb.from('customers').update(payload).eq('id', edit.id) : await sb.from('customers').insert(payload)) ?? true, 'Customer saved');
    if (ok) { setEdit(null); reload(); }
  }
  async function remove() {
    if (!edit?.id || !confirm(`Delete ${edit.name}?`)) return;
    await act(async () => unwrap(await sb.from('customers').delete().eq('id', edit.id)) ?? true, 'Customer deleted');
    setEdit(null); reload();
  }

  if (loading) return <Loading variant="list" />;
  const rows = list.filter((c) => !q || c.name.toLowerCase().includes(q.toLowerCase()) || (c.phone ?? '').includes(q));
  const showPoints = has('loyalty') && restaurant.loyalty_enabled;

  return (
    <>
      <PageHeader title="Customers" actions={<Btn onClick={() => open(null)}><Icon name="plus" className="h-4 w-4" /> Add customer</Btn>} />
      <Input className="mb-3 max-w-xs" placeholder="Search name or mobile" value={q} onChange={(e) => setQ(e.target.value)} />
      {rows.length === 0 ? <Empty icon="users" title={list.length ? 'No match' : 'No customers yet'} text="Customers you add on the POS screen appear here with their visits and spend." /> : (
        <Table head={['Name', 'Mobile', 'Visits', 'Total spent', ...(showPoints ? ['Points'] : [])]}>
          {rows.map((c) => (
            <tr key={c.id} onClick={() => open(c)} className="cursor-pointer hover:bg-field/60">
              <td className="px-4 py-2.5 font-medium">{c.name}</td>
              <td className="px-4 py-2.5">{c.phone ?? '-'}</td>
              <td className="px-4 py-2.5">{c.visits}</td>
              <td className="px-4 py-2.5">{inr(c.total_spent)}</td>
              {showPoints && <td className="px-4 py-2.5">{c.loyalty_points}</td>}
            </tr>
          ))}
        </Table>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Customer' : 'New customer'}
        footer={<>{edit?.id && role === 'owner' && <Btn variant="danger" className="mr-auto" onClick={remove}>Delete</Btn>}<Btn variant="secondary" onClick={() => setEdit(null)}>Cancel</Btn><Btn onClick={save}>Save</Btn></>}>
        {edit && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name"><Input autoFocus value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label="Mobile"><Input inputMode="tel" value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} /></Field>
            <Field label="Email"><Input type="email" value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} /></Field>
            <Field label="Birthday"><Input type="date" value={edit.birthday} onChange={(e) => setEdit({ ...edit, birthday: e.target.value })} /></Field>
            <Field label="Notes" className="sm:col-span-2"><Textarea value={edit.notes} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} /></Field>
            {edit.id && recent.length > 0 && (
              <div className="sm:col-span-2">
                <p className="mb-1 text-sm font-medium text-ink-soft">Recent orders</p>
                <ul className="divide-y divide-line rounded-lg border border-line text-sm">
                  {recent.map((o) => <li key={o.order_no} className="flex justify-between px-3 py-1.5"><span>#{o.order_no} · {fmtDate(o.created_at)}</span><b>{inr(o.total)}</b></li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}

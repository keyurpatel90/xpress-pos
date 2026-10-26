'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { unwrap, useAction, useData, useSupabase } from '@/lib/hooks';
import { useApp } from '@/components/app/AppProvider';
import { Badge, Btn, Card, Empty, Field, Input, Loading, Modal, PageHeader, Select } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { cn, inr, minutesSince } from '@/lib/utils';
import type { Row } from '@/lib/types';

export default function TablesPage() {
  const { role, access } = useApp();
  const sb = useSupabase();
  const act = useAction();
  const router = useRouter();
  const isOwner = role === 'owner';
  const { data, loading, reload } = useData<{ tables: Row[]; orders: Row[] }>(async (c) => {
    const [t, o] = await Promise.all([
      c.from('dining_tables').select('*').order('sort').order('name'),
      c.from('orders').select('id, table_id, total, order_no, created_at').eq('status', 'open').not('table_id', 'is', null),
    ]);
    return { tables: unwrap(t) ?? [], orders: unwrap(o) ?? [] };
  }, { tables: [], orders: [] });
  useEffect(() => { const t = setInterval(reload, 10000); return () => clearInterval(t); }, [reload]);

  const [gen, setGen] = useState({ count: '10', prefix: 'T', seats: '4', section: 'Main' });
  const [edit, setEdit] = useState<Row | null>(null);

  async function generate() {
    const n = Math.min(200, Math.max(1, Number(gen.count) || 0));
    const prefix = gen.prefix.trim();
    const re = new RegExp('^' + prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\d+)$');
    const max = data.tables.reduce((m, t) => Math.max(m, Number(re.exec(t.name)?.[1] ?? 0)), 0);
    const rows = Array.from({ length: n }, (_, i) => ({
      restaurant_id: access.restaurant_id, name: `${prefix}${max + i + 1}`, section: gen.section.trim() || 'Main',
      seats: Number(gen.seats) || 4, sort: data.tables.length + i + 1,
    }));
    const ok = await act(async () => unwrap(await sb.from('dining_tables').insert(rows)) ?? true, `${n} table${n > 1 ? 's' : ''} added`);
    if (ok) reload();
  }
  async function save() {
    if (!edit) return;
    const { id, name, section, seats, status } = edit;
    const ok = await act(async () => unwrap(await sb.from('dining_tables').update({ name: name.trim(), section: section.trim() || 'Main', seats: Number(seats) || 4, status }).eq('id', id)) ?? true, 'Table saved');
    if (ok) { setEdit(null); reload(); }
  }
  async function remove() {
    if (!edit || !confirm(`Delete table ${edit.name}?`)) return;
    const ok = await act(async () => unwrap(await sb.from('dining_tables').delete().eq('id', edit.id)) ?? true, 'Table deleted');
    if (ok) { setEdit(null); reload(); }
  }

  if (loading) return <Loading />;
  const sections = Array.from(new Set(data.tables.map((t) => t.section)));

  return (
    <>
      <PageHeader title="Tables" subtitle="Tap a table to open its order" />
      {isOwner && (
        <Card className="mb-5 p-4">
          <p className="font-display font-semibold">Add tables</p>
          <p className="mb-3 text-sm text-ink-mute">Enter how many tables you have and we will number them for you.</p>
          <div className="grid grid-cols-2 items-end gap-3 sm:grid-cols-5">
            <Field label="How many"><Input type="number" min="1" max="200" value={gen.count} onChange={(e) => setGen({ ...gen, count: e.target.value })} /></Field>
            <Field label="Name prefix"><Input value={gen.prefix} onChange={(e) => setGen({ ...gen, prefix: e.target.value })} /></Field>
            <Field label="Seats each"><Input type="number" min="1" value={gen.seats} onChange={(e) => setGen({ ...gen, seats: e.target.value })} /></Field>
            <Field label="Section"><Input value={gen.section} onChange={(e) => setGen({ ...gen, section: e.target.value })} placeholder="Main, AC, Garden" /></Field>
            <Btn onClick={generate}><Icon name="plus" className="h-4 w-4" /> Add tables</Btn>
          </div>
        </Card>
      )}
      {data.tables.length === 0 ? (
        <Empty icon="table" title="No tables yet" text={isOwner ? 'Add your tables above. You can rename them or change seats afterwards.' : 'Ask the owner to add tables.'} />
      ) : sections.map((s) => (
        <section key={s} className="mb-6">
          <h2 className="mb-2 font-display text-lg font-semibold">{s}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
            {data.tables.filter((t) => t.section === s).map((t) => {
              const o = data.orders.find((x) => x.table_id === t.id);
              const busy = !!o || t.status === 'occupied';
              return (
                <div key={t.id} role="button" tabIndex={0} onClick={() => router.push(`/app/pos?table=${t.id}`)}
                  onKeyDown={(e) => e.key === 'Enter' && router.push(`/app/pos?table=${t.id}`)}
                  className={cn('relative cursor-pointer rounded-xl border p-3 transition-shadow hover:shadow-lift',
                    busy ? 'border-turmeric-400 bg-turmeric-50' : t.status === 'reserved' ? 'border-line bg-field' : 'border-line bg-white')}>
                  <div className="flex items-start justify-between">
                    <p className="font-display text-xl font-bold">{t.name}</p>
                    {isOwner && (
                      <button onClick={(e) => { e.stopPropagation(); setEdit(t); }} className="rounded-md p-1 text-ink-mute hover:bg-white" aria-label={`Edit ${t.name}`}><Icon name="edit" className="h-4 w-4" /></button>
                    )}
                  </div>
                  <p className="text-xs text-ink-mute">{t.seats} seats</p>
                  <div className="mt-2">
                    {o ? <><Badge tone="yellow">Order #{o.order_no}</Badge><p className="mt-1 text-sm font-semibold">{inr(o.total)}<span className="ml-1 text-xs font-normal text-ink-mute">{minutesSince(o.created_at)} min</span></p></>
                      : <Badge tone={t.status === 'reserved' ? 'gray' : 'green'}>{t.status === 'reserved' ? 'Reserved' : 'Free'}</Badge>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
      <Modal open={!!edit} onClose={() => setEdit(null)} title="Edit table"
        footer={<><Btn variant="danger" className="mr-auto" onClick={remove}>Delete</Btn><Btn variant="secondary" onClick={() => setEdit(null)}>Cancel</Btn><Btn onClick={save}>Save</Btn></>}>
        {edit && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name"><Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label="Seats"><Input type="number" min="1" value={edit.seats} onChange={(e) => setEdit({ ...edit, seats: e.target.value })} /></Field>
            <Field label="Section"><Input value={edit.section} onChange={(e) => setEdit({ ...edit, section: e.target.value })} /></Field>
            <Field label="Status">
              <Select value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>
                <option value="free">Free</option><option value="reserved">Reserved</option><option value="occupied">Occupied</option>
              </Select>
            </Field>
          </div>
        )}
      </Modal>
    </>
  );
}

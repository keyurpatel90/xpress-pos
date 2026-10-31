'use client';
import { useState } from 'react';
import { unwrap, useAction, useData, useSupabase } from '@/lib/hooks';
import { useApp } from '@/components/app/AppProvider';
import { Btn, Card, Empty, Field, Input, Loading, Modal, PageHeader } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { inr } from '@/lib/utils';
import type { Row } from '@/lib/types';

export default function ModifiersPage() {
  const { access } = useApp();
  const sb = useSupabase();
  const act = useAction();
  const { data: groups, loading, reload } = useData<Row[]>(
    async (c) => unwrap(await c.from('modifier_groups').select('*, modifier_options(*)').order('name')) ?? [], []);
  const [grp, setGrp] = useState<Row | null>(null);
  const [draft, setDraft] = useState<Record<string, { name: string; price: string }>>({});

  async function saveGroup() {
    if (!grp?.name.trim()) return;
    const min = Math.max(0, Number(grp.min_select) || 0);
    const max = Math.max(1, Number(grp.max_select) || 1);
    const payload = { restaurant_id: access.restaurant_id, name: grp.name.trim(), min_select: Math.min(min, max), max_select: max };
    const ok = await act(async () => unwrap(grp.id ? await sb.from('modifier_groups').update(payload).eq('id', grp.id) : await sb.from('modifier_groups').insert(payload)) ?? true, 'Group saved');
    if (ok) { setGrp(null); reload(); }
  }
  async function removeGroup() {
    if (!grp?.id || !confirm('Delete this group and its options?')) return;
    await act(async () => unwrap(await sb.from('modifier_groups').delete().eq('id', grp.id)) ?? true, 'Group deleted');
    setGrp(null); reload();
  }
  async function addOption(g: Row) {
    const d = draft[g.id];
    if (!d?.name.trim()) return;
    const ok = await act(async () => unwrap(await sb.from('modifier_options').insert({
      restaurant_id: access.restaurant_id, group_id: g.id, name: d.name.trim(), price: Number(d.price) || 0, sort: (g.modifier_options as Row[]).length + 1,
    })) ?? true);
    if (ok) { setDraft({ ...draft, [g.id]: { name: '', price: '' } }); reload(); }
  }
  async function removeOption(id: string) {
    await act(async () => unwrap(await sb.from('modifier_options').delete().eq('id', id)) ?? true);
    reload();
  }

  if (loading) return <Loading variant="list" />;
  return (
    <>
      <PageHeader title="Modifiers" subtitle="Add-ons and choices that appear when you tap a dish. Attach groups to dishes from the Menu page."
        actions={<Btn onClick={() => setGrp({ id: null, name: '', min_select: 0, max_select: 1 })}><Icon name="plus" className="h-4 w-4" /> New group</Btn>} />
      {groups.length === 0 ? (
        <Empty icon="sliders" title="No modifier groups yet" text="Create a group such as Spice level or Extras, then add its options." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {groups.map((g) => (
            <Card key={g.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display text-lg font-semibold">{g.name}</p>
                  <p className="text-xs text-ink-mute">{g.min_select > 0 ? `Choose at least ${g.min_select}` : 'Optional'} · up to {g.max_select}</p>
                </div>
                <button onClick={() => setGrp(g)} className="rounded-md p-1.5 text-ink-mute hover:bg-field" aria-label={`Edit ${g.name}`}><Icon name="edit" className="h-4 w-4" /></button>
              </div>
              <ul className="my-3 flex flex-wrap gap-2">
                {(g.modifier_options as Row[]).sort((a, b) => a.sort - b.sort).map((o) => (
                  <li key={o.id} className="flex items-center gap-1 rounded-lg bg-field px-2.5 py-1 text-sm">
                    {o.name}{Number(o.price) > 0 && <span className="text-ink-mute"> +{inr(o.price)}</span>}
                    <button onClick={() => removeOption(o.id)} className="ml-1 text-ink-mute hover:text-rose-600" aria-label={`Remove ${o.name}`}><Icon name="x" className="h-3.5 w-3.5" /></button>
                  </li>
                ))}
                {(g.modifier_options as Row[]).length === 0 && <li className="text-sm text-ink-mute">No options yet</li>}
              </ul>
              <div className="flex gap-2">
                <Input placeholder="Option name" value={draft[g.id]?.name ?? ''} onChange={(e) => setDraft({ ...draft, [g.id]: { name: e.target.value, price: draft[g.id]?.price ?? '' } })} />
                <Input className="w-24" type="number" min="0" placeholder="₹ extra" value={draft[g.id]?.price ?? ''} onChange={(e) => setDraft({ ...draft, [g.id]: { name: draft[g.id]?.name ?? '', price: e.target.value } })} />
                <Btn variant="secondary" onClick={() => addOption(g)}>Add</Btn>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal open={!!grp} onClose={() => setGrp(null)} title={grp?.id ? 'Edit group' : 'New modifier group'}
        footer={<>{grp?.id && <Btn variant="danger" className="mr-auto" onClick={removeGroup}>Delete</Btn>}<Btn variant="secondary" onClick={() => setGrp(null)}>Cancel</Btn><Btn onClick={saveGroup}>Save</Btn></>}>
        {grp && (
          <div className="space-y-3">
            <Field label="Group name"><Input autoFocus placeholder="Spice level, Extras, Size" value={grp.name} onChange={(e) => setGrp({ ...grp, name: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Minimum to choose" hint="0 makes the group optional"><Input type="number" min="0" value={grp.min_select} onChange={(e) => setGrp({ ...grp, min_select: e.target.value })} /></Field>
              <Field label="Maximum to choose"><Input type="number" min="1" value={grp.max_select} onChange={(e) => setGrp({ ...grp, max_select: e.target.value })} /></Field>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

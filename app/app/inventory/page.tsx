'use client';
import { useState } from 'react';
import { unwrap, useAction, useData, useSupabase } from '@/lib/hooks';
import { useApp } from '@/components/app/AppProvider';
import { Badge, Btn, Empty, Field, Input, Loading, Modal, PageHeader, Segmented, Select, Stat, Table } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { INV_UNITS, fmtDate, inr } from '@/lib/utils';
import type { Row } from '@/lib/types';

const REASONS: Record<string, string> = { purchase: 'Purchase', wastage: 'Wastage', correction: 'Correction', opening: 'Opening stock', sale: 'Used in orders', cancel: 'Order cancelled' };

export default function InventoryPage() {
  const { access } = useApp();
  const sb = useSupabase();
  const act = useAction();
  const { data: items, loading, reload } = useData<Row[]>(async (c) => unwrap(await c.from('inventory_items').select('*').order('name')) ?? [], []);
  const [q, setQ] = useState('');
  const [lowOnly, setLowOnly] = useState(false);
  const [edit, setEdit] = useState<Row | null>(null);
  const [adj, setAdj] = useState<Row | null>(null);
  const [hist, setHist] = useState<{ item: Row; rows: Row[] } | null>(null);

  const isLow = (i: Row) => Number(i.reorder_level) > 0 && Number(i.quantity) <= Number(i.reorder_level);
  const value = items.reduce((s, i) => s + Number(i.quantity) * Number(i.cost_per_unit), 0);

  async function save() {
    if (!edit?.name.trim()) return;
    const payload = {
      restaurant_id: access.restaurant_id, name: edit.name.trim(), unit: edit.unit, reorder_level: Number(edit.reorder_level) || 0,
      cost_per_unit: Number(edit.cost_per_unit) || 0, supplier: edit.supplier?.trim() || null,
    };
    const ok = await act(async () => {
      if (edit.id) { unwrap(await sb.from('inventory_items').update(payload).eq('id', edit.id)); return true; }
      const created = unwrap(await sb.from('inventory_items').insert(payload).select('id').single()) as Row;
      const open = Number(edit.opening) || 0;
      if (open > 0) unwrap(await sb.rpc('adjust_stock', { p_item: created.id, p_change: open, p_reason: 'opening', p_note: null }));
      return true;
    }, 'Saved');
    if (ok) { setEdit(null); reload(); }
  }
  async function remove() {
    if (!edit?.id || !confirm(`Delete ${edit.name}? Recipes that use it will lose this ingredient.`)) return;
    await act(async () => unwrap(await sb.from('inventory_items').delete().eq('id', edit.id)) ?? true, 'Deleted');
    setEdit(null); reload();
  }
  async function adjust() {
    if (!adj) return;
    const qty = Math.abs(Number(adj.qty) || 0);
    if (!qty) return;
    const sign = adj.reason === 'purchase' ? 1 : adj.reason === 'wastage' ? -1 : adj.dir === 'out' ? -1 : 1;
    const ok = await act(async () => unwrap(await sb.rpc('adjust_stock', { p_item: adj.item.id, p_change: sign * qty, p_reason: adj.reason, p_note: adj.note })) ?? true, 'Stock updated');
    if (ok) { setAdj(null); reload(); }
  }
  async function openHist(item: Row) {
    const { data } = await sb.from('stock_movements').select('*').eq('inventory_item_id', item.id).order('created_at', { ascending: false }).limit(40);
    setHist({ item, rows: (data as Row[]) ?? [] });
  }

  if (loading) return <Loading />;
  const rows = items.filter((i) => (!q || i.name.toLowerCase().includes(q.toLowerCase())) && (!lowOnly || isLow(i)));

  return (
    <>
      <PageHeader title="Inventory" subtitle="Ingredients and supplies"
        actions={<Btn onClick={() => setEdit({ id: null, name: '', unit: 'kg', opening: '', reorder_level: '', cost_per_unit: '', supplier: '' })}><Icon name="plus" className="h-4 w-4" /> Add item</Btn>} />
      <div className="mb-4 grid grid-cols-3 gap-3">
        <Stat label="Items" value={items.length} />
        <Stat label="Low stock" value={items.filter(isLow).length} tone={items.some(isLow) ? 'warn' : undefined} />
        <Stat label="Stock value" value={inr(value)} />
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Input className="max-w-xs" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
        <Segmented value={lowOnly ? 'low' : 'all'} onChange={(v) => setLowOnly(v === 'low')} options={[{ id: 'all', label: 'All' }, { id: 'low', label: 'Low stock' }]} />
      </div>
      {rows.length === 0 ? <Empty icon="box" title={items.length ? 'Nothing matches' : 'No inventory items yet'} text="Add ingredients like paneer, rice or oil with their unit and cost." /> : (
        <Table head={['Item', 'In stock', 'Reorder at', 'Cost / unit', 'Value', '']}>
          {rows.map((i) => (
            <tr key={i.id}>
              <td className="px-4 py-2.5 font-medium">{i.name}{i.supplier && <span className="block text-xs font-normal text-ink-mute">{i.supplier}</span>}</td>
              <td className="px-4 py-2.5">{Number(i.quantity)} {i.unit} {isLow(i) && <Badge tone="red" className="ml-1">Low</Badge>}</td>
              <td className="px-4 py-2.5 text-ink-soft">{Number(i.reorder_level) > 0 ? `${Number(i.reorder_level)} ${i.unit}` : '-'}</td>
              <td className="px-4 py-2.5">{inr(i.cost_per_unit, 2)}</td>
              <td className="px-4 py-2.5">{inr(Number(i.quantity) * Number(i.cost_per_unit))}</td>
              <td className="whitespace-nowrap px-4 py-2.5 text-right">
                <Btn size="sm" variant="secondary" onClick={() => setAdj({ item: i, reason: 'purchase', qty: '', dir: 'in', note: '' })}>Adjust</Btn>
                <button onClick={() => openHist(i)} className="p-1.5 text-ink-mute hover:text-ink" aria-label="History"><Icon name="clock" className="h-4 w-4" /></button>
                <button onClick={() => setEdit({ ...i, supplier: i.supplier ?? '' })} className="p-1.5 text-ink-mute hover:text-ink" aria-label={`Edit ${i.name}`}><Icon name="edit" className="h-4 w-4" /></button>
              </td>
            </tr>
          ))}
        </Table>
      )}

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit inventory item' : 'New inventory item'}
        footer={<>{edit?.id && <Btn variant="danger" className="mr-auto" onClick={remove}>Delete</Btn>}<Btn variant="secondary" onClick={() => setEdit(null)}>Cancel</Btn><Btn onClick={save}>Save</Btn></>}>
        {edit && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name" className="sm:col-span-2"><Input autoFocus value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label="Counted in"><Select value={edit.unit} onChange={(e) => setEdit({ ...edit, unit: e.target.value })}>{INV_UNITS.map((u) => <option key={u}>{u}</option>)}</Select></Field>
            <Field label="Cost per unit (₹)"><Input type="number" min="0" step="0.01" value={edit.cost_per_unit} onChange={(e) => setEdit({ ...edit, cost_per_unit: e.target.value })} /></Field>
            {!edit.id && <Field label="Opening stock"><Input type="number" min="0" step="0.001" value={edit.opening} onChange={(e) => setEdit({ ...edit, opening: e.target.value })} /></Field>}
            <Field label="Reorder level" hint="Warn me at or below this"><Input type="number" min="0" step="0.001" value={edit.reorder_level} onChange={(e) => setEdit({ ...edit, reorder_level: e.target.value })} /></Field>
            <Field label="Supplier (optional)" className="sm:col-span-2"><Input value={edit.supplier} onChange={(e) => setEdit({ ...edit, supplier: e.target.value })} /></Field>
          </div>
        )}
      </Modal>

      <Modal open={!!adj} onClose={() => setAdj(null)} title={adj ? `Adjust ${adj.item.name}` : ''}
        footer={<><Btn variant="secondary" onClick={() => setAdj(null)}>Cancel</Btn><Btn onClick={adjust}>Update stock</Btn></>}>
        {adj && (
          <div className="space-y-3">
            <p className="text-sm text-ink-mute">Now in stock: <b>{Number(adj.item.quantity)} {adj.item.unit}</b></p>
            <Field label="What happened">
              <Select value={adj.reason} onChange={(e) => setAdj({ ...adj, reason: e.target.value })}>
                <option value="purchase">Purchase (add stock)</option><option value="wastage">Wastage (remove stock)</option><option value="correction">Correction after a stock count</option>
              </Select>
            </Field>
            {adj.reason === 'correction' && <Segmented value={adj.dir} onChange={(v) => setAdj({ ...adj, dir: v })} options={[{ id: 'in', label: 'Increase' }, { id: 'out', label: 'Decrease' }]} />}
            <Field label={`Quantity (${adj.item.unit})`}><Input type="number" min="0" step="0.001" value={adj.qty} onChange={(e) => setAdj({ ...adj, qty: e.target.value })} /></Field>
            <Field label="Note (optional)"><Input value={adj.note} onChange={(e) => setAdj({ ...adj, note: e.target.value })} /></Field>
          </div>
        )}
      </Modal>

      <Modal open={!!hist} onClose={() => setHist(null)} title={hist ? `${hist.item.name}: history` : ''}>
        {hist && (hist.rows.length === 0 ? <p className="py-6 text-center text-sm text-ink-mute">No movements yet.</p> : (
          <ul className="divide-y divide-line text-sm">
            {hist.rows.map((m) => (
              <li key={m.id} className="flex items-center justify-between py-2">
                <span>{REASONS[m.reason] ?? m.reason}{m.note ? <span className="text-ink-mute"> · {m.note}</span> : ''}<span className="block text-xs text-ink-mute">{fmtDate(m.created_at, true)}</span></span>
                <b className={Number(m.change) < 0 ? 'text-chili-600' : 'text-pine-700'}>{Number(m.change) > 0 ? '+' : ''}{Number(m.change)} {hist.item.unit}</b>
              </li>
            ))}
          </ul>
        ))}
      </Modal>
    </>
  );
}

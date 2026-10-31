'use client';

import { useState } from 'react';
import { unwrap, useAction, useData, useSupabase } from '@/lib/hooks';
import { useApp } from '@/components/app/AppProvider';
import { Badge, Btn, Empty, Field, Input, Modal, Select, Table, Textarea } from '@/components/ui';
import { Icon } from '@/components/Icon';
import type { Row } from '@/lib/types';

const ORDER_TYPES = ['dine_in', 'takeaway', 'delivery'];
const CSV_COLUMNS = ['name', 'price', 'category', 'description', 'is_veg', 'tax_rate', 'unit', 'station'];

function download(name: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
}

export function AdvancedMenu() {
  const { access } = useApp();
  const sb = useSupabase();
  const act = useAction();
  const rid = access.restaurant_id;
  const [tab, setTab] = useState('variants');
  const [modal, setModal] = useState<Row | null>(null);
  const [dryRun, setDryRun] = useState<Row[]>([]);
  const [importError, setImportError] = useState('');
  const { data, loading, reload } = useData(async (c) => {
    const [items, variants, combos, comboItems, lists, prices, schedules] = await Promise.all([
      c.from('menu_items').select('id,name,price,category_id').order('name'),
      c.from('menu_variants').select('*').order('name'),
      c.from('menu_combos').select('*').order('name'),
      c.from('menu_combo_items').select('*'),
      c.from('menu_price_lists').select('*').order('name'),
      c.from('menu_prices').select('*'),
      c.from('menu_schedules').select('*').order('name'),
    ]);
    return { items: unwrap(items) ?? [], variants: unwrap(variants) ?? [], combos: unwrap(combos) ?? [], comboItems: unwrap(comboItems) ?? [], lists: unwrap(lists) ?? [], prices: unwrap(prices) ?? [], schedules: unwrap(schedules) ?? [] };
  }, { items: [], variants: [], combos: [], comboItems: [], lists: [], prices: [], schedules: [] });

  const items = data.items as Row[];
  const variants = data.variants as Row[];
  const combos = data.combos as Row[];
  const lists = data.lists as Row[];
  const schedules = data.schedules as Row[];
  const itemName = (id: string) => items.find((item) => item.id === id)?.name ?? 'Unknown item';

  async function save() {
    if (!modal?.name?.trim()) return;
    const table = tab === 'variants' ? 'menu_variants' : tab === 'combos' ? 'menu_combos' : tab === 'lists' ? 'menu_price_lists' : 'menu_schedules';
    const payload: Record<string, unknown> = tab === 'variants'
      ? { restaurant_id: rid, menu_item_id: modal.menu_item_id, name: modal.name.trim(), price: Number(modal.price) || 0, recipe_id: modal.recipe_id || null, is_active: true }
      : tab === 'combos'
        ? { restaurant_id: rid, name: modal.name.trim(), description: modal.description || null, price: Number(modal.price) || 0, is_active: true }
        : tab === 'lists'
          ? { restaurant_id: rid, name: modal.name.trim(), order_type: modal.order_type, is_default: !!modal.is_default, is_active: true }
          : { restaurant_id: rid, name: modal.name.trim(), starts_at: modal.starts_at, ends_at: modal.ends_at, days: [0, 1, 2, 3, 4, 5, 6], price_list_id: modal.price_list_id || null, is_active: true };
    const ok = await act(async () => unwrap(modal.id ? await sb.from(table).update(payload).eq('id', modal.id) : await sb.from(table).insert(payload)), 'Saved');
    if (ok !== undefined) { setModal(null); reload(); }
  }

  function exportCsv() {
    const rows = items.map((item) => CSV_COLUMNS.map((key) => key === 'name' ? item.name : key === 'price' ? item.price : item[key] ?? '').map((v) => `"${String(v).replaceAll('"', '""')}"`).join(','));
    download('menu-items.csv', `${CSV_COLUMNS.join(',')}\n${rows.join('\n')}`);
  }

  function parseCsv(text: string) {
    const lines = text.split(/\r?\n/).filter(Boolean); const headers = lines.shift()?.split(',').map((v) => v.trim().replaceAll('"', '')) ?? [];
    const parsed = lines.map((line) => line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''))).map((values, index) => Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ''])) as Row & { row: number }).map((row, index) => ({ ...row, row: index + 2, valid: !!row.name && Number(row.price) >= 0 }));
    setDryRun(parsed); setImportError(headers.length && headers[0] === 'name' ? '' : `CSV must start with: ${CSV_COLUMNS.join(', ')}`);
  }

  async function importCsv() {
    const valid = dryRun.filter((row) => row.valid);
    if (!valid.length || importError) return;
    await act(async () => unwrap(await sb.from('menu_items').insert(valid.map((row) => ({ restaurant_id: rid, name: row.name, price: Number(row.price), description: row.description || null, is_veg: row.is_veg !== 'false', tax_rate: row.tax_rate ? Number(row.tax_rate) : null, unit: row.unit || 'plate', station: row.station || 'Kitchen', is_available: true })))), `${valid.length} items imported`);
    setDryRun([]); reload();
  }

  const tabs = [{ id: 'variants', label: 'Variants' }, { id: 'combos', label: 'Combos' }, { id: 'lists', label: 'Price lists' }, { id: 'schedules', label: 'Schedules' }, { id: 'import', label: 'CSV tools' }];
  if (loading) return null;
  return <section className="mt-8 card p-5">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Advanced menu</h2><p className="text-sm text-ink-mute">Variants, combos, time-based pricing and order-type prices.</p></div><div className="flex gap-2"><Btn size="sm" variant="secondary" onClick={exportCsv}><Icon name="download" className="h-4 w-4" /> Export CSV</Btn>{tab !== 'import' && <Btn size="sm" onClick={() => setModal({})}><Icon name="plus" className="h-4 w-4" /> Add</Btn>}</div></div>
    <div className="mb-4 flex flex-wrap gap-1 border-b border-line">{tabs.map((t) => <button key={t.id} className={`border-b-2 px-3 py-2 text-sm font-medium ${tab === t.id ? 'border-brand-600 text-brand-700' : 'border-transparent text-ink-mute'}`} onClick={() => setTab(t.id)}>{t.label}</button>)}</div>
    {tab === 'variants' && <Table head={['Variant', 'Item', 'Price', 'Status', '']}><>{variants.map((v) => <tr key={v.id}><td className="px-4 py-2.5 font-medium">{v.name}</td><td className="px-4 py-2.5">{itemName(v.menu_item_id)}</td><td className="px-4 py-2.5">₹{Number(v.price).toFixed(2)}</td><td className="px-4 py-2.5"><Badge>{v.is_active ? 'Active' : 'Hidden'}</Badge></td><td className="px-4 py-2.5 text-right"><button onClick={() => setModal(v)} aria-label="Edit variant"><Icon name="edit" className="h-4 w-4" /></button></td></tr>)}</></Table>}
    {tab === 'combos' && <Table head={['Combo', 'Price', 'Status', '']}><>{combos.map((c) => <tr key={c.id}><td className="px-4 py-2.5 font-medium">{c.name}</td><td className="px-4 py-2.5">₹{Number(c.price).toFixed(2)}</td><td className="px-4 py-2.5"><Badge>{c.is_active ? 'Active' : 'Hidden'}</Badge></td><td className="px-4 py-2.5 text-right"><button onClick={() => setModal(c)} aria-label="Edit combo"><Icon name="edit" className="h-4 w-4" /></button></td></tr>)}</></Table>}
    {tab === 'lists' && <Table head={['Price list', 'Order type', 'Default', '']}><>{lists.map((l) => <tr key={l.id}><td className="px-4 py-2.5 font-medium">{l.name}</td><td className="px-4 py-2.5 capitalize">{l.order_type.replace('_', ' ')}</td><td className="px-4 py-2.5">{l.is_default ? 'Yes' : 'No'}</td><td className="px-4 py-2.5 text-right"><button onClick={() => setModal(l)} aria-label="Edit price list"><Icon name="edit" className="h-4 w-4" /></button></td></tr>)}</></Table>}
    {tab === 'schedules' && <Table head={['Schedule', 'Time', 'Price list', '']}><>{schedules.map((s) => <tr key={s.id}><td className="px-4 py-2.5 font-medium">{s.name}</td><td className="px-4 py-2.5">{s.starts_at}–{s.ends_at}</td><td className="px-4 py-2.5">{lists.find((l) => l.id === s.price_list_id)?.name ?? 'Base prices'}</td><td className="px-4 py-2.5 text-right"><button onClick={() => setModal(s)} aria-label="Edit schedule"><Icon name="edit" className="h-4 w-4" /></button></td></tr>)}</></Table>}
    {tab === 'import' && <div className="grid gap-4 md:grid-cols-2"><div><Field label="Import CSV"><Input type="file" accept=".csv,text/csv" onChange={(e) => { const file = e.target.files?.[0]; if (file) file.text().then(parseCsv); }} /></Field><p className="mt-2 text-xs text-ink-mute">Required columns: {CSV_COLUMNS.join(', ')}</p>{importError && <p className="mt-2 text-sm text-rose-600">{importError}</p>}</div><div><h3 className="mb-2 font-medium">Dry run</h3>{dryRun.length === 0 ? <Empty title="No file preview" text="Choose a CSV to validate before importing." /> : <><p className="mb-2 text-sm">{dryRun.filter((r) => r.valid).length} valid, {dryRun.filter((r) => !r.valid).length} invalid rows.</p><Btn onClick={importCsv} disabled={!!importError || !dryRun.some((r) => r.valid)}>Import valid rows</Btn></>}</div></div>}
    <Modal open={!!modal} onClose={() => setModal(null)} title={`Add ${tab}`} footer={<><Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn><Btn onClick={save}>Save</Btn></>}>
      {modal && <div className="grid gap-3 sm:grid-cols-2"><Field label="Name" className="sm:col-span-2"><Input autoFocus value={modal.name ?? ''} onChange={(e) => setModal({ ...modal, name: e.target.value })} /></Field>{tab === 'variants' && <><Field label="Menu item"><Select value={modal.menu_item_id ?? ''} onChange={(e) => setModal({ ...modal, menu_item_id: e.target.value })}><option value="">Select item</option>{items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</Select></Field><Field label="Price"><Input type="number" value={modal.price ?? ''} onChange={(e) => setModal({ ...modal, price: e.target.value })} /></Field></>}{tab === 'combos' && <><Field label="Price"><Input type="number" value={modal.price ?? ''} onChange={(e) => setModal({ ...modal, price: e.target.value })} /></Field><Field label="Description"><Textarea value={modal.description ?? ''} onChange={(e) => setModal({ ...modal, description: e.target.value })} /></Field></>}{tab === 'lists' && <Field label="Order type"><Select value={modal.order_type ?? ORDER_TYPES[0]} onChange={(e) => setModal({ ...modal, order_type: e.target.value })}>{ORDER_TYPES.map((type) => <option key={type}>{type}</option>)}</Select></Field>}{tab === 'schedules' && <><Field label="Starts"><Input type="time" value={modal.starts_at ?? ''} onChange={(e) => setModal({ ...modal, starts_at: e.target.value })} /></Field><Field label="Ends"><Input type="time" value={modal.ends_at ?? ''} onChange={(e) => setModal({ ...modal, ends_at: e.target.value })} /></Field><Field label="Price list"><Select value={modal.price_list_id ?? ''} onChange={(e) => setModal({ ...modal, price_list_id: e.target.value })}><option value="">Base prices</option>{lists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</Select></Field></>}</div>}
    </Modal>
  </section>;
}

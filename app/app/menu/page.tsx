'use client';
import { useState } from 'react';
import { unwrap, useAction, useData, useSupabase } from '@/lib/hooks';
import { useApp } from '@/components/app/AppProvider';
import { Badge, Btn, Empty, Field, Input, Loading, Modal, PageHeader, Select, Table, Textarea, Toggle } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { UNITS, cn, inr } from '@/lib/utils';
import type { Row } from '@/lib/types';
import { AdvancedMenu } from '@/components/menu/AdvancedMenu';

const blankItem = (catId: string): Row => ({
  id: null, name: '', category_id: catId !== 'all' && catId !== 'none' ? catId : '', price: '', is_veg: true,
  unit: 'plate', tax_rate: '', station: 'Kitchen', description: '', is_available: true,
});

export default function MenuPage() {
  const { role, has, access, restaurant } = useApp();
  const sb = useSupabase();
  const act = useAction();
  const canEdit = role === 'owner';
  const rid = access.restaurant_id;
  const { data, loading, reload } = useData<Row>(async (c) => {
    const [cs, its, gs, ls] = await Promise.all([
      c.from('categories').select('*').order('sort').order('name'),
      c.from('menu_items').select('*').order('name'),
      c.from('modifier_groups').select('id, name').order('name'),
      c.from('menu_item_modifier_groups').select('menu_item_id, group_id'),
    ]);
    return { cats: unwrap(cs) ?? [], items: unwrap(its) ?? [], groups: unwrap(gs) ?? [], links: unwrap(ls) ?? [] };
  }, { cats: [], items: [], groups: [], links: [] });

  const [catId, setCatId] = useState('all');
  const [q, setQ] = useState('');
  const [item, setItem] = useState<Row | null>(null);
  const [gsel, setGsel] = useState<string[]>([]);
  const [cat, setCat] = useState<Row | null>(null);
  const cats = data.cats as Row[];
  const items = data.items as Row[];
  const stations = Array.from(new Set(['Kitchen', 'Tandoor', 'Bar', 'Dessert', ...items.map((i) => i.station)]));

  function openItem(i: Row | null) {
    setItem(i ? { ...i, price: String(i.price), tax_rate: i.tax_rate ?? '', category_id: i.category_id ?? '', description: i.description ?? '' } : blankItem(catId));
    setGsel(i ? (data.links as Row[]).filter((l) => l.menu_item_id === i.id).map((l) => l.group_id) : []);
  }
  async function saveItem() {
    if (!item) return;
    if (!item.name.trim() || item.price === '' || Number(item.price) < 0) return act(async () => { throw new Error('Enter a name and a price'); });
    const payload = {
      restaurant_id: rid, category_id: item.category_id || null, name: item.name.trim(), description: item.description?.trim() || null,
      price: Number(item.price), is_veg: item.is_veg, unit: item.unit, tax_rate: item.tax_rate === '' ? null : Number(item.tax_rate),
      station: item.station.trim() || 'Kitchen', is_available: item.is_available,
    };
    const ok = await act(async () => {
      let id = item.id as string | null;
      if (id) unwrap(await sb.from('menu_items').update(payload).eq('id', id));
      else id = (unwrap(await sb.from('menu_items').insert(payload).select('id').single()) as Row).id as string;
      if (has('modifiers')) {
        unwrap(await sb.from('menu_item_modifier_groups').delete().eq('menu_item_id', id));
        if (gsel.length) unwrap(await sb.from('menu_item_modifier_groups').insert(gsel.map((g) => ({ menu_item_id: id, group_id: g, restaurant_id: rid }))));
      }
      return true;
    }, 'Item saved');
    if (ok) { setItem(null); reload(); }
  }
  async function removeItem(i: Row) {
    if (!confirm(`Delete ${i.name}? Past bills keep their record.`)) return;
    await act(async () => unwrap(await sb.from('menu_items').delete().eq('id', i.id)) ?? true, 'Item deleted');
    reload();
  }
  async function toggle(i: Row) {
    await act(async () => unwrap(await sb.rpc('set_item_availability', { p_item: i.id, p_available: !i.is_available })));
    reload();
  }
  async function saveCat() {
    if (!cat?.name.trim()) return;
    const payload = { restaurant_id: rid, name: cat.name.trim(), sort: Number(cat.sort) || 0, is_active: cat.is_active };
    const ok = await act(async () => unwrap(cat.id ? await sb.from('categories').update(payload).eq('id', cat.id) : await sb.from('categories').insert(payload)) ?? true, 'Category saved');
    if (ok) { setCat(null); reload(); }
  }
  async function removeCat() {
    if (!cat?.id || !confirm('Delete this category? Its items stay on the menu without a category.')) return;
    await act(async () => unwrap(await sb.from('categories').delete().eq('id', cat.id)) ?? true, 'Category deleted');
    setCat(null); setCatId('all'); reload();
  }
  async function sample() {
    await act(async () => unwrap(await sb.rpc('seed_sample_data')), 'Sample menu and tables added');
    reload();
  }

  if (loading) return <Loading variant="list" />;
  const shown = items.filter((i) =>
    (catId === 'all' || (catId === 'none' ? !i.category_id : i.category_id === catId)) && (!q || i.name.toLowerCase().includes(q.toLowerCase())));
  const catName = (id: string | null) => cats.find((c) => c.id === id)?.name ?? '-';

  return (
    <>
      <PageHeader title="Menu" subtitle={canEdit ? 'Categories, items, units, GST and kitchen stations' : 'Mark dishes unavailable when they run out'}
        actions={canEdit && <>
          <Btn variant="secondary" onClick={() => setCat({ id: null, name: '', sort: cats.length + 1, is_active: true })}><Icon name="plus" className="h-4 w-4" /> Category</Btn>
          <Btn onClick={() => openItem(null)}><Icon name="plus" className="h-4 w-4" /> Menu item</Btn>
        </>} />
      {cats.length === 0 && items.length === 0 ? (
        <Empty icon="menu" title="Your menu is empty" text="Add categories and items, or start from a sample menu and edit it."
          action={canEdit && <div className="flex gap-2"><Btn onClick={sample}>Load sample menu</Btn><Btn variant="secondary" onClick={() => setCat({ id: null, name: '', sort: 1, is_active: true })}>Add a category</Btn></div>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-[220px_1fr]">
          <nav className="card h-fit p-2">
            {([{ id: 'all', name: 'All items', n: items.length } as Row, ...cats.map((c): Row => ({ ...c, n: items.filter((i) => i.category_id === c.id).length })),
              ...(items.some((i) => !i.category_id) ? [{ id: 'none', name: 'Uncategorised', n: items.filter((i) => !i.category_id).length } as Row] : [])] as Row[]).map((c) => (
              <div key={c.id} className={cn('flex items-center rounded-lg', catId === c.id ? 'bg-brand-50' : 'hover:bg-field')}>
                <button onClick={() => setCatId(c.id)} className={cn('flex-1 px-3 py-2 text-left text-sm font-medium', catId === c.id ? 'text-brand-700' : 'text-ink-soft')}>
                  {c.name} <span className="text-xs text-ink-mute">{c.n}</span>{c.is_active === false && <Badge className="ml-1">Hidden</Badge>}
                </button>
                {canEdit && c.id !== 'all' && c.id !== 'none' && <button onClick={() => setCat({ ...c })} className="p-2 text-ink-mute hover:text-ink" aria-label={`Edit ${c.name}`}><Icon name="edit" className="h-4 w-4" /></button>}
              </div>
            ))}
          </nav>
          <div>
            <Input className="mb-3 max-w-xs" placeholder="Search items" value={q} onChange={(e) => setQ(e.target.value)} />
            {shown.length === 0 ? <Empty icon="menu" title="No items here" /> : (
              <Table head={['Item', 'Category', 'Price', 'GST', 'Station', 'Available', '']}>
                {shown.map((i) => (
                  <tr key={i.id}>
                    <td className="px-4 py-2.5">
                      <span className="flex items-center gap-2 font-medium">
                        <span className={cn('inline-block h-2.5 w-2.5 rounded-full', i.is_veg ? 'bg-emerald-600' : 'bg-rose-500')} />{i.name}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-ink-soft">{catName(i.category_id)}</td>
                    <td className="px-4 py-2.5">{inr(i.price, 2)} <span className="text-xs text-ink-mute">/ {i.unit}</span></td>
                    <td className="px-4 py-2.5 text-ink-soft">{i.tax_rate ?? restaurant.tax_rate}%</td>
                    <td className="px-4 py-2.5 text-ink-soft">{i.station}</td>
                    <td className="px-4 py-2.5"><Toggle checked={i.is_available} onChange={() => toggle(i)} /></td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right">
                      {canEdit && <>
                        <button onClick={() => openItem(i)} className="p-1.5 text-ink-mute hover:text-ink" aria-label={`Edit ${i.name}`}><Icon name="edit" className="h-4 w-4" /></button>
                        <button onClick={() => removeItem(i)} className="p-1.5 text-ink-mute hover:text-rose-600" aria-label={`Delete ${i.name}`}><Icon name="trash" className="h-4 w-4" /></button>
                      </>}
                    </td>
                  </tr>
                ))}
              </Table>
            )}
          </div>
        </div>
      )}

      <Modal open={!!item} onClose={() => setItem(null)} title={item?.id ? 'Edit menu item' : 'New menu item'} wide
        footer={<><Btn variant="secondary" onClick={() => setItem(null)}>Cancel</Btn><Btn onClick={saveItem}>Save item</Btn></>}>
        {item && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Item name" className="sm:col-span-2"><Input autoFocus value={item.name} onChange={(e) => setItem({ ...item, name: e.target.value })} /></Field>
            <Field label="Category">
              <Select value={item.category_id} onChange={(e) => setItem({ ...item, category_id: e.target.value })}>
                <option value="">No category</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            <Field label="Price (₹)"><Input type="number" min="0" step="0.01" inputMode="decimal" value={item.price} onChange={(e) => setItem({ ...item, price: e.target.value })} /></Field>
            <Field label="Sold by">
              <Select value={item.unit} onChange={(e) => setItem({ ...item, unit: e.target.value })}>{UNITS.map((u) => <option key={u} value={u}>{u}</option>)}</Select>
            </Field>
            <Field label={`GST % (blank = ${restaurant.tax_rate}%)`}><Input type="number" min="0" max="100" step="0.01" value={item.tax_rate} onChange={(e) => setItem({ ...item, tax_rate: e.target.value })} /></Field>
            <Field label="Kitchen station" hint="Orders for this item show on this station’s screen">
              <Input list="stations" value={item.station} onChange={(e) => setItem({ ...item, station: e.target.value })} />
              <datalist id="stations">{stations.map((s) => <option key={s} value={s} />)}</datalist>
            </Field>
            <div className="flex items-end gap-6 pb-1">
              <Toggle checked={item.is_veg} onChange={(v) => setItem({ ...item, is_veg: v })} label={item.is_veg ? 'Veg' : 'Non-veg'} />
              <Toggle checked={item.is_available} onChange={(v) => setItem({ ...item, is_available: v })} label="Available" />
            </div>
            <Field label="Description (optional)" className="sm:col-span-2"><Textarea value={item.description} onChange={(e) => setItem({ ...item, description: e.target.value })} /></Field>
            {has('modifiers') && (data.groups as Row[]).length > 0 && (
              <div className="sm:col-span-2">
                <p className="mb-1 text-sm font-medium text-ink-soft">Modifier groups</p>
                <div className="flex flex-wrap gap-2">
                  {(data.groups as Row[]).map((g) => {
                    const on = gsel.includes(g.id);
                    return (
                      <button key={g.id} type="button" onClick={() => setGsel(on ? gsel.filter((x) => x !== g.id) : [...gsel, g.id])}
                        className={cn('rounded-lg border px-3 py-1.5 text-sm font-medium', on ? 'border-brand-600 bg-brand-600 text-white' : 'border-line hover:bg-field')}>{g.name}</button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal open={!!cat} onClose={() => setCat(null)} title={cat?.id ? 'Edit category' : 'New category'}
        footer={<>{cat?.id && <Btn variant="danger" className="mr-auto" onClick={removeCat}>Delete</Btn>}<Btn variant="secondary" onClick={() => setCat(null)}>Cancel</Btn><Btn onClick={saveCat}>Save</Btn></>}>
        {cat && (
          <div className="space-y-3">
            <Field label="Category name"><Input autoFocus value={cat.name} onChange={(e) => setCat({ ...cat, name: e.target.value })} /></Field>
            <Field label="Order on screen" hint="Smaller numbers come first"><Input type="number" value={cat.sort} onChange={(e) => setCat({ ...cat, sort: e.target.value })} /></Field>
            <Toggle checked={cat.is_active} onChange={(v) => setCat({ ...cat, is_active: v })} label="Show on the POS" />
          </div>
        )}
      </Modal>
      <AdvancedMenu />
    </>
  );
}

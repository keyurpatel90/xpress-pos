'use client';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { unwrap, useAction, useData, useSupabase } from '@/lib/hooks';
import { useApp, useToast } from '@/components/app/AppProvider';
import { BillDialog } from '@/components/app/BillDialog';
import { CustomerPicker } from '@/components/app/CustomerPicker';
import { KotSlip } from '@/components/app/Invoice';
import { Badge, Btn, Input, Loading, Modal, Segmented, Toggle } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { ORDER_TYPES, cn, estimate, inr, typeLabel } from '@/lib/utils';
import type { Row } from '@/lib/types';

type Line = { key: string; item: Row; qty: number; notes: string; mods: Row[] };
const STATUS_TONE: Record<string, 'gray' | 'yellow' | 'green' | 'dark'> = { new: 'gray', preparing: 'yellow', ready: 'green', served: 'dark' };

export default function PosPage() {
  return <Suspense fallback={<Loading variant="pos" />}><Pos /></Suspense>;
}

function Pos() {
  const { role, restaurant, print } = useApp();
  const sb = useSupabase();
  const act = useAction();
  const toast = useToast();
  const params = useSearchParams();
  const canBill = role === 'owner' || role === 'cashier';

  const { data: cat, loading } = useData<Row>(async (c) => {
    const [cs, its, ts, gs, ls] = await Promise.all([
      c.from('categories').select('*').eq('is_active', true).order('sort').order('name'),
      c.from('menu_items').select('*').order('sort').order('name'),
      c.from('dining_tables').select('*').order('sort').order('name'),
      c.from('modifier_groups').select('*, modifier_options(*)'),
      c.from('menu_item_modifier_groups').select('menu_item_id, group_id'),
    ]);
    return { cats: unwrap(cs), items: unwrap(its), tables: unwrap(ts), groups: unwrap(gs), links: unwrap(ls) };
  }, { cats: [], items: [], tables: [], groups: [], links: [] });

  const { data: open, reload: reloadOpen } = useData<Row[]>(
    async (c) => unwrap(await c.from('orders').select('*, order_items(*), dining_tables(name)').eq('status', 'open').order('created_at')) ?? [], []);
  useEffect(() => {
    const t = setInterval(reloadOpen, 8000);
    return () => clearInterval(t);
  }, [reloadOpen]);

  const [ordType, setOrdType] = useState('dine_in');
  const [tableId, setTableId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [customer, setCustomer] = useState<Row | null>(null);
  const [notes, setNotes] = useState('');
  const [q, setQ] = useState('');
  const [catId, setCatId] = useState('all');
  const [vegOnly, setVegOnly] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [modItem, setModItem] = useState<Row | null>(null);
  const [billFor, setBillFor] = useState<string | null>(null);
  const [picker, setPicker] = useState(false);
  const [busy, setBusy] = useState(false);

  const activeOrder = useMemo(() => open.find((o) => o.id === activeId) ?? null, [open, activeId]);
  const sentItems: Row[] = useMemo(() => (activeOrder?.order_items ?? []).filter((i: Row) => i.status !== 'cancelled'), [activeOrder]);

  // Deep link from the Tables page (?table=...)
  const applied = useRef(false);
  const selectTable = useCallback((id: string) => {
    setOrdType('dine_in');
    setTableId(id);
    setActiveId(open.find((o) => o.table_id === id)?.id ?? null);
    setCustomer(null);
  }, [open]);
  useEffect(() => {
    const t = params.get('table');
    if (!applied.current && t && cat.tables.length) { applied.current = true; selectTable(t); }
  }, [params, cat.tables, selectTable]);

  // Deep link from the Orders page (?order=...) once open orders have loaded
  const appliedOrder = useRef(false);
  useEffect(() => {
    const id = params.get('order');
    const o = id ? open.find((x) => x.id === id) : null;
    if (!appliedOrder.current && o) { appliedOrder.current = true; setActiveId(o.id); setOrdType(o.order_type); setTableId(o.table_id); }
  }, [params, open]);

  // If a table is selected and it already has an open order (it may load after the table), attach to it
  useEffect(() => {
    if (ordType === 'dine_in' && tableId && !activeId) {
      const o = open.find((x) => x.table_id === tableId);
      if (o) setActiveId(o.id);
    }
  }, [open, tableId, activeId, ordType]);

  const groupsFor = (itemId: string): Row[] =>
    (cat.links as Row[]).filter((l) => l.menu_item_id === itemId).map((l) => (cat.groups as Row[]).find((g) => g.id === l.group_id)).filter(Boolean) as Row[];

  function addLine(item: Row, mods: Row[] = [], note = '') {
    const key = `${item.id}|${mods.map((m) => m.id).sort().join(',')}|${note}`;
    setLines((ls) => (ls.some((l) => l.key === key)
      ? ls.map((l) => (l.key === key ? { ...l, qty: l.qty + 1 } : l))
      : [...ls, { key, item, qty: 1, notes: note, mods }]));
  }
  function tap(item: Row) {
    if (!item.is_available) return toast(`${item.name} is marked unavailable`, 'error');
    if (groupsFor(item.id).length) setModItem(item); else addLine(item);
  }
  const bump = (key: string, d: number) =>
    setLines((ls) => ls.flatMap((l) => (l.key !== key ? [l] : l.qty + d <= 0 ? [] : [{ ...l, qty: l.qty + d }])));

  const est = estimate(lines.map((l) => ({
    price: Number(l.item.price), qty: l.qty, modTotal: l.mods.reduce((s, m) => s + Number(m.price), 0),
    taxRate: Number(l.item.tax_rate ?? restaurant.tax_rate),
  })), restaurant);
  const count = lines.reduce((s, l) => s + l.qty, 0);

  async function printKot(orderId: string) {
    const { data: o } = await sb.from('orders').select('*, order_items(*), dining_tables(name)').eq('id', orderId).single();
    if (!o) return;
    const items = (o.order_items as Row[]).filter((i) => i.kot_no === o.kot_count && i.status !== 'cancelled');
    print(<KotSlip restaurant={restaurant} order={o} items={items} tableName={o.dining_tables?.name} />);
  }

  async function sendKot(withPrint: boolean) {
    if (!lines.length) return;
    if (ordType === 'dine_in' && !tableId && !activeId) return toast('Select a table first', 'error');
    setBusy(true);
    const id = await act(async () => unwrap(await sb.rpc('send_kot', {
      p_order_id: activeId, p_type: ordType, p_table_id: tableId, p_customer_id: customer?.id ?? null,
      p_customer_name: customer?.name ?? null, p_customer_phone: customer?.phone ?? null, p_notes: notes,
      p_items: lines.map((l) => ({ menu_item_id: l.item.id, qty: l.qty, notes: l.notes, modifier_ids: l.mods.map((m) => m.id) })),
    })) as string);
    setBusy(false);
    if (!id) { reloadOpen(); return; }
    setLines([]); setNotes(''); setCustomer(null); setActiveId(id);
    toast('Sent to kitchen', 'success');
    await reloadOpen();
    if (withPrint || restaurant.auto_print_kot) printKot(id);
  }

  async function cancelItem(id: string) {
    if (!confirm('Cancel this item?')) return;
    await act(async () => unwrap(await sb.rpc('cancel_order_item', { p_item: id })), 'Item cancelled');
    reloadOpen();
  }
  async function cancelOrder() {
    if (!activeId || !confirm('Cancel the whole order? This cannot be undone.')) return;
    await act(async () => unwrap(await sb.rpc('cancel_order', { p_order: activeId })), 'Order cancelled');
    setActiveId(null); setTableId(null); reloadOpen();
  }
  async function serve(ids: string[]) {
    await act(async () => unwrap(await sb.rpc('set_item_status', { p_ids: ids, p_status: 'served' })));
    reloadOpen();
  }
  function resetAfterPaid() {
    setActiveId(null); setTableId(null); setLines([]); setCustomer(null); setNotes('');
    reloadOpen();
  }

  const ready = open.flatMap((o) => (o.order_items as Row[]).filter((i) => i.status === 'ready').map((i) => ({ ...i, where: o.dining_tables?.name ?? `#${o.order_no}` })));
  const readyBy = ready.reduce<Record<string, Row[]>>((m, i) => ((m[i.where] ??= []).push(i), m), {});

  const items = (cat.items as Row[]).filter((i) =>
    (catId === 'all' || i.category_id === catId) && (!vegOnly || i.is_veg) && (!q || i.name.toLowerCase().includes(q.toLowerCase())));

  if (loading) return <Loading variant="pos" />;
  const noMenu = (cat.items as Row[]).length === 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      <section className="flex min-h-0 flex-1 flex-col">
        <div className="space-y-2 border-b border-line bg-white p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Segmented variant="soft" value={ordType} onChange={(v) => { setOrdType(v); if (v !== 'dine_in') { setTableId(null); setActiveId(null); } }} options={ORDER_TYPES} />
            <Btn variant="secondary" size="sm" onClick={() => setPicker(true)}>Open orders ({open.length})</Btn>
            <div className="relative min-w-[140px] flex-1 sm:max-w-xs">
              <Icon name="search" className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-ink-mute" />
              <Input className="pl-9" placeholder="Search menu" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <button type="button" onClick={() => setVegOnly(!vegOnly)} aria-pressed={vegOnly} className={cn('inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold', vegOnly ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-line bg-white text-ink-soft')}><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Veg only</button>
          </div>
          {ordType === 'dine_in' && (
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              {(cat.tables as Row[]).length === 0 && <p className="py-1 text-sm text-ink-mute">No tables yet. Add them under Tables.</p>}
              {(cat.tables as Row[]).map((t) => {
                const busyT = open.some((o) => o.table_id === t.id);
                return (
                  <button key={t.id} onClick={() => selectTable(t.id)}
                    className={cn('shrink-0 rounded-lg border-2 px-3 py-1.5 text-sm font-bold',
                      tableId === t.id ? 'border-brand-600 bg-brand-600 text-white shadow-sm' : busyT ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50')}>
                    {t.name}
                  </button>
                );
              })}
            </div>
          )}
          {Object.keys(readyBy).length > 0 && (
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              {Object.entries(readyBy).map(([where, its]) => (
                <div key={where} className="flex shrink-0 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm">
                  <Icon name="bell" className="h-4 w-4 text-emerald-600" />
                  <span><b>{where}</b> ready: {its.map((i) => `${i.qty}× ${i.name}`).join(', ')}</span>
                  <button onClick={() => serve(its.map((i) => i.id))} className="rounded-md bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">Served</button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto border-b border-line bg-white px-3 py-2">
          {[{ id: 'all', name: 'All' }, ...(cat.cats as Row[])].map((c) => (
            <button key={c.id} onClick={() => setCatId(c.id)}
              className={cn('shrink-0 rounded-lg px-3.5 py-1.5 text-sm font-semibold', catId === c.id ? 'bg-brand-600 text-white shadow-sm' : 'bg-slate-100 text-ink-soft hover:bg-slate-200')}>
              {c.name}
            </button>
          ))}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-3 pb-24 lg:pb-3">
          {noMenu ? (
            <p className="py-12 text-center text-sm text-ink-mute">Your menu is empty. {role === 'owner' ? 'Add items under Menu, or load a sample menu there.' : 'Ask the owner to add menu items.'}</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
              {items.map((i) => {
                const inCart = lines.filter((l) => l.item.id === i.id).reduce((s, l) => s + l.qty, 0);
                return (
                  <button key={i.id} onClick={() => tap(i)}
                    className={cn('relative flex flex-col rounded-xl border bg-white p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-md', !i.is_available && 'opacity-55', inCart ? 'border-brand-500 ring-2 ring-brand-500/30' : 'border-line')}>
                    <span className="flex items-center justify-between">
                      <span className={cn('flex h-4 w-4 items-center justify-center rounded-[3px] border-[1.5px]', i.is_veg ? 'border-emerald-600' : 'border-rose-500')}>
                        <span className={cn('h-1.5 w-1.5 rounded-full', i.is_veg ? 'bg-emerald-600' : 'bg-rose-500')} />
                      </span>
                      <span className="font-display text-base font-extrabold">{inr(i.price)}</span>
                    </span>
                    <span className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-5">{i.name}</span>
                    <span className="mt-2 flex items-center gap-1.5 border-t border-line pt-2 text-xs font-medium text-ink-mute">
                      <Icon name="box" className="h-3.5 w-3.5" />per {i.unit}
                      {!i.is_available && <span className="ml-auto font-bold text-rose-600">Unavailable</span>}
                      {inCart > 0 && <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[11px] font-bold text-white">{inCart}</span>}
                    </span>
                  </button>
                );
              })}
              {items.length === 0 && <p className="col-span-full py-10 text-center text-sm text-ink-mute">No items match.</p>}
            </div>
          )}
        </div>
      </section>

      <aside className={cn('fixed inset-0 z-40 flex-col bg-white lg:static lg:z-auto lg:flex lg:w-[400px] lg:shrink-0 lg:border-l lg:border-line', cartOpen ? 'flex' : 'hidden')}>
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div>
            <p className="font-display text-lg font-extrabold">{activeOrder ? `Order #${activeOrder.order_no}` : 'New order'}</p>
            <p className="text-xs text-ink-mute">
              {typeLabel(ordType)}{ordType === 'dine_in' && tableId ? ` · Table ${(cat.tables as Row[]).find((t) => t.id === tableId)?.name ?? ''}` : ''}
              {activeOrder?.customer_name ? ` · ${activeOrder.customer_name}` : ''}
            </p>
          </div>
          <button onClick={() => setCartOpen(false)} className="rounded-lg p-2 hover:bg-field lg:hidden" aria-label="Close order"><Icon name="x" /></button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {sentItems.length > 0 && (
            <div className="mb-4">
              <p className="label-caps mb-1.5">Sent to kitchen</p>
              <ul className="divide-y divide-line rounded-lg border border-line">
                {sentItems.map((i) => (
                  <li key={i.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                    <span className="min-w-0 flex-1">
                      <span className="font-medium">{i.qty} × {i.name}</span>
                      {(i.modifiers ?? []).length > 0 && <span className="block truncate text-xs text-ink-mute">{(i.modifiers as Row[]).map((m) => m.name).join(', ')}</span>}
                    </span>
                    <Badge tone={STATUS_TONE[i.status]}>{i.status}</Badge>
                    {canBill && <button onClick={() => cancelItem(i.id)} className="text-ink-mute hover:text-rose-600" aria-label="Cancel item"><Icon name="trash" className="h-4 w-4" /></button>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {lines.length > 0 ? (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <p className="label-caps">Selected items ({count})</p>
                <button onClick={() => setLines([])} className="text-xs font-bold text-rose-600 hover:underline">Clear all</button>
              </div>
              <ul className="space-y-2">
                {lines.map((l) => (
                  <li key={l.key} className="rounded-lg border border-line p-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{l.item.name}</p>
                        {l.mods.length > 0 && <p className="text-xs text-ink-mute">{l.mods.map((m) => m.name).join(', ')}</p>}
                      </div>
                      <p className="text-sm font-semibold">{inr((Number(l.item.price) + l.mods.reduce((s, m) => s + Number(m.price), 0)) * l.qty)}</p>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex items-center rounded-lg border border-line">
                        <button onClick={() => bump(l.key, -1)} className="p-1.5 hover:bg-field" aria-label="Decrease"><Icon name="minus" className="h-4 w-4" /></button>
                        <span className="w-8 text-center text-sm font-semibold">{l.qty}</span>
                        <button onClick={() => bump(l.key, 1)} className="p-1.5 hover:bg-field" aria-label="Increase"><Icon name="plus" className="h-4 w-4" /></button>
                      </div>
                      <Input className="h-8 text-xs" placeholder="Note for kitchen" value={l.notes}
                        onChange={(e) => setLines((ls) => ls.map((x) => (x.key === l.key ? { ...x, notes: e.target.value } : x)))} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : sentItems.length === 0 && (
            <div className="py-14 text-center text-sm text-ink-mute"><Icon name="cart" className="mx-auto mb-2 h-8 w-8 text-line" />Tap menu items to start an order.</div>
          )}
        </div>

        <div className="space-y-2 border-t border-line p-4">
          {!activeOrder && <><p className="label-caps">Customer and order details</p><CustomerPicker value={customer} onChange={setCustomer} /></>}
          <Input placeholder="Order note (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
          {lines.length > 0 ? (
            <dl className="space-y-1 pb-1 text-sm">
              <div className="flex justify-between text-ink-mute"><dt>Subtotal</dt><dd>{inr(est.sub, 2)}</dd></div>
              {est.sc > 0 && <div className="flex justify-between text-ink-mute"><dt>Service charge</dt><dd>{inr(est.sc, 2)}</dd></div>}
              <div className="flex justify-between text-ink-mute"><dt>{restaurant.tax_inclusive ? 'GST (included)' : 'GST'}</dt><dd>{inr(est.tax, 2)}</dd></div>
              <div className="flex items-end justify-between border-t border-line pt-2">
                <dt className="font-bold">Estimated total</dt><dd className="font-display text-xl font-extrabold text-brand-600">{inr(est.total)}</dd>
              </div>
            </dl>
          ) : (
            <div className="flex items-end justify-between text-sm">
              <span className="font-bold">{activeOrder ? 'Bill so far' : 'Total'}</span>
              <span className="font-display text-xl font-extrabold text-brand-600">{inr(activeOrder?.total ?? 0)}</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Btn onClick={() => sendKot(false)} loading={busy} disabled={!lines.length} size="lg" className="col-span-2 btn-glow">
              <Icon name="send" className="h-4 w-4" /> Send to kitchen (generate KOT)
            </Btn>
            <Btn variant="secondary" className="col-span-2" onClick={() => sendKot(true)} disabled={!lines.length || busy}>
              <Icon name="print" className="h-4 w-4" /> Send and print KOT slip
            </Btn>
            {canBill && (
              <Btn variant="accent" size="lg" className="col-span-2" disabled={!activeOrder || lines.length > 0} onClick={() => activeOrder && setBillFor(activeOrder.id)}>
                {lines.length > 0 ? 'Send items before billing' : `Bill ${activeOrder ? inr(activeOrder.total) : ''}`}
              </Btn>
            )}
          </div>
          {activeOrder && (
            <div className="flex justify-between">
              <button onClick={() => printKot(activeOrder.id)} className="text-xs text-ink-mute underline">Reprint last KOT</button>
              {canBill && <button onClick={cancelOrder} className="text-xs text-rose-600 underline">Cancel order</button>}
            </div>
          )}
        </div>
      </aside>

      <div className="fixed inset-x-3 bottom-3 z-30 lg:hidden">
        <button onClick={() => setCartOpen(true)} className="btn btn-primary btn-lg w-full justify-between shadow-lift">
          <span><Icon name="cart" className="mr-2 inline h-5 w-5" />View order{count > 0 ? ` (${count} new)` : ''}</span>
          <span>{inr(lines.length > 0 ? est.total : activeOrder?.total ?? 0)}</span>
        </button>
      </div>

      <ModifierDialog item={modItem} groups={modItem ? groupsFor(modItem.id) : []} onClose={() => setModItem(null)}
        onAdd={(mods, note) => { if (modItem) addLine(modItem, mods, note); setModItem(null); }} />

      <Modal open={picker} onClose={() => setPicker(false)} title="Open orders">
        {open.length === 0 ? <p className="py-6 text-center text-sm text-ink-mute">No open orders.</p> : (
          <ul className="divide-y divide-line">
            {open.map((o) => (
              <li key={o.id}>
                <button className="flex w-full items-center justify-between py-3 text-left hover:bg-field"
                  onClick={() => { setActiveId(o.id); setOrdType(o.order_type); setTableId(o.table_id); setPicker(false); }}>
                  <span><b>#{o.order_no}</b> · {o.dining_tables?.name ? `Table ${o.dining_tables.name}` : typeLabel(o.order_type)}{o.customer_name ? ` · ${o.customer_name}` : ''}</span>
                  <span className="font-semibold">{inr(o.total)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      {billFor && <BillDialog orderId={billFor} onClose={() => { setBillFor(null); reloadOpen(); }} onPaid={resetAfterPaid} />}
    </div>
  );
}

function ModifierDialog({ item, groups, onClose, onAdd }: { item: Row | null; groups: Row[]; onClose: () => void; onAdd: (mods: Row[], note: string) => void }) {
  const [sel, setSel] = useState<Record<string, string[]>>({});
  const [note, setNote] = useState('');
  useEffect(() => { setSel({}); setNote(''); }, [item?.id]);
  if (!item) return null;

  const toggle = (g: Row, id: string) => setSel((s) => {
    const cur = s[g.id] ?? [];
    if (cur.includes(id)) return { ...s, [g.id]: cur.filter((x) => x !== id) };
    if (g.max_select <= 1) return { ...s, [g.id]: [id] };
    return cur.length >= g.max_select ? s : { ...s, [g.id]: [...cur, id] };
  });
  const missing = groups.find((g) => (sel[g.id]?.length ?? 0) < g.min_select);
  const all = groups.flatMap((g) => (g.modifier_options as Row[]).filter((o) => (sel[g.id] ?? []).includes(o.id)));

  return (
    <Modal open onClose={onClose} title={item.name}
      footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn disabled={!!missing} onClick={() => onAdd(all, note)}>Add to order</Btn></>}>
      <div className="space-y-4">
        {groups.map((g) => (
          <div key={g.id}>
            <p className="mb-1.5 text-sm font-semibold">{g.name} <span className="font-normal text-ink-mute">{g.min_select > 0 ? '(required)' : g.max_select > 1 ? `(up to ${g.max_select})` : '(optional)'}</span></p>
            <div className="flex flex-wrap gap-2">
              {(g.modifier_options as Row[]).sort((a, b) => a.sort - b.sort).map((o) => {
                const on = (sel[g.id] ?? []).includes(o.id);
                return (
                  <button key={o.id} onClick={() => toggle(g, o.id)}
                    className={cn('rounded-lg border px-3 py-1.5 text-sm font-medium', on ? 'border-brand-600 bg-brand-600 text-white' : 'border-line hover:bg-field')}>
                    {o.name}{Number(o.price) > 0 ? ` +${inr(o.price)}` : ''}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <Input placeholder="Note for kitchen (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
    </Modal>
  );
}

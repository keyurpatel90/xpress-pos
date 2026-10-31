'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { unwrap, useAction, useData, useSupabase } from '@/lib/hooks';
import { useApp } from '@/components/app/AppProvider';
import { Btn, Loading, Segmented, Toggle } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { LogoMark } from '@/components/Logo';
import { cn, minutesSince, typeLabel } from '@/lib/utils';
import type { Row } from '@/lib/types';

const NEXT: Record<string, string> = { new: 'preparing', preparing: 'ready', ready: 'served' };
// Full class strings so Tailwind can see them
const COLS = [
  { id: 'new', title: 'New items', icon: 'clock', action: 'Start cooking', box: 'bg-orange-500 shadow-[0_6px_14px_-4px_rgba(249,115,22,.55)]', badge: 'border-orange-400 text-orange-600', edge: 'border-l-orange-500', empty: 'No pending items' },
  { id: 'preparing', title: 'Cooking station', icon: 'chef', action: 'Mark ready', box: 'bg-blue-500 shadow-[0_6px_14px_-4px_rgba(59,130,246,.55)]', badge: 'border-blue-400 text-blue-600', edge: 'border-l-blue-500', empty: 'Station idle' },
  { id: 'ready', title: 'Ready / pickup', icon: 'checkc', action: 'Handed over', box: 'bg-emerald-500 shadow-[0_6px_14px_-4px_rgba(16,185,129,.55)]', badge: 'border-emerald-400 text-emerald-600', edge: 'border-l-emerald-500', empty: 'No items ready' },
];

function beep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = 880; g.gain.value = 0.15;
    o.start(); o.stop(ctx.currentTime + 0.25);
  } catch { /* audio not available */ }
}

export default function KdsPage() {
  const { access, role, restaurant } = useApp();
  const sb = useSupabase();
  const act = useAction();
  const [station, setStation] = useState('all');
  const [view, setView] = useState<'tickets' | 'items'>('tickets');
  const [sound, setSound] = useState(true);
  const [, tick] = useState(0);
  const prevNew = useRef(-1);

  const { data: items, loading, reload } = useData<Row[]>(async (c) =>
    unwrap(await c.from('order_items')
      .select('*, orders!inner(id, order_no, order_type, status, notes, customer_name, dining_tables(name))')
      .in('status', ['new', 'preparing', 'ready']).neq('orders.status', 'cancelled').order('created_at')) ?? [], []);

  useEffect(() => {
    const ch = sb.channel('kds-' + access.restaurant_id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items', filter: `restaurant_id=eq.${access.restaurant_id}` }, () => reload())
      .subscribe();
    const t1 = setInterval(reload, 10000);
    const t2 = setInterval(() => tick((n) => n + 1), 30000);
    return () => { sb.removeChannel(ch); clearInterval(t1); clearInterval(t2); };
  }, [sb, access.restaurant_id, reload]);

  const newCount = items.filter((i) => i.status === 'new').length;
  useEffect(() => {
    if (prevNew.current >= 0 && newCount > prevNew.current && sound) beep();
    prevNew.current = newCount;
  }, [newCount, sound]);

  const stations = useMemo(() => Array.from(new Set(items.map((i) => i.station))).sort(), [items]);
  const shown = useMemo(() => items.filter((i) => station === 'all' || i.station === station), [items, station]);

  const tickets = useMemo(() => {
    const map = new Map<string, Row>();
    shown.forEach((i) => {
      const k = `${i.order_id}-${i.kot_no}`;
      const t = map.get(k) ?? { key: k, order: i.orders, kot: i.kot_no, created_at: i.created_at, items: [] as Row[] };
      t.items.push(i);
      map.set(k, t);
    });
    return Array.from(map.values()).map((t): Row => {
      const st = t.items.some((i: Row) => i.status === 'new') ? 'new' : t.items.some((i: Row) => i.status === 'preparing') ? 'preparing' : 'ready';
      return { ...t, status: st };
    });
  }, [shown]);

  // Preparation summary: total quantity of each dish still to cook
  const summary = useMemo(() => {
    const m = new Map<string, { name: string; qty: number; fresh: number }>();
    shown.filter((i) => i.status !== 'ready').forEach((i) => {
      const e = m.get(i.name) ?? { name: i.name, qty: 0, fresh: 0 };
      e.qty += i.qty;
      if (i.status === 'new') e.fresh += i.qty;
      m.set(i.name, e);
    });
    return Array.from(m.values()).sort((a, b) => b.qty - a.qty);
  }, [shown]);
  const activeQty = summary.reduce((s, e) => s + e.qty, 0);

  async function move(ids: string[], status: string) {
    if (!ids.length) return;
    await act(async () => unwrap(await sb.rpc('set_item_status', { p_ids: ids, p_status: status })));
    reload();
  }

  if (loading) return <Loading variant="table" />;
  const canFull = typeof document !== 'undefined' && !!document.documentElement.requestFullscreen;
  const autoPrint = !!restaurant.auto_print_kot;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-field lg:flex-row">
      <aside className="hidden w-[320px] shrink-0 flex-col gap-4 border-r border-line p-5 lg:flex">
        <div className="flex items-center gap-3">
          <LogoMark className="h-9 w-9" />
          <div>
            <p className="font-display text-lg font-extrabold leading-tight">Kitchen board</p>
            <p className="label-caps">Preparation summary</p>
          </div>
        </div>
        <section className="card flex min-h-0 flex-1 flex-col overflow-hidden">
          <header className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="label-caps">Active items</span>
            <span className="rounded-md border border-line px-2 py-0.5 text-xs font-bold">{activeQty}</span>
          </header>
          {summary.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-ink-mute"><Icon name="refresh" className="h-5 w-5" /></span>
              <p className="label-caps leading-5">Everything is<br />prepped!</p>
            </div>
          ) : (
            <ul className="flex-1 divide-y divide-line overflow-y-auto">
              {summary.map((e) => (
                <li key={e.name} className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm">
                  <span className="min-w-0 truncate font-semibold">{e.name}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    {e.fresh > 0 && <span className="rounded bg-orange-50 px-1.5 py-0.5 text-[11px] font-bold text-orange-600">{e.fresh} new</span>}
                    <b className="font-display text-base">{e.qty}</b>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </aside>

      <section className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-3 px-4 pb-1 pt-4 sm:px-5">
          <Segmented value={view} onChange={setView} variant="brand" options={[
            { id: 'items', label: `Item cards (${shown.length})`, icon: 'grid' },
            { id: 'tickets', label: `Order tickets (${tickets.length})`, icon: 'layers' },
          ]} />
          <span className="label-caps hidden sm:inline">● {activeQty} active items</span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <span className={cn('inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold',
              autoPrint ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-line bg-white text-ink-mute')}>
              <Icon name="print" className="h-4 w-4" /> Auto-print: {autoPrint ? 'ON' : 'OFF'}
            </span>
            <Btn variant="secondary" onClick={reload}><Icon name="refresh" className="h-4 w-4" /> Real-time sync</Btn>
            {canFull && <Btn variant="secondary" className="hidden sm:inline-flex" onClick={() => document.documentElement.requestFullscreen()} aria-label="Full screen"><Icon name="expand" className="h-4 w-4" /></Btn>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 px-4 pb-2 pt-2 sm:px-5">
          {['all', ...stations].map((s) => (
            <button key={s} onClick={() => setStation(s)}
              className={cn('rounded-lg px-3 py-1.5 text-sm font-semibold', station === s ? 'bg-brand-600 text-white' : 'bg-slate-100 text-ink-soft hover:bg-slate-200')}>
              {s === 'all' ? 'All stations' : s}
            </button>
          ))}
          <span className="ml-auto"><Toggle checked={sound} onChange={setSound} label="Sound alert" /></span>
        </div>

        <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto px-4 pb-6 pt-2 sm:px-5 md:grid-cols-3">
          {COLS.map((col) => {
            const list = tickets.filter((t) => t.status === col.id);
            const cards = shown.filter((i) => i.status === col.id);
            const n = view === 'tickets' ? list.length : cards.length;
            return (
              <section key={col.id} className="min-w-0">
                <header className="mb-3 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2.5">
                    <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg text-white', col.box)}><Icon name={col.icon} className="h-4 w-4" /></span>
                    <h2 className="font-display text-sm font-extrabold uppercase tracking-wide">{col.title}</h2>
                  </span>
                  <span className={cn('rounded-full border-2 bg-white px-2.5 py-0.5 text-xs font-bold', col.badge)}>{n}</span>
                </header>
                <div className="space-y-3">
                  {n === 0 && <p className="label-caps py-10 text-center">{col.empty}</p>}

                  {view === 'tickets' && list.map((t) => {
                    const age = minutesSince(t.created_at);
                    return (
                      <article key={t.key} className={cn('card border-l-4 p-3.5', col.edge)}>
                        <header className="mb-2 flex items-start justify-between gap-2">
                          <div>
                            <p className="font-display text-lg font-extrabold">#{t.order.order_no}<span className="ml-2 text-sm font-semibold text-ink-mute">KOT {t.kot}</span></p>
                            <p className="text-sm font-medium text-ink-soft">{t.order.dining_tables?.name ? `Table ${t.order.dining_tables.name}` : typeLabel(t.order.order_type)}{t.order.customer_name ? ` · ${t.order.customer_name}` : ''}</p>
                          </div>
                          <AgeChip age={age} />
                        </header>
                        <ul className="space-y-1">
                          {t.items.map((i: Row) => (
                            <li key={i.id}>
                              <button onClick={() => move([i.id], NEXT[i.status])} title="Tap to move this dish to the next stage"
                                className="flex w-full items-start gap-2 rounded-lg px-1.5 py-1 text-left hover:bg-slate-50">
                                <span className="font-display text-lg font-extrabold leading-6">{i.qty}×</span>
                                <span className="min-w-0 flex-1">
                                  <span className="font-semibold">{i.name}</span>
                                  <span className="block text-xs font-medium text-ink-mute">{i.station}{i.status !== col.id ? ` · ${i.status}` : ''}</span>
                                  {(i.modifiers ?? []).length > 0 && <span className="block text-sm text-brand-700">{(i.modifiers as Row[]).map((m) => m.name).join(', ')}</span>}
                                  {i.notes && <span className="block text-sm font-semibold text-rose-600">Note: {i.notes}</span>}
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                        {t.order.notes && <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-sm">Order note: {t.order.notes}</p>}
                        <Btn className="mt-3 w-full" size="lg" variant={col.id === 'ready' ? 'secondary' : 'primary'}
                          onClick={() => move(t.items.filter((i: Row) => i.status !== NEXT[col.id]).map((i: Row) => i.id), NEXT[col.id])}>
                          {col.action}
                        </Btn>
                      </article>
                    );
                  })}

                  {view === 'items' && cards.map((i) => {
                    const o = i.orders as Row;
                    return (
                      <article key={i.id} className={cn('card border-l-4 p-3.5', col.edge)}>
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-bold text-ink-soft">#{o.order_no} · {o.dining_tables?.name ? `Table ${o.dining_tables.name}` : typeLabel(o.order_type)}</p>
                          <AgeChip age={minutesSince(i.created_at)} />
                        </div>
                        <p className="mt-1 font-display text-lg font-extrabold leading-6">{i.qty}× {i.name}</p>
                        {(i.modifiers ?? []).length > 0 && <p className="text-sm text-brand-700">{(i.modifiers as Row[]).map((m) => m.name).join(', ')}</p>}
                        {i.notes && <p className="text-sm font-semibold text-rose-600">Note: {i.notes}</p>}
                        <p className="mt-1 text-xs font-medium text-ink-mute">{i.station} · KOT {i.kot_no}</p>
                        <Btn className="mt-3 w-full" variant={col.id === 'ready' ? 'secondary' : 'primary'} onClick={() => move([i.id], NEXT[col.id])}>{col.action}</Btn>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
        {(role === 'chef' || role === 'kds') && <p className="sr-only">Signed in as kitchen staff</p>}
      </section>
    </div>
  );
}

function AgeChip({ age }: { age: number }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold', age >= 20 ? 'bg-rose-500 text-white' : age >= 10 ? 'bg-amber-400 text-ink' : 'bg-slate-100 text-ink-soft')}>
      <Icon name="clock" className="h-3 w-3" />{age}m
    </span>
  );
}

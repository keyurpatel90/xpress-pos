'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { unwrap, useAction, useData, useSupabase } from '@/lib/hooks';
import { useApp } from '@/components/app/AppProvider';
import { Btn, Loading, Toggle } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { cn, minutesSince, typeLabel } from '@/lib/utils';
import type { Row } from '@/lib/types';

const NEXT: Record<string, string> = { new: 'preparing', preparing: 'ready', ready: 'served' };
const COLS = [
  { id: 'new', title: 'New', action: 'Start cooking', tone: 'border-chili-500' },
  { id: 'preparing', title: 'Preparing', action: 'Mark ready', tone: 'border-turmeric-400' },
  { id: 'ready', title: 'Ready', action: 'Handed over', tone: 'border-pine-500' },
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
  const { access, role } = useApp();
  const sb = useSupabase();
  const act = useAction();
  const [station, setStation] = useState('all');
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
  const tickets = useMemo(() => {
    const map = new Map<string, Row>();
    items.filter((i) => station === 'all' || i.station === station).forEach((i) => {
      const k = `${i.order_id}-${i.kot_no}`;
      const t = map.get(k) ?? { key: k, order: i.orders, kot: i.kot_no, created_at: i.created_at, items: [] as Row[] };
      t.items.push(i);
      map.set(k, t);
    });
    return Array.from(map.values()).map((t): Row => {
      const st = t.items.some((i: Row) => i.status === 'new') ? 'new' : t.items.some((i: Row) => i.status === 'preparing') ? 'preparing' : 'ready';
      return { ...t, status: st };
    });
  }, [items, station]);

  async function move(ids: string[], status: string) {
    await act(async () => unwrap(await sb.rpc('set_item_status', { p_ids: ids, p_status: status })));
    reload();
  }

  if (loading) return <Loading />;
  const canFull = typeof document !== 'undefined' && !!document.documentElement.requestFullscreen;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-ink text-white">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <h1 className="mr-2 font-display text-lg font-semibold">Kitchen{role === 'chef' || role === 'kds' ? '' : ' board'}</h1>
        {['all', ...stations].map((s) => (
          <button key={s} onClick={() => setStation(s)} className={cn('rounded-full px-3 py-1 text-sm font-medium', station === s ? 'bg-turmeric-400 text-ink' : 'bg-white/10 hover:bg-white/20')}>
            {s === 'all' ? 'All stations' : s}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-3 text-white">
          <Toggle checked={sound} onChange={setSound} label="Sound" />
          {canFull && <Btn variant="secondary" size="sm" onClick={() => document.documentElement.requestFullscreen()}><Icon name="expand" className="h-4 w-4" /> Full screen</Btn>}
        </div>
      </div>
      <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto p-3 md:grid-cols-3">
        {COLS.map((col) => {
          const list = tickets.filter((t) => t.status === col.id);
          return (
            <section key={col.id} className="flex min-h-[200px] flex-col rounded-xl bg-white/5 p-2">
              <h2 className="px-2 py-1 font-display font-semibold">{col.title} <span className="text-white/50">({list.length})</span></h2>
              <div className="space-y-3 overflow-y-auto p-1">
                {list.length === 0 && <p className="py-8 text-center text-sm text-white/40">Nothing here</p>}
                {list.map((t) => {
                  const age = minutesSince(t.created_at);
                  return (
                    <article key={t.key} className={cn('rounded-lg border-l-4 bg-white p-3 text-ink', col.tone)}>
                      <header className="mb-2 flex items-start justify-between gap-2">
                        <div>
                          <p className="font-display text-lg font-bold">#{t.order.order_no}<span className="ml-2 text-sm font-medium text-ink-mute">KOT {t.kot}</span></p>
                          <p className="text-sm text-ink-soft">{t.order.dining_tables?.name ? `Table ${t.order.dining_tables.name}` : typeLabel(t.order.order_type)}{t.order.customer_name ? ` · ${t.order.customer_name}` : ''}</p>
                        </div>
                        <span className={cn('rounded-md px-2 py-0.5 text-sm font-bold', age >= 20 ? 'bg-chili-500 text-white' : age >= 10 ? 'bg-turmeric-400' : 'bg-field')}>{age}m</span>
                      </header>
                      <ul className="space-y-1.5">
                        {t.items.map((i: Row) => (
                          <li key={i.id}>
                            <button onClick={() => move([i.id], NEXT[i.status])}
                              className="flex w-full items-start gap-2 rounded-md px-1 py-0.5 text-left hover:bg-field" title="Tap to move this dish to the next stage">
                              <span className="font-display text-lg font-bold leading-6">{i.qty}×</span>
                              <span className="min-w-0 flex-1">
                                <span className="font-semibold">{i.name}</span>
                                {(i.modifiers ?? []).length > 0 && <span className="block text-sm text-pine-700">{(i.modifiers as Row[]).map((m) => m.name).join(', ')}</span>}
                                {i.notes && <span className="block text-sm font-medium text-chili-600">Note: {i.notes}</span>}
                              </span>
                              <span className="shrink-0 text-xs text-ink-mute">{i.station}{i.status !== col.id ? ` · ${i.status}` : ''}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                      {t.order.notes && <p className="mt-2 rounded bg-turmeric-50 px-2 py-1 text-sm">Order note: {t.order.notes}</p>}
                      <Btn className="mt-3 w-full" size="lg" variant={col.id === 'ready' ? 'secondary' : 'primary'}
                        onClick={() => move(t.items.filter((i: Row) => i.status !== (col.id === 'new' ? 'preparing' : col.id === 'preparing' ? 'ready' : 'served')).map((i: Row) => i.id), NEXT[col.id])}>
                        {col.action}
                      </Btn>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

'use client';
import { useMemo, useState } from 'react';
import { unwrap, useAction, useData, useSupabase } from '@/lib/hooks';
import { useApp } from '@/components/app/AppProvider';
import { Btn, Card, Empty, Input, Loading, PageHeader, Select } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { cn, inr } from '@/lib/utils';
import type { Row } from '@/lib/types';

export default function RecipesPage() {
  const { access } = useApp();
  const sb = useSupabase();
  const act = useAction();
  const { data, loading, reload } = useData<Row>(async (c) => {
    const [m, i, r] = await Promise.all([
      c.from('menu_items').select('id, name, price').order('name'),
      c.from('inventory_items').select('*').order('name'),
      c.from('recipes').select('*'),
    ]);
    return { menu: unwrap(m) ?? [], inv: unwrap(i) ?? [], recipes: unwrap(r) ?? [] };
  }, { menu: [], inv: [], recipes: [] });
  const [sel, setSel] = useState<string | null>(null);
  const [rows, setRows] = useState<{ inventory_item_id: string; quantity: string }[]>([]);
  const [q, setQ] = useState('');

  const inv = data.inv as Row[];
  const costOf = (rs: Row[]) =>
    rs.reduce((s, r) => s + (Number(r.quantity) || 0) * Number(inv.find((i) => i.id === r.inventory_item_id)?.cost_per_unit ?? 0), 0);
  const costs = useMemo(() => {
    const m: Record<string, number> = {};
    (data.menu as Row[]).forEach((x) => { m[x.id] = costOf((data.recipes as Row[]).filter((r) => r.menu_item_id === x.id)); });
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  function pick(id: string) {
    setSel(id);
    setRows((data.recipes as Row[]).filter((r) => r.menu_item_id === id).map((r) => ({ inventory_item_id: r.inventory_item_id, quantity: String(Number(r.quantity)) })));
  }
  async function save() {
    if (!sel) return;
    const clean = rows.filter((r) => r.inventory_item_id && Number(r.quantity) > 0);
    const ok = await act(async () => {
      unwrap(await sb.from('recipes').delete().eq('menu_item_id', sel));
      if (clean.length) unwrap(await sb.from('recipes').insert(clean.map((r) => ({ restaurant_id: access.restaurant_id, menu_item_id: sel, inventory_item_id: r.inventory_item_id, quantity: Number(r.quantity) }))));
      return true;
    }, 'Recipe saved');
    if (ok) reload();
  }

  if (loading) return <Loading />;
  const item = (data.menu as Row[]).find((m) => m.id === sel);
  const cost = costOf(rows);
  const margin = item ? Number(item.price) - cost : 0;
  const list = (data.menu as Row[]).filter((m) => !q || m.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <PageHeader title="Recipes and costing" subtitle="Link ingredients to dishes. Stock is deducted automatically when a dish is sent to the kitchen." />
      {inv.length === 0 ? <Empty icon="book" title="Add inventory items first" text="Recipes use the ingredients in your inventory." /> : (
        <div className="grid gap-4 md:grid-cols-[320px_1fr]">
          <div>
            <Input className="mb-2" placeholder="Search dishes" value={q} onChange={(e) => setQ(e.target.value)} />
            <div className="card max-h-[70vh] divide-y divide-line overflow-y-auto">
              {list.map((m) => {
                const c = costs[m.id] ?? 0;
                return (
                  <button key={m.id} onClick={() => pick(m.id)} className={cn('flex w-full items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-field', sel === m.id && 'bg-pine-50')}>
                    <span className="font-medium">{m.name}</span>
                    <span className="text-xs text-ink-mute">{c > 0 ? `cost ${inr(c, 2)} · ${Math.round(((Number(m.price) - c) / Number(m.price)) * 100)}%` : 'no recipe'}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {item ? (
            <Card className="p-4">
              <p className="font-display text-xl font-semibold">{item.name}</p>
              <p className="text-sm text-ink-mute">Quantity of each ingredient used for one serving</p>
              <div className="mt-3 space-y-2">
                {rows.map((r, idx) => {
                  const u = inv.find((i) => i.id === r.inventory_item_id)?.unit;
                  return (
                    <div key={idx} className="flex gap-2">
                      <Select value={r.inventory_item_id} onChange={(e) => setRows(rows.map((x, i) => (i === idx ? { ...x, inventory_item_id: e.target.value } : x)))}>
                        <option value="">Choose ingredient</option>{inv.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                      </Select>
                      <div className="relative w-36 shrink-0">
                        <Input type="number" min="0" step="0.001" value={r.quantity} onChange={(e) => setRows(rows.map((x, i) => (i === idx ? { ...x, quantity: e.target.value } : x)))} />
                        {u && <span className="pointer-events-none absolute right-3 top-2.5 text-xs text-ink-mute">{u}</span>}
                      </div>
                      <Btn variant="ghost" onClick={() => setRows(rows.filter((_, i) => i !== idx))} aria-label="Remove ingredient"><Icon name="x" className="h-4 w-4" /></Btn>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <Btn variant="secondary" size="sm" onClick={() => setRows([...rows, { inventory_item_id: '', quantity: '' }])}><Icon name="plus" className="h-4 w-4" /> Ingredient</Btn>
                <Btn onClick={save}>Save recipe</Btn>
              </div>
              <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-line pt-4 text-sm">
                <div><dt className="text-ink-mute">Food cost</dt><dd className="font-display text-xl font-bold">{inr(cost, 2)}</dd></div>
                <div><dt className="text-ink-mute">Selling price</dt><dd className="font-display text-xl font-bold">{inr(item.price, 2)}</dd></div>
                <div><dt className="text-ink-mute">Margin</dt><dd className={cn('font-display text-xl font-bold', margin < 0 && 'text-chili-600')}>{inr(margin, 2)} <span className="text-sm font-medium text-ink-mute">({Number(item.price) > 0 ? Math.round((margin / Number(item.price)) * 100) : 0}%)</span></dd></div>
              </dl>
            </Card>
          ) : <Empty icon="book" title="Pick a dish" text="Choose a dish on the left to build or edit its recipe." />}
        </div>
      )}
    </>
  );
}

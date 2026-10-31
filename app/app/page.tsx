'use client';
import Link from 'next/link';
import { useEffect } from 'react';
import { useData, unwrap } from '@/lib/hooks';
import { useApp } from '@/components/app/AppProvider';
import { BarChart } from '@/components/BarChart';
import { Icon } from '@/components/Icon';
import { Card, Loading, PageHeader, Stat } from '@/components/ui';
import { inr } from '@/lib/utils';
import type { Row } from '@/lib/types';

export default function Dashboard() {
  const { restaurant, has, role } = useApp();
  const { data: d, loading, reload } = useData<Row>(async (sb) => unwrap(await sb.rpc('dashboard_summary')) ?? {}, {});

  useEffect(() => {
    const t = setInterval(reload, 30000);
    return () => clearInterval(t);
  }, [reload]);

  if (role !== 'owner') return null;
  if (loading) return <Loading variant="dashboard" />;

  const steps = [
    { done: d.tables_total > 0, label: 'Add your tables', href: '/app/tables' },
    { done: d.categories > 0 && d.menu_items > 0, label: 'Build your menu', href: '/app/menu' },
    { done: d.staff > 0, label: 'Invite your team', href: '/app/staff' },
    { done: d.today_orders > 0, label: 'Take your first order', href: '/app/pos' },
  ];
  const week: { label: string; value: number }[] = (d.week ?? []).map((w: Row) => ({
    label: new Date(w.day + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' }),
    value: Number(w.sales),
  }));

  return (
    <>
      <PageHeader title="Dashboard" subtitle={restaurant.name} />
      {steps.some((s) => !s.done) && (
        <Card className="mb-5 p-4">
          <p className="font-display font-semibold">Get set up</p>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <li key={s.label}>
                <Link href={s.href} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm hover:bg-field">
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full ${s.done ? 'bg-emerald-500 text-white' : 'border border-line'}`}>
                    {s.done && <Icon name="check" className="h-3 w-3" />}
                  </span>
                  <span className={s.done ? 'text-ink-mute line-through' : 'font-medium'}>{s.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Today’s sales" value={inr(d.today_sales)} />
        <Stat label="Bills today" value={d.today_orders ?? 0} sub={`Average ${inr(d.avg_bill)}`} />
        <Stat label="Open orders" value={d.open_orders ?? 0} sub={`${d.tables_busy ?? 0} of ${d.tables_total ?? 0} tables busy`} />
        {has('inventory')
          ? <Stat label="Low stock items" value={d.low_stock ?? 0} tone={d.low_stock > 0 ? 'warn' : undefined} sub="At or below reorder level" />
          : <Stat label="Menu items" value={d.menu_items ?? 0} sub={`${d.categories ?? 0} categories`} />}
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <p className="mb-3 font-display font-semibold">Sales, last 7 days</p>
          <BarChart data={week} format={(n) => inr(n)} />
        </Card>
        <Card className="p-4">
          <p className="mb-3 font-display font-semibold">Best sellers this week</p>
          {(d.top_items ?? []).length === 0 ? <p className="text-sm text-ink-mute">Sales will show up here after your first paid bill.</p> : (
            <ul className="divide-y divide-line text-sm">
              {(d.top_items as Row[]).map((t) => (
                <li key={t.name} className="flex justify-between py-2"><span>{t.name}</span><span className="font-semibold">{t.qty}</span></li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

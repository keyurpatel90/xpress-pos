import { Icon } from '@/components/Icon';

// Illustrative product preview built from real UI patterns (not a screenshot).
const TABLES = [
  { n: 'T1', note: 'Window view · 2 seats', state: 'free' },
  { n: 'T2', note: 'Booth corner · 4 seats', state: 'busy', order: 'Order #14', total: '₹1,034' },
  { n: 'T4', note: 'Centre · 4 seats', state: 'busy', order: 'Order #15', total: '₹746' },
  { n: 'T5', note: 'Garden patio · 4 seats', state: 'free' },
] as const;

export function HeroPreview() {
  return (
    <div className="rounded-3xl border border-line bg-white p-4 shadow-lift md:p-5" aria-hidden="true">
      <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
        <div className="flex items-center gap-3">
          <span className="flex gap-1.5"><i className="h-3 w-3 rounded-full bg-rose-400" /><i className="h-3 w-3 rounded-full bg-amber-400" /><i className="h-3 w-3 rounded-full bg-emerald-400" /></span>
          <span className="font-slip text-xs text-ink-mute">/pos/counter</span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live sync active
        </span>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
        <div className="rounded-2xl border border-line bg-slate-50 p-4">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-2 text-left">
            <div>
              <p className="label-caps">Live table floor</p>
              <p className="text-xs text-ink-mute">Real-time occupancy and running bill totals</p>
            </div>
            <div className="flex gap-1.5 text-xs font-bold">
              <span className="rounded-md bg-emerald-100 px-2 py-1 text-emerald-700">Vacant (2)</span>
              <span className="rounded-md bg-rose-100 px-2 py-1 text-rose-600">Occupied (2)</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-left sm:grid-cols-4">
            {TABLES.map((t) => (
              <div key={t.n} className={`rounded-xl border-2 bg-white p-3 ${t.state === 'free' ? 'border-emerald-300' : 'border-rose-300'}`}>
                <div className="flex items-center justify-between">
                  <b className="font-display text-base font-extrabold">{t.n}</b>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${t.state === 'free' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>{t.state === 'free' ? 'Vacant' : 'Occupied'}</span>
                </div>
                <p className="mt-1 text-[11px] text-ink-mute">{t.note}</p>
                {t.state === 'busy'
                  ? <p className="mt-2 flex items-center justify-between text-xs"><span className="font-semibold text-ink-soft">{t.order}</span><b className="text-brand-600">{t.total}</b></p>
                  : <p className="mt-2 text-xs text-ink-mute">Ready for guests</p>}
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-3 text-left">
          <div className="rounded-2xl bg-slate-900 p-4 text-white">
            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-bold text-amber-300"><Icon name="chef" className="h-4 w-4" /> Live kitchen</span>
              <span className="text-[11px] text-slate-400">Station: Tandoor</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg bg-slate-800 px-3 py-2">
                <div><p className="text-sm font-semibold">2× Paneer Tikka</p><p className="font-slip text-[11px] text-amber-300">T2 · 8m elapsed</p></div>
                <span className="rounded bg-amber-400/20 px-2 py-0.5 text-[11px] font-bold text-amber-300">Cooking</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-800 px-3 py-2">
                <div><p className="text-sm font-semibold">4× Butter Naan</p><p className="font-slip text-[11px] text-emerald-300">T4 · 3m elapsed</p></div>
                <span className="rounded bg-emerald-400/20 px-2 py-0.5 text-[11px] font-bold text-emerald-300">Ready</span>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4">
            <p className="label-caps !text-brand-700">Bill ready</p>
            <p className="mt-1 flex items-end justify-between"><span className="text-sm font-semibold">INV-00042 · Table T4</span><b className="font-display text-lg font-extrabold text-brand-700">₹746</b></p>
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-white px-2 py-1 text-xs font-bold text-emerald-700"><Icon name="chat" className="h-3.5 w-3.5" /> Sent on WhatsApp</p>
          </div>
        </div>
      </div>
    </div>
  );
}

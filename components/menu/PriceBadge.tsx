export function PriceBadge({ reason }: { reason: string }) {
  const label = reason.startsWith('schedule:') ? reason.slice('schedule:'.length) : reason === 'combo' ? 'Combo' : reason === 'variant' ? 'Variant' : 'Base price';
  const tone = reason === 'combo' ? 'bg-amber-100 text-amber-800' : reason.startsWith('schedule:') ? 'bg-blue-100 text-blue-800' : reason === 'variant' ? 'bg-violet-100 text-violet-800' : 'bg-slate-100 text-slate-700';
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone}`}>{label}</span>;
}

export function BarChart({ data, format = (n: number) => String(n), color = 'bg-pine-500' }:
  { data: { label: string; value: number }[]; format?: (n: number) => string; color?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex gap-2" role="img" aria-label="Bar chart">
      {data.map((d) => (
        <div key={d.label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
          <span className="h-4 text-[11px] text-ink-mute">{d.value ? format(d.value) : ''}</span>
          <div className="flex h-32 w-full items-end">
            <div className={`w-full rounded-t-md ${color}`} style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value ? 4 : 2 }} title={`${d.label}: ${format(d.value)}`} />
          </div>
          <span className="w-full truncate text-center text-xs text-ink-mute">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

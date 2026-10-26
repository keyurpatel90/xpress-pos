import { Icon } from '@/components/Icon';

export function FaqList({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-line rounded-2xl border border-line bg-white">
      {items.map((f) => (
        <details key={f.q} className="group px-5 py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-semibold [&::-webkit-details-marker]:hidden">
            {f.q}
            <Icon name="chev" className="h-5 w-5 shrink-0 text-ink-mute transition-transform group-open:rotate-180" />
          </summary>
          <p className="mt-2 max-w-3xl text-ink-soft">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

'use client';

import { useState } from 'react';
import type { VariantGroup } from '@/lib/menu';

export function VariantPicker({ groups, onChange }: { groups: VariantGroup[]; onChange: (selection: Record<string, string[]>) => void }) {
  const [selection, setSelection] = useState<Record<string, string[]>>({});
  function choose(group: VariantGroup, variantId: string) {
    const current = selection[group.id] ?? [];
    const next = group.maxSelect === 1 ? [variantId] : current.includes(variantId) ? current.filter((id) => id !== variantId) : current.length < group.maxSelect ? [...current, variantId] : current;
    const value = { ...selection, [group.id]: next }; setSelection(value); onChange(value);
  }
  return <div className="space-y-4" aria-label="Choose variants">{groups.map((group) => <fieldset key={group.id}><legend className="mb-2 text-sm font-semibold">{group.name} <span className="font-normal text-ink-mute">{group.required ? `(choose ${group.minSelect || 1})` : `(up to ${group.maxSelect})`}</span></legend><div className="grid gap-2 sm:grid-cols-2">{group.variants.filter((variant) => variant.isAvailable).map((variant) => { const checked = (selection[group.id] ?? []).includes(variant.id); return <label key={variant.id} className={`flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2.5 text-sm ${checked ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-600/20' : 'border-line bg-white'}`}><span className="flex items-center gap-2"><input type={group.maxSelect === 1 ? 'radio' : 'checkbox'} name={group.id} checked={checked} onChange={() => choose(group, variant.id)} className="accent-brand-600" />{variant.name}</span><span className="font-semibold">{variant.priceLabel ?? 'Price unavailable'}</span></label>; })}</div></fieldset>)}</div>;
}

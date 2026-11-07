'use client';

import { useState } from 'react';
import type { ComboLine } from '@/lib/menu';

export type ComboChoiceGroup = { name: string; minChoices: number; maxChoices: number; items: ComboLine[] };
export function ComboPicker({ name, description, priceLabel, lines, groups, onChange }: { name: string; description?: string | null; priceLabel: string; lines: ComboLine[]; groups: ComboChoiceGroup[]; onChange: (selection: string[]) => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  function toggle(id: string, group: ComboChoiceGroup) {
    const groupIds = group.items.map((item) => item.menuItemId);
    const current = selected.filter((value) => groupIds.includes(value));
    const outside = selected.filter((value) => !groupIds.includes(value));
    const next = current.includes(id) ? outside.concat(current.filter((value) => value !== id)) : current.length < group.maxChoices ? outside.concat(current, id) : selected;
    setSelected(next); onChange(next);
  }
  return <section className="space-y-4 rounded-2xl border border-line bg-white p-4" aria-label={`Choose ${name}`}><div><h2 className="font-display text-lg font-bold">{name}</h2>{description && <p className="mt-1 text-sm text-ink-mute">{description}</p>}<p className="mt-2 text-lg font-extrabold text-brand-700">{priceLabel}</p></div>{groups.length ? groups.map((group) => <fieldset key={group.name}><legend className="mb-2 text-sm font-semibold">{group.name} <span className="font-normal text-ink-mute">Choose {group.minChoices}–{group.maxChoices}</span></legend><div className="space-y-2">{group.items.map((item) => <label key={`${item.menuItemId}:${item.variantId ?? ''}`} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm"><input type="checkbox" checked={selected.includes(item.menuItemId)} onChange={() => toggle(item.menuItemId, group)} className="accent-brand-600" />{item.name}</label>)}</div></fieldset>) : <ul className="space-y-1 text-sm text-ink-soft">{lines.map((line) => <li key={`${line.menuItemId}:${line.variantId ?? ''}`}>{line.quantity} × {line.name}</li>)}</ul>}</section>;
}

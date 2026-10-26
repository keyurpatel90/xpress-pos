import type { Row } from './types';

export const cn = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(' ');

/** Button class names. Lives here (not in a client module) so server components can call it. */
export const btnClass = (variant: 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent' = 'primary', size: 'sm' | 'md' | 'lg' = 'md', extra?: string) =>
  cn('btn', `btn-${variant}`, `btn-${size}`, extra);

export const inr = (n: number | string | null | undefined, dec = 0) =>
  '₹' + Number(n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: dec, maximumFractionDigits: dec });

export function fmtDate(d: string | Date | null | undefined, withTime = false) {
  if (!d) return '-';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

export const minutesSince = (d: string) => Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 60000));

export function isoDate(d = new Date()) {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
}

/** Units a menu item can be sold by. */
export const UNITS = [
  'plate', 'piece', 'portion', 'bowl', 'cup', 'glass', 'bottle', 'can', 'slice', 'set', 'pack',
  'full', 'half', 'dozen', 'kg', 'g', 'litre', 'ml',
];
/** Units inventory can be counted in. */
export const INV_UNITS = ['kg', 'g', 'litre', 'ml', 'piece', 'packet', 'dozen', 'bottle', 'box', 'can'];

export const PAY_METHODS = [
  { id: 'cash', label: 'Cash' },
  { id: 'upi', label: 'UPI' },
  { id: 'card', label: 'Card' },
  { id: 'other', label: 'Other' },
];
export const ORDER_TYPES = [
  { id: 'dine_in', label: 'Dine-in' },
  { id: 'takeaway', label: 'Takeaway' },
  { id: 'delivery', label: 'Delivery' },
];
export const typeLabel = (t: string) => ORDER_TYPES.find((x) => x.id === t)?.label ?? t;

/** Indian mobile numbers: 10 digits get +91. Returns digits only (WhatsApp format). */
export function normalizePhone(p: string) {
  const d = (p || '').replace(/\D/g, '');
  if (d.length === 10) return '91' + d;
  if (d.length === 11 && d.startsWith('0')) return '91' + d.slice(1);
  return d;
}

/** Cart preview only; the database recalculates the real bill. */
export function estimate(lines: { price: number; qty: number; modTotal: number; taxRate: number }[], rest: Row) {
  const sub = lines.reduce((s, l) => s + (l.price + l.modTotal) * l.qty, 0);
  const sc = (sub * Number(rest?.service_charge_pct ?? 0)) / 100;
  const tax = lines.reduce((s, l) => {
    const line = (l.price + l.modTotal) * l.qty;
    return s + (rest?.tax_inclusive ? (line * l.taxRate) / (100 + l.taxRate) : (line * l.taxRate) / 100);
  }, 0);
  return { sub, tax, total: Math.round(sub + sc + (rest?.tax_inclusive ? 0 : tax)) };
}

export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');

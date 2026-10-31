'use client';
import Link from 'next/link';
import { useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import Skeleton from '@mui/material/Skeleton';
import { btnClass, cn } from '@/lib/utils';
import { Icon } from '@/components/Icon';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
type Size = 'sm' | 'md' | 'lg';

export function Btn({ variant = 'primary', size = 'md', loading, className, children, disabled, ...rest }:
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; loading?: boolean }) {
  return (
    <button type="button" className={btnClass(variant, size, className)} disabled={disabled || loading} {...rest}>
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}

export function LinkBtn({ href, variant = 'primary', size = 'md', className, children }:
  { href: string; variant?: Variant; size?: Size; className?: string; children: ReactNode }) {
  return <Link href={href} className={btnClass(variant, size, className)}>{children}</Link>;
}

export function Spinner({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={cn('animate-spin', className)} viewBox="0 0 24 24" fill="none" aria-label="Loading">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity=".25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Field({ label, hint, children, className }: { label?: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn('block', className)}>
      {label && <span className="mb-1 block text-sm font-medium text-ink-soft">{label}</span>}
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-mute">{hint}</span>}
    </label>
  );
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('input', className)} {...rest} />;
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn('input h-auto py-2', className)} rows={3} {...rest} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={cn('input appearance-none pr-9', className)} {...rest}>{children}</select>
      <Icon name="chev" className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-ink-mute" />
    </div>
  );
}

export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label?: string; disabled?: boolean }) {
  return (
    <button
      type="button" role="switch" aria-checked={checked} disabled={disabled}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2 text-sm disabled:opacity-50"
    >
      <span className={cn('relative h-6 w-11 rounded-full transition-colors', checked ? 'bg-brand-600' : 'bg-line')}>
        <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', checked ? 'left-[22px]' : 'left-0.5')} />
      </span>
      {label && <span className="text-ink-soft">{label}</span>}
    </button>
  );
}

export function Modal({ open, onClose, title, children, footer, wide }:
  { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        role="dialog" aria-modal="true" aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        className={cn('flex max-h-[92vh] w-full flex-col rounded-t-3xl bg-white shadow-lift sm:rounded-2xl', wide ? 'sm:max-w-3xl' : 'sm:max-w-lg')}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="font-display text-lg font-bold tracking-tight">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-mute hover:bg-field" aria-label="Close"><Icon name="x" /></button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

const TONES = {
  gray: 'bg-field text-ink-soft',
  green: 'bg-emerald-50 text-emerald-700',
  red: 'bg-rose-50 text-rose-600',
  yellow: 'bg-amber-50 text-amber-700',
  blue: 'bg-blue-50 text-blue-700',
  brand: 'bg-brand-50 text-brand-700',
  dark: 'bg-ink text-white',
};
export function Badge({ tone = 'gray', children, className }: { tone?: keyof typeof TONES; children: ReactNode; className?: string }) {
  return <span className={cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold', TONES[tone], className)}>{children}</span>;
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('card', className)}>{children}</div>;
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-ink-mute">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Empty({ icon = 'box', title, text, action }: { icon?: string; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-line bg-white px-6 py-12 text-center">
      <span className="mb-3 rounded-2xl bg-brand-50 p-3 text-brand-600"><Icon name={icon} className="h-6 w-6" /></span>
      <p className="font-display text-lg font-semibold">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-ink-mute">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Loading() {
  return (
    <div className="flex flex-col gap-5" aria-label="Loading content" role="status">
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((item) => <Skeleton key={item} variant="rounded" height={92} animation="wave" />)}
      </div>
      <Skeleton variant="rounded" height={320} animation="wave" />
    </div>
  );
}

export function Stat({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: string; tone?: 'warn' }) {
  return (
    <div className="card p-4">
      <p className="label-caps">{label}</p>
      <p className={cn('mt-1.5 font-display text-2xl font-extrabold tracking-tight', tone === 'warn' && 'text-rose-600')}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-ink-mute">{sub}</p>}
    </div>
  );
}

/** variant "brand": violet active pill in a white tray. variant "soft": white active tab in a grey tray (order type). */
export function Segmented<T extends string>({ value, onChange, options, variant = 'brand' }:
  { value: T; onChange: (v: T) => void; options: { id: T; label: string; icon?: string }[]; variant?: 'brand' | 'soft' }) {
  return (
    <div className={cn('inline-flex gap-0.5 rounded-xl p-1', variant === 'soft' ? 'bg-slate-100' : 'border border-line bg-white shadow-sm')}>
      {options.map((o) => {
        const on = value === o.id;
        return (
          <button
            key={o.id} type="button" onClick={() => onChange(o.id)} aria-pressed={on}
            className={cn('inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors',
              variant === 'soft'
                ? on ? 'bg-white text-ink shadow-sm' : 'text-ink-mute hover:text-ink'
                : on ? 'bg-brand-600 text-white shadow-sm' : 'text-ink-mute hover:bg-field')}
          >
            {o.icon && <Icon name={o.icon} className="h-4 w-4" />}{o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-line bg-slate-50">
          <tr>{head.map((h) => <th key={h} className="label-caps whitespace-nowrap px-4 py-3">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}

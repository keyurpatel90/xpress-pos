import Link from 'next/link';
import { Icon } from '@/components/Icon';

export function LogoMark({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm ${className}`}>
      <Icon name="menu" className="h-5 w-5" />
    </span>
  );
}

export function Logo({ href = '/', light = false, pill = false }: { href?: string; light?: boolean; pill?: boolean }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5">
      <LogoMark />
      <span className={`font-display text-xl font-extrabold tracking-tight ${light ? 'text-white' : 'text-ink'}`}>
        Xpress<span className={light ? 'text-brand-300' : 'text-brand-600'}>POS</span>
      </span>
      {pill && <span className="hidden rounded-md bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-700 sm:inline">Cloud POS</span>}
    </Link>
  );
}

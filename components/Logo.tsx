import Link from 'next/link';

export function LogoMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path d="M6 3h20v22l-3.3-2.2L19.3 25 16 22.8 12.7 25l-3.4-2.2L6 25z" fill="#0E6B52" />
      <path d="M17.5 8l-6.5 8.5h4.2L14 22.5l6.5-8.5h-4.2z" fill="#F5C242" />
    </svg>
  );
}

export function Logo({ href = '/', light = false }: { href?: string; light?: boolean }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2">
      <LogoMark />
      <span className={`font-display text-xl font-bold tracking-tight ${light ? 'text-white' : 'text-ink'}`}>
        Xpress<span className={light ? 'text-turmeric-400' : 'text-pine-600'}> POS</span>
      </span>
    </Link>
  );
}

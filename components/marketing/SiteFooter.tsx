import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { SUPPORT_EMAIL, TAGLINE } from '@/lib/site';

const COLS = [
  { title: 'Product', links: [['/features', 'Features'], ['/pricing', 'Pricing'], ['/faq', 'FAQ']] },
  { title: 'Company', links: [['/support', 'Support'], ['/legal/terms', 'Terms'], ['/legal/privacy', 'Privacy'], ['/legal/refunds', 'Refunds']] },
  { title: 'Get started', links: [['/signup', 'Start free trial'], ['/login', 'Log in']] },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-[2fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-ink-mute">{TAGLINE}.</p>
          {SUPPORT_EMAIL && <a href={`mailto:${SUPPORT_EMAIL}`} className="mt-3 block text-sm font-medium text-brand-700">{SUPPORT_EMAIL}</a>}
        </div>
        {COLS.map((c) => (
          <div key={c.title}>
            <p className="font-display font-semibold">{c.title}</p>
            <ul className="mt-3 space-y-2 text-sm">
              {c.links.map(([href, label]) => <li key={href}><Link href={href} className="text-ink-mute hover:text-ink">{label}</Link></li>)}
            </ul>
          </div>
        ))}
      </div>
      <p className="border-t border-line py-4 text-center text-xs text-ink-mute">© {new Date().getFullYear()} Xpress POS. All rights reserved.</p>
    </footer>
  );
}

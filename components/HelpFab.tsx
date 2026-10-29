import Link from 'next/link';
import { Icon } from '@/components/Icon';

/** Floating help button (links to the support page). */
export function HelpFab({ newTab = false }: { newTab?: boolean }) {
  return (
    <Link
      href="/support" aria-label="Contact support" target={newTab ? '_blank' : undefined}
      className="no-print fixed bottom-5 right-5 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white shadow-glow transition-transform hover:scale-105"
    >
      <Icon name="chat" className="h-5 w-5" />
      <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-brand-600 bg-white" />
    </Link>
  );
}

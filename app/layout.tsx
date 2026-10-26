import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/figtree';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Xpress POS: cloud POS for restaurants', template: '%s | Xpress POS' },
  description: 'Billing, tables, kitchen display, inventory and WhatsApp bills for restaurants, cafes and food counters. Free for 30 days.',
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#0E6B52' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { ContactForm } from '@/components/marketing/ContactForm';
import { Icon } from '@/components/Icon';
import { SUPPORT_EMAIL, SUPPORT_PHONE } from '@/lib/site';

export const metadata: Metadata = { title: 'Support', description: 'Get help with setup, billing, WhatsApp bills and your account.' };

export default function SupportPage() {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.2fr_1fr]">
      <div>
        <h1 className="font-display text-4xl font-bold tracking-tight">We are here to help</h1>
        <p className="mb-6 mt-3 text-lg text-ink-soft">Tell us what you need and we will reply by email. Include your restaurant name so we can find your account faster.</p>
        <ContactForm />
      </div>
      <aside className="space-y-6 md:pt-24">
        {(SUPPORT_EMAIL || SUPPORT_PHONE) && (
          <div className="space-y-3 rounded-2xl border border-line bg-white p-5">
            <p className="font-display font-semibold">Reach us directly</p>
            {SUPPORT_EMAIL && <a href={`mailto:${SUPPORT_EMAIL}`} className="flex items-center gap-3 text-pine-700"><Icon name="mail" className="h-5 w-5" />{SUPPORT_EMAIL}</a>}
            {SUPPORT_PHONE && <a href={`tel:${SUPPORT_PHONE}`} className="flex items-center gap-3 text-pine-700"><Icon name="phone" className="h-5 w-5" />{SUPPORT_PHONE}</a>}
          </div>
        )}
        <div className="rounded-2xl border border-line bg-white p-5">
          <p className="font-display font-semibold">Common topics</p>
          <ul className="mt-2 space-y-2 text-sm text-ink-soft">
            <li>Setting up tables, menu and GST</li>
            <li>Inviting your cashier, waiter or chef</li>
            <li>Connecting WhatsApp Business to send bills</li>
            <li>Plans, payments and invoices</li>
          </ul>
          <Link href="/faq" className="mt-3 inline-block text-sm font-semibold text-pine-700 hover:underline">Read the FAQ first</Link>
        </div>
      </aside>
    </div>
  );
}

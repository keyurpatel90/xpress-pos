import type { Metadata } from 'next';
import Link from 'next/link';
import { FaqList } from '@/components/marketing/FaqList';
import { FAQS } from '@/lib/site';

export const metadata: Metadata = { title: 'FAQ', description: 'Answers about the free trial, plans, hardware, GST, staff logins and WhatsApp bills.' };

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-14">
      <h1 className="font-display text-4xl font-extrabold tracking-tight md:text-5xl">Frequently asked questions</h1>
      <p className="mb-8 mt-3 text-lg text-ink-soft">Cannot find your answer? <Link href="/support" className="font-semibold text-brand-700 underline">Contact support</Link>.</p>
      <FaqList items={FAQS} />
    </div>
  );
}

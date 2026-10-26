import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import { Invoice } from '@/components/app/Invoice';
import { PrintButton } from '@/components/PrintButton';
import { Logo } from '@/components/Logo';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Your bill', robots: { index: false, follow: false } };

// Public, unguessable link sent to the customer on WhatsApp
export default async function BillPage({ params }: { params: { token: string } }) {
  if (!/^[0-9a-f-]{36}$/i.test(params.token)) notFound();
  const admin = createAdminClient();
  const { data: order } = await admin.from('orders').select('*, dining_tables(name)').eq('public_token', params.token).maybeSingle();
  if (!order || order.status === 'cancelled') notFound();
  const [{ data: restaurant }, { data: items }, { data: payments }] = await Promise.all([
    admin.from('restaurants').select('name, address, city, state, phone, gstin, bill_footer, tax_inclusive').eq('id', order.restaurant_id).single(),
    admin.from('order_items').select('*').eq('order_id', order.id).order('created_at'),
    admin.from('order_payments').select('*').eq('order_id', order.id),
  ]);
  if (!restaurant) notFound();

  return (
    <main className="min-h-screen bg-field px-4 py-8">
      <div className="mx-auto max-w-sm">
        <div className="no-print mb-4 flex items-center justify-between"><Logo href="/" /><PrintButton /></div>
        <div className="rounded-xl border border-line bg-white p-5 shadow-lift">
          <Invoice restaurant={restaurant} order={order} items={items ?? []} payments={payments ?? []} tableName={order.dining_tables?.name} />
        </div>
        <p className="no-print mt-4 text-center text-xs text-ink-mute">Bill generated with Xpress POS</p>
      </div>
    </main>
  );
}

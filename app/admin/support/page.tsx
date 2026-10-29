import { createAdminClient } from '@/lib/supabase/admin';
import { TicketStatus } from '@/components/admin/Admin';
import type { Row } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function AdminSupport() {
  const { data } = await createAdminClient().from('support_tickets').select('*').order('created_at', { ascending: false }).limit(100);
  const tickets = (data ?? []) as Row[];
  return (
    <>
      <h1 className="mb-4 font-display text-2xl font-bold">Support inbox</h1>
      {tickets.length === 0 ? <p className="text-ink-mute">No messages yet.</p> : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <article key={t.id} className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{t.name} <a className="font-normal text-brand-700" href={`mailto:${t.email}`}>{t.email}</a>{t.phone ? <span className="font-normal text-ink-mute"> · {t.phone}</span> : null}</p>
                <TicketStatus t={t} />
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-ink-soft">{t.message}</p>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

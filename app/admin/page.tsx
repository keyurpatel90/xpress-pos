import { createAdminClient } from '@/lib/supabase/admin';
import { RestaurantActions } from '@/components/admin/Admin';
import { Badge, Stat } from '@/components/ui';
import { effStatus } from '@/lib/status';
import { fmtDate, inr } from '@/lib/utils';
import type { Row } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function AdminHome() {
  const admin = createAdminClient();
  const [rs, owners, pays, plans, staff] = await Promise.all([
    admin.from('restaurants').select('*, plans(name)').order('created_at', { ascending: false }).limit(300),
    admin.from('profiles').select('restaurant_id, email, full_name').eq('role', 'owner'),
    admin.from('subscription_payments').select('amount_paise, paid_at').eq('status', 'paid'),
    admin.from('plans').select('id, name').order('sort'),
    admin.from('profiles').select('restaurant_id'),
  ]);
  const restaurants = (rs.data ?? []) as Row[];
  const ownerOf = new Map((owners.data ?? []).map((o: Row) => [o.restaurant_id, o]));
  const staffCount = new Map<string, number>();
  (staff.data ?? []).forEach((s: Row) => staffCount.set(s.restaurant_id, (staffCount.get(s.restaurant_id) ?? 0) + 1));
  const st = restaurants.map((r) => effStatus(r));
  const paid = (pays.data ?? []) as Row[];
  const total = paid.reduce((s, p) => s + Number(p.amount_paise), 0) / 100;
  const month = paid.filter((p) => p.paid_at && Date.now() - new Date(p.paid_at).getTime() < 30 * 86400000).reduce((s, p) => s + Number(p.amount_paise), 0) / 100;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Restaurants" value={restaurants.length} />
        <Stat label="On trial" value={st.filter((s) => s === 'trialing').length} />
        <Stat label="Subscribed" value={st.filter((s) => s === 'active').length} />
        <Stat label="Expired" value={st.filter((s) => s === 'expired').length} />
        <Stat label="Collected (30 days)" value={inr(month)} sub={`${inr(total)} all time`} />
      </div>
      <h2 className="mb-3 mt-8 font-display text-xl font-semibold">Restaurants</h2>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-line bg-field/60 text-ink-mute">
            <tr>{['Restaurant', 'Owner', 'Joined', 'Status', 'Plan / ends', 'Logins', ''].map((h) => <th key={h} className="px-4 py-2.5 font-medium">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-line">
            {restaurants.map((r, i) => {
              const o = ownerOf.get(r.id) as Row | undefined;
              const s = st[i];
              return (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3">{o?.full_name || '-'}<span className="block text-xs text-ink-mute">{o?.email}</span></td>
                  <td className="px-4 py-3">{fmtDate(r.created_at)}</td>
                  <td className="px-4 py-3"><Badge tone={s === 'active' ? 'green' : s === 'trialing' ? 'yellow' : 'red'}>{r.subscription_status === 'cancelled' ? 'suspended' : s}</Badge></td>
                  <td className="px-4 py-3">{s === 'active' ? `${r.plans?.name ?? 'Granted'} until ${fmtDate(r.current_period_end)}` : s === 'trialing' ? `Trial ends ${fmtDate(r.trial_ends_at)}` : `Ended ${fmtDate(r.current_period_end ?? r.trial_ends_at)}`}</td>
                  <td className="px-4 py-3">{staffCount.get(r.id) ?? 0}</td>
                  <td className="px-4 py-3"><RestaurantActions r={r} plans={(plans.data ?? []) as Row[]} /></td>
                </tr>
              );
            })}
            {restaurants.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-ink-mute">No restaurants have signed up yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

import { createAdminClient } from '@/lib/supabase/admin';
import { SettingsForm } from '@/components/admin/Admin';

export const dynamic = 'force-dynamic';

export default async function AdminSettings() {
  const { data } = await createAdminClient().from('platform_settings').select('*');
  const m = Object.fromEntries((data ?? []).map((r: { key: string; value: unknown }) => [r.key, r.value]));
  return (
    <>
      <h1 className="mb-4 font-display text-2xl font-bold">Platform settings</h1>
      <SettingsForm initial={{
        trial_days: Number(m.trial_days ?? 30),
        trial_premium_access: m.trial_premium_access === true,
        after_trial_mode: m.after_trial_mode === 'free' ? 'free' : 'lock',
      }} />
    </>
  );
}

import { createAdminClient } from '@/lib/supabase/admin';
import { FeatureTable } from '@/components/admin/Admin';
import type { Row } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function AdminFeatures() {
  const admin = createAdminClient();
  const [f, p] = await Promise.all([admin.from('feature_flags').select('*').order('sort'), admin.from('plans').select('name, level').order('level')]);
  const plans = (p.data ?? []) as Row[];
  const names: Record<number, string> = {};
  plans.forEach((x) => { names[x.level] = names[x.level] ? `${names[x.level]} / ${x.name}` : x.name; });
  return (
    <>
      <h1 className="font-display text-2xl font-bold">Feature access</h1>
      <p className="mb-4 mt-1 max-w-2xl text-sm text-ink-mute">Choose which features are free and which need a subscription. A paid feature is available to restaurants whose plan level is at or above the level you set. Changes apply immediately to every restaurant.</p>
      <FeatureTable features={(f.data ?? []) as Row[]} maxLevel={Math.max(1, ...plans.map((x) => x.level))} planNames={names} />
    </>
  );
}

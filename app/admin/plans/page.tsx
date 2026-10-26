import { createAdminClient } from '@/lib/supabase/admin';
import { PlanManager } from '@/components/admin/Admin';
import type { Row } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function AdminPlans() {
  const { data } = await createAdminClient().from('plans').select('*').order('sort');
  return (
    <>
      <h1 className="mb-4 font-display text-2xl font-bold">Plans</h1>
      <PlanManager plans={(data ?? []) as Row[]} />
    </>
  );
}

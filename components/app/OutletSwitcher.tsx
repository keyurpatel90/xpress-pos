'use client';

import { useRouter } from 'next/navigation';
import { unwrap, useData, useSupabase } from '@/lib/hooks';
import { useApp } from '@/components/app/AppProvider';
import { Select } from '@/components/ui';
import { Icon } from '@/components/Icon';
import type { Row } from '@/lib/types';

export function OutletSwitcher() {
  const { access, restaurant } = useApp();
  const sb = useSupabase();
  const router = useRouter();
  const { data } = useData(async (client) => {
    const memberships = unwrap(await client.from('outlet_memberships').select('restaurant_id,role').order('created_at')) ?? [];
    const ids = memberships.map((item: Row) => item.restaurant_id);
    if (restaurant?.id && !ids.includes(restaurant.id)) ids.push(restaurant.id);
    if (!ids.length) return [];
    return unwrap(await client.from('restaurants').select('id,name,city').in('id', ids).order('name')) ?? [];
  }, []);

  const outlets = data as Row[];
  if (outlets.length < 2) return <div className="hidden sm:flex items-center gap-2 text-xs text-ink-mute"><Icon name="layers" className="h-4 w-4" />{restaurant.name}</div>;

  async function switchOutlet(id: string) {
    if (id === access.restaurant_id) return;
    const { error } = await sb.rpc('switch_restaurant', { p_restaurant_id: id });
    if (error) return;
    router.refresh();
    window.location.reload();
  }

  return <label className="flex items-center gap-2 rounded-xl border border-line bg-white px-2.5 py-1.5 text-sm shadow-sm">
    <Icon name="layers" className="h-4 w-4 text-brand-600" />
    <span className="sr-only">Switch outlet</span>
    <Select aria-label="Switch outlet" value={access.restaurant_id ?? ''} onChange={(event) => switchOutlet(event.target.value)} className="min-w-36 border-0 bg-transparent p-0 text-sm font-semibold shadow-none focus:ring-0">
      {outlets.map((outlet) => <option key={outlet.id} value={outlet.id}>{outlet.name}{outlet.city ? ` · ${outlet.city}` : ''}</option>)}
    </Select>
  </label>;
}

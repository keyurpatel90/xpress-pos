'use client';

import { useState } from 'react';
import { Badge, Btn, Field, Input, Modal, PageHeader, Segmented, Select, Stat, Table, Textarea } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useApp } from '@/components/app/AppProvider';
import { unwrap, useAction, useData, useSupabase } from '@/lib/hooks';
import type { Row } from '@/lib/types';

const tabs = [{ id: 'menu', label: 'Central menu' }, { id: 'transfers', label: 'Stock transfers' }, { id: 'reports', label: 'Consolidated reports' }];

export default function OutletsPage() {
  const { access, profile, role } = useApp(); const sb = useSupabase(); const act = useAction();
  const [tab, setTab] = useState('menu'); const [modal, setModal] = useState<Row | null>(null); const [range, setRange] = useState('30');
  const { data, loading, reload } = useData(async (c) => {
    const [restaurants, catalog, overrides, transfers, items] = await Promise.all([
      c.from('restaurants').select('id,name,city').order('name'), c.from('central_menu_items').select('*').order('name'), c.from('menu_outlet_overrides').select('*'), c.from('stock_transfers').select('*').order('created_at', { ascending: false }), c.from('inventory_items').select('id,name,unit,quantity,cost_per_unit').order('name'),
    ]);
    return { restaurants: unwrap(restaurants) ?? [], catalog: unwrap(catalog) ?? [], overrides: unwrap(overrides) ?? [], transfers: unwrap(transfers) ?? [], items: unwrap(items) ?? [] };
  }, { restaurants: [], catalog: [], overrides: [], transfers: [], items: [] });
  const d = data as Record<string, Row[]>;
  const [report, setReport] = useState<Row>({});

  async function loadReport() {
    const to = new Date(); const from = new Date(Date.now() - Number(range) * 86400000);
    const result = unwrap(await sb.rpc('consolidated_sales_report', { p_from: from.toISOString().slice(0, 10), p_to: to.toISOString().slice(0, 10) }));
    setReport(result ?? {});
  }
  async function saveCatalog() {
    if (!modal?.name?.trim()) return;
    await act(async () => unwrap(await sb.from('central_menu_items').upsert({ ...modal, owner_id: modal.owner_id, base_price: Number(modal.base_price) || 0, name: modal.name.trim() })), 'Central menu item saved'); setModal(null); reload();
  }
  async function saveOverride() {
    if (!modal?.central_menu_item_id || !modal.restaurant_id) return;
    await act(async () => unwrap(await sb.from('menu_outlet_overrides').upsert({ ...modal, price: modal.price === '' ? null : Number(modal.price), is_available: modal.is_available !== false })), 'Outlet override saved'); setModal(null); reload();
  }
  async function saveTransfer() {
    if (!modal?.to_restaurant_id || !modal.inventory_item_id || Number(modal.quantity) <= 0) return;
    const transfer = unwrap(await sb.from('stock_transfers').insert({ from_restaurant_id: access.restaurant_id, to_restaurant_id: modal.to_restaurant_id, transfer_no: modal.transfer_no, status: 'sent', requested_by: null, sent_at: new Date().toISOString(), notes: modal.notes || null }).select('id').single()) as Row | null;
    if (transfer?.id) await act(async () => unwrap(await sb.from('stock_transfer_items').insert({ transfer_id: transfer.id, inventory_item_id: modal.inventory_item_id, quantity: Number(modal.quantity), unit_cost: Number(modal.unit_cost) || 0 })), 'Stock transfer sent');
    setModal(null); reload();
  }

  const openModal = () => setModal(tab === 'menu' ? { owner_id: profile.id, name: '', base_price: '', category_name: '', description: '' } : tab === 'transfers' ? { transfer_no: `TR-${Date.now()}`, to_restaurant_id: '', inventory_item_id: '', quantity: '', unit_cost: '', notes: '' } : null);
  return <><PageHeader title="Multi-outlet" subtitle="Centralize menu, stock movement and performance across your outlets." actions={tab !== 'reports' && (tab !== 'menu' || role === 'owner') && <Btn onClick={openModal}><Icon name="plus" className="h-4 w-4" /> {tab === 'menu' ? 'Add menu item' : 'New transfer'}</Btn>} /><div className="mb-5"><Segmented value={tab} onChange={setTab} options={tabs} /></div>
    {tab === 'menu' && <><div className="mb-4 grid gap-3 sm:grid-cols-3"><Stat label="Outlets" value={d.restaurants.length} /><Stat label="Central items" value={d.catalog.length} /><Stat label="Overrides" value={d.overrides.length} /></div><Table head={['Menu item', 'Base price', 'Outlet overrides', 'Status', '']}><>{d.catalog.map((item) => { const overrides = d.overrides.filter((o) => o.central_menu_item_id === item.id); return <tr key={item.id}><td className="px-4 py-3"><p className="font-semibold">{item.name}</p><p className="text-xs text-ink-mute">{item.category_name || 'Uncategorised'}</p></td><td className="px-4 py-3">₹{Number(item.base_price).toFixed(2)}</td><td className="px-4 py-3">{overrides.length} outlet{overrides.length === 1 ? '' : 's'}</td><td className="px-4 py-3"><Badge>{item.is_active ? 'Active' : 'Hidden'}</Badge></td><td className="px-4 py-3 text-right"><Btn size="sm" variant="secondary" onClick={() => setModal({ central_menu_item_id: item.id, restaurant_id: access.restaurant_id, price: item.base_price, is_available: true })}>Override</Btn></td></tr>; })}</></Table></>}
    {tab === 'transfers' && <Table head={['Transfer', 'From', 'To', 'Status', 'Created']}><>{d.transfers.map((transfer) => <tr key={transfer.id}><td className="px-4 py-3 font-semibold">{transfer.transfer_no}</td><td className="px-4 py-3">{d.restaurants.find((r) => r.id === transfer.from_restaurant_id)?.name ?? '—'}</td><td className="px-4 py-3">{d.restaurants.find((r) => r.id === transfer.to_restaurant_id)?.name ?? '—'}</td><td className="px-4 py-3"><Badge>{transfer.status}</Badge></td><td className="px-4 py-3">{new Date(transfer.created_at).toLocaleDateString()}</td></tr>)}</></Table>}
    {tab === 'reports' && <><div className="mb-4 flex flex-wrap items-center gap-3"><Segmented value={range} onChange={setRange} options={[{ id: '7', label: '7 days' }, { id: '30', label: '30 days' }, { id: '90', label: '90 days' }]} /><Btn onClick={loadReport}>Refresh report</Btn></div><div className="grid gap-3 sm:grid-cols-2"><Stat label="Consolidated sales" value={`₹${Number(report.totals?.sales ?? 0).toFixed(2)}`} /><Stat label="Paid bills" value={report.totals?.orders ?? 0} /></div><div className="mt-4"><Table head={['Outlet', 'Sales', 'Bills']}><>{(report.by_outlet ?? []).map((row: Row) => <tr key={row.restaurant_id}><td className="px-4 py-3 font-semibold">{row.name}</td><td className="px-4 py-3">₹{Number(row.sales).toFixed(2)}</td><td className="px-4 py-3">{row.orders}</td></tr>)}</></Table></div></>}
    <Modal open={!!modal} onClose={() => setModal(null)} title={tab === 'menu' ? (modal?.central_menu_item_id ? 'Outlet price override' : 'Central menu item') : 'New stock transfer'} wide footer={<><Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn><Btn onClick={tab === 'menu' ? (modal?.central_menu_item_id ? saveOverride : saveCatalog) : saveTransfer}>Save</Btn></>}>
      {modal && tab === 'menu' && !modal.central_menu_item_id && <div className="grid gap-3 sm:grid-cols-2"><Field label="Name"><Input autoFocus value={modal.name} onChange={(e) => setModal({ ...modal, name: e.target.value })} /></Field><Field label="Base price"><Input type="number" value={modal.base_price} onChange={(e) => setModal({ ...modal, base_price: e.target.value })} /></Field><Field label="Category"><Input value={modal.category_name} onChange={(e) => setModal({ ...modal, category_name: e.target.value })} /></Field><Field label="Description"><Textarea value={modal.description} onChange={(e) => setModal({ ...modal, description: e.target.value })} /></Field></div>}
      {modal && tab === 'menu' && modal.central_menu_item_id && <div className="grid gap-3 sm:grid-cols-2"><Field label="Outlet"><Select value={modal.restaurant_id} onChange={(e) => setModal({ ...modal, restaurant_id: e.target.value })}>{d.restaurants.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</Select></Field><Field label="Override price"><Input type="number" value={modal.price} onChange={(e) => setModal({ ...modal, price: e.target.value })} /></Field><Field label="Availability"><Select value={String(modal.is_available)} onChange={(e) => setModal({ ...modal, is_available: e.target.value === 'true' })}><option value="true">Available</option><option value="false">Unavailable</option></Select></Field></div>}
      {modal && tab === 'transfers' && <div className="grid gap-3 sm:grid-cols-2"><Field label="Transfer number"><Input value={modal.transfer_no} onChange={(e) => setModal({ ...modal, transfer_no: e.target.value })} /></Field><Field label="Destination outlet"><Select value={modal.to_restaurant_id} onChange={(e) => setModal({ ...modal, to_restaurant_id: e.target.value })}><option value="">Select outlet</option>{d.restaurants.filter((r) => r.id !== access.restaurant_id).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</Select></Field><Field label="Inventory item"><Select value={modal.inventory_item_id} onChange={(e) => setModal({ ...modal, inventory_item_id: e.target.value })}><option value="">Select item</option>{d.items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</Select></Field><Field label="Quantity"><Input type="number" min="0.001" step="0.001" value={modal.quantity} onChange={(e) => setModal({ ...modal, quantity: e.target.value })} /></Field><Field label="Unit cost"><Input type="number" min="0" step="0.01" value={modal.unit_cost} onChange={(e) => setModal({ ...modal, unit_cost: e.target.value })} /></Field><Field label="Notes"><Textarea value={modal.notes} onChange={(e) => setModal({ ...modal, notes: e.target.value })} /></Field></div>}
    </Modal>
  </>;
}

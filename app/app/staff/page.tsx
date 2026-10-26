'use client';
import { useState } from 'react';
import { api, unwrap, useAction, useData } from '@/lib/hooks';
import { useApp } from '@/components/app/AppProvider';
import { Badge, Btn, Card, Field, Input, Loading, Modal, PageHeader, Segmented, Select, Table } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { ROLE_HELP, ROLE_LABEL, STAFF_ROLES } from '@/lib/roles';
import type { Role, Row } from '@/lib/types';

export default function StaffPage() {
  const { profile } = useApp();
  const act = useAction();
  const { data: staff, loading, reload } = useData<Row[]>(async (sb) => unwrap(await sb.from('profiles').select('*').order('created_at')) ?? [], []);
  const [inv, setInv] = useState<Row | null>(null);

  async function invite() {
    if (!inv) return;
    const ok = await act(() => api('/api/staff', 'POST', {
      full_name: inv.full_name, email: inv.email, role: inv.role, mode: inv.mode, password: inv.password,
    }), inv.mode === 'invite' ? 'Invitation email sent' : 'Login created');
    if (ok) { setInv(null); reload(); }
  }
  const patch = async (id: string, body: Row, msg: string) => { if (await act(() => api('/api/staff', 'PATCH', { id, ...body }), msg)) reload(); };
  async function remove(s: Row) {
    if (!confirm(`Remove ${s.full_name || s.email}? They will no longer be able to sign in.`)) return;
    if (await act(() => api('/api/staff', 'DELETE', { id: s.id }), 'Staff removed')) reload();
  }

  if (loading) return <Loading />;
  return (
    <>
      <PageHeader title="Staff" subtitle="Each person signs in with their own login and lands on the screen for their job"
        actions={<Btn onClick={() => setInv({ full_name: '', email: '', role: 'cashier', mode: 'invite', password: '' })}><Icon name="plus" className="h-4 w-4" /> Add staff</Btn>} />
      <Card className="mb-4 grid gap-2 p-4 text-sm sm:grid-cols-2">
        {STAFF_ROLES.map((r) => <p key={r}><b>{ROLE_LABEL[r]}:</b> <span className="text-ink-mute">{ROLE_HELP[r]}</span></p>)}
      </Card>
      <Table head={['Name', 'Role', 'Status', '']}>
        {staff.map((s) => {
          const isOwner = s.role === 'owner';
          return (
            <tr key={s.id}>
              <td className="px-4 py-2.5"><span className="font-medium">{s.full_name || '-'}</span><span className="block text-xs text-ink-mute">{s.email}</span></td>
              <td className="px-4 py-2.5">
                {isOwner ? <Badge tone="green">Owner</Badge> : (
                  <div className="w-40"><Select value={s.role} onChange={(e) => patch(s.id, { role: e.target.value }, 'Role updated')}>
                    {STAFF_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r as Role]}</option>)}
                  </Select></div>
                )}
              </td>
              <td className="px-4 py-2.5"><Badge tone={s.status === 'active' ? 'green' : s.status === 'invited' ? 'yellow' : 'red'}>{s.status === 'invited' ? 'Invited' : s.status === 'active' ? 'Active' : 'Disabled'}</Badge></td>
              <td className="whitespace-nowrap px-4 py-2.5 text-right">
                {!isOwner && s.id !== profile.id && <>
                  <Btn size="sm" variant="secondary" onClick={() => patch(s.id, { status: s.status === 'disabled' ? 'active' : 'disabled' }, s.status === 'disabled' ? 'Access restored' : 'Access disabled')}>
                    {s.status === 'disabled' ? 'Enable' : 'Disable'}
                  </Btn>
                  <button onClick={() => remove(s)} className="ml-1 p-1.5 text-ink-mute hover:text-chili-600" aria-label="Remove"><Icon name="trash" className="h-4 w-4" /></button>
                </>}
              </td>
            </tr>
          );
        })}
      </Table>
      <Modal open={!!inv} onClose={() => setInv(null)} title="Add a staff login"
        footer={<><Btn variant="secondary" onClick={() => setInv(null)}>Cancel</Btn><Btn onClick={invite}>{inv?.mode === 'invite' ? 'Send invitation' : 'Create login'}</Btn></>}>
        {inv && (
          <div className="space-y-3">
            <Field label="Full name"><Input autoFocus value={inv.full_name} onChange={(e) => setInv({ ...inv, full_name: e.target.value })} /></Field>
            <Field label="Email"><Input type="email" value={inv.email} onChange={(e) => setInv({ ...inv, email: e.target.value })} /></Field>
            <Field label="Role" hint={ROLE_HELP[inv.role as Role]}>
              <Select value={inv.role} onChange={(e) => setInv({ ...inv, role: e.target.value })}>{STAFF_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</Select>
            </Field>
            <Segmented value={inv.mode} onChange={(v) => setInv({ ...inv, mode: v })} options={[{ id: 'invite', label: 'Email invitation' }, { id: 'password', label: 'Set a password myself' }]} />
            {inv.mode === 'password'
              ? <Field label="Password" hint="At least 8 characters. Share it with them privately."><Input type="text" autoComplete="off" value={inv.password} onChange={(e) => setInv({ ...inv, password: e.target.value })} /></Field>
              : <p className="text-sm text-ink-mute">They get an email with a link to choose their own password.</p>}
          </div>
        )}
      </Modal>
    </>
  );
}

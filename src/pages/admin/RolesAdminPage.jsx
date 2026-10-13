import { useState } from 'react';
import { Lock, Plus, Trash2 } from 'lucide-react';
import { adminUsersRepo, rolesRepo } from '../../services/api';
import { PERMISSIONS } from '../../data/seed/content';
import { useCollection } from '../../hooks/useAsync';
import { useAdmin } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { PageHeader, Panel } from '../../components/admin/AdminUI';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Input, Select, Toggle } from '../../components/ui/Form';
import { Badge, PageLoader } from '../../components/ui/Feedback';
import { demoHash, validate } from '../../utils/validators';
import { slugify } from '../../utils/format';

export default function RolesAdminPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const me = useAdmin();
  const { items: roles, loading } = useCollection('roles');
  const { items: users } = useCollection('adminUsers');
  const [roleModal, setRoleModal] = useState(null);
  const [userModal, setUserModal] = useState(null);
  const [errors, setErrors] = useState({});

  if (loading) return <PageLoader />;
  const togglePerm = async (role, perm, on) => {
    const permissions = on ? [...new Set([...role.permissions, perm])] : role.permissions.filter((p) => p !== perm);
    await rolesRepo.update(role.id, { permissions });
    toast.success(`${role.name}: ${on ? 'granted' : 'revoked'} "${perm}".`);
  };
  const saveRole = async () => {
    const res = validate(roleModal, { name: ['required', { minLength: 3 }, { custom: (v) => (roles.some((r) => r.name.toLowerCase() === v.trim().toLowerCase()) ? 'A role with this name already exists.' : null) }] }, { name: 'Role name' });
    setErrors(res.errors);
    if (!res.valid) return;
    await rolesRepo.create({ id: slugify(roleModal.name).replace(/-/g, '_'), name: roleModal.name.trim(), description: roleModal.description || '', permissions: ['dashboard'], system: false });
    toast.success('Role created. Tick its permissions in the matrix.');
    setRoleModal(null);
  };
  const delRole = async (r) => {
    if (users.some((u) => u.roleId === r.id)) return toast.error('Reassign the users of this role first.');
    if (!(await confirm({ title: 'Delete role?', message: `"${r.name}" will be removed.`, confirmLabel: 'Delete', danger: true }))) return;
    await rolesRepo.remove(r.id); toast.success('Role deleted.');
  };
  const saveUser = async () => {
    const res = validate(userModal, { name: ['required', { minLength: 2 }], email: ['required', 'email', { custom: (v) => (users.some((u) => u.email.toLowerCase() === v.trim().toLowerCase()) ? 'This email is already an admin.' : null) }], password: ['required', { minLength: 8 }], roleId: ['required'] }, { roleId: 'Role' });
    setErrors(res.errors);
    if (!res.valid) return;
    await adminUsersRepo.create({ name: userModal.name.trim(), email: userModal.email.trim(), roleId: userModal.roleId, passwordHash: demoHash(userModal.password), status: 'active' });
    toast.success('Admin user created (demo).');
    setUserModal(null);
  };
  const delUser = async (u) => {
    if (u.id === me.user.id) return toast.error('You cannot delete your own account.');
    if (!(await confirm({ title: 'Delete admin user?', message: `${u.name} will lose access.`, confirmLabel: 'Delete', danger: true }))) return;
    await adminUsersRepo.remove(u.id); toast.success('User deleted.');
  };

  return (
    <div>
      <PageHeader title="Roles & permissions" subtitle="Demo role management. Permissions here only hide or show screens in this prototype: they are not a security boundary." actions={<><Button size="sm" variant="secondary" icon={Plus} onClick={() => { setErrors({}); setUserModal({ name: '', email: '', password: '', roleId: roles[1]?.id || roles[0]?.id }); }}>Add admin user</Button><Button size="sm" icon={Plus} onClick={() => { setErrors({}); setRoleModal({ name: '', description: '' }); }}>Add role</Button></>} />
      <Panel title="Permission matrix">
        <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead><tr className="text-left text-xs uppercase tracking-wide text-slate-500"><th className="py-2 pr-4">Permission</th>{roles.map((r) => <th key={r.id} className="px-3 py-2 text-center"><div className="flex flex-col items-center gap-1">{r.name}{r.system ? <Lock className="h-3 w-3" aria-label="Locked" /> : <button onClick={() => delRole(r)} aria-label={`Delete role ${r.name}`} className="text-red-500 hover:text-red-700"><Trash2 className="h-3.5 w-3.5" /></button>}</div></th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">{PERMISSIONS.map((p) => <tr key={p.id}><td className="py-2.5 pr-4 font-medium text-navy-900">{p.label}<span className="ml-2 text-xs text-slate-400">{p.id}</span></td>{roles.map((r) => <td key={r.id} className="px-3 py-2.5 text-center"><input type="checkbox" aria-label={`${r.name} can access ${p.label}`} disabled={r.system} checked={r.permissions.includes(p.id)} onChange={(e) => togglePerm(r, p.id, e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-300 disabled:opacity-50" /></td>)}</tr>)}</tbody></table></div>
        <p className="mt-3 text-xs text-slate-500">Super Admin is locked to full access so you cannot lock yourself out.</p>
      </Panel>
      <Panel title="Admin users" className="mt-6">
        <ul className="divide-y divide-slate-100">
          {users.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-0 flex-1"><p className="font-semibold text-navy-900">{u.name} {u.id === me.user.id ? <Badge tone="green">You</Badge> : null}</p><p className="text-xs text-slate-500">{u.email}</p></div>
              <div className="w-48"><Select aria-label={`Role for ${u.name}`} value={u.roleId} disabled={u.id === me.user.id} onChange={async (e) => { await adminUsersRepo.update(u.id, { roleId: e.target.value }); toast.success('Role updated.'); }} options={roles.map((r) => ({ value: r.id, label: r.name }))} /></div>
              <Toggle checked={u.status === 'active'} disabled={u.id === me.user.id} label={`Active: ${u.name}`} onChange={async (v) => { await adminUsersRepo.update(u.id, { status: v ? 'active' : 'disabled' }); toast.success(v ? 'User enabled.' : 'User disabled.'); }} />
              <Button size="xs" variant="ghost" className="text-red-600" icon={Trash2} onClick={() => delUser(u)} aria-label={`Delete ${u.name}`} />
            </li>
          ))}
        </ul>
      </Panel>

      <Modal open={!!roleModal} onClose={() => setRoleModal(null)} title="Add role" footer={<><Button variant="ghost" onClick={() => setRoleModal(null)}>Cancel</Button><Button onClick={saveRole}>Create role</Button></>}>
        {roleModal ? <div className="space-y-4"><Input label="Role name" required value={roleModal.name} onChange={(e) => setRoleModal({ ...roleModal, name: e.target.value })} error={errors.name} /><Input label="Description" value={roleModal.description} onChange={(e) => setRoleModal({ ...roleModal, description: e.target.value })} /></div> : null}
      </Modal>
      <Modal open={!!userModal} onClose={() => setUserModal(null)} title="Add admin user" footer={<><Button variant="ghost" onClick={() => setUserModal(null)}>Cancel</Button><Button onClick={saveUser}>Create user</Button></>}>
        {userModal ? <div className="space-y-4"><Input label="Name" required value={userModal.name} onChange={(e) => setUserModal({ ...userModal, name: e.target.value })} error={errors.name} /><Input label="Email" type="email" required value={userModal.email} onChange={(e) => setUserModal({ ...userModal, email: e.target.value })} error={errors.email} /><Input label="Password" type="password" required value={userModal.password} onChange={(e) => setUserModal({ ...userModal, password: e.target.value })} error={errors.password} hint="Demo only: never reuse a real password." /><Select label="Role" required value={userModal.roleId} onChange={(e) => setUserModal({ ...userModal, roleId: e.target.value })} options={roles.map((r) => ({ value: r.id, label: r.name }))} error={errors.roleId} /></div> : null}
      </Modal>
    </div>
  );
}

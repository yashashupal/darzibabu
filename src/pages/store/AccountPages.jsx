import { useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useNavigate, useParams } from 'react-router-dom';
import { Heart, LogOut, MapPin, Package, Plus, Trash2, User, LayoutDashboard } from 'lucide-react';
import { cancelOrder, customersRepo, ordersRepo } from '../../services/api';
import { useAsync } from '../../hooks/useAsync';
import { useDocumentTitle } from '../../hooks/useMisc';
import { useCustomer } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Form';
import { Badge, EmptyState, PageLoader, StatusBadge } from '../../components/ui/Feedback';
import { Breadcrumbs } from '../../components/ui/Misc';
import Pagination, { paginate } from '../../components/ui/Pagination';
import OrderTimeline from '../../components/store/OrderTimeline';
import { OrderItems, OrderTotals } from './OrderConfirmationPage';
import { formatDate, formatINR, cx, uid } from '../../utils/format';
import { validate } from '../../utils/validators';

export function AccountLayout() {
  const { customer, loading, logout } = useCustomer();
  const navigate = useNavigate();
  const toast = useToast();
  if (loading) return <PageLoader />;
  if (!customer) return <Navigate to="/login?next=/account" replace />;
  const links = [['/account', 'Overview', LayoutDashboard, true], ['/account/orders', 'My orders', Package], ['/account/addresses', 'Addresses', MapPin], ['/account/profile', 'Profile', User], ['/wishlist', 'Wishlist', Heart]];
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'My account' }]} />
      <div className="grid gap-8 lg:grid-cols-[15rem_1fr]">
        <aside className="h-fit rounded-2xl bg-white p-3 shadow-card ring-1 ring-slate-100">
          <div className="mb-2 border-b border-slate-100 px-3 pb-3"><p className="font-bold text-navy-900">{customer.name}</p><p className="truncate text-xs text-slate-500">{customer.email}</p></div>
          <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label="Account">
            {links.map(([to, label, Icon, end]) => <NavLink key={to} to={to} end={end} className={({ isActive }) => cx('flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold', isActive ? 'bg-navy-900 text-white' : 'text-slate-700 hover:bg-slate-100')}><Icon className="h-4 w-4" />{label}</NavLink>)}
            <button onClick={() => { logout(); toast.info('Signed out.'); navigate('/'); }} className="flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"><LogOut className="h-4 w-4" />Sign out</button>
          </nav>
        </aside>
        <div className="min-w-0"><Outlet /></div>
      </div>
    </div>
  );
}

const useMyOrders = () => {
  const { customer } = useCustomer();
  const q = useAsync(() => ordersRepo.list(), [customer?.id]);
  const mine = (q.data || []).filter((o) => o.customerId === customer?.id || o.customer?.email?.toLowerCase() === customer?.email?.toLowerCase()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return { ...q, orders: mine };
};

export function AccountOverview() {
  useDocumentTitle('My account');
  const { customer } = useCustomer();
  const { orders, loading } = useMyOrders();
  const wish = useWishlist();
  const active = orders.filter((o) => !['Delivered', 'Cancelled'].includes(o.status)).length;
  const stats = [['Total orders', orders.length], ['In progress', active], ['Wishlist items', wish.ids.length]];
  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-navy-900">Hello, {customer.name.split(' ')[0]}</h1>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">{stats.map(([l, n]) => <div key={l} className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100"><p className="text-sm text-slate-500">{l}</p><p className="font-display text-3xl font-extrabold text-navy-900">{loading ? '…' : n}</p></div>)}</div>
      <h2 className="mb-3 mt-8 font-display text-lg font-bold text-navy-900">Recent orders</h2>
      {loading ? <PageLoader className="min-h-[10rem]" /> : orders.length === 0 ? <EmptyState icon={Package} title="No orders yet" message="Your demo orders will show up here." action={{ label: 'Start shopping', to: '/products' }} /> : (
        <div className="space-y-3">{orders.slice(0, 3).map((o) => <Link key={o.id} to={`/account/orders/${o.id}`} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-100 hover:ring-brand-300"><div><p className="font-bold text-navy-900">{o.orderNo}</p><p className="text-xs text-slate-500">{formatDate(o.createdAt)} · {o.items.length} item(s)</p></div><div className="text-right"><StatusBadge status={o.status} /><p className="mt-1 text-sm font-semibold">{formatINR(o.total)}</p></div></Link>)}</div>
      )}
    </div>
  );
}

export function AccountOrders() {
  useDocumentTitle('My orders');
  const { orders, loading } = useMyOrders();
  const [page, setPage] = useState(1);
  const pg = paginate(orders, page, 6);
  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-navy-900">My orders</h1>
      <div className="mt-5">
        {loading ? <PageLoader className="min-h-[10rem]" /> : orders.length === 0 ? <EmptyState icon={Package} title="No orders yet" action={{ label: 'Browse products', to: '/products' }} /> : (
          <>
            <div className="space-y-3">{pg.rows.map((o) => (
              <div key={o.id} className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-100">
                <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-bold text-navy-900">{o.orderNo}</p><p className="text-xs text-slate-500">{formatDate(o.createdAt)}</p></div><StatusBadge status={o.status} /></div>
                <p className="mt-2 line-clamp-1 text-sm text-slate-600">{o.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}</p>
                <div className="mt-3 flex items-center justify-between"><p className="font-display text-lg font-extrabold text-navy-900">{formatINR(o.total)}</p><Button size="sm" variant="secondary" to={`/account/orders/${o.id}`}>View details</Button></div>
              </div>))}</div>
            <div className="mt-6"><Pagination page={pg.page} pages={pg.pages} onChange={setPage} total={pg.total} pageSize={pg.pageSize} /></div>
          </>
        )}
      </div>
    </div>
  );
}

export function AccountOrderDetail() {
  const { id } = useParams();
  const { customer } = useCustomer();
  const toast = useToast();
  const confirm = useConfirm();
  const cart = useCart();
  const navigate = useNavigate();
  const { data: order, loading, reload } = useAsync(() => ordersRepo.get(id), [id]);
  const [busy, setBusy] = useState(false);
  useDocumentTitle(order ? `Order ${order.orderNo}` : 'Order');
  if (loading) return <PageLoader />;
  if (!order || (order.customerId !== customer.id && order.customer?.email?.toLowerCase() !== customer.email.toLowerCase())) return <EmptyState icon={Package} title="Order not found" action={{ label: 'Back to orders', to: '/account/orders' }} />;
  const canCancel = ['Placed', 'Design Approval'].includes(order.status);
  const doCancel = async () => {
    if (!(await confirm({ title: 'Cancel this order?', message: 'Orders can be cancelled until production starts. This cannot be undone.', confirmLabel: 'Cancel order', danger: true }))) return;
    setBusy(true);
    try { await cancelOrder(order.id); toast.success('Order cancelled.'); reload(); } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  const reorder = () => {
    order.items.forEach((it) => cart.addItem({ productId: it.productId, options: it.options, printMethodId: it.printMethodId, qty: it.qty, logo: it.logo || null, notes: '' }));
    toast.success('Items added to your cart.');
    navigate('/cart');
  };
  return (
    <div>
      <Link to="/account/orders" className="text-sm font-semibold text-brand-600 hover:underline">← All orders</Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3"><h1 className="font-display text-2xl font-extrabold text-navy-900">Order {order.orderNo}</h1><StatusBadge status={order.status} /></div>
      <p className="text-sm text-slate-500">Placed {formatDate(order.createdAt)} · {order.paymentMethod} · <Badge tone={order.paymentStatus.startsWith('Paid') ? 'green' : 'amber'}>{order.paymentStatus}</Badge></p>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100"><h2 className="mb-4 font-bold text-navy-900">Tracking</h2><OrderTimeline order={order} /></section>
        <section className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100"><h2 className="font-bold text-navy-900">Items</h2><OrderItems order={order} /><div className="border-t border-slate-100 pt-3"><OrderTotals order={order} /></div></section>
      </div>
      <div className="mt-6 flex flex-wrap gap-3"><Button onClick={reorder}>Reorder these items</Button>{canCancel ? <Button variant="danger" loading={busy} onClick={doCancel}>Cancel order</Button> : null}<Button variant="secondary" to="/contact">Need help?</Button></div>
    </div>
  );
}

const EMPTY_ADDR = { label: 'Home', name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '' };
export function AccountAddresses() {
  useDocumentTitle('Addresses');
  const { customer, refresh } = useCustomer();
  const toast = useToast();
  const confirm = useConfirm();
  const [editing, setEditing] = useState(null);
  const [errors, setErrors] = useState({});
  const addresses = customer.addresses || [];
  const save = async () => {
    const res = validate(editing, { name: ['required'], phone: ['required', 'phone'], line1: ['required', { minLength: 5 }], city: ['required'], state: ['required'], pincode: ['required', { pattern: /^[1-9][0-9]{5}$/, message: 'Enter a valid 6-digit PIN code.' }] }, { line1: 'Address', pincode: 'PIN code' });
    setErrors(res.errors);
    if (!res.valid) return;
    const next = editing.id ? addresses.map((a) => (a.id === editing.id ? editing : a)) : [...addresses, { ...editing, id: uid('addr'), isDefault: addresses.length === 0 }];
    await customersRepo.update(customer.id, { addresses: next });
    await refresh();
    setEditing(null);
    toast.success('Address saved.');
  };
  const remove = async (a) => {
    if (!(await confirm({ title: 'Delete address?', message: `${a.label}: ${a.line1}`, confirmLabel: 'Delete', danger: true }))) return;
    const rest = addresses.filter((x) => x.id !== a.id);
    if (a.isDefault && rest[0]) rest[0] = { ...rest[0], isDefault: true };
    await customersRepo.update(customer.id, { addresses: rest });
    await refresh();
    toast.success('Address deleted.');
  };
  const makeDefault = async (a) => { await customersRepo.update(customer.id, { addresses: addresses.map((x) => ({ ...x, isDefault: x.id === a.id })) }); await refresh(); toast.success('Default address updated.'); };
  const f = (k) => (e) => setEditing((s) => ({ ...s, [k]: e.target.value }));
  return (
    <div>
      <div className="flex items-center justify-between"><h1 className="font-display text-2xl font-extrabold text-navy-900">Saved addresses</h1><Button size="sm" icon={Plus} onClick={() => { setErrors({}); setEditing({ ...EMPTY_ADDR, name: customer.name, phone: customer.phone || '' }); }}>Add address</Button></div>
      {addresses.length === 0 ? <EmptyState className="mt-5" icon={MapPin} title="No saved addresses" message="Add an address to speed up checkout." /> : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">{addresses.map((a) => (
          <div key={a.id} className="rounded-2xl bg-white p-5 text-sm shadow-card ring-1 ring-slate-100">
            <div className="flex items-center justify-between"><p className="font-bold text-navy-900">{a.label}</p>{a.isDefault ? <Badge tone="green">Default</Badge> : null}</div>
            <p className="mt-2 text-slate-600">{a.name} · {a.phone}<br />{a.line1}{a.line2 ? `, ${a.line2}` : ''}<br />{a.city}, {a.state} {a.pincode}</p>
            <div className="mt-3 flex flex-wrap gap-2"><Button size="xs" variant="secondary" onClick={() => { setErrors({}); setEditing(a); }}>Edit</Button>{!a.isDefault ? <Button size="xs" variant="soft" onClick={() => makeDefault(a)}>Make default</Button> : null}<Button size="xs" variant="ghost" icon={Trash2} onClick={() => remove(a)}>Delete</Button></div>
          </div>))}</div>
      )}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Edit address' : 'Add address'} footer={<><Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={save}>Save address</Button></>}>
        {editing ? <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Label" value={editing.label} onChange={f('label')} /><Input label="Full name" required value={editing.name} onChange={f('name')} error={errors.name} />
          <Input label="Phone" required value={editing.phone} onChange={f('phone')} error={errors.phone} /><Input label="PIN code" required maxLength={6} value={editing.pincode} onChange={f('pincode')} error={errors.pincode} />
          <Input label="Address line 1" required className="sm:col-span-2" value={editing.line1} onChange={f('line1')} error={errors.line1} /><Input label="Address line 2" className="sm:col-span-2" value={editing.line2} onChange={f('line2')} />
          <Input label="City" required value={editing.city} onChange={f('city')} error={errors.city} /><Input label="State" required value={editing.state} onChange={f('state')} error={errors.state} />
        </div> : null}
      </Modal>
    </div>
  );
}

export function AccountProfile() {
  useDocumentTitle('Profile');
  const { customer, refresh } = useCustomer();
  const toast = useToast();
  const [v, setV] = useState({ name: customer.name, phone: customer.phone || '', company: customer.company || '', gstin: customer.gstin || '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    const res = validate(v, { name: ['required', { minLength: 2 }], phone: ['required', 'phone'] });
    setErrors(res.errors);
    if (!res.valid) return;
    setBusy(true);
    await customersRepo.update(customer.id, v);
    await refresh();
    setBusy(false);
    toast.success('Profile updated.');
  };
  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-navy-900">Profile</h1>
      <form onSubmit={submit} noValidate className="mt-5 grid max-w-xl gap-4 rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100 sm:grid-cols-2">
        <Input label="Full name" required value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} error={errors.name} />
        <Input label="Email" value={customer.email} disabled hint="Email cannot be changed in the demo." />
        <Input label="Phone" required value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} error={errors.phone} />
        <Input label="Company" value={v.company} onChange={(e) => setV({ ...v, company: e.target.value })} />
        <Input label="GSTIN" className="sm:col-span-2" value={v.gstin} onChange={(e) => setV({ ...v, gstin: e.target.value })} />
        <div className="sm:col-span-2"><Button type="submit" loading={busy}>Save changes</Button></div>
      </form>
    </div>
  );
}

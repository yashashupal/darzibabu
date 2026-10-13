import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Download, Printer, ShoppingBag } from 'lucide-react';
import { ordersRepo, updateOrderStatus } from '../../services/api';
import { useAsync, useCollection } from '../../hooks/useAsync';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { PageHeader, Panel, Toolbar } from '../../components/admin/AdminUI';
import Button from '../../components/ui/Button';
import DataTable, { sortRows } from '../../components/ui/DataTable';
import Pagination, { paginate } from '../../components/ui/Pagination';
import { Select, Textarea } from '../../components/ui/Form';
import { EmptyState, PageLoader, StatusBadge } from '../../components/ui/Feedback';
import { SearchInput } from '../../components/ui/Misc';
import OrderTimeline from '../../components/store/OrderTimeline';
import { OrderItems, OrderTotals } from '../store/OrderConfirmationPage';
import { ALL_ORDER_STATUSES, PAYMENT_STATUSES } from '../../config/brand';
import { downloadText, formatDate, formatDateTime, formatINR, toCSV } from '../../utils/format';

export function OrdersAdmin() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { items, loading } = useCollection('orders');
  const [q, setQ] = useState(params.get('q') || '');
  const [status, setStatus] = useState(params.get('status') || '');
  const [pay, setPay] = useState('');
  const [sort, setSort] = useState({ key: 'createdAt', dir: 'desc' });
  const [page, setPage] = useState(1);
  useEffect(() => { setQ(params.get('q') || ''); }, [params]);

  const rows = useMemo(() => {
    let r = items;
    if (q.trim()) r = r.filter((o) => [o.orderNo, o.customer.name, o.customer.email, o.customer.company].join(' ').toLowerCase().includes(q.toLowerCase()));
    if (status) r = r.filter((o) => o.status === status);
    if (pay) r = r.filter((o) => o.paymentStatus === pay);
    return sortRows(r, sort, { customer: (o) => o.customer.name, items: (o) => o.items.length });
  }, [items, q, status, pay, sort]);
  const pg = paginate(rows, page, 10);
  const exportCsv = () => { downloadText('orders.csv', toCSV([['Order', 'Date', 'Customer', 'Email', 'Status', 'Payment', 'Total'], ...rows.map((o) => [o.orderNo, formatDate(o.createdAt), o.customer.name, o.customer.email, o.status, o.paymentStatus, o.total])])); toast.success('Orders exported.'); };

  const cols = [
    { key: 'orderNo', header: 'Order', sortable: true, render: (o) => <span className="font-bold text-navy-900">{o.orderNo}</span> },
    { key: 'createdAt', header: 'Date', sortable: true, render: (o) => formatDate(o.createdAt) },
    { key: 'customer', header: 'Customer', sortable: true, render: (o) => <div><p className="font-semibold">{o.customer.name}</p><p className="text-xs text-slate-500">{o.customer.company || o.customer.email}</p></div> },
    { key: 'items', header: 'Items', sortable: true, render: (o) => o.items.reduce((s, i) => s + i.qty, 0) + ' pcs' },
    { key: 'paymentStatus', header: 'Payment', sortable: true, render: (o) => <StatusBadge status={o.paymentStatus} /> },
    { key: 'status', header: 'Status', sortable: true, render: (o) => <StatusBadge status={o.status} /> },
    { key: 'total', header: 'Total', sortable: true, align: 'right', render: (o) => <span className="font-semibold">{formatINR(o.total)}</span> },
  ];
  return (
    <div>
      <PageHeader title="Orders" subtitle="Review orders, update production status and track payments." actions={<Button variant="secondary" size="sm" icon={Download} onClick={exportCsv} disabled={!rows.length}>Export CSV</Button>} />
      <Toolbar>
        <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); if (!v) setParams({}); }} placeholder="Search order, name or email" className="sm:w-72" />
        <div className="sm:w-48"><Select aria-label="Filter by status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} placeholder="All statuses" options={ALL_ORDER_STATUSES} /></div>
        <div className="sm:w-48"><Select aria-label="Filter by payment" value={pay} onChange={(e) => { setPay(e.target.value); setPage(1); }} placeholder="All payments" options={PAYMENT_STATUSES} /></div>
        <p className="text-xs text-slate-500 sm:ml-auto">{rows.length} of {items.length} orders</p>
      </Toolbar>
      {loading ? <PageLoader /> : items.length === 0 ? <EmptyState icon={ShoppingBag} title="No orders yet" message="Orders placed on the storefront will appear here." /> : (
        <div className="space-y-4">
          <DataTable columns={cols} rows={pg.rows} sort={sort} onSort={(k) => setSort((s) => (s.key === k ? { key: k, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key: k, dir: 'asc' }))} onRowClick={(o) => navigate(`/admin/orders/${o.id}`)} empty="No orders match your filters." />
          <Pagination page={pg.page} pages={pg.pages} total={pg.total} pageSize={pg.pageSize} onChange={setPage} />
        </div>
      )}
    </div>
  );
}

export function OrderDetailAdmin() {
  const { id } = useParams();
  const toast = useToast();
  const confirm = useConfirm();
  const { data: order, loading, reload } = useAsync(() => ordersRepo.get(id), [id]);
  const [status, setStatus] = useState('');
  const [payment, setPayment] = useState('');
  const [note, setNote] = useState('');
  const [internal, setInternal] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => { if (order) { setStatus(order.status); setPayment(order.paymentStatus); setInternal(order.notes || ''); setNote(''); } }, [order?.id, order?.status, order?.paymentStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <PageLoader />;
  if (!order) return <EmptyState icon={ShoppingBag} title="Order not found" action={{ label: 'Back to orders', to: '/admin/orders' }} />;

  const save = async () => {
    setErr('');
    if (status === 'Cancelled' && order.status !== 'Cancelled' && !note.trim()) return setErr('Add a note explaining why the order is cancelled.');
    if (status === order.status && payment === order.paymentStatus && !note.trim()) return toast.info('Nothing to update.');
    if (status === 'Cancelled' && order.status !== 'Cancelled' && !(await confirm({ title: 'Cancel this order?', message: 'The customer will see it as cancelled.', confirmLabel: 'Cancel order', danger: true }))) return;
    setBusy(true);
    try { await updateOrderStatus(order.id, status, note.trim(), payment); toast.success(`Order ${order.orderNo} updated.`); reload(true); } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  const saveNotes = async () => { await ordersRepo.update(order.id, { notes: internal }); toast.success('Internal notes saved.'); reload(true); };
  const a = order.shippingAddress;
  const logos = order.items.filter((i) => i.logo?.dataUrl);

  return (
    <div>
      <PageHeader back={{ to: '/admin/orders', label: 'All orders' }} title={`Order ${order.orderNo}`} subtitle={`Placed ${formatDateTime(order.createdAt)} · ${order.paymentMethod}`} actions={<><StatusBadge status={order.status} /><Button size="sm" variant="secondary" icon={Printer} onClick={() => window.print()}>Print</Button></>} />
      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <div className="space-y-6">
          <Panel title="Items"><OrderItems order={order} /><div className="mt-2 border-t border-slate-100 pt-3"><OrderTotals order={order} /></div></Panel>
          {logos.length ? <Panel title="Customer artwork"><div className="grid gap-4 sm:grid-cols-2">{logos.map((i, k) => <div key={k} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"><img src={i.logo.dataUrl} alt={i.logoName} className="h-16 w-16 rounded bg-white object-contain p-1 ring-1 ring-slate-200" /><div className="min-w-0 text-xs text-slate-600"><p className="truncate font-semibold text-navy-900">{i.logoName}</p><p>For: {i.name}</p><p>Placement: {i.logo.placement?.id}</p><a href={i.logo.dataUrl} download={i.logoName} className="font-semibold text-brand-600 hover:underline">Download file</a></div></div>)}</div></Panel> : null}
          <Panel title="Status history"><OrderTimeline order={order} /></Panel>
        </div>
        <div className="space-y-6">
          <Panel title="Update order">
            <div className="space-y-4">
              <Select label="Order status" value={status} onChange={(e) => setStatus(e.target.value)} options={ALL_ORDER_STATUSES} />
              <Select label="Payment status" value={payment} onChange={(e) => setPayment(e.target.value)} options={PAYMENT_STATUSES} />
              <Textarea label="Note for the customer timeline" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Proof sent to your email." error={err} />
              <Button className="w-full" onClick={save} loading={busy}>Save update</Button>
              {order.status !== 'Delivered' && order.status !== 'Cancelled' ? <Button className="w-full" variant="soft" onClick={() => { const i = ALL_ORDER_STATUSES.indexOf(order.status); setStatus(ALL_ORDER_STATUSES[Math.min(i + 1, 5)]); }}>Select next stage</Button> : null}
            </div>
          </Panel>
          <Panel title="Customer"><p className="font-semibold text-navy-900">{order.customer.name}</p><p className="text-sm text-slate-600">{order.customer.company}</p><p className="text-sm"><a className="text-brand-600 hover:underline" href={`mailto:${order.customer.email}`}>{order.customer.email}</a></p><p className="text-sm text-slate-600">{order.customer.phone}</p>{order.customer.gstin ? <p className="text-xs text-slate-500">GSTIN: {order.customer.gstin}</p> : null}<Link className="mt-2 inline-block text-xs font-semibold text-brand-600 hover:underline" to={`/admin/orders?q=${encodeURIComponent(order.customer.email)}`}>All orders by this customer</Link></Panel>
          <Panel title="Shipping address"><p className="text-sm text-slate-600">{a.name}<br />{a.line1}{a.line2 ? `, ${a.line2}` : ''}<br />{a.city}, {a.state} {a.pincode}<br />{a.phone}</p><p className="mt-2 text-xs text-slate-500">{order.shippingMethodLabel}</p></Panel>
          <Panel title="Order notes (customer and internal)"><Textarea aria-label="Internal notes" rows={3} value={internal} onChange={(e) => setInternal(e.target.value)} placeholder="Only visible to admins" /><Button className="mt-3" size="sm" variant="secondary" onClick={saveNotes}>Save notes</Button>{order.notes ? null : null}</Panel>
        </div>
      </div>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { TriangleAlert, IndianRupee, ShoppingBag, TrendingUp, Users } from 'lucide-react';
import { useCollection } from '../../hooks/useAsync';
import { PageHeader, Panel, StatCard } from '../../components/admin/AdminUI';
import { BarChart, Donut, HBars } from '../../components/admin/Charts';
import { PageLoader, StatusBadge } from '../../components/ui/Feedback';
import { Select } from '../../components/ui/Form';
import { Img } from '../../components/ui/Misc';
import { ALL_ORDER_STATUSES } from '../../config/brand';
import { formatDate, formatINR, formatNumber } from '../../utils/format';

const dayKey = (d) => new Date(d).toISOString().slice(0, 10);

export default function DashboardPage() {
  const [range, setRange] = useState('30');
  const { items: orders, loading } = useCollection('orders');
  const { items: customers } = useCollection('customers');
  const { items: products } = useCollection('products');
  const { items: categories } = useCollection('categories');

  const d = useMemo(() => {
    const days = Number(range);
    const since = Date.now() - days * 86400000;
    const inRange = orders.filter((o) => new Date(o.createdAt).getTime() >= since);
    const valid = inRange.filter((o) => o.status !== 'Cancelled');
    const revenue = valid.reduce((s, o) => s + o.total, 0);
    const byDay = {};
    valid.forEach((o) => { const k = dayKey(o.createdAt); byDay[k] = (byDay[k] || 0) + o.total; });
    const bucket = days > 30 ? 7 : 1;
    const series = [];
    for (let i = days - 1; i >= 0; i -= bucket) {
      let v = 0; let label = '';
      for (let j = 0; j < bucket && i - j >= 0; j++) { const dt = new Date(Date.now() - (i - j) * 86400000); v += byDay[dayKey(dt)] || 0; if (j === 0) label = dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }); }
      series.push({ label, value: v });
    }
    const status = ALL_ORDER_STATUSES.map((s) => ({ label: s, value: inRange.filter((o) => o.status === s).length }));
    const prodRev = {}; const catRev = {};
    valid.forEach((o) => o.items.forEach((it) => {
      prodRev[it.productId] = prodRev[it.productId] || { name: it.name, image: it.image, value: 0, qty: 0 };
      prodRev[it.productId].value += it.unit * it.qty; prodRev[it.productId].qty += it.qty;
      const p = products.find((x) => x.id === it.productId);
      const c = categories.find((x) => x.id === p?.categoryId)?.name || 'Other';
      catRev[c] = (catRev[c] || 0) + it.unit * it.qty;
    }));
    return {
      revenue, count: inRange.length, aov: valid.length ? revenue / valid.length : 0,
      newCustomers: customers.filter((c) => new Date(c.createdAt).getTime() >= since).length,
      pending: orders.filter((o) => ['Placed', 'Design Approval'].includes(o.status)).length,
      series, status, top: Object.values(prodRev).sort((a, b) => b.value - a.value).slice(0, 5),
      cats: Object.entries(catRev).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 7),
    };
  }, [orders, customers, products, categories, range]);

  const low = useMemo(() => products.flatMap((p) => (p.inventory || []).filter((r) => r.stock <= Math.min(60, p.lowStockThreshold || 60)).map((r) => ({ p, r }))).sort((a, b) => a.r.stock - b.r.stock).slice(0, 6), [products]);

  if (loading) return <PageLoader />;
  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Performance overview from this browser's demo data." actions={<div className="w-44"><Select aria-label="Date range" value={range} onChange={(e) => setRange(e.target.value)} options={[{ value: '7', label: 'Last 7 days' }, { value: '30', label: 'Last 30 days' }, { value: '90', label: 'Last 90 days' }]} /></div>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenue" value={formatINR(d.revenue)} hint="Excludes cancelled orders" icon={IndianRupee} tone="green" />
        <StatCard label="Orders" value={formatNumber(d.count)} hint={`${d.pending} awaiting action (all time)`} icon={ShoppingBag} tone="navy" />
        <StatCard label="Average order value" value={formatINR(d.aov)} icon={TrendingUp} tone="pink" />
        <StatCard label="New customers" value={formatNumber(d.newCustomers)} icon={Users} tone="amber" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel title={`Revenue (${range} days${Number(range) > 30 ? ', weekly' : ''})`} className="xl:col-span-2"><BarChart data={d.series} every={Number(range) > 30 ? 1 : Number(range) > 7 ? 4 : 1} /></Panel>
        <Panel title="Orders by status"><HBars data={d.status.filter((s) => s.value > 0 || s.label !== 'Cancelled')} format={(n) => `${n}`} /></Panel>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel title="Top products by revenue">
          {d.top.length === 0 ? <p className="text-sm text-slate-500">No sales in this period.</p> : <ul className="space-y-3">{d.top.map((t) => <li key={t.name} className="flex items-center gap-3"><Img src={t.image} alt="" className="h-10 w-10 rounded-lg object-cover" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-navy-900">{t.name}</span><span className="text-xs text-slate-500">{formatNumber(t.qty)} pcs</span></span><span className="text-sm font-bold">{formatINR(t.value)}</span></li>)}</ul>}
        </Panel>
        <Panel title="Revenue by category">{d.cats.length ? <Donut data={d.cats} /> : <p className="text-sm text-slate-500">No sales in this period.</p>}</Panel>
        <Panel title="Low stock alerts" action={<Link to="/admin/inventory" className="text-xs font-semibold text-brand-600 hover:underline">Manage</Link>}>
          {low.length === 0 ? <p className="text-sm text-slate-500">All variants are well stocked.</p> : <ul className="space-y-2.5">{low.map(({ p, r }) => <li key={p.id + r.sku + JSON.stringify(r.options)} className="flex items-center gap-2 text-sm"><TriangleAlert className={`h-4 w-4 shrink-0 ${r.stock === 0 ? 'text-red-500' : 'text-amber-500'}`} /><span className="min-w-0 flex-1 truncate"><b className="text-navy-900">{p.name}</b> <span className="text-xs text-slate-500">{Object.values(r.options).join(' / ')}</span></span><span className={`font-bold ${r.stock === 0 ? 'text-red-600' : 'text-amber-700'}`}>{r.stock}</span></li>)}</ul>}
        </Panel>
      </div>
      <Panel title="Recent orders" className="mt-6" action={<Link to="/admin/orders" className="text-xs font-semibold text-brand-600 hover:underline">View all</Link>}>
        <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="py-2 pr-4">Order</th><th className="pr-4">Customer</th><th className="pr-4">Date</th><th className="pr-4">Status</th><th className="text-right">Total</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{orders.slice(0, 6).map((o) => <tr key={o.id}><td className="py-2.5 pr-4"><Link to={`/admin/orders/${o.id}`} className="font-bold text-navy-900 hover:text-brand-600">{o.orderNo}</Link></td><td className="pr-4">{o.customer.name}</td><td className="pr-4 text-slate-500">{formatDate(o.createdAt)}</td><td className="pr-4"><StatusBadge status={o.status} /></td><td className="text-right font-semibold">{formatINR(o.total)}</td></tr>)}</tbody></table></div>
      </Panel>
    </div>
  );
}

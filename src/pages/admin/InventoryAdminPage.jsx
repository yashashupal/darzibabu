import { useMemo, useState } from 'react';
import { Boxes, Plus } from 'lucide-react';
import { productsRepo } from '../../services/api';
import { useCollection } from '../../hooks/useAsync';
import { useToast } from '../../context/ToastContext';
import { PageHeader, StatCard, Toolbar } from '../../components/admin/AdminUI';
import Button from '../../components/ui/Button';
import DataTable, { sortRows } from '../../components/ui/DataTable';
import Pagination, { paginate } from '../../components/ui/Pagination';
import { Select } from '../../components/ui/Form';
import { Badge, EmptyState, PageLoader } from '../../components/ui/Feedback';
import { Img, SearchInput } from '../../components/ui/Misc';
import { formatNumber } from '../../utils/format';

function StockInput({ value, onSave }) {
  const [v, setV] = useState(String(value));
  const [saving, setSaving] = useState(false);
  const commit = async () => {
    const n = Math.max(0, Math.floor(Number(v)));
    if (Number.isNaN(n)) return setV(String(value));
    setV(String(n));
    if (n !== value) { setSaving(true); await onSave(n); setSaving(false); }
  };
  return <input aria-label="Stock quantity" type="number" min="0" value={v} disabled={saving} onChange={(e) => setV(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} className="h-9 w-24 rounded-lg border border-slate-300 px-2 text-right text-sm focus:border-navy-500 focus:outline-none focus:ring-4 focus:ring-navy-100 disabled:opacity-50" />;
}

export default function InventoryAdminPage() {
  const toast = useToast();
  const { items: products, loading } = useCollection('products');
  const { items: cats } = useCollection('categories');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [state, setState] = useState('');
  const [sort, setSort] = useState({ key: 'stock', dir: 'asc' });
  const [page, setPage] = useState(1);

  const flat = useMemo(() => products.flatMap((p) => (p.inventory || []).map((r, i) => ({ id: `${p.id}:${i}`, p, i, variant: Object.values(r.options).join(' / ') || 'Default', sku: r.sku, stock: Number(r.stock), threshold: p.lowStockThreshold ?? 100 }))), [products]);
  const rows = useMemo(() => {
    let r = flat;
    if (q.trim()) r = r.filter((x) => (x.p.name + x.variant + x.sku).toLowerCase().includes(q.toLowerCase()));
    if (cat) r = r.filter((x) => x.p.categoryId === cat);
    if (state === 'out') r = r.filter((x) => x.stock <= 0);
    if (state === 'low') r = r.filter((x) => x.stock > 0 && x.stock <= x.threshold);
    if (state === 'in') r = r.filter((x) => x.stock > x.threshold);
    return sortRows(r, sort, { product: (x) => x.p.name });
  }, [flat, q, cat, state, sort]);
  const pg = paginate(rows, page, 15);
  const out = flat.filter((x) => x.stock <= 0).length;
  const low = flat.filter((x) => x.stock > 0 && x.stock <= x.threshold).length;

  const setStock = async (row, stock) => {
    try {
      const fresh = await productsRepo.get(row.p.id);
      const inv = fresh.inventory.map((r, i) => (i === row.i ? { ...r, stock } : r));
      await productsRepo.update(row.p.id, { inventory: inv });
      toast.success(`Stock updated: ${row.p.name} (${row.variant}) → ${stock}`);
    } catch (e) { toast.error(e.message); }
  };

  const cols = [
    { key: 'product', header: 'Product', sortable: true, render: (r) => <div className="flex items-center gap-3"><Img src={r.p.images[0]} alt="" className="h-10 w-10 rounded-lg object-cover" /><span className="font-semibold text-navy-900">{r.p.name}</span></div> },
    { key: 'variant', header: 'Variant', sortable: true },
    { key: 'sku', header: 'SKU', sortable: true, render: (r) => <span className="text-xs text-slate-500">{r.sku}</span> },
    { key: 'stock', header: 'Stock', sortable: true, render: (r) => <StockInput key={`${r.id}-${r.stock}`} value={r.stock} onSave={(n) => setStock(r, n)} /> },
    { key: 'state', header: 'Status', render: (r) => (r.stock <= 0 ? <Badge tone="red">Out of stock</Badge> : r.stock <= r.threshold ? <Badge tone="amber">Low stock</Badge> : <Badge tone="green">In stock</Badge>) },
    { key: 'actions', header: 'Quick add', align: 'right', render: (r) => <Button size="xs" variant="soft" icon={Plus} onClick={() => setStock(r, r.stock + 100)}>100</Button> },
  ];
  return (
    <div>
      <PageHeader title="Inventory" subtitle="Edit stock per variant. Type a number and press Enter or click away to save. Orders placed on the storefront reduce stock automatically." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Tracked variants" value={formatNumber(flat.length)} icon={Boxes} />
        <StatCard label="Low stock" value={low} tone="amber" hint="At or below each product's threshold" />
        <StatCard label="Out of stock" value={out} tone="pink" />
      </div>
      <Toolbar>
        <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search product, variant or SKU" className="sm:w-72" />
        <div className="sm:w-52"><Select aria-label="Filter by category" value={cat} onChange={(e) => { setCat(e.target.value); setPage(1); }} placeholder="All categories" options={cats.map((c) => ({ value: c.id, label: c.name }))} /></div>
        <div className="sm:w-44"><Select aria-label="Filter by stock level" value={state} onChange={(e) => { setState(e.target.value); setPage(1); }} placeholder="All levels" options={[{ value: 'out', label: 'Out of stock' }, { value: 'low', label: 'Low stock' }, { value: 'in', label: 'In stock' }]} /></div>
      </Toolbar>
      {loading ? <PageLoader /> : flat.length === 0 ? <EmptyState icon={Boxes} title="No inventory tracked" message="Add products with variants to track stock here." action={{ label: 'Add product', to: '/admin/products/new' }} /> : (
        <div className="space-y-4">
          <DataTable columns={cols} rows={pg.rows} sort={sort} onSort={(k) => setSort((s) => (s.key === k ? { key: k, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key: k, dir: 'asc' }))} dense empty="No variants match your filters." />
          <Pagination page={pg.page} pages={pg.pages} total={pg.total} pageSize={pg.pageSize} onChange={setPage} />
        </div>
      )}
    </div>
  );
}

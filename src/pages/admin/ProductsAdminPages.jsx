import { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, Copy, ExternalLink, Package, Pencil, Plus, Trash2 } from 'lucide-react';
import { productsRepo } from '../../services/api';
import { useAsync, useCollection } from '../../hooks/useAsync';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { PageHeader, Panel, Toolbar } from '../../components/admin/AdminUI';
import ImagePicker from '../../components/admin/ImagePicker';
import Button from '../../components/ui/Button';
import DataTable, { sortRows } from '../../components/ui/DataTable';
import Pagination, { paginate } from '../../components/ui/Pagination';
import { Checkbox, Input, Select, Textarea, Toggle } from '../../components/ui/Form';
import { EmptyState, PageLoader, StatusBadge, Badge } from '../../components/ui/Feedback';
import { Img, SearchInput } from '../../components/ui/Misc';
import TierTable from '../../components/store/TierTable';
import { buildInventory, startingPrice, stockStatus, totalStock } from '../../utils/pricing';
import { formatINR, slugify } from '../../utils/format';

export function ProductsAdmin() {
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const { items, loading } = useCollection('products');
  const { items: cats } = useCollection('categories');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' });
  const [page, setPage] = useState(1);

  const rows = useMemo(() => {
    let r = items;
    if (q.trim()) r = r.filter((p) => (p.name + ' ' + p.slug + ' ' + (p.tags || []).join(' ')).toLowerCase().includes(q.toLowerCase()));
    if (cat) r = r.filter((p) => p.categoryId === cat);
    if (status) r = r.filter((p) => p.status === status);
    return sortRows(r, sort, { price: startingPrice, stock: totalStock, category: (p) => cats.find((c) => c.id === p.categoryId)?.name || '' });
  }, [items, q, cat, status, sort, cats]);
  const pg = paginate(rows, page, 10);

  const duplicate = async (p) => {
    const { id, createdAt, updatedAt, ...rest } = p;
    let slug = `${p.slug}-copy`;
    let n = 2;
    while (items.some((x) => x.slug === slug)) slug = `${p.slug}-copy-${n++}`;
    const copy = await productsRepo.create({ ...rest, name: `${p.name} (Copy)`, slug, status: 'draft', featured: false, bestSeller: false, rating: 0, reviewCount: 0 });
    toast.success('Product duplicated as a draft.');
    navigate(`/admin/products/${copy.id}`);
  };
  const remove = async (p) => {
    if (!(await confirm({ title: 'Delete product?', message: `"${p.name}" will be removed from the catalogue. Existing orders keep their own copy of the item details.`, confirmLabel: 'Delete product', danger: true }))) return;
    await productsRepo.remove(p.id);
    toast.success('Product deleted.');
  };

  const cols = [
    { key: 'image', header: 'Image', render: (p) => <Img src={p.images[0]} alt="" className="h-12 w-12 rounded-lg object-cover" /> },
    { key: 'name', header: 'Product', sortable: true, render: (p) => <div><Link to={`/admin/products/${p.id}`} className="font-semibold text-navy-900 hover:text-brand-600">{p.name}</Link><p className="text-xs text-slate-500">/{p.slug}</p></div> },
    { key: 'category', header: 'Category', sortable: true, render: (p) => cats.find((c) => c.id === p.categoryId)?.name || '-' },
    { key: 'price', header: 'From', sortable: true, render: (p) => <span>{formatINR(startingPrice(p))}<span className="text-xs text-slate-500"> · MOQ {p.moq}</span></span> },
    { key: 'stock', header: 'Stock', sortable: true, render: (p) => { const s = stockStatus(p); return <Badge tone={s === 'out' ? 'red' : s === 'low' ? 'amber' : 'green'}>{totalStock(p).toLocaleString('en-IN')}{s === 'low' ? ' · low' : s === 'out' ? ' · out' : ''}</Badge>; } },
    { key: 'status', header: 'Published', sortable: true, render: (p) => <Toggle checked={p.status === 'published'} label={`Publish ${p.name}`} onChange={async (v) => { await productsRepo.update(p.id, { status: v ? 'published' : 'draft' }); toast.success(v ? 'Product published.' : 'Product moved to drafts.'); }} /> },
    { key: 'actions', header: 'Actions', align: 'right', render: (p) => (
      <div className="flex justify-end gap-1">
        <Button size="xs" variant="secondary" icon={Pencil} to={`/admin/products/${p.id}`}>Edit</Button>
        <Button size="xs" variant="ghost" icon={Copy} onClick={() => duplicate(p)} aria-label={`Duplicate ${p.name}`} />
        <Button size="xs" variant="ghost" icon={ExternalLink} to={`/product/${p.slug}`} target="_blank" aria-label={`View ${p.name} on storefront`} />
        <Button size="xs" variant="ghost" icon={Trash2} className="text-red-600 hover:bg-red-50" onClick={() => remove(p)} aria-label={`Delete ${p.name}`} />
      </div>) },
  ];
  return (
    <div>
      <PageHeader title="Products" subtitle="Manage the catalogue, pricing tiers, variants and publishing." actions={<Button size="sm" icon={Plus} to="/admin/products/new">Add product</Button>} />
      <Toolbar>
        <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search products" className="sm:w-72" />
        <div className="sm:w-52"><Select aria-label="Filter by category" value={cat} onChange={(e) => { setCat(e.target.value); setPage(1); }} placeholder="All categories" options={cats.map((c) => ({ value: c.id, label: c.name }))} /></div>
        <div className="sm:w-40"><Select aria-label="Filter by status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} placeholder="All statuses" options={['published', 'draft']} /></div>
        <p className="text-xs text-slate-500 sm:ml-auto">{rows.length} of {items.length} products</p>
      </Toolbar>
      {loading ? <PageLoader /> : items.length === 0 ? <EmptyState icon={Package} title="No products yet" message="Add your first product to start selling." action={{ label: 'Add product', to: '/admin/products/new' }} /> : (
        <div className="space-y-4">
          <DataTable columns={cols} rows={pg.rows} sort={sort} onSort={(k) => setSort((s) => (s.key === k ? { key: k, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key: k, dir: 'asc' }))} empty="No products match your filters." />
          <Pagination page={pg.page} pages={pg.pages} total={pg.total} pageSize={pg.pageSize} onChange={setPage} />
        </div>
      )}
    </div>
  );
}

const blank = (categoryId = '') => ({
  name: '', slug: '', categoryId, status: 'draft', featured: false, bestSeller: false, shortDescription: '', description: '', features: [], tags: [], images: [], moq: 10, leadTimeDays: 7, lowStockThreshold: 100,
  options: [], printMethods: [{ id: 'standard', label: 'Standard decoration', price: 0 }], tiers: [{ min: 10, price: 0 }, { min: 50, price: 0 }], inventory: [],
});

function validateProduct(p, all, id) {
  const e = {};
  if (!p.name.trim() || p.name.trim().length < 3) e.name = 'Name must be at least 3 characters.';
  if (!/^[a-z0-9-]+$/.test(p.slug)) e.slug = 'Slug may only contain lowercase letters, numbers and hyphens.';
  else if (all.some((x) => x.id !== id && x.slug === p.slug)) e.slug = 'This slug is already used by another product.';
  if (!p.categoryId) e.categoryId = 'Choose a category.';
  if (!p.shortDescription.trim()) e.shortDescription = 'Add a short description.';
  if (!p.images.length || p.images.some((i) => !i)) e.images = 'Add at least one image (remove empty slots).';
  if (!(Number(p.moq) >= 1)) e.moq = 'Minimum order must be at least 1.';
  if (!(Number(p.leadTimeDays) >= 1)) e.leadTimeDays = 'Lead time must be at least 1 day.';
  const mins = p.tiers.map((t) => Number(t.min));
  if (!p.tiers.length) e.tiers = 'Add at least one pricing tier.';
  else if (p.tiers.some((t) => !(Number(t.min) >= 1) || !(Number(t.price) > 0))) e.tiers = 'Every tier needs a quantity of 1 or more and a price above 0.';
  else if (new Set(mins).size !== mins.length) e.tiers = 'Tier quantities must be unique.';
  else {
    const sorted = [...p.tiers].sort((a, b) => a.min - b.min);
    if (sorted.some((t, i) => i && Number(t.price) > Number(sorted[i - 1].price))) e.tiers = 'Prices should not increase as quantity grows.';
  }
  const names = p.options.map((o) => o.name.trim().toLowerCase());
  if (p.options.some((o) => !o.name.trim())) e.options = 'Every option needs a name.';
  else if (new Set(names).size !== names.length) e.options = 'Option names must be unique.';
  else if (p.options.some((o) => !o.values.length)) e.options = 'Every option needs at least one value.';
  else if (p.options.some((o) => o.values.some((v) => !v.label.trim()) || new Set(o.values.map((v) => v.label.trim().toLowerCase())).size !== o.values.length)) e.options = 'Option values must be filled and unique within an option.';
  if (!p.printMethods.length || p.printMethods.some((m) => !m.label.trim())) e.printMethods = 'Add at least one decoration method with a label.';
  return e;
}

const SectionTitle = ({ children, error }) => <div className="mb-3"><h2 className="font-display text-base font-bold text-navy-900">{children}</h2>{error ? <p role="alert" className="mt-1 text-xs font-medium text-red-600">{error}</p> : null}</div>;

export function ProductEditorAdmin() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const toast = useToast();
  const { items: cats } = useCollection('categories');
  const { items: all } = useCollection('products');
  const { data: loaded, loading } = useAsync(() => (isNew ? Promise.resolve(null) : productsRepo.get(id)), [id]);
  const [p, setP] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (isNew) setP(blank(cats[0]?.id || ''));
    else if (loaded) setP(structuredClone(loaded));
  }, [loaded, isNew, cats.length === 0]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const h = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  if (loading || !p) return isNew || loading ? <PageLoader /> : <EmptyState icon={Package} title="Product not found" action={{ label: 'Back to products', to: '/admin/products' }} />;
  const set = (patch) => { setP((s) => ({ ...s, ...patch })); setDirty(true); };
  const setName = (name) => set({ name, ...(isNew && (!p.slug || p.slug === slugify(p.name)) ? { slug: slugify(name) } : {}) });
  const inv = buildInventory(p.options, p.inventory, 300);
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const stockOf = (r) => (p.inventory.find((x) => same(x.options, r.options)) || r).stock;
  const setStock = (r, stock) => set({ inventory: inv.map((x) => ({ ...x, stock: same(x.options, r.options) ? stock : stockOf(x) })) });
  const move = (arr, i, d) => { const a = [...arr]; const j = i + d; if (j < 0 || j >= a.length) return a; [a[i], a[j]] = [a[j], a[i]]; return a; };
  const setOption = (i, patch) => set({ options: p.options.map((o, k) => (k === i ? { ...o, ...patch } : o)) });
  const setValue = (i, j, patch) => setOption(i, { values: p.options[i].values.map((v, k) => (k === j ? { ...v, ...patch } : v)) });

  const save = async () => {
    const draft = { ...p, features: p.features, tiers: p.tiers.map((t) => ({ min: Number(t.min), price: Number(t.price) })), moq: Number(p.moq), leadTimeDays: Number(p.leadTimeDays), lowStockThreshold: Number(p.lowStockThreshold) || 0 };
    const errs = validateProduct(draft, all, p.id);
    setErrors(errs);
    if (Object.keys(errs).length) { toast.error('Please fix the highlighted problems.'); setTimeout(() => document.querySelector('[role="alert"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50); return; }
    setBusy(true);
    try {
      const sorted = [...draft.tiers].sort((a, b) => a.min - b.min);
      const payload = {
        ...draft, name: draft.name.trim(), tiers: sorted, basePrice: sorted[0].price, inventory: inv,
        options: draft.options.map((o) => ({ ...o, name: o.name.trim(), values: o.values.map((v) => ({ ...v, label: v.label.trim(), priceDelta: Number(v.priceDelta) || 0 })) })),
        printMethods: draft.printMethods.map((m) => ({ ...m, id: m.id || slugify(m.label), price: Number(m.price) || 0 })),
      };
      const saved = isNew ? await productsRepo.create({ ...payload, rating: 0, reviewCount: 0 }) : await productsRepo.update(p.id, payload);
      setDirty(false);
      toast.success(isNew ? 'Product created.' : 'Product saved.');
      if (isNew) navigate(`/admin/products/${saved.id}`, { replace: true });
      else setP(structuredClone(saved));
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  return (
    <div>
      <PageHeader back={{ to: '/admin/products', label: 'All products' }} title={isNew ? 'New product' : p.name || 'Edit product'} subtitle={dirty ? 'You have unsaved changes.' : isNew ? 'Fill in the details and save.' : 'All changes are saved to this browser.'}
        actions={<>{!isNew ? <Button size="sm" variant="secondary" icon={ExternalLink} to={`/product/${p.slug}`} target="_blank">View on store</Button> : null}<Button size="sm" onClick={save} loading={busy}>{isNew ? 'Create product' : 'Save changes'}</Button></>} />
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Panel><SectionTitle>Basic information</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Product name" required className="sm:col-span-2" value={p.name} onChange={(e) => setName(e.target.value)} error={errors.name} />
              <Input label="URL slug" required value={p.slug} onChange={(e) => set({ slug: e.target.value })} error={errors.slug} hint="/product/your-slug" />
              <Select label="Category" required value={p.categoryId} onChange={(e) => set({ categoryId: e.target.value })} error={errors.categoryId} placeholder="Select category" options={cats.map((c) => ({ value: c.id, label: c.name }))} />
              <Textarea label="Short description" required rows={2} className="sm:col-span-2" value={p.shortDescription} onChange={(e) => set({ shortDescription: e.target.value })} error={errors.shortDescription} />
              <Textarea label="Full description" rows={5} className="sm:col-span-2" value={p.description} onChange={(e) => set({ description: e.target.value })} />
              <Textarea label="Key features (one per line)" rows={4} value={p.features.join('\n')} onChange={(e) => set({ features: e.target.value.split('\n').map((x) => x.trim()).filter(Boolean) })} />
              <Textarea label="Search tags (comma separated)" rows={4} value={p.tags.join(', ')} onChange={(e) => set({ tags: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })} />
            </div>
          </Panel>

          <Panel><SectionTitle error={errors.images}>Images</SectionTitle>
            <div className="space-y-3">
              {p.images.map((im, i) => (
                <div key={i} className="flex items-start gap-2">
                  <ImagePicker className="flex-1" label={i === 0 ? 'Main image' : `Image ${i + 1}`} value={im} onChange={(v) => set({ images: p.images.map((x, k) => (k === i ? v : x)) })} />
                  <div className="mt-7 flex flex-col"><button type="button" aria-label="Move image up" onClick={() => set({ images: move(p.images, i, -1) })} className="rounded p-1 hover:bg-slate-100"><ArrowUp className="h-4 w-4" /></button><button type="button" aria-label="Move image down" onClick={() => set({ images: move(p.images, i, 1) })} className="rounded p-1 hover:bg-slate-100"><ArrowDown className="h-4 w-4" /></button><button type="button" aria-label="Remove image" onClick={() => set({ images: p.images.filter((_, k) => k !== i) })} className="rounded p-1 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></div>
                </div>
              ))}
              <Button size="sm" variant="secondary" icon={Plus} onClick={() => set({ images: [...p.images, ''] })}>Add image</Button>
            </div>
          </Panel>

          <Panel><SectionTitle error={errors.tiers}>Quantity-based pricing (per piece, INR)</SectionTitle>
            <p className="mb-3 text-xs text-slate-500">The price drops as quantity rises. The first tier sets the starting price shown in listings. Option and decoration add-ons are added on top.</p>
            <div className="space-y-2">
              {p.tiers.map((t, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
                  <Input aria-label={`Tier ${i + 1} minimum quantity`} label={i === 0 ? 'Minimum quantity' : undefined} type="number" min="1" value={t.min} onChange={(e) => set({ tiers: p.tiers.map((x, k) => (k === i ? { ...x, min: e.target.value } : x)) })} />
                  <Input aria-label={`Tier ${i + 1} price`} label={i === 0 ? 'Price per piece' : undefined} type="number" min="1" value={t.price} onChange={(e) => set({ tiers: p.tiers.map((x, k) => (k === i ? { ...x, price: e.target.value } : x)) })} />
                  <Button variant="ghost" size="sm" className="text-red-600" onClick={() => set({ tiers: p.tiers.filter((_, k) => k !== i) })} aria-label={`Remove tier ${i + 1}`} icon={Trash2} />
                </div>
              ))}
              <Button size="sm" variant="secondary" icon={Plus} onClick={() => set({ tiers: [...p.tiers, { min: (Number(p.tiers.at(-1)?.min) || 0) * 2 || 10, price: Number(p.tiers.at(-1)?.price) || 100 }] })}>Add tier</Button>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <Input label="Minimum order qty" type="number" min="1" value={p.moq} onChange={(e) => set({ moq: e.target.value })} error={errors.moq} />
              <Input label="Production days" type="number" min="1" value={p.leadTimeDays} onChange={(e) => set({ leadTimeDays: e.target.value })} error={errors.leadTimeDays} />
              <Input label="Low-stock threshold" type="number" min="0" value={p.lowStockThreshold} onChange={(e) => set({ lowStockThreshold: e.target.value })} />
            </div>
          </Panel>

          <Panel><SectionTitle error={errors.options}>Variants (options)</SectionTitle>
            <div className="space-y-4">
              {p.options.map((o, i) => (
                <div key={i} className="rounded-xl border border-slate-200 p-3">
                  <div className="grid grid-cols-[1fr_9rem_auto] items-end gap-2">
                    <Input label="Option name" value={o.name} placeholder="Color, Size, Finish…" onChange={(e) => setOption(i, { name: e.target.value })} />
                    <Select label="Display as" value={o.type} onChange={(e) => setOption(i, { type: e.target.value })} options={[{ value: 'select', label: 'Buttons' }, { value: 'swatch', label: 'Colour swatches' }]} />
                    <Button variant="ghost" size="sm" className="text-red-600" icon={Trash2} aria-label={`Remove option ${o.name || i + 1}`} onClick={() => set({ options: p.options.filter((_, k) => k !== i) })} />
                  </div>
                  <div className="mt-3 space-y-2">
                    {o.values.map((v, j) => (
                      <div key={j} className="grid grid-cols-[1fr_5rem_6rem_auto] items-center gap-2">
                        <input aria-label="Value label" placeholder="Value" value={v.label} onChange={(e) => setValue(i, j, { label: e.target.value })} className="h-10 rounded-lg border border-slate-300 px-2.5 text-sm focus:border-navy-500 focus:outline-none focus:ring-4 focus:ring-navy-100" />
                        {o.type === 'swatch' ? <input aria-label="Colour" type="color" value={v.hex || '#000000'} onChange={(e) => setValue(i, j, { hex: e.target.value })} className="h-10 w-full rounded-lg border border-slate-300 p-1" /> : <span />}
                        <input aria-label="Price add-on per piece" type="number" placeholder="+₹" value={v.priceDelta ?? 0} onChange={(e) => setValue(i, j, { priceDelta: e.target.value })} className="h-10 rounded-lg border border-slate-300 px-2.5 text-sm focus:border-navy-500 focus:outline-none focus:ring-4 focus:ring-navy-100" />
                        <button type="button" aria-label="Remove value" onClick={() => setOption(i, { values: o.values.filter((_, k) => k !== j) })} className="rounded p-1.5 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    ))}
                    <Button size="xs" variant="soft" icon={Plus} onClick={() => setOption(i, { values: [...o.values, o.type === 'swatch' ? { label: '', hex: '#000000', priceDelta: 0 } : { label: '', priceDelta: 0 }] })}>Add value</Button>
                  </div>
                </div>
              ))}
              <Button size="sm" variant="secondary" icon={Plus} onClick={() => set({ options: [...p.options, { name: '', type: 'select', values: [{ label: '', priceDelta: 0 }] }] })}>Add option</Button>
            </div>
          </Panel>

          <Panel><SectionTitle error={errors.printMethods}>Decoration methods</SectionTitle>
            <div className="space-y-2">
              {p.printMethods.map((m, i) => (
                <div key={i} className="grid grid-cols-[1fr_8rem_auto] items-end gap-2">
                  <Input aria-label="Method label" label={i === 0 ? 'Label' : undefined} value={m.label} onChange={(e) => set({ printMethods: p.printMethods.map((x, k) => (k === i ? { ...x, label: e.target.value, id: x.id && x.id !== 'standard' ? x.id : slugify(e.target.value) } : x)) })} />
                  <Input aria-label="Add-on price" label={i === 0 ? 'Add-on / pc' : undefined} type="number" min="0" value={m.price} onChange={(e) => set({ printMethods: p.printMethods.map((x, k) => (k === i ? { ...x, price: e.target.value } : x)) })} />
                  <Button variant="ghost" size="sm" className="text-red-600" icon={Trash2} aria-label="Remove method" onClick={() => set({ printMethods: p.printMethods.filter((_, k) => k !== i) })} />
                </div>
              ))}
              <Button size="sm" variant="secondary" icon={Plus} onClick={() => set({ printMethods: [...p.printMethods, { id: '', label: '', price: 0 }] })}>Add method</Button>
            </div>
          </Panel>

          <Panel><SectionTitle>Inventory by variant</SectionTitle>
            {inv.length <= 1 && !p.options.length ? <p className="text-sm text-slate-500">Add options above to track stock per variant. Without options, a single SKU is used.</p> : null}
            <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200">
              <table className="min-w-full text-sm"><thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-3 py-2">Variant</th><th className="px-3 py-2">SKU</th><th className="px-3 py-2 text-right">Stock</th></tr></thead>
                <tbody className="divide-y divide-slate-100">{inv.map((r) => <tr key={JSON.stringify(r.options)}><td className="px-3 py-1.5">{Object.values(r.options).join(' / ') || 'Default'}</td><td className="px-3 py-1.5 text-xs text-slate-500">{r.sku}</td><td className="px-3 py-1.5 text-right"><input aria-label={`Stock for ${Object.values(r.options).join(' ')}`} type="number" min="0" value={stockOf(r)} onChange={(e) => setStock(r, Math.max(0, Number(e.target.value) || 0))} className="h-8 w-24 rounded-lg border border-slate-300 px-2 text-right text-sm" /></td></tr>)}</tbody></table>
            </div>
            <p className="mt-2 text-xs text-slate-500">New variants default to 300 units. Existing stock is kept when option values are unchanged.</p>
          </Panel>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <Panel title="Publishing">
            <div className="space-y-3">
              <Select label="Status" value={p.status} onChange={(e) => set({ status: e.target.value })} options={['published', 'draft']} />
              <Checkbox label="Featured on homepage" checked={p.featured} onChange={(v) => set({ featured: v })} />
              <Checkbox label="Mark as best seller" checked={p.bestSeller} onChange={(v) => set({ bestSeller: v })} />
              <Button className="w-full" onClick={save} loading={busy}>{isNew ? 'Create product' : 'Save changes'}</Button>
            </div>
          </Panel>
          <Panel title="Price preview"><TierTable product={{ tiers: p.tiers.filter((t) => Number(t.min) > 0 && Number(t.price) > 0).map((t) => ({ min: Number(t.min), price: Number(t.price) })) }} qty={Number(p.moq) || 1} /></Panel>
        </aside>
      </div>
    </div>
  );
}

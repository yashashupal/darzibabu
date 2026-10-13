import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { PackageSearch, SlidersHorizontal, X } from 'lucide-react';
import { queryProducts } from '../../services/api';
import { useAsync, useCollection } from '../../hooks/useAsync';
import { useDebounce, useDocumentTitle } from '../../hooks/useMisc';
import ProductCard from '../../components/store/ProductCard';
import { Breadcrumbs } from '../../components/ui/Misc';
import { Drawer } from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';
import { Select, Checkbox } from '../../components/ui/Form';
import { EmptyState, ErrorState, ProductGridSkeleton } from '../../components/ui/Feedback';
import { cx } from '../../utils/format';

const SORTS = [
  { value: 'featured', label: 'Featured' }, { value: 'newest', label: 'Newest' }, { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' }, { value: 'rating', label: 'Top rated' }, { value: 'name', label: 'Name A-Z' },
];
const COLOR_FILTERS = ['Black', 'Navy', 'White', 'Red', 'Heather Grey', 'Royal Blue', 'Yellow'];
const PAGE_SIZE = 12;

function Filters({ params, set, clear, categories, showCategory, activeCount }) {
  const [min, setMin] = useState(params.get('min') || '');
  const [max, setMax] = useState(params.get('max') || '');
  useEffect(() => { setMin(params.get('min') || ''); setMax(params.get('max') || ''); }, [params]);
  const colors = (params.get('colors') || '').split(',').filter(Boolean);
  const toggleColor = (c) => set({ colors: (colors.includes(c) ? colors.filter((x) => x !== c) : [...colors, c]).join(',') });
  const h = 'mb-2 text-xs font-bold uppercase tracking-wider text-slate-500';
  return (
    <div className="space-y-6">
      {showCategory ? (
        <div>
          <p className={h}>Category</p>
          <div className="space-y-1">
            <button onClick={() => set({ category: '' })} className={cx('block w-full rounded-lg px-2.5 py-1.5 text-left text-sm', !params.get('category') ? 'bg-navy-900 font-semibold text-white' : 'text-slate-700 hover:bg-slate-100')}>All categories</button>
            {categories.map((c) => <button key={c.id} onClick={() => set({ category: c.slug })} className={cx('block w-full rounded-lg px-2.5 py-1.5 text-left text-sm', params.get('category') === c.slug ? 'bg-navy-900 font-semibold text-white' : 'text-slate-700 hover:bg-slate-100')}>{c.name}</button>)}
          </div>
        </div>
      ) : null}
      <div>
        <p className={h}>Price per piece (from)</p>
        <form onSubmit={(e) => { e.preventDefault(); set({ min, max }); }} className="flex items-center gap-2">
          <input aria-label="Minimum price" inputMode="numeric" placeholder="Min" value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ''))} className="h-10 w-full rounded-lg border border-slate-300 px-2.5 text-sm focus:border-navy-500 focus:outline-none focus:ring-4 focus:ring-navy-100" />
          <span className="text-slate-400">-</span>
          <input aria-label="Maximum price" inputMode="numeric" placeholder="Max" value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ''))} className="h-10 w-full rounded-lg border border-slate-300 px-2.5 text-sm focus:border-navy-500 focus:outline-none focus:ring-4 focus:ring-navy-100" />
          <Button type="submit" size="sm" variant="soft">Apply</Button>
        </form>
      </div>
      <div>
        <p className={h}>Colour</p>
        <div className="flex flex-wrap gap-1.5">
          {COLOR_FILTERS.map((c) => <button key={c} onClick={() => toggleColor(c)} aria-pressed={colors.includes(c)} className={cx('rounded-full border px-3 py-1 text-xs font-semibold', colors.includes(c) ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50')}>{c}</button>)}
        </div>
      </div>
      <div>
        <p className={h}>Customer rating</p>
        <div className="flex gap-1.5">
          {[0, 4, 3].map((r) => <button key={r} onClick={() => set({ rating: r || '' })} aria-pressed={Number(params.get('rating') || 0) === r} className={cx('rounded-lg border px-3 py-1.5 text-xs font-semibold', Number(params.get('rating') || 0) === r ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50')}>{r ? `${r}★ & up` : 'Any'}</button>)}
        </div>
      </div>
      <Checkbox label="In stock only" checked={params.get('instock') === '1'} onChange={(v) => set({ instock: v ? '1' : '' })} />
      <Button variant="ghost" size="sm" onClick={clear} disabled={!activeCount} icon={X}>Clear all filters</Button>
    </div>
  );
}

/** Used for /products, /category/:slug and /search */
export default function ProductsPage({ mode = 'all' }) {
  const routeParams = useParams();
  const [params, setParams] = useSearchParams();
  const { items: categories } = useCollection('categories');
  const [drawer, setDrawer] = useState(false);

  const categorySlug = mode === 'category' ? routeParams.slug : params.get('category') || '';
  const category = categories.find((c) => c.slug === categorySlug);
  const q = mode === 'search' ? params.get('q') || '' : '';
  const sort = params.get('sort') || (q ? 'rating' : 'featured');
  const page = Number(params.get('page') || 1);
  const query = {
    q, category: categorySlug, minPrice: params.get('min') || undefined, maxPrice: params.get('max') || undefined,
    colors: (params.get('colors') || '').split(',').filter(Boolean), rating: Number(params.get('rating') || 0), inStock: params.get('instock') === '1', sort, page, pageSize: PAGE_SIZE,
  };
  const key = JSON.stringify(query);
  const { data, loading, error, reload } = useAsync(() => queryProducts(query), [key]);
  const debounced = useDebounce(loading, 120);

  const title = mode === 'search' ? `Search results${q ? ` for “${q}”` : ''}` : category ? category.name : 'All products';
  useDocumentTitle(mode === 'search' ? 'Search' : title);

  const set = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v === '' || v === undefined || v === null ? next.delete(k) : next.set(k, v)));
    if (!('page' in patch)) next.delete('page');
    setParams(next);
  };
  const clear = () => {
    const next = new URLSearchParams();
    if (q) next.set('q', q);
    if (mode !== 'category' && params.get('category')) next.set('category', params.get('category'));
    setParams(next);
  };
  const activeCount = ['min', 'max', 'colors', 'rating', 'instock'].filter((k) => params.get(k)).length;
  const catName = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c.name])), [categories]);
  const filterProps = { params, set, clear, categories, showCategory: mode !== 'category', activeCount };

  if (mode === 'category' && categories.length && !category) {
    return <div className="mx-auto max-w-3xl px-4 py-16"><EmptyState icon={PackageSearch} title="Category not found" message="This category may have been renamed or removed." action={{ label: 'Browse all categories', to: '/categories' }} /></div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, ...(mode === 'category' ? [{ label: 'Categories', to: '/categories' }, { label: category?.name || '…' }] : [{ label: mode === 'search' ? 'Search' : 'All products' }])]} />
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-navy-900">{title}</h1>
          {category?.description ? <p className="mt-1 max-w-2xl text-slate-600">{category.description}</p> : null}
          {data ? <p className="mt-1 text-sm text-slate-500">{data.total} product{data.total === 1 ? '' : 's'}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={SlidersHorizontal} className="lg:hidden" onClick={() => setDrawer(true)}>Filters{activeCount ? ` (${activeCount})` : ''}</Button>
          <div className="w-44"><Select aria-label="Sort products" value={sort} onChange={(e) => set({ sort: e.target.value })} options={SORTS} /></div>
        </div>
      </div>

      {mode === 'search' && !q ? (
        <EmptyState icon={PackageSearch} title="What are you looking for?" message="Use the search box in the header to find polos, caps, keychains and more." action={{ label: 'Browse all products', to: '/products' }} />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
          <aside className="hidden lg:block"><div className="sticky top-32 rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100"><Filters {...filterProps} /></div></aside>
          <div>
            {error ? <ErrorState error={error} onRetry={reload} /> : loading && !data ? <ProductGridSkeleton /> : data.items.length === 0 ? (
              <EmptyState icon={PackageSearch} title="No products match" message={q ? `We could not find anything for “${q}”. Try a different keyword or clear filters.` : 'Try removing some filters to see more products.'} action={{ label: 'Clear filters', onClick: clear, variant: 'secondary' }} />
            ) : (
              <div className={cx('transition-opacity', debounced && 'opacity-60')}>
                <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
                  {data.items.map((p) => <ProductCard key={p.id} product={p} categoryName={catName[p.categoryId]} />)}
                </div>
                <div className="mt-8"><Pagination page={data.page} pages={data.pages} total={data.total} pageSize={data.pageSize} onChange={(p) => { set({ page: p > 1 ? p : '' }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} /></div>
              </div>
            )}
            {mode === 'search' && q && data?.items.length === 0 ? <p className="mt-6 text-center text-sm text-slate-500">Need something custom? <Link className="font-semibold text-brand-600 hover:underline" to="/contact?topic=quote">Request a quote</Link>.</p> : null}
          </div>
        </div>
      )}

      <Drawer open={drawer} onClose={() => setDrawer(false)} title="Filters" footer={<Button className="w-full" onClick={() => setDrawer(false)}>Show results</Button>}>
        <div className="p-4"><Filters {...filterProps} /></div>
      </Drawer>
    </div>
  );
}

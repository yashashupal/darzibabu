import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useCollection } from '../../hooks/useAsync';
import { useDocumentTitle } from '../../hooks/useMisc';
import { Breadcrumbs, Img } from '../../components/ui/Misc';
import { PageLoader, EmptyState } from '../../components/ui/Feedback';

export default function CategoriesPage() {
  useDocumentTitle('Categories');
  const { items, loading } = useCollection('categories');
  const { items: products } = useCollection('products');
  const cats = items.filter((c) => c.status === 'active').sort((a, b) => a.sortOrder - b.sortOrder);
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Categories' }]} />
      <h1 className="font-display text-3xl font-extrabold text-navy-900">Shop by category</h1>
      <p className="mt-2 max-w-2xl text-slate-600">Everything we make carries your brand: from team apparel to engraved accessories and curated gift kits.</p>
      {loading ? <PageLoader /> : cats.length === 0 ? <EmptyState className="mt-8" title="No categories yet" message="Categories added in the admin dashboard will appear here." /> : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cats.map((c) => {
            const n = products.filter((p) => p.categoryId === c.id && p.status === 'published').length;
            return (
              <Link key={c.id} to={`/category/${c.slug}`} className="group overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-slate-100 transition hover:shadow-pop">
                <div className="aspect-[16/10] overflow-hidden bg-slate-100"><Img src={c.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /></div>
                <div className="p-5">
                  <div className="flex items-center justify-between"><h2 className="font-display text-lg font-bold text-navy-900">{c.name}</h2><ArrowRight className="h-5 w-5 text-brand-500 transition group-hover:translate-x-1" /></div>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{c.description}</p>
                  <p className="mt-3 text-xs font-semibold text-brand-600">{n} product{n === 1 ? '' : 's'}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

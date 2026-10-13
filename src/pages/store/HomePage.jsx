import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, ChevronLeft, ChevronRight, ClipboardList, Palette, PackageCheck, Quote, Ruler, ShieldCheck, Truck, Wallet } from 'lucide-react';
import { homepageDoc } from '../../services/api';
import { useAsync, useCollection } from '../../hooks/useAsync';
import { useDocumentTitle } from '../../hooks/useMisc';
import { useSettings } from '../../context/SettingsContext';
import { subscribe } from '../../services/storage';
import Button from '../../components/ui/Button';
import { Img, SectionHeading, Accordion } from '../../components/ui/Misc';
import { Rating, Skeleton } from '../../components/ui/Feedback';
import ProductCard from '../../components/store/ProductCard';
import CoverArt from '../../components/store/CoverArt';
import { formatDate, formatINR, cx } from '../../utils/format';

function Hero() {
  const { items, loading } = useCollection('banners');
  const slides = useMemo(() => items.filter((b) => b.placement === 'home-hero' && b.active).sort((a, b) => a.sortOrder - b.sortOrder), [items]);
  const [i, setI] = useState(0);
  useEffect(() => {
    if (slides.length < 2) return undefined;
    const t = setInterval(() => setI((x) => (x + 1) % slides.length), 6500);
    return () => clearInterval(t);
  }, [slides.length]);
  useEffect(() => setI(0), [slides.length]);

  if (loading) return <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6"><Skeleton className="h-[26rem] w-full rounded-3xl" /></div>;
  if (!slides.length) return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6"><div className="rounded-3xl bg-navy-900 p-10 text-white"><h1 className="font-display text-4xl font-extrabold">Custom merchandise, made with thread and care</h1><Button className="mt-6" to="/products">Browse products</Button></div></section>
  );
  const s = slides[Math.min(i, slides.length - 1)];
  return (
    <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6" aria-roledescription="carousel" aria-label="Featured collections">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 text-white">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-500/30 blur-2xl" aria-hidden="true" />
        <div className="relative grid items-center gap-6 p-6 sm:p-10 md:grid-cols-2 lg:p-14">
          <div key={s.id} className="animate-fade-up">
            <p className="mb-3 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-200">Darzibabu · The art of thread</p>
            <h1 className="font-display text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">{s.title}</h1>
            <p className="mt-4 max-w-lg text-base text-white/80 sm:text-lg">{s.subtitle}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button to={s.link || '/products'} size="lg" iconRight={ArrowRight}>{s.ctaLabel || 'Shop now'}</Button>
              <Button to="/contact?topic=quote" size="lg" variant="white">Get a bulk quote</Button>
            </div>
          </div>
          <div key={`img-${s.id}`} className="animate-fade-up">
            <div className="mx-auto aspect-square max-w-md overflow-hidden rounded-3xl bg-white/10 p-2 ring-1 ring-white/20">
              <Img src={s.image} alt={s.title} className="h-full w-full rounded-2xl object-cover" />
            </div>
          </div>
        </div>
        {slides.length > 1 ? (
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/25 px-3 py-1.5 backdrop-blur">
            <button aria-label="Previous slide" onClick={() => setI((i - 1 + slides.length) % slides.length)} className="text-white/80 hover:text-white"><ChevronLeft className="h-4 w-4" /></button>
            {slides.map((sl, k) => <button key={sl.id} aria-label={`Go to slide ${k + 1}`} aria-current={k === i} onClick={() => setI(k)} className={cx('h-2 rounded-full transition-all', k === i ? 'w-6 bg-brand-400' : 'w-2 bg-white/50')} />)}
            <button aria-label="Next slide" onClick={() => setI((i + 1) % slides.length)} className="text-white/80 hover:text-white"><ChevronRight className="h-4 w-4" /></button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function Trust() {
  const { settings } = useSettings();
  const items = [
    [Truck, 'Free shipping', `On orders above ${formatINR(settings?.shipping?.freeShippingThreshold || 5000)}`],
    [Palette, 'Proof before production', 'Approve your design first'],
    [ShieldCheck, 'Quality checked', 'Every piece inspected'],
    [Wallet, 'Volume pricing', 'Prices drop as quantity grows'],
  ];
  return (
    <section className="mx-auto mt-6 max-w-7xl px-4 sm:px-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {items.map(([Icon, t, d]) => (
          <div key={t} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-100">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><Icon className="h-5 w-5" /></span>
            <div><p className="text-sm font-bold text-navy-900">{t}</p><p className="text-xs text-slate-500">{d}</p></div>
          </div>
        ))}
      </div>
    </section>
  );
}

const Wrap = ({ children, className }) => <section className={cx('mx-auto mt-16 max-w-7xl px-4 sm:px-6', className)}>{children}</section>;

function Categories({ cfg }) {
  const { items } = useCollection('categories');
  const cats = items.filter((c) => c.status === 'active' && c.featured).sort((a, b) => a.sortOrder - b.sortOrder);
  return (
    <Wrap>
      <SectionHeading eyebrow="Categories" title={cfg.title} subtitle={cfg.subtitle} action={<Button to="/categories" variant="secondary" size="sm" iconRight={ArrowRight}>All categories</Button>} />
      <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
        {cats.map((c) => (
          <Link key={c.id} to={`/category/${c.slug}`} className="group relative overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-slate-100">
            <div className="aspect-[4/3] overflow-hidden bg-slate-100"><Img src={c.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /></div>
            <div className="flex items-center justify-between p-3.5"><span className="font-semibold text-navy-900">{c.name}</span><ArrowRight className="h-4 w-4 text-brand-500 transition group-hover:translate-x-1" /></div>
          </Link>
        ))}
      </div>
    </Wrap>
  );
}

function ProductRow({ cfg, filter, sort, eyebrow, link }) {
  const { items, loading } = useCollection('products');
  const { items: categories } = useCollection('categories');
  const list = useMemo(() => {
    const base = items.filter((p) => p.status === 'published' && filter(p));
    return [...base].sort(sort).slice(0, 4);
  }, [items]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Wrap>
      <SectionHeading eyebrow={eyebrow} title={cfg.title} subtitle={cfg.subtitle} action={<Button to={link} variant="secondary" size="sm" iconRight={ArrowRight}>View all</Button>} />
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4]" />) : list.map((p) => <ProductCard key={p.id} product={p} categoryName={categories.find((c) => c.id === p.categoryId)?.name} />)}
      </div>
    </Wrap>
  );
}

function Process({ cfg }) {
  const steps = [[Ruler, 'Choose a product', 'Pick colours, sizes and a decoration method.'], [Palette, 'Upload your logo', 'Preview placement instantly on the product.'], [ClipboardList, 'Approve the proof', 'We share a design proof before we print.'], [PackageCheck, 'We make and ship', 'Quality-checked and delivered to your door.']];
  return (
    <Wrap>
      <SectionHeading align="center" eyebrow="How it works" title={cfg.title} subtitle={cfg.subtitle} />
      <div className="grid gap-4 md:grid-cols-4">
        {steps.map(([Icon, t, d], i) => (
          <div key={t} className="relative rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-100">
            <span className="absolute right-4 top-3 font-display text-5xl font-extrabold text-slate-100">{i + 1}</span>
            <span className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-navy-900 text-white"><Icon className="h-6 w-6" /></span>
            <h3 className="relative mt-4 font-bold text-navy-900">{t}</h3>
            <p className="relative mt-1 text-sm text-slate-600">{d}</p>
          </div>
        ))}
      </div>
    </Wrap>
  );
}

function Bulk({ cfg }) {
  const { items } = useCollection('banners');
  const b = items.find((x) => x.placement === 'promo-strip' && x.active);
  return (
    <Wrap>
      <div className="grid items-center gap-6 overflow-hidden rounded-3xl bg-gradient-to-r from-brand-600 to-brand-500 p-6 text-white sm:p-10 md:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="font-display text-2xl font-extrabold sm:text-3xl">{cfg.title}</h2>
          <p className="mt-2 max-w-xl text-white/90">{b?.subtitle || cfg.subtitle}</p>
          <p className="mt-1 text-sm text-white/80">{b?.title}</p>
          <div className="mt-6 flex flex-wrap gap-3"><Button to={b?.link || '/contact?topic=quote'} variant="white" size="lg">{b?.ctaLabel || 'Request a quote'}</Button><Button to="/faqs" variant="navy" size="lg">Read the FAQs</Button></div>
        </div>
        {b?.image ? <div className="hidden aspect-[4/3] overflow-hidden rounded-2xl ring-4 ring-white/30 md:block"><Img src={b.image} alt="" className="h-full w-full object-cover" /></div> : null}
      </div>
    </Wrap>
  );
}

function Testimonials({ cfg }) {
  const { items } = useCollection('reviews');
  const { items: products } = useCollection('products');
  const list = items.filter((r) => r.status === 'approved' && r.rating >= 4).slice(0, 3);
  if (!list.length) return null;
  return (
    <Wrap>
      <SectionHeading align="center" eyebrow="Reviews" title={cfg.title} subtitle={cfg.subtitle} />
      <div className="grid gap-4 md:grid-cols-3">
        {list.map((r) => {
          const p = products.find((x) => x.id === r.productId);
          return (
            <figure key={r.id} className="flex flex-col rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-100">
              <Quote className="h-6 w-6 text-brand-300" />
              <Rating value={r.rating} />
              <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-slate-700">{r.body}</blockquote>
              <figcaption className="mt-4 border-t border-slate-100 pt-3 text-sm"><span className="font-bold text-navy-900">{r.name}</span>{p ? <Link to={`/product/${p.slug}`} className="block text-xs text-brand-600 hover:underline">on {p.name}</Link> : null}</figcaption>
            </figure>
          );
        })}
      </div>
    </Wrap>
  );
}

function BlogTeaser({ cfg }) {
  const { items } = useCollection('posts');
  const list = items.filter((p) => p.status === 'published').sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3);
  return (
    <Wrap>
      <SectionHeading eyebrow="Blog" title={cfg.title} subtitle={cfg.subtitle} action={<Button to="/blog" variant="secondary" size="sm" iconRight={ArrowRight}>All articles</Button>} />
      <div className="grid gap-5 md:grid-cols-3">
        {list.map((p) => (
          <Link key={p.id} to={`/blog/${p.slug}`} className="group overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-slate-100">
            <CoverArt cover={p.cover} title={p.title} className="aspect-[16/9]" />
            <div className="p-5"><p className="text-xs font-bold uppercase tracking-wider text-brand-600">{p.category} · {formatDate(p.date)}</p><h3 className="mt-1.5 font-bold text-navy-900 group-hover:text-brand-600">{p.title}</h3><p className="mt-1.5 line-clamp-2 text-sm text-slate-600">{p.excerpt}</p></div>
          </Link>
        ))}
      </div>
    </Wrap>
  );
}

function FaqTeaser({ cfg }) {
  const { items } = useCollection('faqs');
  const list = items.filter((f) => f.active).sort((a, b) => a.sortOrder - b.sortOrder).slice(0, 5);
  if (!list.length) return null;
  return (
    <Wrap className="max-w-3xl">
      <SectionHeading align="center" eyebrow="FAQ" title={cfg.title} subtitle={cfg.subtitle} />
      <Accordion items={list} />
      <div className="mt-5 text-center"><Button to="/faqs" variant="secondary" size="sm" iconRight={ArrowRight}>See all FAQs</Button></div>
    </Wrap>
  );
}

export default function HomePage() {
  useDocumentTitle('');
  const { data, reload } = useAsync(() => homepageDoc.get(), []);
  useEffect(() => subscribe((k) => (k === 'doc:homepage' || k === '*') && reload(true)), [reload]);
  const sections = data || homepageDoc.snapshot();
  const render = (s) => {
    switch (s.id) {
      case 'trust': return <Trust key={s.id} />;
      case 'categories': return <Categories key={s.id} cfg={s} />;
      case 'featured': return <ProductRow key={s.id} cfg={s} eyebrow="Popular" link="/products" filter={(p) => p.featured || p.bestSeller} sort={(a, b) => Number(b.bestSeller) - Number(a.bestSeller)} />;
      case 'process': return <Process key={s.id} cfg={s} />;
      case 'bulk': return <Bulk key={s.id} cfg={s} />;
      case 'new': return <ProductRow key={s.id} cfg={s} eyebrow="Just in" link="/products?sort=newest" filter={() => true} sort={(a, b) => new Date(b.createdAt) - new Date(a.createdAt)} />;
      case 'testimonials': return <Testimonials key={s.id} cfg={s} />;
      case 'blog': return <BlogTeaser key={s.id} cfg={s} />;
      case 'faq': return <FaqTeaser key={s.id} cfg={s} />;
      default: return null;
    }
  };
  return (
    <div className="pb-4">
      <Hero />
      {sections.filter((s) => s.enabled).map(render)}
    </div>
  );
}

import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Clock, Heart, Mail, MapPin, Phone, Search } from 'lucide-react';
import { submitInquiry } from '../../services/api';
import { useCollection } from '../../hooks/useAsync';
import { useDocumentTitle } from '../../hooks/useMisc';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import { useWishlist } from '../../context/WishlistContext';
import Button from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/Form';
import { EmptyState, PageLoader } from '../../components/ui/Feedback';
import { Accordion, Breadcrumbs, SearchInput, Tabs } from '../../components/ui/Misc';
import Pagination, { paginate } from '../../components/ui/Pagination';
import ProductCard from '../../components/store/ProductCard';
import CoverArt from '../../components/store/CoverArt';
import { validate } from '../../utils/validators';
import { formatDate, formatINR } from '../../utils/format';
import { BRAND } from '../../config/brand';

const PageShell = ({ title, subtitle, crumbs, children, narrow }) => (
  <div className={`mx-auto px-4 py-8 sm:px-6 ${narrow ? 'max-w-3xl' : 'max-w-7xl'}`}>
    <Breadcrumbs items={[{ label: 'Home', to: '/' }, ...crumbs]} />
    <h1 className="font-display text-3xl font-extrabold text-navy-900 sm:text-4xl">{title}</h1>
    {subtitle ? <p className="mt-2 max-w-2xl text-slate-600">{subtitle}</p> : null}
    <div className="mt-8">{children}</div>
  </div>
);

/* --------------------------------- wishlist -------------------------------- */
export function WishlistPage() {
  useDocumentTitle('Wishlist');
  const wish = useWishlist();
  const { items, loading } = useCollection('products');
  const { items: cats } = useCollection('categories');
  const list = items.filter((p) => wish.ids.includes(p.id) && p.status === 'published');
  return (
    <PageShell title="Your wishlist" subtitle="Products you saved on this device." crumbs={[{ label: 'Wishlist' }]}>
      {loading ? <PageLoader /> : list.length === 0 ? <EmptyState icon={Heart} title="Your wishlist is empty" message="Tap the heart on any product to save it here." action={{ label: 'Browse products', to: '/products' }} /> : (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">{list.map((p) => <ProductCard key={p.id} product={p} categoryName={cats.find((c) => c.id === p.categoryId)?.name} />)}</div>
      )}
    </PageShell>
  );
}

/* ----------------------------------- blog ---------------------------------- */
export function BlogPage() {
  useDocumentTitle('Blog');
  const { items, loading } = useCollection('posts');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [page, setPage] = useState(1);
  const posts = items.filter((p) => p.status === 'published').sort((a, b) => new Date(b.date) - new Date(a.date));
  const cats = ['All', ...Array.from(new Set(posts.map((p) => p.category)))];
  const filtered = posts.filter((p) => (cat === 'All' || p.category === cat) && (!q || (p.title + p.excerpt).toLowerCase().includes(q.toLowerCase())));
  const pg = paginate(filtered, page, 6);
  return (
    <PageShell title="The Darzibabu blog" subtitle="Practical guides on uniforms, decoration methods and corporate gifting." crumbs={[{ label: 'Blog' }]}>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs tabs={cats.map((c) => ({ id: c, label: c }))} value={cat} onChange={(c) => { setCat(c); setPage(1); }} className="sm:max-w-[70%]" />
        <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search articles" className="sm:w-64" />
      </div>
      {loading ? <PageLoader /> : filtered.length === 0 ? <EmptyState icon={Search} title="No articles found" message="Try another keyword or category." action={{ label: 'Reset', onClick: () => { setQ(''); setCat('All'); }, variant: 'secondary' }} /> : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{pg.rows.map((p) => (
            <Link key={p.id} to={`/blog/${p.slug}`} className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-slate-100 transition hover:shadow-pop">
              <CoverArt cover={p.cover} title={p.title} className="aspect-[16/9]" />
              <div className="flex flex-1 flex-col p-5"><p className="text-xs font-bold uppercase tracking-wider text-brand-600">{p.category}</p><h2 className="mt-1.5 font-display text-lg font-bold text-navy-900 group-hover:text-brand-600">{p.title}</h2><p className="mt-2 flex-1 text-sm text-slate-600">{p.excerpt}</p><p className="mt-4 flex items-center gap-2 text-xs text-slate-500"><Clock className="h-3.5 w-3.5" />{p.readMins} min read · {formatDate(p.date)}</p></div>
            </Link>))}</div>
          <div className="mt-8"><Pagination page={pg.page} pages={pg.pages} total={pg.total} pageSize={pg.pageSize} onChange={setPage} /></div>
        </>
      )}
    </PageShell>
  );
}

export function BlogPostPage() {
  const { slug } = useParams();
  const { items, loading } = useCollection('posts');
  const post = items.find((p) => p.slug === slug && p.status === 'published');
  useDocumentTitle(post?.title);
  const toast = useToast();
  if (loading) return <PageLoader />;
  if (!post) return <div className="mx-auto max-w-3xl px-4 py-16"><EmptyState icon={Search} title="Article not found" action={{ label: 'Back to blog', to: '/blog' }} /></div>;
  const more = items.filter((p) => p.status === 'published' && p.id !== post.id).slice(0, 3);
  const copy = async () => { try { await navigator.clipboard.writeText(window.location.href); toast.success('Article link copied.'); } catch { toast.info('Copy the link from your address bar.'); } };
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Blog', to: '/blog' }, { label: post.title }]} />
      <p className="text-xs font-bold uppercase tracking-wider text-brand-600">{post.category}</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight text-navy-900 sm:text-4xl">{post.title}</h1>
      <p className="mt-3 text-sm text-slate-500">{post.author} · {formatDate(post.date)} · {post.readMins} min read</p>
      <CoverArt cover={post.cover} title={post.title} className="my-8 aspect-[16/8] rounded-3xl" />
      <article className="space-y-4 text-[1.02rem] leading-relaxed text-slate-700">
        {post.content.map((block, i) => block.startsWith('## ') ? <h2 key={i} className="pt-4 font-display text-2xl font-bold text-navy-900">{block.slice(3)}</h2> : <p key={i}>{block}</p>)}
      </article>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-navy-50 p-5"><p className="font-semibold text-navy-900">Ready to put this into practice?</p><div className="flex gap-2"><Button size="sm" to="/products">Browse products</Button><Button size="sm" variant="secondary" onClick={copy}>Copy link</Button></div></div>
      {more.length ? <div className="mt-12"><h2 className="mb-4 font-display text-xl font-bold text-navy-900">More to read</h2><div className="grid gap-4 sm:grid-cols-3">{more.map((p) => <Link key={p.id} to={`/blog/${p.slug}`} className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-slate-100"><CoverArt cover={p.cover} className="aspect-[16/9]" /><p className="p-3 text-sm font-semibold text-navy-900 hover:text-brand-600">{p.title}</p></Link>)}</div></div> : null}
    </div>
  );
}

/* ----------------------------------- FAQs ---------------------------------- */
export function FaqPage() {
  useDocumentTitle('FAQs');
  const { items, loading } = useCollection('faqs');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const list = items.filter((f) => f.active).sort((a, b) => a.sortOrder - b.sortOrder);
  const cats = ['All', ...Array.from(new Set(list.map((f) => f.category)))];
  const filtered = list.filter((f) => (cat === 'All' || f.category === cat) && (!q || (f.question + f.answer).toLowerCase().includes(q.toLowerCase())));
  return (
    <PageShell narrow title="Frequently asked questions" subtitle="Quick answers about ordering, artwork, shipping and payments." crumbs={[{ label: 'FAQs' }]}>
      <SearchInput value={q} onChange={setQ} placeholder="Search questions" className="mb-4" />
      <Tabs tabs={cats.map((c) => ({ id: c, label: c }))} value={cat} onChange={setCat} className="mb-6" />
      {loading ? <PageLoader /> : filtered.length === 0 ? <EmptyState icon={Search} title="No matching questions" message="Try different words or contact us directly." action={{ label: 'Contact us', to: '/contact' }} /> : <Accordion key={cat + q} items={filtered} defaultOpen={0} />}
      <div className="mt-8 rounded-2xl bg-navy-50 p-6 text-center"><p className="font-semibold text-navy-900">Still need help?</p><Button className="mt-3" to="/contact">Contact our team</Button></div>
    </PageShell>
  );
}

/* ---------------------------------- contact -------------------------------- */
const TOPICS = ['General question', 'Bulk quote', 'Order support', 'Artwork help', 'Corporate partnership'];
export function ContactPage() {
  useDocumentTitle('Contact');
  const [params] = useSearchParams();
  const { settings } = useSettings();
  const toast = useToast();
  const s = settings?.site || {};
  const [v, setV] = useState({ name: '', email: '', phone: '', company: '', topic: params.get('topic') === 'quote' ? 'Bulk quote' : 'General question', quantity: '', message: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const set = (k) => (e) => setV((x) => ({ ...x, [k]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    const res = validate(v, { name: ['required', { minLength: 2 }], email: ['required', 'email'], phone: ['phone'], message: ['required', { minLength: 10 }], quantity: [{ pattern: /^\d+$/, message: 'Enter a whole number.' }] });
    setErrors(res.errors);
    if (!res.valid) return;
    setBusy(true);
    try {
      await submitInquiry({ type: v.topic === 'Bulk quote' ? 'quote' : 'contact', ...v, message: v.quantity ? `${v.message}\n\nEstimated quantity: ${v.quantity}` : v.message });
      setSent(true);
      toast.success('Message sent. We will reply within one business day (demo).');
    } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };
  return (
    <PageShell title="Contact us" subtitle="Questions, bulk quotes or artwork help: tell us what you need and we will get back to you." crumbs={[{ label: 'Contact' }]}>
      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-100">
          {sent ? (
            <div className="py-10 text-center"><h2 className="font-display text-2xl font-extrabold text-navy-900">Thanks for reaching out!</h2><p className="mx-auto mt-2 max-w-md text-slate-600">Your message has been saved in this demo. In the live site our team replies within one business day.</p><div className="mt-5 flex justify-center gap-3"><Button onClick={() => { setSent(false); setV({ ...v, message: '', quantity: '' }); }} variant="secondary">Send another</Button><Button to="/products">Browse products</Button></div></div>
          ) : (
            <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
              <Input label="Name" required value={v.name} onChange={set('name')} error={errors.name} />
              <Input label="Email" type="email" required value={v.email} onChange={set('email')} error={errors.email} />
              <Input label="Phone" value={v.phone} onChange={set('phone')} error={errors.phone} />
              <Input label="Company" value={v.company} onChange={set('company')} />
              <Select label="Topic" value={v.topic} onChange={set('topic')} options={TOPICS} />
              <Input label="Estimated quantity" inputMode="numeric" value={v.quantity} onChange={set('quantity')} error={errors.quantity} placeholder="e.g. 200" />
              <Textarea label="Message" required className="sm:col-span-2" rows={5} value={v.message} onChange={set('message')} error={errors.message} placeholder="Tell us the products, quantities, deadline and logo details…" />
              <div className="sm:col-span-2"><Button type="submit" size="lg" loading={busy}>Send message</Button></div>
            </form>
          )}
        </div>
        <aside className="space-y-4">
          {[[Phone, 'Call us', s.phone, `tel:${(s.phone || '').replace(/\s/g, '')}`], [Mail, 'Email', s.email, `mailto:${s.email}`], [MapPin, 'Studio', s.address, null], [Clock, 'Hours', s.hours, null]].map(([Icon, l, val, href]) => (
            <div key={l} className="flex gap-3 rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-100"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><Icon className="h-5 w-5" /></span><div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{l}</p>{href ? <a href={href} className="text-sm font-semibold text-navy-900 hover:text-brand-600">{val}</a> : <p className="text-sm font-semibold text-navy-900">{val}</p>}</div></div>
          ))}
          <p className="text-xs text-slate-500">Contact details are editable from Admin → Settings.</p>
        </aside>
      </div>
    </PageShell>
  );
}

/* ----------------------------------- about --------------------------------- */
export function AboutPage() {
  useDocumentTitle('About us');
  const values = [['Craftsmanship', 'Clean stitching, sharp prints and finishing checked by hand.'], ['Consistency', 'Repeat orders match earlier batches so teams always look aligned.'], ['Care', 'Clear proofs, honest timelines and a human who answers your questions.']];
  const stats = [['10+', 'Product categories'], ['10 pcs', 'Typical minimum order'], ['5-12 days', 'Production window'], ['1 day', 'Quote turnaround']];
  return (
    <PageShell title="About Darzibabu" subtitle={BRAND.description} crumbs={[{ label: 'About' }]}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{stats.map(([n, l]) => <div key={l} className="rounded-2xl bg-white p-5 text-center shadow-card ring-1 ring-slate-100"><p className="font-display text-3xl font-extrabold text-brand-600">{n}</p><p className="text-sm text-slate-600">{l}</p></div>)}</div>
      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <div className="space-y-4 text-slate-700"><h2 className="font-display text-2xl font-extrabold text-navy-900">The art of thread</h2><p>Darzibabu creates premium, custom apparel for every need, from individual youth clothing to large-scale corporate orders. As a manufacturer and wholesaler, we control quality from fabric selection to final finishing.</p><p>Our services include expert screen printing, DTF printing and embroidery, so your design looks exactly as intended, whether it is a startup tee, a hotel staff uniform or a premium onboarding kit.</p><p>Businesses choose us for dependable merchandise. Organisations choose us for uniforms that last. Everyone gets the same careful craftsmanship.</p></div>
        <div className="grid gap-4">{values.map(([t, d]) => <div key={t} className="rounded-2xl bg-navy-900 p-5 text-white"><h3 className="font-bold">{t}</h3><p className="mt-1 text-sm text-white/75">{d}</p></div>)}</div>
      </div>
      <div className="mt-10 flex flex-wrap gap-3"><Button to="/products">Shop the catalogue</Button><Button to="/contact?topic=quote" variant="secondary">Request a bulk quote</Button></div>
    </PageShell>
  );
}

/* ---------------------------------- policies ------------------------------- */
export function PolicyPage() {
  const { slug } = useParams();
  const { settings } = useSettings();
  const fs = formatINR(settings?.shipping?.freeShippingThreshold || 0);
  const policies = {
    shipping: { title: 'Shipping policy', blocks: [['Production time', settings?.shipping?.processingNote || 'Production takes 5 to 12 working days after design approval.'], ['Delivery time', 'Standard delivery takes 5 to 7 days and express delivery 2 to 3 days after dispatch. Timelines vary by location.'], ['Shipping charges', `Standard shipping is free on orders above ${fs}. Charges for express delivery and smaller orders are shown at checkout.`], ['Multiple addresses', 'We can split large orders across several addresses. Share the details in your order notes or contact us after ordering.']] },
    returns: { title: 'Returns & refunds', blocks: [['Made-to-order items', 'Customised products are made specifically for you, so we cannot accept returns for change of mind.'], ['Defects and print errors', 'If the product has a manufacturing defect or the print differs from the approved proof, tell us within 48 hours of delivery with photos. We will reprint or refund affected items.'], ['Cancellations', 'You can cancel for free until the design proof is approved. After that, production has started and cancellation is not possible.'], ['Refund timing', 'Approved refunds are processed to the original payment method within 7 to 10 working days.']] },
    privacy: { title: 'Privacy policy', blocks: [['What we collect', 'In the live store we collect the contact, address and artwork details you provide to fulfil your order.'], ['This prototype', 'The current demo stores everything only in your own browser (localStorage). Nothing is sent to a server. Clear it any time from the admin "Reset demo data" action or your browser settings.'], ['Your choices', 'You can request access, correction or deletion of your data by contacting us.']] },
    terms: { title: 'Terms of use', blocks: [['Demo prototype', 'This website is a design and functionality prototype. Orders, payments, stock and accounts are simulated and have no real effect.'], ['Pricing', 'Prices shown are demo figures and quantity-based tiers. Final pricing in production is confirmed in your quote or order.'], ['Artwork', 'You confirm you have the right to use any logo or artwork you upload.'], ['Changes', 'We may update these terms as the real store is built.']] },
  };
  const p = policies[slug];
  useDocumentTitle(p?.title);
  if (!p) return <div className="mx-auto max-w-3xl px-4 py-16"><EmptyState title="Policy not found" action={{ label: 'Go home', to: '/' }} /></div>;
  return (
    <PageShell narrow title={p.title} crumbs={[{ label: p.title }]}>
      <div className="space-y-6">{p.blocks.map(([h, t]) => <section key={h}><h2 className="font-display text-xl font-bold text-navy-900">{h}</h2><p className="mt-1 leading-relaxed text-slate-700">{t}</p></section>)}</div>
      <div className="mt-8 flex flex-wrap gap-2 border-t border-slate-200 pt-6 text-sm">{Object.entries(policies).filter(([k]) => k !== slug).map(([k, v]) => <Link key={k} to={`/policies/${k}`} className="rounded-full bg-white px-3 py-1.5 font-semibold text-navy-900 ring-1 ring-slate-200 hover:ring-brand-400">{v.title}</Link>)}</div>
    </PageShell>
  );
}

export function NotFoundPage() {
  useDocumentTitle('Page not found');
  return <div className="mx-auto max-w-xl px-4 py-24 text-center"><p className="font-display text-7xl font-extrabold text-brand-500">404</p><h1 className="mt-2 font-display text-2xl font-extrabold text-navy-900">We could not find that page</h1><p className="mt-2 text-slate-600">The link may be outdated or the page may have moved.</p><div className="mt-6 flex justify-center gap-3"><Button to="/">Go home</Button><Button to="/products" variant="secondary">Browse products</Button></div></div>;
}

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, Clock, Heart, Link2, PackageSearch, ShieldCheck, ShoppingCart, Star, Truck } from 'lucide-react';
import { productsRepo, reviewsRepo, submitReview } from '../../services/api';
import { useAsync, useCollection } from '../../hooks/useAsync';
import { useDocumentTitle } from '../../hooks/useMisc';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import { Badge, EmptyState, PageLoader, Rating } from '../../components/ui/Feedback';
import { Breadcrumbs, Img, QtyStepper, Swatch, Tabs } from '../../components/ui/Misc';
import { Input, Select, Textarea } from '../../components/ui/Form';
import ProductCard from '../../components/store/ProductCard';
import TierTable from '../../components/store/TierTable';
import LogoUploader from '../../components/store/LogoUploader';
import { cx, formatDate, formatINR } from '../../utils/format';
import { printMethodPrice, stockFor, stockStatus, tierPrice, unitPrice, optionDelta } from '../../utils/pricing';
import { validate } from '../../utils/validators';

function ReviewForm({ product, onDone }) {
  const toast = useToast();
  const [v, setV] = useState({ name: '', email: '', rating: 5, title: '', body: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    const res = validate(v, { name: ['required', { minLength: 2 }], email: ['required', 'email'], title: ['required', { maxLength: 80 }], body: ['required', { minLength: 15 }] }, { body: 'Review' });
    setErrors(res.errors);
    if (!res.valid) return;
    setBusy(true);
    try {
      await submitReview({ ...v, rating: Number(v.rating), productId: product.id });
      toast.success('Thank you! Your review is awaiting moderation (demo).');
      setV({ name: '', email: '', rating: 5, title: '', body: '' });
      onDone?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} noValidate className="space-y-4 rounded-2xl bg-slate-50 p-5">
      <h3 className="font-display text-lg font-bold text-navy-900">Write a review</h3>
      <div>
        <p className="mb-1.5 text-sm font-semibold text-slate-800">Your rating</p>
        <div className="flex gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button type="button" key={n} role="radio" aria-checked={Number(v.rating) === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => setV((s) => ({ ...s, rating: n }))}>
              <Star className={cx('h-7 w-7', n <= v.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300')} />
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Name" required value={v.name} onChange={set('name')} error={errors.name} />
        <Input label="Email" type="email" required value={v.email} onChange={set('email')} error={errors.email} hint="Not shown publicly." />
      </div>
      <Input label="Review title" required value={v.title} onChange={set('title')} error={errors.title} />
      <Textarea label="Your review" required value={v.body} onChange={set('body')} error={errors.body} rows={4} />
      <Button type="submit" loading={busy}>Submit review</Button>
    </form>
  );
}

function Reviews({ product }) {
  const { data, reload } = useAsync(() => reviewsRepo.list(), [product.id]);
  const list = (data || []).filter((r) => r.productId === product.id && r.status === 'approved').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, c: list.filter((r) => r.rating === n).length }));
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <div>
        {list.length === 0 ? <EmptyState icon={Star} title="No reviews yet" message="Be the first to share your experience with this product." /> : (
          <>
            <div className="mb-6 grid gap-6 rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100 sm:grid-cols-[10rem_1fr]">
              <div className="text-center"><p className="font-display text-5xl font-extrabold text-navy-900">{product.rating || 0}</p><Rating value={product.rating} size="lg" /><p className="mt-1 text-xs text-slate-500">{list.length} review{list.length === 1 ? '' : 's'}</p></div>
              <div className="space-y-1.5">{dist.map((d) => <div key={d.n} className="flex items-center gap-2 text-xs"><span className="w-6">{d.n}★</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-amber-400" style={{ width: `${(d.c / list.length) * 100}%` }} /></div><span className="w-5 text-right text-slate-500">{d.c}</span></div>)}</div>
            </div>
            <ul className="space-y-4">
              {list.map((r) => (
                <li key={r.id} className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100">
                  <div className="flex flex-wrap items-center justify-between gap-2"><Rating value={r.rating} />{r.verified ? <Badge tone="green">Verified buyer</Badge> : null}</div>
                  <h4 className="mt-2 font-bold text-navy-900">{r.title}</h4>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{r.body}</p>
                  <p className="mt-3 text-xs text-slate-500">{r.name} · {formatDate(r.createdAt)}</p>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      <ReviewForm product={product} onDone={reload} />
    </div>
  );
}

export default function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const cart = useCart();
  const wish = useWishlist();
  const { settings } = useSettings();
  const { data: product, loading } = useAsync(() => productsRepo.get(slug), [slug]);
  const { items: categories } = useCollection('categories');
  const { items: allProducts } = useCollection('products');

  const [options, setOptions] = useState({});
  const [printMethodId, setPrintMethodId] = useState('');
  const [qty, setQty] = useState(1);
  const [img, setImg] = useState(0);
  const [logo, setLogo] = useState(null);
  const [notes, setNotes] = useState('');
  const [tab, setTab] = useState('description');
  const [touched, setTouched] = useState(false);

  useDocumentTitle(product?.name);
  useEffect(() => {
    if (!product) return;
    const o = {};
    product.options.forEach((opt) => (o[opt.name] = opt.values.find((v) => (stockFor(product, { ...o, [opt.name]: v.label }) || 0) > 0)?.label || opt.values[0]?.label));
    setOptions(o);
    setPrintMethodId(product.printMethods?.[0]?.id || '');
    setQty(product.moq);
    setImg(0);
    setLogo(null);
    setNotes('');
    setTouched(false);
    setTab('description');
  }, [product?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const related = useMemo(() => (product ? allProducts.filter((p) => p.categoryId === product.categoryId && p.id !== product.id && p.status === 'published').slice(0, 4) : []), [allProducts, product]);

  if (loading) return <PageLoader label="Loading product…" />;
  if (!product || product.status !== 'published') return <div className="mx-auto max-w-3xl px-4 py-16"><EmptyState icon={PackageSearch} title="Product not found" message="This product may no longer be available." action={{ label: 'Browse all products', to: '/products' }} /></div>;

  const category = categories.find((c) => c.id === product.categoryId);
  const selection = { options, printMethodId };
  const stock = stockFor(product, options);
  const unit = unitPrice(product, selection, qty);
  const total = unit * qty;
  const baseTier = tierPrice(product, qty);
  const extra = optionDelta(product, options) + printMethodPrice(product, printMethodId);
  const outOfStock = stock <= 0;
  const qtyError = qty < product.moq ? `Minimum order quantity is ${product.moq}.` : qty > stock ? `Only ${stock} in stock for this combination.` : '';
  const liked = wish.has(product.id);
  const overall = stockStatus(product);

  const buildItem = () => ({ productId: product.id, options, printMethodId, qty, logo, notes: notes.trim() });
  const add = (go) => {
    setTouched(true);
    if (qtyError || outOfStock) return toast.error(qtyError || 'This combination is out of stock.');
    cart.addItem(buildItem());
    if (go) navigate('/checkout');
    else toast.success(`Added ${qty} × ${product.name} to your cart.`);
  };
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Product link copied.');
    } catch {
      toast.info('Copy this page address from your browser bar.');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: category?.name || 'Products', to: category ? `/category/${category.slug}` : '/products' }, { label: product.name }]} />
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div>
          <div className="aspect-square overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-slate-100"><Img src={product.images[img]} alt={product.name} className="h-full w-full object-cover" /></div>
          {product.images.length > 1 ? (
            <div className="mt-3 flex gap-3">{product.images.map((im, i) => <button key={i} onClick={() => setImg(i)} aria-label={`View image ${i + 1}`} aria-pressed={i === img} className={cx('h-20 w-20 overflow-hidden rounded-xl ring-2', i === img ? 'ring-brand-500' : 'ring-transparent hover:ring-slate-300')}><Img src={im} alt="" className="h-full w-full object-cover" /></button>)}</div>
          ) : null}
          <div className="mt-6"><LogoUploader value={logo} onChange={setLogo} previewImage={product.images[img]} productName={product.name} /></div>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            {category ? <Link to={`/category/${category.slug}`} className="text-xs font-bold uppercase tracking-wider text-brand-600 hover:underline">{category.name}</Link> : null}
            {product.bestSeller ? <Badge tone="pink">Best seller</Badge> : null}
            {overall === 'low' ? <Badge tone="amber">Low stock</Badge> : null}
          </div>
          <h1 className="mt-1 font-display text-3xl font-extrabold text-navy-900">{product.name}</h1>
          <div className="mt-2 flex items-center gap-3">{product.reviewCount ? <button onClick={() => { setTab('reviews'); document.getElementById('details')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:opacity-80"><Rating value={product.rating} count={product.reviewCount} showValue /></button> : <span className="text-sm text-slate-500">No reviews yet</span>}</div>
          <p className="mt-3 text-slate-600">{product.shortDescription}</p>

          <div className="mt-5 flex items-end gap-3 rounded-2xl bg-navy-50 p-4">
            <div><p className="text-xs font-semibold uppercase tracking-wide text-navy-700">Your price per piece</p><p className="font-display text-4xl font-extrabold text-navy-900" data-testid="unit-price">{formatINR(unit)}</p></div>
            <p className="pb-1 text-sm text-slate-600">for {qty} pcs · <span className="font-bold text-navy-900" data-testid="total-price">{formatINR(total)}</span> <span className="text-xs">+ GST as applicable</span></p>
          </div>

          <div className="mt-6 space-y-5">
            {product.options.map((opt) => (
              <div key={opt.name}>
                <p className="mb-2 text-sm font-semibold text-slate-800">{opt.name}: <span className="font-normal text-slate-600">{options[opt.name]}</span></p>
                {opt.type === 'swatch' ? (
                  <div className="flex flex-wrap gap-2">{opt.values.map((v) => <Swatch key={v.label} hex={v.hex} label={v.label} selected={options[opt.name] === v.label} disabled={stockFor(product, { ...options, [opt.name]: v.label }) <= 0} onClick={() => setOptions((o) => ({ ...o, [opt.name]: v.label }))} />)}</div>
                ) : (
                  <div className="flex flex-wrap gap-2">{opt.values.map((v) => {
                    const dis = stockFor(product, { ...options, [opt.name]: v.label }) <= 0;
                    return <button key={v.label} type="button" disabled={dis} aria-pressed={options[opt.name] === v.label} onClick={() => setOptions((o) => ({ ...o, [opt.name]: v.label }))} className={cx('rounded-xl border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 disabled:line-through', options[opt.name] === v.label ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-300 text-slate-700 hover:border-slate-400')}>{v.label}{v.priceDelta ? <span className="ml-1 text-xs text-slate-500">+{formatINR(v.priceDelta)}</span> : null}</button>;
                  })}</div>
                )}
              </div>
            ))}
            {product.printMethods?.length ? (
              <Select label="Decoration method" value={printMethodId} onChange={(e) => setPrintMethodId(e.target.value)} options={product.printMethods.map((m) => ({ value: m.id, label: `${m.label}${m.price ? ` (+${formatINR(m.price)}/pc)` : ''}` }))} />
            ) : null}
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-800">Quantity <span className="font-normal text-slate-500">(minimum {product.moq})</span></p>
              <div className="flex flex-wrap items-center gap-3">
                <QtyStepper value={qty} onChange={setQty} min={1} max={Number.isFinite(stock) ? stock : 99999} step={product.moq >= 25 ? 5 : 1} />
                <span className={cx('text-sm font-medium', outOfStock ? 'text-red-600' : stock <= product.lowStockThreshold ? 'text-amber-600' : 'text-emerald-600')}>
                  {outOfStock ? 'Out of stock for this option' : Number.isFinite(stock) ? (stock <= product.lowStockThreshold ? `Only ${stock} left` : 'In stock') : 'Available'}
                </span>
              </div>
              {(touched || qty < product.moq) && qtyError ? <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">{qtyError}</p> : null}
            </div>
            <div><p className="mb-2 text-sm font-semibold text-slate-800">Quantity pricing</p><TierTable product={product} qty={qty} extra={extra} onPick={(m) => setQty(Math.min(m, Number.isFinite(stock) ? stock : m))} /></div>
            <Textarea label="Notes for our design team (optional)" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Pantone colours, name lists, size split, placement notes…" />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg" icon={ShoppingCart} onClick={() => add(false)} disabled={outOfStock} className="flex-1 sm:flex-none">Add to cart</Button>
            <Button size="lg" variant="navy" onClick={() => add(true)} disabled={outOfStock} className="flex-1 sm:flex-none">Buy now</Button>
            <button type="button" onClick={() => wish.toggle(product.id, product.name)} aria-pressed={liked} aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'} className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-300 hover:bg-slate-50"><Heart className={cx('h-5 w-5', liked && 'fill-brand-500 text-brand-500')} /></button>
            <button type="button" onClick={copyLink} aria-label="Copy product link" className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-300 hover:bg-slate-50"><Link2 className="h-5 w-5" /></button>
          </div>
          {!logo ? <p className="mt-3 text-xs text-slate-500">No logo yet? You can still order: our team will contact you for artwork before production.</p> : <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-700"><Check className="h-4 w-4" />Logo attached for design proof.</p>}

          <ul className="mt-6 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
            <li className="flex items-center gap-2"><Clock className="h-4 w-4 text-brand-500" />~{product.leadTimeDays} days production</li>
            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand-500" />Proof before print</li>
            <li className="flex items-center gap-2"><Truck className="h-4 w-4 text-brand-500" />Free ship ≥ {formatINR(settings?.shipping?.freeShippingThreshold || 0)}</li>
          </ul>
        </div>
      </div>

      <section id="details" className="mt-14">
        <Tabs value={tab} onChange={setTab} tabs={[{ id: 'description', label: 'Description' }, { id: 'specs', label: 'Specifications' }, { id: 'reviews', label: 'Reviews', count: product.reviewCount || 0 }, { id: 'delivery', label: 'Delivery & returns' }]} />
        <div className="mt-6">
          {tab === 'description' ? (
            <div className="grid gap-8 lg:grid-cols-2">
              <p className="leading-relaxed text-slate-700">{product.description}</p>
              <ul className="space-y-2">{product.features.map((f) => <li key={f} className="flex gap-2 text-sm text-slate-700"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{f}</li>)}</ul>
            </div>
          ) : null}
          {tab === 'specs' ? (
            <dl className="grid max-w-2xl divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white text-sm">
              {[['Minimum order', `${product.moq} pieces`], ['Production time', `About ${product.leadTimeDays} working days`], ...product.options.map((o) => [o.name, o.values.map((v) => v.label).join(', ')]), ['Decoration', (product.printMethods || []).map((m) => m.label).join('; ')]].map(([k, v]) => <div key={k} className="grid grid-cols-3 gap-4 px-4 py-3"><dt className="font-semibold text-navy-900">{k}</dt><dd className="col-span-2 text-slate-600">{v}</dd></div>)}
            </dl>
          ) : null}
          {tab === 'reviews' ? <Reviews product={product} /> : null}
          {tab === 'delivery' ? (
            <div className="max-w-2xl space-y-3 text-sm leading-relaxed text-slate-700">
              <p>{settings?.shipping?.processingNote}</p>
              <p>Standard shipping is free on orders above {formatINR(settings?.shipping?.freeShippingThreshold || 0)}. Express and studio pickup options are available at checkout.</p>
              <p>Customised items are made to order, so returns are accepted only for manufacturing defects or printing that differs from the approved proof. Read the full <Link className="font-semibold text-brand-600 hover:underline" to="/policies/returns">returns policy</Link>.</p>
            </div>
          ) : null}
        </div>
      </section>

      {related.length ? (
        <section className="mt-16">
          <h2 className="mb-6 font-display text-2xl font-extrabold text-navy-900">You may also like</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">{related.map((p) => <ProductCard key={p.id} product={p} categoryName={category?.name} />)}</div>
        </section>
      ) : null}
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Heart, Menu, Phone, Search, ShoppingCart, User } from 'lucide-react';
import { brandAssets } from '../../assets';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useCustomer } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useCollection } from '../../hooks/useAsync';
import { useDebounce } from '../../hooks/useMisc';
import { Drawer } from '../ui/Modal';
import { IconButton } from '../ui/Button';
import { Img } from '../ui/Misc';
import { formatINR, cx } from '../../utils/format';
import { startingPrice } from '../../utils/pricing';

const navLink = ({ isActive }) => cx('rounded-lg px-3 py-2 text-sm font-semibold transition hover:text-brand-600', isActive ? 'text-brand-600' : 'text-navy-900');

function AnnouncementBar() {
  const { items } = useCollection('banners');
  const { settings } = useSettings();
  const b = items.filter((x) => x.placement === 'announcement' && x.active).sort((a, c) => a.sortOrder - c.sortOrder)[0];
  if (!b || settings?.site?.announcementEnabled === false) return null;
  return (
    <div className="bg-navy-900 px-4 py-2 text-center text-xs font-medium text-white sm:text-sm">
      <span>{b.title}</span>{' '}
      <Link to={b.link || '/products'} className="ml-1 font-bold text-brand-300 underline-offset-2 hover:underline">{b.ctaLabel || 'Learn more'}</Link>
    </div>
  );
}

function SearchBox({ onDone, className }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const dq = useDebounce(q, 200);
  const { items: products } = useCollection('products');
  const box = useRef(null);

  const suggestions = useMemo(() => {
    const t = dq.trim().toLowerCase();
    if (t.length < 2) return [];
    return products.filter((p) => p.status === 'published' && (p.name + ' ' + (p.tags || []).join(' ')).toLowerCase().includes(t)).slice(0, 5);
  }, [dq, products]);

  useEffect(() => {
    const h = (e) => box.current && !box.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const submit = (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    setOpen(false);
    navigate(`/search?q=${encodeURIComponent(q.trim())}`);
    onDone?.();
  };

  return (
    <div ref={box} className={cx('relative', className)}>
      <form onSubmit={submit} role="search" className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} placeholder="Search polos, caps, keychains…" aria-label="Search products"
          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-20 text-sm focus:border-navy-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-navy-100" />
        <button type="submit" className="absolute right-1.5 top-1/2 h-8 -translate-y-1/2 rounded-lg bg-navy-900 px-3 text-xs font-bold text-white hover:bg-navy-800">Search</button>
      </form>
      {open && dq.trim().length >= 2 ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-pop">
          {suggestions.length === 0 ? <p className="px-4 py-3 text-sm text-slate-500">No quick matches. Press Search to browse all results.</p> : suggestions.map((p) => (
            <Link key={p.id} to={`/product/${p.slug}`} onClick={() => { setOpen(false); setQ(''); onDone?.(); }} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50">
              <Img src={p.images[0]} alt="" className="h-11 w-11 rounded-lg object-cover" />
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-navy-900">{p.name}</span><span className="text-xs text-slate-500">From {formatINR(startingPrice(p))} / pc</span></span>
            </Link>
          ))}
          <Link to={`/search?q=${encodeURIComponent(dq.trim())}`} onClick={() => { setOpen(false); onDone?.(); }} className="block border-t border-slate-100 px-4 py-2.5 text-sm font-semibold text-brand-600 hover:bg-slate-50">See all results for “{dq.trim()}”</Link>
        </div>
      ) : null}
    </div>
  );
}

export default function Header() {
  const { count } = useCart();
  const wishlist = useWishlist();
  const { customer } = useCustomer();
  const { settings } = useSettings();
  const { items: categories } = useCollection('categories');
  const [menu, setMenu] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [mobileShop, setMobileShop] = useState(true);
  const loc = useLocation();
  const cats = categories.filter((c) => c.status === 'active').sort((a, b) => a.sortOrder - b.sortOrder);

  useEffect(() => {
    setMenu(false);
    setShopOpen(false);
  }, [loc.pathname, loc.search]);

  return (
    <header className="sticky top-0 z-40 bg-white/95 shadow-sm backdrop-blur">
      <AnnouncementBar />
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
        <IconButton label="Open menu" icon={Menu} className="lg:hidden" onClick={() => setMenu(true)} />
        <Link to="/" className="shrink-0" aria-label="Darzibabu home">
          <img src={brandAssets.logo} alt="Darzibabu - The art of thread" className="h-9 w-auto sm:h-11" />
        </Link>
        <SearchBox className="mx-4 hidden max-w-xl flex-1 lg:block" />
        <div className="ml-auto flex items-center gap-1">
          <a href={`tel:${(settings?.site?.phone || '').replace(/\s/g, '')}`} className="mr-2 hidden items-center gap-2 text-sm font-semibold text-navy-900 xl:flex"><Phone className="h-4 w-4 text-brand-500" />{settings?.site?.phone}</a>
          <Link to="/wishlist" aria-label="Wishlist" className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100">
            <Heart className="h-5 w-5" />
            {wishlist.ids.length ? <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-navy-900 px-1 text-[11px] font-bold text-white">{wishlist.ids.length}</span> : null}
          </Link>
          <Link to={customer ? '/account' : '/login'} aria-label={customer ? 'My account' : 'Sign in'} className="inline-flex h-10 items-center gap-2 rounded-xl px-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">
            <User className="h-5 w-5" /><span className="hidden md:inline">{customer ? customer.name.split(' ')[0] : 'Sign in'}</span>
          </Link>
          <Link to="/cart" aria-label={`Cart, ${count} items`} className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl bg-navy-900 text-white hover:bg-navy-800">
            <ShoppingCart className="h-5 w-5" />
            {count ? <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-500 px-1 text-[11px] font-bold text-white">{count > 999 ? '999+' : count}</span> : null}
          </Link>
        </div>
      </div>

      <nav className="hidden border-t border-slate-100 lg:block" aria-label="Main">
        <div className="mx-auto flex max-w-7xl items-center gap-1 px-6">
          <div className="relative" onMouseEnter={() => setShopOpen(true)} onMouseLeave={() => setShopOpen(false)}>
            <button type="button" aria-expanded={shopOpen} onClick={() => setShopOpen((o) => !o)} className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-navy-900 hover:text-brand-600">
              Shop by category <ChevronDown className="h-4 w-4" />
            </button>
            {shopOpen ? (
              <div className="absolute left-0 top-full z-50 w-[34rem] rounded-2xl border border-slate-200 bg-white p-3 shadow-pop">
                <div className="grid grid-cols-2 gap-1">
                  {cats.map((c) => (
                    <Link key={c.id} to={`/category/${c.slug}`} className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-50">
                      <Img src={c.image} alt="" className="h-11 w-11 rounded-lg object-cover" />
                      <span className="text-sm font-semibold text-navy-900">{c.name}</span>
                    </Link>
                  ))}
                </div>
                <Link to="/categories" className="mt-2 block rounded-xl bg-navy-50 px-3 py-2 text-center text-sm font-bold text-navy-900 hover:bg-navy-100">View all categories</Link>
              </div>
            ) : null}
          </div>
          <NavLink to="/products" end className={navLink}>All products</NavLink>
          <NavLink to="/category/corporate-gift-kits" className={navLink}>Gift kits</NavLink>
          <NavLink to="/category/uniforms-workwear" className={navLink}>Uniforms</NavLink>
          <NavLink to="/blog" className={navLink}>Blog</NavLink>
          <NavLink to="/about" className={navLink}>About</NavLink>
          <NavLink to="/track-order" className={navLink}>Track order</NavLink>
          <Link to="/contact?topic=quote" className="ml-auto rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-bold text-brand-700 hover:bg-brand-100">Get a bulk quote</Link>
        </div>
      </nav>

      <Drawer open={menu} onClose={() => setMenu(false)} title="Menu">
        <div className="space-y-4 p-4">
          <SearchBox onDone={() => setMenu(false)} />
          <div>
            <button type="button" onClick={() => setMobileShop((o) => !o)} aria-expanded={mobileShop} className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-3 py-3 text-sm font-bold text-navy-900">
              Shop by category <ChevronDown className={cx('h-4 w-4 transition', mobileShop && 'rotate-180')} />
            </button>
            {mobileShop ? (
              <div className="mt-1 space-y-0.5 pl-2">
                {cats.map((c) => <Link key={c.id} to={`/category/${c.slug}`} className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-slate-700 hover:bg-slate-50"><Img src={c.image} alt="" className="h-8 w-8 rounded-md object-cover" />{c.name}</Link>)}
              </div>
            ) : null}
          </div>
          <div className="grid gap-0.5 text-sm font-semibold text-navy-900">
            {[['/products', 'All products'], ['/blog', 'Blog'], ['/about', 'About us'], ['/faqs', 'FAQs'], ['/contact', 'Contact'], ['/track-order', 'Track order'], ['/wishlist', 'Wishlist'], ['/account', customer ? 'My account' : 'Sign in / Register']].map(([to, l]) => (
              <Link key={to} to={to} className="rounded-lg px-3 py-2.5 hover:bg-slate-50">{l}</Link>
            ))}
            <Link to="/contact?topic=quote" className="mt-2 rounded-xl bg-brand-500 px-3 py-3 text-center text-white">Get a bulk quote</Link>
          </div>
        </div>
      </Drawer>
    </header>
  );
}

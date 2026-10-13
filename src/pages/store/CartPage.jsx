import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TriangleAlert, ShoppingBag, Tag, Trash2, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { useDocumentTitle } from '../../hooks/useMisc';
import Button from '../../components/ui/Button';
import { EmptyState, Spinner } from '../../components/ui/Feedback';
import { Breadcrumbs, Img, QtyStepper } from '../../components/ui/Misc';
import { LogoThumb } from '../../components/store/LogoUploader';
import { formatINR } from '../../utils/format';

export function OrderSummary({ totals, coupon, children, showItems, lines }) {
  const { settings } = useSettings();
  return (
    <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100">
      <h2 className="font-display text-lg font-bold text-navy-900">Order summary</h2>
      {showItems ? <ul className="mt-3 max-h-60 divide-y divide-slate-100 overflow-y-auto text-sm">{lines.map((l) => <li key={l.key} className="flex items-center gap-3 py-2"><Img src={l.product.images[0]} alt="" className="h-12 w-12 rounded-lg object-cover" /><span className="min-w-0 flex-1"><span className="block truncate font-semibold text-navy-900">{l.product.name}</span><span className="text-xs text-slate-500">{Object.values(l.options).join(' / ')} · {l.qty} pcs</span></span><span className="font-semibold">{formatINR(l.lineTotal)}</span></li>)}</ul> : null}
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between"><dt className="text-slate-600">Subtotal</dt><dd className="font-semibold">{formatINR(totals.subtotal)}</dd></div>
        {totals.discount ? <div className="flex justify-between text-emerald-700"><dt>Discount {coupon ? `(${coupon.code})` : ''}</dt><dd className="font-semibold">-{formatINR(totals.discount)}</dd></div> : null}
        <div className="flex justify-between"><dt className="text-slate-600">Shipping ({totals.shippingMethod?.label?.split(' (')[0] || '-'})</dt><dd className="font-semibold">{totals.shipping ? formatINR(totals.shipping) : 'Free'}</dd></div>
        <div className="flex justify-between"><dt className="text-slate-600">GST ({totals.taxRate}%)</dt><dd className="font-semibold">{settings?.tax?.pricesIncludeTax ? 'Included' : formatINR(totals.tax)}</dd></div>
        <div className="flex justify-between border-t border-slate-200 pt-3 text-base"><dt className="font-bold text-navy-900">Total</dt><dd className="font-display text-2xl font-extrabold text-navy-900" data-testid="grand-total">{formatINR(totals.total)}</dd></div>
      </dl>
      {children}
    </div>
  );
}

export function CouponBox() {
  const cart = useCart();
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState(false);
  const apply = async (e) => {
    e.preventDefault();
    if (!code.trim()) return setMsg({ type: 'error', text: 'Enter a coupon code.' });
    setBusy(true);
    const res = await cart.applyCoupon(code);
    setBusy(false);
    if (res.ok) { setMsg({ type: 'ok', text: `Coupon ${res.coupon.code} applied.` }); setCode(''); } else setMsg({ type: 'error', text: res.error });
  };
  if (cart.coupon) {
    return <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800"><span className="flex items-center gap-2"><Tag className="h-4 w-4" /><b>{cart.coupon.code}</b> · {cart.coupon.description}</span><button onClick={() => { cart.removeCoupon(); setMsg({ type: '', text: '' }); }} aria-label="Remove coupon" className="rounded p-1 hover:bg-emerald-100"><X className="h-4 w-4" /></button></div>;
  }
  return (
    <form onSubmit={apply} noValidate>
      <label htmlFor="coupon" className="mb-1.5 block text-sm font-semibold text-slate-800">Have a coupon?</label>
      <div className="flex gap-2">
        <input id="coupon" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. WELCOME10" className="h-11 min-w-0 flex-1 rounded-xl border border-slate-300 px-3 text-sm uppercase focus:border-navy-500 focus:outline-none focus:ring-4 focus:ring-navy-100" />
        <Button type="submit" variant="navy" loading={busy}>Apply</Button>
      </div>
      {msg.text ? <p role={msg.type === 'error' ? 'alert' : 'status'} className={`mt-1.5 text-xs font-medium ${msg.type === 'error' ? 'text-red-600' : 'text-emerald-700'}`}>{msg.text}</p> : null}
    </form>
  );
}

export default function CartPage() {
  useDocumentTitle('Your cart');
  const cart = useCart();
  const { settings } = useSettings();
  const toast = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const { lines, totals } = cart;
  const methods = (settings?.shipping?.methods || []).filter((m) => m.enabled);
  const minOrder = settings?.orders?.minOrderValue || 0;
  const blocked = lines.some((l) => l.unavailable) || lines.some((l) => l.qty < (l.product?.moq || 1)) || totals.subtotal < minOrder;

  const remove = async (l) => {
    if (await confirm({ title: 'Remove item?', message: `Remove ${l.product?.name || 'this item'} from your cart?`, confirmLabel: 'Remove', danger: true })) {
      cart.removeItem(l.key);
      toast.info('Item removed from cart.');
    }
  };
  const clearAll = async () => {
    if (await confirm({ title: 'Clear cart?', message: 'All items will be removed from your cart.', confirmLabel: 'Clear cart', danger: true })) cart.clear();
  };

  if (!cart.ready) return <div className="py-20"><Spinner className="mx-auto h-8 w-8" /></div>;
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Cart' }]} />
      <div className="flex items-end justify-between"><h1 className="font-display text-3xl font-extrabold text-navy-900">Your cart</h1>{lines.length ? <Button variant="ghost" size="sm" icon={Trash2} onClick={clearAll}>Clear cart</Button> : null}</div>
      {lines.length === 0 ? (
        <EmptyState className="mt-8" icon={ShoppingBag} title="Your cart is empty" message="Add products, upload your logo and see volume pricing update instantly." action={{ label: 'Start shopping', to: '/products' }} />
      ) : (
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_24rem]">
          <ul className="space-y-4">
            {lines.map((l) => (
              <li key={l.key} className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-100 sm:flex-row">
                <Link to={l.product ? `/product/${l.product.slug}` : '/products'} className="shrink-0"><Img src={l.product?.images?.[0]} alt={l.product?.name || 'Unavailable'} className="h-28 w-28 rounded-xl object-cover" /></Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-bold text-navy-900">{l.product ? <Link to={`/product/${l.product.slug}`} className="hover:text-brand-600">{l.product.name}</Link> : 'Unavailable product'}</h2>
                      <p className="mt-0.5 text-sm text-slate-600">{Object.entries(l.options).map(([k, v]) => `${k}: ${v}`).join(' · ')}</p>
                      {l.product ? <p className="text-xs text-slate-500">{l.product.printMethods?.find((m) => m.id === l.printMethodId)?.label}</p> : null}
                    </div>
                    <button onClick={() => remove(l)} aria-label={`Remove ${l.product?.name || 'item'}`} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  {l.unavailable ? <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-red-600"><TriangleAlert className="h-4 w-4" />This product is no longer available. Remove it to continue.</p> : (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <QtyStepper size="sm" value={l.qty} min={l.product.moq} max={Number.isFinite(l.stock) ? l.stock : 99999} step={l.product.moq >= 25 ? 5 : 1} onChange={(q) => cart.updateQty(l.key, q)} />
                        <div className="text-xs text-slate-500"><p>{formatINR(l.unit)} / pc</p>{l.qty < l.product.moq ? <p className="font-semibold text-red-600">Min {l.product.moq}</p> : null}</div>
                      </div>
                      <p className="font-display text-xl font-extrabold text-navy-900">{formatINR(l.lineTotal)}</p>
                    </div>
                  )}
                  {l.logo ? <div className="mt-3 flex items-center gap-3 rounded-xl bg-slate-50 p-2"><LogoThumb logo={l.logo} image={l.product?.images?.[0]} className="h-14 w-14" /><p className="text-xs text-slate-600">Logo: <b>{l.logo.name}</b><br />Placement: {l.logo.placement?.id?.replace('-', ' ')}</p></div> : <p className="mt-3 text-xs text-slate-500">No logo uploaded: our team will request artwork after you order.</p>}
                  {l.notes ? <p className="mt-2 text-xs text-slate-500">Note: {l.notes}</p> : null}
                </div>
              </li>
            ))}
            <li><Button to="/products" variant="secondary">Continue shopping</Button></li>
          </ul>
          <aside className="space-y-4 lg:sticky lg:top-32 lg:self-start">
            <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100"><CouponBox /></div>
            <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100">
              <p className="mb-2 text-sm font-semibold text-slate-800">Shipping method</p>
              <div className="space-y-2">{methods.map((m) => (
                <label key={m.id} className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-sm has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
                  <span className="flex items-center gap-2"><input type="radio" name="ship" checked={cart.shippingMethodId === m.id} onChange={() => cart.setShippingMethod(m.id)} className="text-brand-500 focus:ring-brand-300" />{m.label}</span>
                  <span className="font-semibold">{m.id === 'standard' && totals.subtotal - totals.discount >= (settings.shipping.freeShippingThreshold || Infinity) ? 'Free' : m.price ? formatINR(m.price) : 'Free'}</span>
                </label>))}</div>
            </div>
            <OrderSummary totals={totals} coupon={cart.coupon}>
              {totals.subtotal < minOrder ? <p role="alert" className="mt-3 text-xs font-medium text-red-600">Minimum order value is {formatINR(minOrder)}.</p> : null}
              <Button className="mt-4 w-full" size="lg" disabled={blocked} onClick={() => navigate('/checkout')}>Proceed to checkout</Button>
              <p className="mt-2 text-center text-xs text-slate-500">Demo checkout: no real payment is taken.</p>
            </OrderSummary>
          </aside>
        </div>
      )}
    </div>
  );
}

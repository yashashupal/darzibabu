import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Info, Lock, ShoppingBag } from 'lucide-react';
import { placeOrder } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useCustomer } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import { useDocumentTitle } from '../../hooks/useMisc';
import Button from '../../components/ui/Button';
import { Checkbox, Input, Select, Textarea } from '../../components/ui/Form';
import { EmptyState, Spinner } from '../../components/ui/Feedback';
import { Breadcrumbs } from '../../components/ui/Misc';
import { OrderSummary, CouponBox } from './CartPage';
import { validate } from '../../utils/validators';
import { formatINR, cx } from '../../utils/format';
import { DEMO_NOTICE } from '../../config/brand';

const STATES = ['Andhra Pradesh', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal', 'Other'];
const GSTIN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export default function CheckoutPage() {
  useDocumentTitle('Checkout');
  const cart = useCart();
  const { customer } = useCustomer();
  const { settings } = useSettings();
  const toast = useToast();
  const navigate = useNavigate();
  const [v, setV] = useState({ name: '', email: '', phone: '', company: '', gstin: '', line1: '', line2: '', city: '', state: '', pincode: '', notes: '', payment: '', terms: false });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    if (!customer || prefilled) return;
    const a = customer.addresses?.find((x) => x.isDefault) || customer.addresses?.[0] || {};
    setV((s) => ({ ...s, name: customer.name || '', email: customer.email || '', phone: customer.phone || '', company: customer.company || '', gstin: customer.gstin || '', line1: a.line1 || '', line2: a.line2 || '', city: a.city || '', state: a.state || '', pincode: a.pincode || '' }));
    setPrefilled(true);
  }, [customer, prefilled]);

  const payments = (settings?.payments?.methods || []).filter((m) => m.enabled);
  useEffect(() => {
    if (!v.payment && payments.length) setV((s) => ({ ...s, payment: payments[0].id }));
  }, [payments.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const { validLines, totals } = cart;

  if (!cart.ready) return <div className="py-20"><Spinner className="mx-auto h-8 w-8" /></div>;
  if (!validLines.length) return <div className="mx-auto max-w-3xl px-4 py-16"><EmptyState icon={ShoppingBag} title="Nothing to check out" message="Your cart is empty. Add a few products first." action={{ label: 'Browse products', to: '/products' }} /></div>;

  const submit = async (e) => {
    e.preventDefault();
    const res = validate(v, {
      name: ['required', { minLength: 2 }], email: ['required', 'email'], phone: ['required', 'phone'],
      gstin: [{ pattern: GSTIN, message: 'Enter a valid 15-character GSTIN or leave blank.' }],
      line1: ['required', { minLength: 5 }], city: ['required'], state: ['required'], pincode: ['required', { pattern: /^[1-9][0-9]{5}$/, message: 'Enter a valid 6-digit PIN code.' }],
      payment: [{ custom: (x) => (!x ? 'Select a payment method.' : null) }],
      terms: [{ custom: (x) => (x ? null : 'Please accept the terms to continue.') }],
    }, { line1: 'Address', pincode: 'PIN code', gstin: 'GSTIN' });
    setErrors(res.errors);
    if (!res.valid) {
      toast.error('Please fix the highlighted fields.');
      setTimeout(() => document.querySelector('[aria-invalid="true"]')?.focus(), 50);
      return;
    }
    if (validLines.some((l) => l.qty < l.product.moq)) return toast.error('One or more items are below the minimum order quantity.');
    setBusy(true);
    try {
      await new Promise((r) => setTimeout(r, window.__DZ_FAST ? 0 : 900)); // simulated payment processing
      const pay = payments.find((p) => p.id === v.payment);
      const order = await placeOrder({
        customer: { name: v.name.trim(), email: v.email.trim(), phone: v.phone.trim(), company: v.company.trim(), gstin: v.gstin.trim().toUpperCase() },
        shippingAddress: { name: v.name.trim(), phone: v.phone.trim(), line1: v.line1.trim(), line2: v.line2.trim(), city: v.city.trim(), state: v.state, pincode: v.pincode },
        items: validLines.map((l) => ({ productId: l.productId, name: l.product.name, image: l.product.images[0], options: l.options, printMethodId: l.printMethodId, printMethodLabel: l.product.printMethods?.find((m) => m.id === l.printMethodId)?.label || '', qty: l.qty, unit: l.unit, hasLogo: !!l.logo, logoName: l.logo?.name || '', logo: l.logo || null, notes: l.notes || '' })),
        totals, couponCode: cart.coupon?.code || '', shippingMethodId: totals.shippingMethod?.id, shippingMethodLabel: totals.shippingMethod?.label,
        paymentMethod: pay?.label || v.payment, notes: v.notes.trim(),
      });
      cart.clear();
      navigate(`/order-confirmation/${order.orderNo}`, { replace: true });
    } catch (err) {
      toast.error(err.message || 'Could not place the order.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Cart', to: '/cart' }, { label: 'Checkout' }]} />
      <h1 className="font-display text-3xl font-extrabold text-navy-900">Checkout</h1>
      <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"><Info className="mt-0.5 h-4 w-4 shrink-0" /><p><b>Demo checkout.</b> {DEMO_NOTICE} Do not enter real card or bank details.</p></div>
      {!customer ? <p className="mt-3 text-sm text-slate-600">Already have an account? <Link to="/login?next=/checkout" className="font-semibold text-brand-600 hover:underline">Sign in</Link> to prefill your details, or continue as a guest.</p> : null}

      <form onSubmit={submit} noValidate className="mt-6 grid gap-8 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-6">
          <section className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100">
            <h2 className="mb-4 font-display text-lg font-bold text-navy-900">1. Contact details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Full name" required value={v.name} onChange={set('name')} error={errors.name} autoComplete="name" />
              <Input label="Email" type="email" required value={v.email} onChange={set('email')} error={errors.email} autoComplete="email" />
              <Input label="Phone" required value={v.phone} onChange={set('phone')} error={errors.phone} autoComplete="tel" />
              <Input label="Company (optional)" value={v.company} onChange={set('company')} autoComplete="organization" />
              <Input label="GSTIN (optional)" className="sm:col-span-2" value={v.gstin} onChange={set('gstin')} error={errors.gstin} hint="Add for a GST invoice." />
            </div>
          </section>
          <section className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100">
            <h2 className="mb-4 font-display text-lg font-bold text-navy-900">2. Shipping address</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Address line 1" required className="sm:col-span-2" value={v.line1} onChange={set('line1')} error={errors.line1} autoComplete="address-line1" />
              <Input label="Address line 2" className="sm:col-span-2" value={v.line2} onChange={set('line2')} autoComplete="address-line2" />
              <Input label="City" required value={v.city} onChange={set('city')} error={errors.city} autoComplete="address-level2" />
              <Select label="State" required value={v.state} onChange={set('state')} error={errors.state} placeholder="Select state" options={STATES} />
              <Input label="PIN code" required inputMode="numeric" maxLength={6} value={v.pincode} onChange={set('pincode')} error={errors.pincode} autoComplete="postal-code" />
            </div>
          </section>
          <section className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100">
            <h2 className="mb-1 font-display text-lg font-bold text-navy-900">3. Payment method</h2>
            <p className="mb-4 text-xs text-slate-500">Display only: choosing a method does not charge anything in this prototype.</p>
            <div className="space-y-2" role="radiogroup" aria-label="Payment method">
              {payments.map((p) => (
                <label key={p.id} className={cx('flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm', v.payment === p.id ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:bg-slate-50')}>
                  <input type="radio" name="payment" checked={v.payment === p.id} onChange={() => setV((s) => ({ ...s, payment: p.id }))} className="text-brand-500 focus:ring-brand-300" />
                  <span><span className="font-semibold text-navy-900">{p.label}</span><span className="block text-xs text-slate-500">{p.note}</span></span>
                </label>
              ))}
            </div>
            {errors.payment ? <p role="alert" className="mt-2 text-xs font-medium text-red-600">{errors.payment}</p> : null}
          </section>
          <section className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100">
            <h2 className="mb-4 font-display text-lg font-bold text-navy-900">4. Order notes</h2>
            <Textarea rows={3} value={v.notes} onChange={set('notes')} placeholder="Delivery instructions, split shipments, name lists…" aria-label="Order notes" />
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-32 lg:self-start">
          <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100"><CouponBox /></div>
          <OrderSummary totals={totals} coupon={cart.coupon} showItems lines={validLines}>
            <div className="mt-4"><Checkbox checked={v.terms} onChange={(c) => setV((s) => ({ ...s, terms: c }))} label={<>I agree to the <Link to="/policies/terms" target="_blank" className="text-brand-600 underline">terms</Link> and <Link to="/policies/returns" target="_blank" className="text-brand-600 underline">returns policy</Link>.</>} />{errors.terms ? <p role="alert" className="mt-1 text-xs font-medium text-red-600">{errors.terms}</p> : null}</div>
            <Button type="submit" className="mt-4 w-full" size="lg" icon={Lock} loading={busy}>{busy ? 'Placing order…' : `Place demo order · ${formatINR(totals.total)}`}</Button>
          </OrderSummary>
        </aside>
      </form>
    </div>
  );
}

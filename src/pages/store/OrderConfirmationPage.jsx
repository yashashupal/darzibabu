import { Link, useParams } from 'react-router-dom';
import { CircleCheck, Printer, Search } from 'lucide-react';
import { ordersRepo } from '../../services/api';
import { useAsync } from '../../hooks/useAsync';
import { useDocumentTitle } from '../../hooks/useMisc';
import Button from '../../components/ui/Button';
import { EmptyState, PageLoader } from '../../components/ui/Feedback';
import { Img } from '../../components/ui/Misc';
import { LogoThumb } from '../../components/store/LogoUploader';
import { formatDateTime, formatINR } from '../../utils/format';

export function OrderItems({ order }) {
  return (
    <ul className="divide-y divide-slate-100">
      {order.items.map((it, i) => (
        <li key={i} className="flex items-center gap-3 py-3 text-sm">
          {it.logo ? <LogoThumb logo={it.logo} image={it.image} className="h-16 w-16 shrink-0" /> : <Img src={it.image} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />}
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-navy-900">{it.name}</p>
            <p className="text-xs text-slate-500">{Object.values(it.options || {}).join(' / ')}{it.printMethodLabel ? ` · ${it.printMethodLabel}` : ''}</p>
            <p className="text-xs text-slate-500">{it.hasLogo ? `Logo: ${it.logoName}` : 'Artwork to be shared'} · {it.qty} × {formatINR(it.unit)}</p>
          </div>
          <p className="font-semibold">{formatINR(it.unit * it.qty)}</p>
        </li>
      ))}
    </ul>
  );
}

export function OrderTotals({ order }) {
  return (
    <dl className="space-y-1.5 text-sm">
      <div className="flex justify-between"><dt className="text-slate-600">Subtotal</dt><dd>{formatINR(order.subtotal)}</dd></div>
      {order.discount ? <div className="flex justify-between text-emerald-700"><dt>Discount {order.couponCode ? `(${order.couponCode})` : ''}</dt><dd>-{formatINR(order.discount)}</dd></div> : null}
      <div className="flex justify-between"><dt className="text-slate-600">Shipping</dt><dd>{order.shipping ? formatINR(order.shipping) : 'Free'}</dd></div>
      <div className="flex justify-between"><dt className="text-slate-600">GST</dt><dd>{formatINR(order.tax)}</dd></div>
      <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-navy-900"><dt>Total</dt><dd>{formatINR(order.total)}</dd></div>
    </dl>
  );
}

export default function OrderConfirmationPage() {
  const { orderNo } = useParams();
  useDocumentTitle(`Order ${orderNo}`);
  const { data: orders, loading } = useAsync(() => ordersRepo.list(), [orderNo]);
  const order = (orders || []).find((o) => o.orderNo === orderNo);
  if (loading) return <PageLoader />;
  if (!order) return <div className="mx-auto max-w-3xl px-4 py-16"><EmptyState icon={Search} title="Order not found" message="We could not find this order in this browser." action={{ label: 'Track an order', to: '/track-order' }} /></div>;
  const a = order.shippingAddress;
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="rounded-3xl bg-white p-8 text-center shadow-card ring-1 ring-slate-100">
        <CircleCheck className="mx-auto h-14 w-14 text-emerald-500" />
        <h1 className="mt-4 font-display text-3xl font-extrabold text-navy-900">Thank you, your demo order is placed!</h1>
        <p className="mt-2 text-slate-600">Order number <b className="text-navy-900" data-testid="order-no">{order.orderNo}</b> · placed {formatDateTime(order.createdAt)}</p>
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">Next, our design team prepares a proof for your approval. No payment was taken because this is a demo prototype.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button to={`/track-order?order=${order.orderNo}&email=${encodeURIComponent(order.customer.email)}`} icon={Search}>Track this order</Button>
          <Button variant="secondary" icon={Printer} onClick={() => window.print()}>Print summary</Button>
          <Button variant="ghost" to="/products">Continue shopping</Button>
        </div>
      </div>
      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_18rem]">
        <section className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100"><h2 className="font-display text-lg font-bold text-navy-900">Items</h2><OrderItems order={order} /><div className="mt-2 border-t border-slate-100 pt-3"><OrderTotals order={order} /></div></section>
        <section className="space-y-4">
          <div className="rounded-2xl bg-white p-5 text-sm shadow-card ring-1 ring-slate-100"><h2 className="font-bold text-navy-900">Shipping to</h2><p className="mt-1 text-slate-600">{a.name}<br />{a.line1}{a.line2 ? `, ${a.line2}` : ''}<br />{a.city}, {a.state} {a.pincode}<br />{a.phone}</p><p className="mt-2 text-xs text-slate-500">{order.shippingMethodLabel}</p></div>
          <div className="rounded-2xl bg-white p-5 text-sm shadow-card ring-1 ring-slate-100"><h2 className="font-bold text-navy-900">Payment</h2><p className="mt-1 text-slate-600">{order.paymentMethod} · {order.paymentStatus}</p></div>
          <p className="text-xs text-slate-500">Confirmation sent to {order.customer.email} <span className="italic">(demo: no email is actually sent)</span>. Questions? <Link className="font-semibold text-brand-600 hover:underline" to="/contact">Contact us</Link>.</p>
        </section>
      </div>
    </div>
  );
}

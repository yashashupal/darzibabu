import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PackageSearch } from 'lucide-react';
import { trackOrder } from '../../services/api';
import { useDocumentTitle } from '../../hooks/useMisc';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Form';
import { Breadcrumbs } from '../../components/ui/Misc';
import { StatusBadge } from '../../components/ui/Feedback';
import OrderTimeline from '../../components/store/OrderTimeline';
import { OrderItems, OrderTotals } from './OrderConfirmationPage';
import { validate } from '../../utils/validators';
import { formatDateTime } from '../../utils/format';

export default function TrackOrderPage() {
  useDocumentTitle('Track your order');
  const [params] = useSearchParams();
  const [v, setV] = useState({ orderNo: params.get('order') || '', email: params.get('email') || '' });
  const [errors, setErrors] = useState({});
  const [state, setState] = useState({ loading: false, order: null, searched: false });

  const run = async (val) => {
    const res = validate(val, { orderNo: ['required'], email: ['required', 'email'] }, { orderNo: 'Order number' });
    setErrors(res.errors);
    if (!res.valid) return;
    setState({ loading: true, order: null, searched: false });
    const order = await trackOrder(val.orderNo, val.email);
    setState({ loading: false, order, searched: true });
  };
  useEffect(() => {
    if (params.get('order') && params.get('email')) run({ orderNo: params.get('order'), email: params.get('email') });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Track order' }]} />
      <h1 className="font-display text-3xl font-extrabold text-navy-900">Track your order</h1>
      <p className="mt-2 text-slate-600">Enter your order number and the email used at checkout. Demo tip: try <b>DB-10001</b> with <b>aarav.mehta@brightlabs.example</b>, or place a new demo order.</p>
      <form onSubmit={(e) => { e.preventDefault(); run(v); }} noValidate className="mt-6 grid gap-4 rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100 sm:grid-cols-[1fr_1fr_auto] sm:items-start">
        <Input label="Order number" placeholder="DB-10001" value={v.orderNo} onChange={(e) => setV((s) => ({ ...s, orderNo: e.target.value }))} error={errors.orderNo} />
        <Input label="Email" type="email" value={v.email} onChange={(e) => setV((s) => ({ ...s, email: e.target.value }))} error={errors.email} />
        <Button type="submit" className="sm:mt-[1.65rem]" loading={state.loading} icon={PackageSearch}>Track</Button>
      </form>
      {state.searched && !state.order ? <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">No order matches those details. Check the order number and email, then try again.</p> : null}
      {state.order ? (
        <div className="mt-6 grid gap-6 md:grid-cols-[1fr_20rem]">
          <section className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-100">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs uppercase tracking-wide text-slate-500">Order</p><p className="font-display text-xl font-extrabold text-navy-900">{state.order.orderNo}</p></div><StatusBadge status={state.order.status} /></div>
            <OrderTimeline order={state.order} />
          </section>
          <section className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100">
            <p className="text-xs text-slate-500">Placed {formatDateTime(state.order.createdAt)}</p>
            <OrderItems order={state.order} />
            <div className="border-t border-slate-100 pt-3"><OrderTotals order={state.order} /></div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

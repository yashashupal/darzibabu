import { Check, CircleX } from 'lucide-react';
import { ORDER_STATUSES } from '../../config/brand';
import { formatDateTime, cx } from '../../utils/format';

const STEP_HINT = {
  Placed: 'We have received your order.',
  'Design Approval': 'Our team prepares a design proof for your approval.',
  'In Production': 'Your items are being printed or embroidered.',
  'Quality Check': 'Each piece is inspected before packing.',
  Dispatched: 'Your order is on its way.',
  Delivered: 'Delivered. We hope you love it!',
};

export default function OrderTimeline({ order }) {
  const cancelled = order.status === 'Cancelled';
  const reached = order.history.filter((h) => h.status !== 'Cancelled').map((h) => h.status);
  const idx = Math.max(-1, ...reached.map((s) => ORDER_STATUSES.indexOf(s)));
  return (
    <div>
      {cancelled ? (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"><CircleX className="h-5 w-5" />This order was cancelled.</div>
      ) : null}
      <ol className="relative space-y-0">
        {ORDER_STATUSES.map((s, i) => {
          const done = i <= idx;
          const current = i === idx && !cancelled;
          const entry = [...order.history].reverse().find((h) => h.status === s);
          return (
            <li key={s} className="relative flex gap-4 pb-6 last:pb-0">
              {i < ORDER_STATUSES.length - 1 ? <span className={cx('absolute left-[15px] top-8 h-full w-0.5', i < idx ? 'bg-emerald-400' : 'bg-slate-200')} aria-hidden="true" /> : null}
              <span className={cx('relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold', done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-white text-slate-400', current && 'ring-4 ring-emerald-100')}>
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <div className={cx(!done && 'opacity-60')}>
                <p className="font-semibold text-navy-900">{s}{current ? <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">Current</span> : null}</p>
                <p className="text-sm text-slate-600">{entry?.note || STEP_HINT[s]}</p>
                {entry ? <p className="text-xs text-slate-400">{formatDateTime(entry.at)}</p> : null}
              </div>
            </li>
          );
        })}
      </ol>
      {cancelled ? <p className="mt-4 text-xs text-slate-500">{order.history.find((h) => h.status === 'Cancelled')?.note} · {formatDateTime(order.history.find((h) => h.status === 'Cancelled')?.at)}</p> : null}
    </div>
  );
}

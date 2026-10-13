import { LoaderCircle, Star } from 'lucide-react';
import { cx } from '../../utils/format';
import Button from './Button';

export const Spinner = ({ className }) => <LoaderCircle className={cx('h-5 w-5 animate-spin text-navy-700', className)} aria-label="Loading" />;

export function PageLoader({ label = 'Loading…', className }) {
  return (
    <div className={cx('flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-500', className)} role="status">
      <Spinner className="h-8 w-8" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export const Skeleton = ({ className }) => <div className={cx('animate-pulse rounded-lg bg-slate-200/80', className)} />;

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl bg-white shadow-card">
          <Skeleton className="aspect-square rounded-none" />
          <div className="space-y-2 p-4"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/2" /></div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, message, action, className }) {
  return (
    <div className={cx('flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center', className)}>
      {Icon ? <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-50 text-navy-700"><Icon className="h-7 w-7" /></div> : null}
      <h3 className="font-display text-lg font-bold text-navy-900">{title}</h3>
      {message ? <p className="mt-1.5 max-w-md text-sm text-slate-500">{message}</p> : null}
      {action ? <div className="mt-5">{action.to || action.onClick ? <Button to={action.to} onClick={action.onClick} variant={action.variant || 'primary'} size="sm">{action.label}</Button> : action}</div> : null}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-800">
      <p className="font-semibold">Something went wrong</p>
      <p className="mt-1">{error?.message || 'Please try again.'}</p>
      {onRetry ? <Button className="mt-4" size="sm" variant="secondary" onClick={() => onRetry()}>Try again</Button> : null}
    </div>
  );
}

const tones = {
  slate: 'bg-slate-100 text-slate-700', navy: 'bg-navy-50 text-navy-800', pink: 'bg-brand-50 text-brand-700',
  green: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-800', red: 'bg-red-50 text-red-700', blue: 'bg-sky-50 text-sky-700', violet: 'bg-violet-50 text-violet-700',
};
export const Badge = ({ tone = 'slate', children, className }) => (
  <span className={cx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', tones[tone], className)}>{children}</span>
);

const STATUS_TONE = {
  Placed: 'blue', 'Design Approval': 'violet', 'In Production': 'amber', 'Quality Check': 'amber', Dispatched: 'navy', Delivered: 'green', Cancelled: 'red',
  Pending: 'amber', 'Paid (demo)': 'green', 'Refunded (demo)': 'slate',
  published: 'green', draft: 'slate', active: 'green', inactive: 'slate', approved: 'green', rejected: 'red', blocked: 'red', new: 'pink', read: 'slate', replied: 'green',
};
export const StatusBadge = ({ status }) => <Badge tone={STATUS_TONE[status] || 'slate'}>{status}</Badge>;

export function Rating({ value = 0, count, size = 'sm', showValue }) {
  const s = size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
  return (
    <span className="inline-flex items-center gap-1.5" aria-label={`Rated ${value} out of 5`}>
      <span className="inline-flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} className={cx(s, i <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-slate-300')} />
        ))}
      </span>
      {showValue && value ? <span className="text-sm font-semibold text-slate-700">{value}</span> : null}
      {count !== undefined ? <span className="text-xs text-slate-500">({count})</span> : null}
    </span>
  );
}

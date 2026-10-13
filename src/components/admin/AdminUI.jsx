import { Link } from 'react-router-dom';
import { cx } from '../../utils/format';

export function PageHeader({ title, subtitle, actions, back }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {back ? <Link to={back.to} className="text-xs font-semibold text-brand-600 hover:underline">← {back.label}</Link> : null}
        <h1 className="font-display text-2xl font-extrabold text-navy-900">{title}</h1>
        {subtitle ? <p className="mt-0.5 text-sm text-slate-600">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function StatCard({ label, value, hint, icon: Icon, tone = 'navy' }) {
  const tones = { navy: 'bg-navy-50 text-navy-800', pink: 'bg-brand-50 text-brand-700', green: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-800' };
  return (
    <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100">
      <div className="flex items-start justify-between"><p className="text-sm font-medium text-slate-500">{label}</p>{Icon ? <span className={cx('flex h-9 w-9 items-center justify-center rounded-xl', tones[tone])}><Icon className="h-4 w-4" /></span> : null}</div>
      <p className="mt-2 font-display text-3xl font-extrabold text-navy-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export const Panel = ({ title, action, children, className }) => (
  <section className={cx('rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100', className)}>
    {title ? <div className="mb-4 flex items-center justify-between gap-2"><h2 className="font-display text-base font-bold text-navy-900">{title}</h2>{action}</div> : null}
    {children}
  </section>
);

export function Toolbar({ children }) {
  return <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">{children}</div>;
}

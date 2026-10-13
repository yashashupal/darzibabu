import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, Minus, Plus, Search, X } from 'lucide-react';
import { cx } from '../../utils/format';
import { resolveImage } from '../../assets';

export function Img({ src, alt = '', className, fallback = 'No image', ...rest }) {
  const url = resolveImage(src);
  const [failed, setFailed] = useState(false);
  if (!url || failed) return <div className={cx('flex items-center justify-center bg-slate-100 text-xs text-slate-400', className)}>{fallback}</div>;
  return <img src={url} alt={alt} loading="lazy" onError={() => setFailed(true)} className={className} {...rest} />;
}

export function Breadcrumbs({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1 text-xs text-slate-500">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 ? <ChevronRight className="h-3 w-3" /> : null}
          {it.to ? <Link to={it.to} className="hover:text-brand-600">{it.label}</Link> : <span className="font-semibold text-slate-700">{it.label}</span>}
        </span>
      ))}
    </nav>
  );
}

export function SectionHeading({ eyebrow, title, subtitle, action, align = 'left' }) {
  return (
    <div className={cx('mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between', align === 'center' && 'items-center text-center sm:flex-col sm:items-center')}>
      <div className={align === 'center' ? 'max-w-2xl' : ''}>
        {eyebrow ? <p className="mb-1 text-xs font-bold uppercase tracking-widest text-brand-600">{eyebrow}</p> : null}
        <h2 className="font-display text-2xl font-extrabold text-navy-900 sm:text-3xl">{title}</h2>
        {subtitle ? <p className="mt-2 text-slate-600">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function QtyStepper({ value, onChange, min = 1, max = 99999, step = 1, size = 'md', label = 'Quantity' }) {
  const set = (v) => onChange(Math.min(max, Math.max(min, Number.isNaN(v) ? min : v)));
  const h = size === 'sm' ? 'h-9' : 'h-11';
  return (
    <div className={cx('inline-flex items-center rounded-xl border border-slate-300 bg-white', h)} role="group" aria-label={label}>
      <button type="button" aria-label="Decrease quantity" onClick={() => set(value - step)} disabled={value <= min} className="flex h-full w-9 items-center justify-center text-slate-600 hover:text-brand-600 disabled:opacity-40"><Minus className="h-4 w-4" /></button>
      <input aria-label={label} inputMode="numeric" value={value} onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, '')) || 0)} onBlur={() => set(value)} className="h-full w-14 border-x border-slate-200 text-center text-sm font-semibold text-slate-900 focus:outline-none" />
      <button type="button" aria-label="Increase quantity" onClick={() => set(value + step)} disabled={value >= max} className="flex h-full w-9 items-center justify-center text-slate-600 hover:text-brand-600 disabled:opacity-40"><Plus className="h-4 w-4" /></button>
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Search…', className }) {
  return (
    <div className={cx('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-8 text-sm focus:border-navy-500 focus:outline-none focus:ring-4 focus:ring-navy-100" />
      {value ? <button type="button" onClick={() => onChange('')} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button> : null}
    </div>
  );
}

export function Accordion({ items, defaultOpen = 0 }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {items.map((it, i) => (
        <div key={it.id || i}>
          <button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-navy-900 hover:bg-slate-50">
            {it.question}
            <ChevronDown className={cx('h-5 w-5 shrink-0 text-slate-400 transition', open === i && 'rotate-180 text-brand-500')} />
          </button>
          {open === i ? <div className="px-5 pb-5 text-sm leading-relaxed text-slate-600">{it.answer}</div> : null}
        </div>
      ))}
    </div>
  );
}

export function Tabs({ tabs, value, onChange, className }) {
  return (
    <div className={cx('flex gap-1 overflow-x-auto border-b border-slate-200', className)} role="tablist">
      {tabs.map((t) => (
        <button key={t.id} role="tab" aria-selected={value === t.id} onClick={() => onChange(t.id)} className={cx('whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition', value === t.id ? 'border-brand-500 text-navy-900' : 'border-transparent text-slate-500 hover:text-slate-800')}>
          {t.label}{t.count !== undefined ? <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs">{t.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function Swatch({ hex, label, selected, onClick, disabled }) {
  return (
    <button type="button" title={label} aria-label={label} aria-pressed={selected} onClick={onClick} disabled={disabled}
      className={cx('h-9 w-9 rounded-full border-2 p-0.5 transition disabled:opacity-40', selected ? 'border-brand-500' : 'border-slate-200 hover:border-slate-400')}>
      <span className="block h-full w-full rounded-full ring-1 ring-black/10" style={{ background: hex }} />
    </button>
  );
}

export function Card({ className, children, ...rest }) {
  return <div className={cx('rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100', className)} {...rest}>{children}</div>;
}

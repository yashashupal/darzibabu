import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cx } from '../../utils/format';

function range(page, pages) {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const out = [1];
  const s = Math.max(2, page - 1);
  const e = Math.min(pages - 1, page + 1);
  if (s > 2) out.push('…');
  for (let i = s; i <= e; i++) out.push(i);
  if (e < pages - 1) out.push('…');
  out.push(pages);
  return out;
}

export default function Pagination({ page, pages, onChange, total, pageSize }) {
  if (pages <= 1) return total !== undefined ? <p className="text-center text-xs text-slate-500">{total} result{total === 1 ? '' : 's'}</p> : null;
  const from = total !== undefined ? (page - 1) * pageSize + 1 : null;
  const to = total !== undefined ? Math.min(page * pageSize, total) : null;
  const btn = 'inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg px-2 text-sm font-semibold transition';
  return (
    <nav aria-label="Pagination" className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      {total !== undefined ? <p className="text-xs text-slate-500">Showing {from}-{to} of {total}</p> : <span />}
      <div className="flex items-center gap-1">
        <button className={cx(btn, 'text-slate-600 hover:bg-slate-100 disabled:opacity-40')} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>
        {range(page, pages).map((p, i) =>
          p === '…' ? <span key={`e${i}`} className="px-1 text-slate-400">…</span> : (
            <button key={p} onClick={() => onChange(p)} aria-current={p === page ? 'page' : undefined} className={cx(btn, p === page ? 'bg-navy-900 text-white' : 'text-slate-700 hover:bg-slate-100')}>{p}</button>
          )
        )}
        <button className={cx(btn, 'text-slate-600 hover:bg-slate-100 disabled:opacity-40')} disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Next page"><ChevronRight className="h-4 w-4" /></button>
      </div>
    </nav>
  );
}

/** Client-side pagination helper. */
export function paginate(items, page, pageSize) {
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const p = Math.min(Math.max(1, page), pages);
  return { rows: items.slice((p - 1) * pageSize, p * pageSize), page: p, pages, total: items.length, pageSize };
}

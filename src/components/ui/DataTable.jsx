import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { cx } from '../../utils/format';

/**
 * columns: [{ key, header, sortable, render(row), className, align }]
 * sort: { key, dir } ; onSort(key)
 */
export default function DataTable({ columns, rows, sort, onSort, rowKey = 'id', onRowClick, empty, dense }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((c) => {
              const active = sort?.key === c.key;
              return (
                <th key={c.key} scope="col" className={cx('whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500', c.align === 'right' ? 'text-right' : 'text-left')}>
                  {c.sortable && onSort ? (
                    <button type="button" onClick={() => onSort(c.key)} className="inline-flex items-center gap-1 uppercase hover:text-navy-900">
                      {c.header}
                      {active ? (sort.dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                    </button>
                  ) : c.header}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length === 0 ? (
            <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-slate-500">{empty || 'No records found.'}</td></tr>
          ) : rows.map((r) => (
            <tr key={r[rowKey]} onClick={onRowClick ? () => onRowClick(r) : undefined} className={cx('hover:bg-slate-50/70', onRowClick && 'cursor-pointer')}>
              {columns.map((c) => (
                <td key={c.key} className={cx(dense ? 'px-4 py-2' : 'px-4 py-3', 'align-middle text-slate-700', c.align === 'right' && 'text-right', c.className)}>{c.render ? c.render(r) : r[c.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Generic client-side sorter used with DataTable. */
export function sortRows(rows, sort, getters = {}) {
  if (!sort?.key) return rows;
  const get = getters[sort.key] || ((r) => r[sort.key]);
  return [...rows].sort((a, b) => {
    const x = get(a);
    const y = get(b);
    const cmp = typeof x === 'number' && typeof y === 'number' ? x - y : String(x ?? '').localeCompare(String(y ?? ''), undefined, { numeric: true });
    return sort.dir === 'asc' ? cmp : -cmp;
  });
}

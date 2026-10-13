import { formatINR, cx } from '../../utils/format';
import { sortedTiers } from '../../utils/pricing';

/** Quantity-based demo pricing table. Highlights the tier that applies to `qty`. */
export default function TierTable({ product, qty, extra = 0, onPick }) {
  const tiers = sortedTiers(product);
  let active = -1;
  tiers.forEach((t, i) => qty >= t.min && (active = i));
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr><th className="px-3 py-2 text-left font-bold">Quantity</th><th className="px-3 py-2 text-right font-bold">Price per piece</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {tiers.map((t, i) => (
            <tr key={t.min} onClick={() => onPick?.(t.min)} className={cx(onPick && 'cursor-pointer hover:bg-slate-50', i === active && 'bg-brand-50/70 font-semibold')}>
              <td className="px-3 py-2">{t.min}{tiers[i + 1] ? ` - ${tiers[i + 1].min - 1}` : '+'} pcs {i === active ? <span className="ml-1 rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-bold text-white">Your tier</span> : null}</td>
              <td className="px-3 py-2 text-right">{formatINR(t.price + extra)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

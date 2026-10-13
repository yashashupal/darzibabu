import { formatINR } from '../../utils/format';

/** Lightweight dependency-free SVG bar chart. data: [{label, value}] */
export function BarChart({ data, height = 220, format = formatINR, color = '#064072', every = 1 }) {
  const w = 640;
  const pad = { l: 56, r: 8, t: 10, b: 28 };
  const max = Math.max(1, ...data.map((d) => d.value));
  const nice = (() => { const p = 10 ** Math.floor(Math.log10(max)); const n = max / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; })();
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * nice);
  const bw = (w - pad.l - pad.r) / Math.max(1, data.length);
  const y = (v) => pad.t + (height - pad.t - pad.b) * (1 - v / nice);
  const short = (n) => (n >= 100000 ? `${(n / 100000).toFixed(n % 100000 ? 1 : 0)}L` : n >= 1000 ? `${Math.round(n / 1000)}k` : String(Math.round(n)));
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="h-auto w-full" role="img" aria-label="Revenue chart">
      {ticks.map((t) => (<g key={t}><line x1={pad.l} x2={w - pad.r} y1={y(t)} y2={y(t)} stroke="#e2e8f0" strokeDasharray="3 3" /><text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#64748b">{short(t)}</text></g>))}
      {data.map((d, i) => {
        const x = pad.l + i * bw + bw * 0.18;
        const h = Math.max(0, y(0) - y(d.value));
        return (
          <g key={i}>
            <rect x={x} y={y(d.value)} width={bw * 0.64} height={h} rx="3" fill={color} opacity="0.9"><title>{`${d.label}: ${format(d.value)}`}</title></rect>
            {i % every === 0 ? <text x={x + bw * 0.32} y={height - 8} textAnchor="middle" fontSize="10" fill="#64748b">{d.label}</text> : null}
          </g>
        );
      })}
    </svg>
  );
}

const PALETTE = ['#064072', '#f24b69', '#3b78c8', '#fa6e8d', '#0f3a6a', '#ffc6d3', '#8ebbea', '#b9213f'];
export function Donut({ data, size = 160 }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = 54;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <svg viewBox="0 0 140 140" width={size} height={size} role="img" aria-label="Revenue share by category">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#f1f5f9" strokeWidth="22" />
        {data.map((d, i) => {
          const len = (d.value / total) * c;
          const el = <circle key={d.label} cx="70" cy="70" r={r} fill="none" stroke={PALETTE[i % PALETTE.length]} strokeWidth="22" strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-acc} transform="rotate(-90 70 70)"><title>{`${d.label}: ${formatINR(d.value)}`}</title></circle>;
          acc += len;
          return el;
        })}
      </svg>
      <ul className="min-w-0 flex-1 space-y-1.5 text-sm">
        {data.map((d, i) => <li key={d.label} className="flex items-center gap-2"><span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: PALETTE[i % PALETTE.length] }} /><span className="min-w-0 flex-1 truncate text-slate-700">{d.label}</span><span className="font-semibold text-navy-900">{Math.round((d.value / total) * 100)}%</span></li>)}
      </ul>
    </div>
  );
}

export function HBars({ data, format = (n) => n }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <ul className="space-y-2.5">
      {data.map((d) => (
        <li key={d.label}>
          <div className="mb-1 flex justify-between text-xs"><span className="font-medium text-slate-700">{d.label}</span><span className="font-semibold text-navy-900">{format(d.value)}</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ width: `${(d.value / max) * 100}%`, background: d.color || '#064072' }} /></div>
        </li>
      ))}
    </ul>
  );
}

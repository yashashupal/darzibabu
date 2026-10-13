import { useRef, useState } from 'react';
import { ImagePlus, Trash2, CloudUpload } from 'lucide-react';
import { Img } from '../ui/Misc';
import Button from '../ui/Button';
import { cx } from '../../utils/format';

export const PLACEMENTS = [
  { id: 'left-chest', label: 'Left chest', x: 66, y: 34, size: 14 },
  { id: 'center-chest', label: 'Center chest', x: 50, y: 42, size: 26 },
  { id: 'back', label: 'Back / large', x: 50, y: 48, size: 40 },
  { id: 'sleeve', label: 'Sleeve', x: 82, y: 30, size: 10 },
];
const MAX_BYTES = 2 * 1024 * 1024;
const OK_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];

function readFile(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error('Could not read this file.'));
    r.readAsDataURL(file);
  });
}
/** Downscale raster logos so the cart fits comfortably in localStorage. */
function downscale(dataUrl, max = 420) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * ratio);
      c.height = Math.round(img.height * ratio);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL('image/png'));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Upload + live placement preview. Drag the logo on the product image, change size, or pick a preset.
 * value: { name, dataUrl, placement: {id,x,y,size} } | null
 */
export default function LogoUploader({ value, onChange, previewImage, productName }) {
  const inputRef = useRef(null);
  const stage = useRef(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);

  const handle = async (file) => {
    setError('');
    if (!file) return;
    if (!OK_TYPES.includes(file.type)) return setError('Please upload a PNG, JPG, WEBP or SVG file.');
    if (file.size > MAX_BYTES) return setError('File is too large. Maximum size is 2 MB.');
    setBusy(true);
    try {
      let url = await readFile(file);
      if (file.type !== 'image/svg+xml') url = await downscale(url);
      else if (url.length > 200000) throw new Error('This SVG is too complex for the demo preview (max ~150 KB).');
      onChange({ name: file.name, dataUrl: url, placement: value?.placement || { ...PLACEMENTS[0] } });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const startDrag = (e) => {
    if (!value) return;
    e.preventDefault();
    const rect = stage.current.getBoundingClientRect();
    const move = (ev) => {
      const x = Math.min(95, Math.max(5, ((ev.clientX - rect.left) / rect.width) * 100));
      const y = Math.min(95, Math.max(5, ((ev.clientY - rect.top) / rect.height) * 100));
      onChange({ ...value, placement: { ...value.placement, id: 'custom', x, y } });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const pl = value?.placement;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold text-navy-900"><ImagePlus className="h-4 w-4 text-brand-500" />Upload your logo</h3>
        {value ? <Button size="xs" variant="ghost" icon={Trash2} onClick={() => { onChange(null); setError(''); if (inputRef.current) inputRef.current.value = ''; }}>Remove</Button> : null}
      </div>

      {!value ? (
        <label onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={(e) => { e.preventDefault(); setOver(false); handle(e.dataTransfer.files?.[0]); }}
          className={cx('flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-6 text-center transition', over ? 'border-brand-500 bg-brand-50' : 'border-slate-300 hover:border-navy-400 hover:bg-slate-50')}>
          <CloudUpload className="h-7 w-7 text-navy-600" />
          <span className="text-sm font-semibold text-slate-800">{busy ? 'Processing…' : 'Click to upload or drag a file here'}</span>
          <span className="text-xs text-slate-500">PNG, JPG, WEBP or SVG · up to 2 MB · preview only (artwork is checked by our team after ordering)</span>
          <input ref={inputRef} type="file" accept={OK_TYPES.join(',')} className="sr-only" onChange={(e) => handle(e.target.files?.[0])} aria-label="Upload logo file" />
        </label>
      ) : (
        <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
          <div ref={stage} className="relative aspect-square touch-none select-none overflow-hidden rounded-xl bg-slate-100" aria-label={`Logo preview on ${productName}`}>
            <Img src={previewImage} alt="" className="h-full w-full object-cover" />
            <img src={value.dataUrl} alt="Your uploaded logo" onPointerDown={startDrag} draggable={false}
              style={{ left: `${pl.x}%`, top: `${pl.y}%`, width: `${pl.size}%` }} className="absolute -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-sm bg-white/10 object-contain ring-2 ring-brand-400/80 active:cursor-grabbing" />
            <span className="pointer-events-none absolute bottom-2 left-2 rounded bg-slate-900/70 px-2 py-0.5 text-[10px] font-semibold text-white">Illustrative preview · drag to reposition</span>
          </div>
          <div className="space-y-3 text-sm">
            <p className="truncate text-xs text-slate-500" title={value.name}>{value.name}</p>
            <div>
              <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">Placement</p>
              <div className="grid grid-cols-2 gap-1.5">
                {PLACEMENTS.map((p) => (
                  <button type="button" key={p.id} onClick={() => onChange({ ...value, placement: { ...p } })} className={cx('rounded-lg border px-2 py-1.5 text-xs font-semibold', pl.id === p.id ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-700 hover:bg-slate-50')}>{p.label}</button>
                ))}
              </div>
            </div>
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">Size
              <input type="range" min="6" max="60" value={pl.size} onChange={(e) => onChange({ ...value, placement: { ...pl, id: 'custom', size: Number(e.target.value) } })} className="mt-1 w-full accent-brand-500" aria-label="Logo size" />
            </label>
            <Button size="xs" variant="secondary" onClick={() => inputRef.current?.click()}>Replace file</Button>
            <input ref={inputRef} type="file" accept={OK_TYPES.join(',')} className="sr-only" onChange={(e) => handle(e.target.files?.[0])} aria-label="Replace logo file" />
          </div>
        </div>
      )}
      {error ? <p role="alert" className="mt-2 text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  );
}

/** Small static preview used in cart and order views. */
export function LogoThumb({ logo, image, className = 'h-16 w-16' }) {
  if (!logo?.dataUrl) return null;
  const pl = logo.placement || PLACEMENTS[0];
  return (
    <div className={cx('relative overflow-hidden rounded-lg bg-slate-100', className)} title={`Logo placement: ${pl.id}`}>
      <Img src={image} alt="" className="h-full w-full object-cover" />
      <img src={logo.dataUrl} alt="Logo placement" style={{ left: `${pl.x}%`, top: `${pl.y}%`, width: `${pl.size}%` }} className="absolute -translate-x-1/2 -translate-y-1/2 object-contain" />
    </div>
  );
}

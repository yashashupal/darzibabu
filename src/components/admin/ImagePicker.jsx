import { useRef, useState } from 'react';
import { ImagePlus, Upload } from 'lucide-react';
import { mediaRepo } from '../../services/api';
import { useCollection } from '../../hooks/useAsync';
import { useToast } from '../../context/ToastContext';
import { fileToDataUrl } from '../../utils/image';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Img } from '../ui/Misc';
import { cx } from '../../utils/format';

/** Modal grid to pick an image from the media library or upload a new one. */
export function MediaPickerModal({ open, onClose, onPick }) {
  const { items, loading } = useCollection('media');
  const toast = useToast();
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const upload = async (file) => {
    setBusy(true);
    try {
      const url = await fileToDataUrl(file);
      const m = await mediaRepo.create({ name: file.name, ref: url, kind: 'uploaded', alt: file.name.replace(/\.[^.]+$/, ''), uploadedAt: new Date().toISOString() });
      toast.success('Image uploaded to the media library.');
      onPick(m.ref);
      onClose();
    } catch (e) { toast.error(e.message); } finally { setBusy(false); if (input.current) input.current.value = ''; }
  };
  return (
    <Modal open={open} onClose={onClose} size="lg" title="Choose an image" footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button icon={Upload} loading={busy} onClick={() => input.current?.click()}>Upload new image</Button></>}>
      <input ref={input} type="file" accept="image/*" className="sr-only" aria-label="Upload image" onChange={(e) => upload(e.target.files?.[0])} />
      {loading ? <p className="py-8 text-center text-sm text-slate-500">Loading…</p> : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {items.map((m) => (
            <button key={m.id} type="button" onClick={() => { onPick(m.ref); onClose(); }} className="group overflow-hidden rounded-xl ring-1 ring-slate-200 hover:ring-2 hover:ring-brand-500" title={m.name}>
              <Img src={m.ref} alt={m.alt || m.name} className="aspect-square w-full object-cover" />
              <span className="block truncate bg-white px-1.5 py-1 text-[11px] text-slate-600">{m.name}</span>
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}

export default function ImagePicker({ label = 'Image', value, onChange, error, hint, className }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={className}>
      <p className="mb-1.5 text-sm font-semibold text-slate-800">{label}</p>
      <div className={cx('flex items-center gap-3 rounded-xl border bg-white p-2', error ? 'border-red-400' : 'border-slate-300')}>
        <Img src={value} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" fallback="None" />
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" icon={ImagePlus} onClick={() => setOpen(true)}>{value ? 'Change' : 'Choose image'}</Button>
          {value ? <Button size="sm" variant="ghost" onClick={() => onChange('')}>Remove</Button> : null}
        </div>
      </div>
      {error ? <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">{error}</p> : hint ? <p className="mt-1.5 text-xs text-slate-500">{hint}</p> : null}
      <MediaPickerModal open={open} onClose={() => setOpen(false)} onPick={onChange} />
    </div>
  );
}

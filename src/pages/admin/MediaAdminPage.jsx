import { useRef, useState } from 'react';
import { Copy, Image as ImageIcon, Trash2, Upload } from 'lucide-react';
import { mediaRepo } from '../../services/api';
import { useCollection } from '../../hooks/useAsync';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { PageHeader, Toolbar } from '../../components/admin/AdminUI';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Pagination, { paginate } from '../../components/ui/Pagination';
import { Badge, EmptyState, PageLoader } from '../../components/ui/Feedback';
import { Img, SearchInput } from '../../components/ui/Misc';
import { Input } from '../../components/ui/Form';
import { fileToDataUrl } from '../../utils/image';
import { formatDate } from '../../utils/format';
import { storage } from '../../services/storage';

export default function MediaAdminPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const { items, loading } = useCollection('media');
  const input = useRef(null);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [sel, setSel] = useState(null);
  const [alt, setAlt] = useState('');

  const rows = items.filter((m) => !q || (m.name + (m.alt || '')).toLowerCase().includes(q.toLowerCase())).sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  const pg = paginate(rows, page, 12);

  const upload = async (files) => {
    if (!files?.length) return;
    setBusy(true);
    let ok = 0;
    for (const f of Array.from(files)) {
      try { const url = await fileToDataUrl(f); await mediaRepo.create({ name: f.name, ref: url, kind: 'uploaded', alt: f.name.replace(/\.[^.]+$/, ''), uploadedAt: new Date().toISOString() }); ok += 1; } catch (e) { toast.error(`${f.name}: ${e.message}`); }
    }
    setBusy(false);
    if (input.current) input.current.value = '';
    if (ok) toast.success(`${ok} image${ok > 1 ? 's' : ''} uploaded.`);
  };
  const remove = async (m) => {
    if (!(await confirm({ title: 'Delete image?', message: `"${m.name}" will be removed from the library. Records already using it keep their copy.`, confirmLabel: 'Delete', danger: true }))) return;
    await mediaRepo.remove(m.id); setSel(null); toast.success('Image deleted.');
  };
  const copy = async (m) => { try { await navigator.clipboard.writeText(m.ref.startsWith('data:') ? `[uploaded image: ${m.name}]` : m.ref); toast.success('Reference copied.'); } catch { toast.info('Copy not available in this browser.'); } };
  const usageKb = Math.round(storage.usageBytes() / 1024);

  return (
    <div>
      <PageHeader title="Media library" subtitle={`Images for products, banners, categories and more. Browser storage used by all demo data: ~${usageKb.toLocaleString('en-IN')} KB of roughly 5,000 KB.`} actions={<Button size="sm" icon={Upload} loading={busy} onClick={() => input.current?.click()}>Upload images</Button>} />
      <input ref={input} type="file" accept="image/*" multiple className="sr-only" aria-label="Upload images" onChange={(e) => upload(e.target.files)} />
      <Toolbar><SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search media" className="sm:w-72" /><p className="text-xs text-slate-500 sm:ml-auto">{rows.length} file{rows.length === 1 ? '' : 's'}</p></Toolbar>
      {loading ? <PageLoader /> : rows.length === 0 ? <EmptyState icon={ImageIcon} title={q ? 'No matching files' : 'No media yet'} message="Upload images (PNG, JPG, WEBP, SVG up to 4 MB). Large images are resized to keep browser storage small." action={{ label: 'Upload images', onClick: () => input.current?.click() }} /> : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {pg.rows.map((m) => (
              <button key={m.id} onClick={() => { setSel(m); setAlt(m.alt || ''); }} className="group overflow-hidden rounded-2xl bg-white text-left shadow-card ring-1 ring-slate-100 hover:ring-2 hover:ring-brand-500">
                <Img src={m.ref} alt={m.alt || m.name} className="aspect-square w-full object-cover" />
                <div className="p-2.5"><p className="truncate text-xs font-semibold text-navy-900">{m.name}</p><p className="text-[11px] text-slate-500">{m.kind === 'bundled' ? 'Bundled' : 'Uploaded'} · {formatDate(m.uploadedAt)}</p></div>
              </button>
            ))}
          </div>
          <div className="mt-6"><Pagination page={pg.page} pages={pg.pages} total={pg.total} pageSize={pg.pageSize} onChange={setPage} /></div>
        </>
      )}
      <Modal open={!!sel} onClose={() => setSel(null)} title="Image details" footer={sel ? <>
        <Button variant="ghost" icon={Copy} onClick={() => copy(sel)}>Copy reference</Button>
        {sel.kind === 'uploaded' ? <Button variant="danger" icon={Trash2} onClick={() => remove(sel)}>Delete</Button> : null}
        <Button onClick={async () => { await mediaRepo.update(sel.id, { alt }); toast.success('Details saved.'); setSel(null); }}>Save</Button></> : null}>
        {sel ? <div className="space-y-4"><Img src={sel.ref} alt={sel.alt || sel.name} className="mx-auto max-h-72 rounded-xl object-contain" /><p className="text-sm text-slate-600">{sel.name} <Badge tone={sel.kind === 'bundled' ? 'navy' : 'pink'}>{sel.kind}</Badge></p><Input label="Alt text" value={alt} onChange={(e) => setAlt(e.target.value)} hint="Describes the image for accessibility." />{sel.kind === 'bundled' ? <p className="text-xs text-slate-500">Bundled images ship with the app and cannot be deleted.</p> : null}</div> : null}
      </Modal>
    </div>
  );
}

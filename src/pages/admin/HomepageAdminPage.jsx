import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, RotateCcw } from 'lucide-react';
import { homepageDoc } from '../../services/api';
import { homepageSections as DEFAULT_SECTIONS } from '../../data/seed/content';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { PageHeader } from '../../components/admin/AdminUI';
import Button from '../../components/ui/Button';
import { Input, Toggle } from '../../components/ui/Form';
import { PageLoader } from '../../components/ui/Feedback';

export default function HomepageAdminPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const { data, loading, reload } = useAsync(() => homepageDoc.get(), []);
  const [list, setList] = useState(null);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  useEffect(() => { if (data) { setList(structuredClone(data)); setDirty(false); } }, [data]);
  if (loading || !list) return <PageLoader />;

  const patch = (i, p) => { setList((l) => l.map((s, k) => (k === i ? { ...s, ...p } : s))); setDirty(true); };
  const move = (i, d) => { setList((l) => { const a = [...l]; const j = i + d; if (j < 0 || j >= a.length) return a; [a[i], a[j]] = [a[j], a[i]]; return a; }); setDirty(true); };
  const save = async () => {
    if (!list.some((s) => s.enabled)) return toast.error('Keep at least one section enabled.');
    const blank = list.find((s) => s.enabled && ['categories', 'featured', 'process', 'bulk', 'new', 'testimonials', 'blog', 'faq'].includes(s.id) && !s.title.trim());
    if (blank) return toast.error(`"${blank.label}" needs a title.`);
    setBusy(true);
    try { await homepageDoc.save(list); setDirty(false); toast.success('Homepage layout saved.'); reload(true); } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  const reset = async () => {
    if (!(await confirm({ title: 'Restore default layout?', message: 'Section order, visibility and headings return to their defaults.', confirmLabel: 'Restore defaults' }))) return;
    await homepageDoc.save(structuredClone(DEFAULT_SECTIONS)); toast.success('Defaults restored.'); reload();
  };
  return (
    <div>
      <PageHeader title="Homepage sections" subtitle="Show, hide and reorder sections, and edit their headings. The hero slider is managed under Banners." actions={<><Button size="sm" variant="ghost" icon={RotateCcw} onClick={reset}>Restore defaults</Button><Button size="sm" variant="secondary" to="/" target="_blank">Preview</Button><Button size="sm" onClick={save} loading={busy} disabled={!dirty}>Save layout</Button></>} />
      <ol className="space-y-3">
        {list.map((s, i) => (
          <li key={s.id} className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-100">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-50 text-sm font-bold text-navy-800">{i + 1}</span>
              <div className="min-w-0 flex-1"><p className="font-bold text-navy-900">{s.label}</p><p className="text-xs text-slate-500">Section ID: {s.id}</p></div>
              <div className="flex items-center gap-1">
                <button type="button" aria-label={`Move ${s.label} up`} disabled={i === 0} onClick={() => move(i, -1)} className="rounded-lg p-2 hover:bg-slate-100 disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                <button type="button" aria-label={`Move ${s.label} down`} disabled={i === list.length - 1} onClick={() => move(i, 1)} className="rounded-lg p-2 hover:bg-slate-100 disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                <Toggle checked={s.enabled} onChange={(v) => patch(i, { enabled: v })} label={`Show ${s.label}`} />
              </div>
            </div>
            {s.id !== 'trust' ? <div className="mt-3 grid gap-3 sm:grid-cols-2"><Input label="Heading" value={s.title} onChange={(e) => patch(i, { title: e.target.value })} /><Input label="Sub-heading" value={s.subtitle} onChange={(e) => patch(i, { subtitle: e.target.value })} /></div> : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

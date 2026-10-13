import { useMemo, useState } from 'react';
import { Download, Plus, Pencil, Trash2 } from 'lucide-react';
import { REPOS } from '../../services/api';
import { useCollection } from '../../hooks/useAsync';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import DataTable, { sortRows } from '../ui/DataTable';
import Pagination, { paginate } from '../ui/Pagination';
import { Checkbox, Input, Select, Textarea, Toggle } from '../ui/Form';
import { EmptyState, PageLoader, ErrorState } from '../ui/Feedback';
import { SearchInput } from '../ui/Misc';
import ImagePicker from './ImagePicker';
import { PageHeader, Toolbar } from './AdminUI';
import { downloadText, slugify, toCSV } from '../../utils/format';
import { validate } from '../../utils/validators';

/** Convert between stored values and form-friendly values for special field types. */
const toForm = (f, v) => (f.type === 'lines' ? (v || []).join('\n') : f.type === 'tags' ? (v || []).join(', ') : f.type === 'paragraphs' ? (v || []).join('\n\n') : v ?? (f.type === 'checkbox' ? false : ''));
const fromForm = (f, v) => {
  if (f.type === 'lines') return String(v).split('\n').map((x) => x.trim()).filter(Boolean);
  if (f.type === 'tags') return String(v).split(',').map((x) => x.trim()).filter(Boolean);
  if (f.type === 'paragraphs') return String(v).split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);
  if (f.type === 'number') return v === '' ? '' : Number(v);
  return v;
};

function FieldInput({ f, value, onChange, error, values }) {
  const common = { label: f.label, error, hint: f.hint, required: f.required };
  switch (f.type) {
    case 'textarea': case 'lines': case 'paragraphs': return <Textarea {...common} className={f.full ? 'sm:col-span-2' : ''} rows={f.rows || 4} value={value} onChange={(e) => onChange(e.target.value)} placeholder={f.placeholder} />;
    case 'select': return <Select {...common} className={f.full ? 'sm:col-span-2' : ''} value={value} onChange={(e) => onChange(e.target.value)} options={typeof f.options === 'function' ? f.options(values) : f.options} placeholder={f.placeholder} />;
    case 'checkbox': return <div className={f.full ? 'sm:col-span-2' : ''}><Checkbox label={f.label} description={f.hint} checked={!!value} onChange={onChange} /></div>;
    case 'image': return <ImagePicker className="sm:col-span-2" label={f.label} value={value} onChange={onChange} error={error} hint={f.hint} />;
    case 'number': return <Input {...common} className={f.full ? 'sm:col-span-2' : ''} type="number" min={f.min} step={f.step || 1} value={value} onChange={(e) => onChange(e.target.value)} />;
    case 'date': return <Input {...common} className={f.full ? 'sm:col-span-2' : ''} type="date" value={value} onChange={(e) => onChange(e.target.value)} />;
    default: return <Input {...common} className={f.full ? 'sm:col-span-2' : ''} type={f.type === 'email' ? 'email' : 'text'} value={value} onChange={(e) => onChange(e.target.value)} placeholder={f.placeholder} />;
  }
}

/**
 * Reusable admin CRUD screen.
 * props: repo, title, noun, subtitle, columns, fields, defaults, rules, searchKeys, defaultSort, filters, rowActions, csv, canCreate, canDelete, beforeSave, afterChange, size, empty
 */
export default function CrudPage({ repo: repoName, title, noun, subtitle, columns, fields, defaults = {}, rules = {}, searchKeys = ['name'], defaultSort, filters = [], rowActions, csv, canCreate = true, canDelete = true, beforeSave, afterChange, pageSize = 10, emptyHint, modalSize = 'md', headerExtra, guardDelete, mapRecord }) {
  const repo = REPOS[repoName];
  const toast = useToast();
  const confirm = useConfirm();
  const { items, loading, error, reload } = useCollection(repoName);
  const [q, setQ] = useState('');
  const [fv, setFv] = useState({});
  const [sort, setSort] = useState(defaultSort || null);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null); // { id?, values }
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => {
    let r = items;
    if (q.trim()) r = r.filter((x) => searchKeys.some((k) => String(x[k] ?? '').toLowerCase().includes(q.toLowerCase())));
    filters.forEach((f) => { if (fv[f.key]) r = r.filter((x) => String(f.get ? f.get(x) : x[f.key]) === fv[f.key]); });
    return sortRows(r, sort);
  }, [items, q, fv, sort]); // eslint-disable-line react-hooks/exhaustive-deps
  const pg = paginate(rows, page, pageSize);

  const open = (rec) => {
    setErrors({});
    const values = {};
    const src = rec ? (mapRecord ? { ...rec, ...mapRecord(rec) } : rec) : defaults;
    fields.forEach((f) => (values[f.key] = toForm(f, src[f.key])));
    setEditing({ id: rec?.id, raw: rec, values });
  };
  const setVal = (f, v) => setEditing((s) => {
    const values = { ...s.values, [f.key]: v };
    if (f.slugFrom === undefined) fields.filter((x) => x.slugFrom === f.key).forEach((x) => { if (!s.id && (!s.values[x.key] || s.values[x.key] === slugify(s.values[f.key] || ''))) values[x.key] = slugify(v); });
    return { ...s, values };
  });

  const save = async () => {
    const typed = {};
    fields.forEach((f) => (typed[f.key] = fromForm(f, editing.values[f.key])));
    const res = validate(typed, rules, Object.fromEntries(fields.map((f) => [f.key, f.label])));
    // uniqueness check for fields flagged unique
    const uniq = { ...res.errors };
    fields.filter((f) => f.unique).forEach((f) => {
      if (typed[f.key] && items.some((x) => x.id !== editing.id && String(x[f.key]).toLowerCase() === String(typed[f.key]).toLowerCase())) uniq[f.key] = `${f.label} is already in use.`;
    });
    setErrors(uniq);
    if (Object.keys(uniq).length) return toast.error('Please fix the highlighted fields.');
    setBusy(true);
    try {
      const payload = beforeSave ? beforeSave({ ...typed }, editing.raw) : typed;
      const saved = editing.id ? await repo.update(editing.id, payload) : await repo.create(payload);
      await afterChange?.(saved, editing.id ? 'update' : 'create');
      toast.success(`${noun} ${editing.id ? 'updated' : 'created'}.`);
      setEditing(null);
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  const remove = async (row) => {
    const blocked = guardDelete ? await guardDelete(row) : null;
    if (blocked) return toast.error(blocked);
    if (!(await confirm({ title: `Delete ${noun.toLowerCase()}?`, message: `"${row.name || row.title || row.code || row.question || row.id}" will be permanently removed from this browser's demo data.`, confirmLabel: 'Delete', danger: true }))) return;
    try { await repo.remove(row.id); await afterChange?.(row, 'delete'); toast.success(`${noun} deleted.`); } catch (e) { toast.error(e.message); }
  };
  const update = async (row, patch) => { try { await repo.update(row.id, patch); await afterChange?.({ ...row, ...patch }, 'update'); } catch (e) { toast.error(e.message); } };
  const ctx = { update, reload, open, remove, toast };

  const cols = [...columns.map((c) => ({ ...c, render: c.render ? (r) => c.render(r, ctx) : undefined })), {
    key: '_actions', header: 'Actions', align: 'right',
    render: (r) => (
      <div className="flex justify-end gap-1">
        {rowActions ? rowActions(r, ctx) : null}
        <Button size="xs" variant="secondary" icon={Pencil} onClick={() => open(r)} aria-label={`Edit ${noun}`}>Edit</Button>
        {canDelete ? <Button size="xs" variant="ghost" icon={Trash2} onClick={() => remove(r)} aria-label={`Delete ${noun}`} className="text-red-600 hover:bg-red-50">Delete</Button> : null}
      </div>
    ),
  }];

  const exportCsv = () => {
    const head = csv.map((c) => c.header);
    downloadText(`${repoName}.csv`, toCSV([head, ...rows.map((r) => csv.map((c) => (c.get ? c.get(r) : r[c.key])))]));
    toast.success('CSV downloaded.');
  };

  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} actions={<>{headerExtra}{csv ? <Button variant="secondary" size="sm" icon={Download} onClick={exportCsv} disabled={!rows.length}>Export CSV</Button> : null}{canCreate ? <Button size="sm" icon={Plus} onClick={() => open(null)}>Add {noun.toLowerCase()}</Button> : null}</>} />
      <Toolbar>
        <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder={`Search ${title.toLowerCase()}`} className="sm:w-72" />
        {filters.map((f) => (
          <div key={f.key} className="sm:w-48"><Select aria-label={f.label} value={fv[f.key] || ''} onChange={(e) => { setFv((s) => ({ ...s, [f.key]: e.target.value })); setPage(1); }} placeholder={f.label} options={typeof f.options === 'function' ? f.options(items) : f.options} /></div>
        ))}
        <p className="text-xs text-slate-500 sm:ml-auto">{rows.length} of {items.length} {title.toLowerCase()}</p>
      </Toolbar>

      {error ? <ErrorState error={error} onRetry={reload} /> : loading ? <PageLoader /> : items.length === 0 ? (
        <EmptyState title={`No ${title.toLowerCase()} yet`} message={emptyHint || `Create your first ${noun.toLowerCase()} to get started.`} action={canCreate ? { label: `Add ${noun.toLowerCase()}`, onClick: () => open(null) } : null} />
      ) : (
        <div className="space-y-4">
          <DataTable columns={cols} rows={pg.rows} sort={sort} onSort={(k) => { setSort((s) => (s?.key === k ? { key: k, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key: k, dir: 'asc' })); setPage(1); }} empty={<span>No {title.toLowerCase()} match your search or filters.</span>} />
          <Pagination page={pg.page} pages={pg.pages} total={pg.total} pageSize={pg.pageSize} onChange={setPage} />
        </div>
      )}

      <Modal open={!!editing} onClose={() => !busy && setEditing(null)} size={modalSize} title={`${editing?.id ? 'Edit' : 'Add'} ${noun.toLowerCase()}`}
        footer={<><Button variant="ghost" onClick={() => setEditing(null)} disabled={busy}>Cancel</Button><Button onClick={save} loading={busy}>{editing?.id ? 'Save changes' : `Create ${noun.toLowerCase()}`}</Button></>}>
        {editing ? (
          <form onSubmit={(e) => { e.preventDefault(); save(); }} noValidate className="grid gap-4 sm:grid-cols-2">
            {fields.filter((f) => !f.hideWhen || !f.hideWhen(editing.values)).map((f) => <FieldInput key={f.key} f={f} value={editing.values[f.key]} values={editing.values} error={errors[f.key]} onChange={(v) => setVal(f, v)} />)}
            <button type="submit" className="sr-only" tabIndex={-1}>Save</button>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}

export { Toggle };

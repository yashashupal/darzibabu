import { useEffect, useState } from 'react';
import { Download, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { settingsDoc, resetDemoData } from '../../services/api';
import { storage } from '../../services/storage';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { PageHeader, Panel } from '../../components/admin/AdminUI';
import Button from '../../components/ui/Button';
import { Checkbox, Input, Textarea, Toggle } from '../../components/ui/Form';
import { PageLoader } from '../../components/ui/Feedback';
import { Tabs } from '../../components/ui/Misc';
import { validate, isEmail } from '../../utils/validators';
import { downloadText, slugify } from '../../utils/format';

const URL_RULE = { pattern: /^(https?:\/\/\S+)?$/, message: 'Use a full https:// link or leave empty.' };

export default function SettingsAdminPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const { data, loading, reload } = useAsync(() => settingsDoc.get(), []);
  const [s, setS] = useState(null);
  const [tab, setTab] = useState('general');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (data) setS(structuredClone(data)); }, [data]);
  if (loading || !s) return <PageLoader />;

  const up = (path, value) => setS((cur) => { const n = structuredClone(cur); const keys = path.split('.'); let o = n; keys.slice(0, -1).forEach((k) => (o = o[k])); o[keys.at(-1)] = value; return n; });

  const save = async () => {
    const e = {};
    const site = validate(s.site, { name: ['required'], email: ['required', 'email'], phone: ['required', 'phone'] }).errors;
    Object.entries(site).forEach(([k, v]) => (e[`site.${k}`] = v));
    ['instagram', 'facebook', 'linkedin', 'youtube'].forEach((k) => { if (s.site.social[k] && !URL_RULE.pattern.test(s.site.social[k])) e[`site.social.${k}`] = URL_RULE.message; });
    if (!(Number(s.tax.gstPercent) >= 0 && Number(s.tax.gstPercent) <= 40)) e['tax.gstPercent'] = 'GST must be between 0 and 40.';
    if (s.tax.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(s.tax.gstin)) e['tax.gstin'] = 'Enter a valid 15-character GSTIN or leave empty.';
    if (!(Number(s.shipping.freeShippingThreshold) >= 0)) e['shipping.freeShippingThreshold'] = 'Enter 0 or more.';
    s.shipping.methods.forEach((m, i) => { if (!m.label.trim()) e[`ship.${i}.label`] = 'Label required.'; if (!(Number(m.price) >= 0)) e[`ship.${i}.price`] = 'Invalid price.'; });
    if (!s.shipping.methods.some((m) => m.enabled)) e.shippingAny = 'Enable at least one shipping method.';
    if (!s.payments.methods.some((m) => m.enabled)) e.paymentAny = 'Enable at least one payment method.';
    s.payments.methods.forEach((m, i) => { if (!m.label.trim()) e[`pay.${i}.label`] = 'Label required.'; });
    if (!(Number(s.orders.minOrderValue) >= 0)) e['orders.minOrderValue'] = 'Enter 0 or more.';
    if (!/^[A-Z]{2,5}$/.test(s.orders.prefix)) e['orders.prefix'] = 'Use 2-5 capital letters.';
    setErrors(e);
    if (Object.keys(e).length) {
      const first = Object.keys(e)[0];
      setTab(first.startsWith('site') ? 'general' : first.startsWith('tax') || first.startsWith('orders') ? 'tax' : first.startsWith('ship') ? 'shipping' : 'payments');
      return toast.error('Please fix the highlighted fields.');
    }
    setBusy(true);
    try {
      const clean = structuredClone(s);
      clean.tax.gstPercent = Number(clean.tax.gstPercent);
      clean.shipping.freeShippingThreshold = Number(clean.shipping.freeShippingThreshold);
      clean.shipping.methods = clean.shipping.methods.map((m) => ({ ...m, price: Number(m.price), id: m.id || slugify(m.label) }));
      clean.orders.minOrderValue = Number(clean.orders.minOrderValue);
      await settingsDoc.save(clean);
      toast.success('Settings saved.');
      reload(true);
    } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };

  const exportData = () => {
    const out = {};
    Object.keys(localStorage).filter((k) => k.startsWith('darzibabu:v1:') && !k.includes('session:') && !k.includes(':ui:')).forEach((k) => { try { out[k.replace('darzibabu:v1:', '')] = JSON.parse(localStorage.getItem(k)); } catch { /* skip */ } });
    downloadText('darzibabu-demo-data.json', JSON.stringify(out, null, 2), 'application/json');
    toast.success('Demo data exported (passwords are hashed demo values).');
  };
  const reset = async () => {
    if (!(await confirm({ title: 'Reset all demo data?', message: 'This deletes every change made in this browser (products, orders, settings, uploads, cart, sessions) and restores the original sample data.', confirmLabel: 'Reset everything', danger: true }))) return;
    resetDemoData();
    toast.success('Demo data reset. Reloading…');
    setTimeout(() => { window.location.href = '/admin/login'; }, 700);
  };

  const err = (k) => errors[k];
  return (
    <div>
      <PageHeader title="Site settings" subtitle="Brand details, tax, shipping, payment display and demo data tools." actions={<Button onClick={save} loading={busy} size="sm">Save settings</Button>} />
      <Tabs className="mb-6" value={tab} onChange={setTab} tabs={[{ id: 'general', label: 'General' }, { id: 'tax', label: 'Tax & orders' }, { id: 'shipping', label: 'Shipping' }, { id: 'payments', label: 'Payments display' }, { id: 'data', label: 'Demo data' }]} />

      {tab === 'general' ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="Business details"><div className="grid gap-4 sm:grid-cols-2">
            <Input label="Business name" required value={s.site.name} onChange={(e) => up('site.name', e.target.value)} error={err('site.name')} />
            <Input label="Tagline" value={s.site.tagline} onChange={(e) => up('site.tagline', e.target.value)} />
            <Input label="Contact email" type="email" required value={s.site.email} onChange={(e) => up('site.email', e.target.value)} error={err('site.email')} />
            <Input label="Phone" required value={s.site.phone} onChange={(e) => up('site.phone', e.target.value)} error={err('site.phone')} />
            <Input label="WhatsApp number" value={s.site.whatsapp} onChange={(e) => up('site.whatsapp', e.target.value)} />
            <Input label="Business hours" value={s.site.hours} onChange={(e) => up('site.hours', e.target.value)} />
            <Textarea label="Address" className="sm:col-span-2" rows={2} value={s.site.address} onChange={(e) => up('site.address', e.target.value)} />
          </div></Panel>
          <Panel title="Social links & announcement"><div className="space-y-4">
            {['instagram', 'facebook', 'linkedin', 'youtube'].map((k) => <Input key={k} label={k[0].toUpperCase() + k.slice(1)} placeholder="https://" value={s.site.social[k]} onChange={(e) => up(`site.social.${k}`, e.target.value)} error={err(`site.social.${k}`)} hint={k === 'instagram' ? 'Icons appear in the footer only when a link is set.' : undefined} />)}
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><div><p className="text-sm font-semibold text-navy-900">Show announcement bar</p><p className="text-xs text-slate-500">Edit the message under Banners.</p></div><Toggle checked={s.site.announcementEnabled} onChange={(v) => up('site.announcementEnabled', v)} label="Show announcement bar" /></div>
          </div></Panel>
        </div>
      ) : null}

      {tab === 'tax' ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="GST"><div className="space-y-4">
            <Input label="GST percentage" type="number" min="0" max="40" value={s.tax.gstPercent} onChange={(e) => up('tax.gstPercent', e.target.value)} error={err('tax.gstPercent')} />
            <Input label="Business GSTIN" value={s.tax.gstin} onChange={(e) => up('tax.gstin', e.target.value.toUpperCase())} error={err('tax.gstin')} />
            <Checkbox label="Displayed prices already include GST" description="When on, no extra GST is added at checkout." checked={s.tax.pricesIncludeTax} onChange={(v) => up('tax.pricesIncludeTax', v)} />
          </div></Panel>
          <Panel title="Orders"><div className="space-y-4">
            <Input label="Minimum order value (INR)" type="number" min="0" value={s.orders.minOrderValue} onChange={(e) => up('orders.minOrderValue', e.target.value)} error={err('orders.minOrderValue')} hint="0 = no minimum. Enforced in the cart." />
            <Input label="Order number prefix" value={s.orders.prefix} onChange={(e) => up('orders.prefix', e.target.value.toUpperCase())} error={err('orders.prefix')} />
          </div></Panel>
        </div>
      ) : null}

      {tab === 'shipping' ? (
        <Panel title="Shipping settings">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Free standard shipping above (INR)" type="number" min="0" value={s.shipping.freeShippingThreshold} onChange={(e) => up('shipping.freeShippingThreshold', e.target.value)} error={err('shipping.freeShippingThreshold')} />
            <Input label="Production note shown to customers" value={s.shipping.processingNote} onChange={(e) => up('shipping.processingNote', e.target.value)} />
          </div>
          <h3 className="mb-2 mt-6 text-sm font-bold text-navy-900">Shipping methods</h3>
          {err('shippingAny') ? <p role="alert" className="mb-2 text-xs font-medium text-red-600">{err('shippingAny')}</p> : null}
          <div className="space-y-2">
            {s.shipping.methods.map((m, i) => (
              <div key={i} className="grid grid-cols-[1fr_7rem_auto_auto] items-start gap-2">
                <Input aria-label="Method label" value={m.label} onChange={(e) => up(`shipping.methods.${i}.label`, e.target.value)} error={err(`ship.${i}.label`)} />
                <Input aria-label="Price" type="number" min="0" value={m.price} onChange={(e) => up(`shipping.methods.${i}.price`, e.target.value)} error={err(`ship.${i}.price`)} />
                <div className="pt-2.5"><Toggle checked={m.enabled} onChange={(v) => up(`shipping.methods.${i}.enabled`, v)} label={`Enable ${m.label}`} /></div>
                <Button variant="ghost" size="sm" className="mt-1 text-red-600" icon={Trash2} aria-label={`Remove ${m.label}`} disabled={m.id === 'standard'} onClick={() => up('shipping.methods', s.shipping.methods.filter((_, k) => k !== i))} />
              </div>
            ))}
          </div>
          <Button className="mt-3" size="sm" variant="secondary" icon={Plus} onClick={() => up('shipping.methods', [...s.shipping.methods, { id: `m${Date.now().toString(36)}`, label: 'New method', price: 0, enabled: true }])}>Add method</Button>
          <p className="mt-3 text-xs text-slate-500">The "standard" method is required and qualifies for the free-shipping threshold.</p>
        </Panel>
      ) : null}

      {tab === 'payments' ? (
        <Panel title="Payment methods shown at checkout">
          <p className="mb-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">Display settings only. No payment gateway is connected in this prototype and no money is ever collected. Connect a PCI-compliant gateway through a server before accepting real payments.</p>
          {err('paymentAny') ? <p role="alert" className="mb-2 text-xs font-medium text-red-600">{err('paymentAny')}</p> : null}
          <div className="space-y-2">
            {s.payments.methods.map((m, i) => (
              <div key={m.id} className="grid grid-cols-[1fr_1.4fr_auto] items-start gap-2">
                <Input aria-label="Label" value={m.label} onChange={(e) => up(`payments.methods.${i}.label`, e.target.value)} error={err(`pay.${i}.label`)} />
                <Input aria-label="Note" value={m.note} onChange={(e) => up(`payments.methods.${i}.note`, e.target.value)} />
                <div className="pt-2.5"><Toggle checked={m.enabled} onChange={(v) => up(`payments.methods.${i}.enabled`, v)} label={`Enable ${m.label}`} /></div>
              </div>
            ))}
          </div>
        </Panel>
      ) : null}

      {tab === 'data' ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="Browser storage"><p className="text-sm text-slate-600">All demo data lives in this browser's localStorage under the key prefix <code className="rounded bg-slate-100 px-1">darzibabu:v1:</code>. Approximate usage: <b>{Math.round(storage.usageBytes() / 1024).toLocaleString('en-IN')} KB</b> (browsers allow roughly 5,000 KB).</p><Button className="mt-4" variant="secondary" icon={Download} onClick={exportData}>Export data as JSON</Button></Panel>
          <Panel title="Reset"><p className="text-sm text-slate-600">Restore the original sample products, orders, customers and content. This also signs you out and clears the cart and wishlist.</p><Button className="mt-4" variant="danger" icon={RotateCcw} onClick={reset}>Reset demo data</Button></Panel>
        </div>
      ) : null}
    </div>
  );
}

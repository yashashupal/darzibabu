import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Info } from 'lucide-react';
import { useCustomer } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useDocumentTitle } from '../../hooks/useMisc';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Form';
import { validate } from '../../utils/validators';
import { DEMO_CUSTOMER } from '../../data/seed/people';
import { brandAssets } from '../../assets';

const safeNext = (n) => (n && n.startsWith('/') && !n.startsWith('//') ? n : '/account');

function Shell({ title, subtitle, children, footer }) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-10">
      <div className="w-full rounded-3xl bg-white p-7 shadow-card ring-1 ring-slate-100">
        <img src={brandAssets.mark} alt="" className="mx-auto h-12 w-12" />
        <h1 className="mt-3 text-center font-display text-2xl font-extrabold text-navy-900">{title}</h1>
        <p className="mt-1 text-center text-sm text-slate-600">{subtitle}</p>
        <div className="mt-6">{children}</div>
        <div className="mt-6 text-center text-sm text-slate-600">{footer}</div>
        <p className="mt-5 flex gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />Demo sign-in only: credentials are checked in your browser and are not secure. Never use a real password.</p>
      </div>
    </div>
  );
}

export function LoginPage() {
  useDocumentTitle('Sign in');
  const { customer, login } = useCustomer();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const [v, setV] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  if (customer) return <Navigate to={next} replace />;
  const submit = async (e) => {
    e.preventDefault();
    const res = validate(v, { email: ['required', 'email'], password: ['required'] });
    setErrors(res.errors);
    if (!res.valid) return;
    setBusy(true);
    try {
      await login(v.email, v.password);
      toast.success('Welcome back!');
      navigate(next, { replace: true });
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setBusy(false);
    }
  };
  return (
    <Shell title="Sign in" subtitle="Access your orders, addresses and wishlist." footer={<>New to Darzibabu? <Link className="font-semibold text-brand-600 hover:underline" to={`/register${params.get('next') ? `?next=${encodeURIComponent(next)}` : ''}`}>Create an account</Link></>}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <Input label="Email" type="email" autoComplete="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} error={errors.email} />
        <Input label="Password" type="password" autoComplete="current-password" value={v.password} onChange={(e) => setV({ ...v, password: e.target.value })} error={errors.password} />
        {errors.form ? <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{errors.form}</p> : null}
        <Button type="submit" className="w-full" loading={busy}>Sign in</Button>
        <Button type="button" variant="soft" className="w-full" onClick={() => setV({ email: DEMO_CUSTOMER.email, password: DEMO_CUSTOMER.password })}>Fill demo customer login</Button>
      </form>
    </Shell>
  );
}

export function RegisterPage() {
  useDocumentTitle('Create account');
  const { customer, register } = useCustomer();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const [v, setV] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  if (customer) return <Navigate to={next} replace />;
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    const res = validate(v, {
      name: ['required', { minLength: 2 }], email: ['required', 'email'], phone: ['required', 'phone'],
      password: ['required', { minLength: 8 }, { pattern: /(?=.*[A-Za-z])(?=.*\d)/, message: 'Use letters and numbers.' }],
      confirm: ['required', { custom: (x, all) => (x === all.password ? null : 'Passwords do not match.') }],
    }, { confirm: 'Confirm password' });
    setErrors(res.errors);
    if (!res.valid) return;
    setBusy(true);
    try {
      await register({ name: v.name.trim(), email: v.email, phone: v.phone, password: v.password });
      toast.success('Account created (demo).');
      navigate(next, { replace: true });
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setBusy(false);
    }
  };
  return (
    <Shell title="Create your account" subtitle="Save addresses, track orders and reorder faster." footer={<>Already registered? <Link className="font-semibold text-brand-600 hover:underline" to="/login">Sign in</Link></>}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <Input label="Full name" autoComplete="name" value={v.name} onChange={set('name')} error={errors.name} />
        <Input label="Email" type="email" autoComplete="email" value={v.email} onChange={set('email')} error={errors.email} />
        <Input label="Phone" autoComplete="tel" value={v.phone} onChange={set('phone')} error={errors.phone} />
        <Input label="Password" type="password" autoComplete="new-password" value={v.password} onChange={set('password')} error={errors.password} hint="At least 8 characters with letters and numbers." />
        <Input label="Confirm password" type="password" autoComplete="new-password" value={v.confirm} onChange={set('confirm')} error={errors.confirm} />
        {errors.form ? <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{errors.form}</p> : null}
        <Button type="submit" className="w-full" loading={busy}>Create account</Button>
      </form>
    </Shell>
  );
}

import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAdmin } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Form';
import { validate } from '../../utils/validators';
import { ADMIN_DEMO_LOGINS } from '../../data/seed/people';
import { brandAssets } from '../../assets';

export default function AdminLoginPage() {
  const { user, login } = useAdmin();
  const toast = useToast();
  const navigate = useNavigate();
  const loc = useLocation();
  const [v, setV] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const dest = loc.state?.from?.startsWith('/admin') && loc.state.from !== '/admin/login' ? loc.state.from : '/admin';
  if (user) return <Navigate to={dest} replace />;
  const submit = async (e) => {
    e.preventDefault();
    const res = validate(v, { email: ['required', 'email'], password: ['required'] });
    setErrors(res.errors);
    if (!res.valid) return;
    setBusy(true);
    try {
      await login(v.email, v.password);
      toast.success('Signed in to admin (demo).');
      navigate(dest, { replace: true });
    } catch (err) { setErrors({ form: err.message }); } finally { setBusy(false); }
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 p-4">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-pop md:grid-cols-2">
        <div className="p-8">
          <img src={brandAssets.logo} alt="Darzibabu" className="h-10 w-auto" />
          <h1 className="mt-6 font-display text-2xl font-extrabold text-navy-900">Admin sign in</h1>
          <p className="mt-1 text-sm text-slate-600">Manage products, orders, content and settings.</p>
          <form onSubmit={submit} noValidate className="mt-6 space-y-4">
            <Input label="Email" type="email" autoComplete="username" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} error={errors.email} />
            <Input label="Password" type="password" autoComplete="current-password" value={v.password} onChange={(e) => setV({ ...v, password: e.target.value })} error={errors.password} />
            {errors.form ? <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{errors.form}</p> : null}
            <Button type="submit" className="w-full" loading={busy}>Sign in</Button>
          </form>
          <Link to="/" className="mt-4 inline-block text-sm font-semibold text-brand-600 hover:underline">← Back to storefront</Link>
        </div>
        <div className="bg-navy-50 p-8">
          <p className="flex items-start gap-2 rounded-xl bg-amber-100 p-3 text-xs text-amber-900"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />Prototype only. This login runs entirely in the browser and is <b>not secure</b>. Real authentication and permission checks must be built on the server.</p>
          <h2 className="mt-5 text-sm font-bold uppercase tracking-wider text-slate-500">Demo accounts</h2>
          <ul className="mt-3 space-y-2">
            {ADMIN_DEMO_LOGINS.map((a) => (
              <li key={a.email} className="flex items-center justify-between gap-2 rounded-xl bg-white p-3 text-sm shadow-sm">
                <span className="min-w-0"><span className="block font-semibold text-navy-900">{a.role}</span><span className="block truncate text-xs text-slate-500">{a.email} · {a.password}</span></span>
                <Button size="xs" variant="soft" onClick={() => { setV({ email: a.email, password: a.password }); setErrors({}); }}>Use</Button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

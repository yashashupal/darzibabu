import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Boxes, ExternalLink, FileText, CircleHelp, Image, Inbox, KeyRound, LayoutDashboard, LayoutTemplate, LogOut, Megaphone, Menu, MessageSquare, Package, Percent, Settings, ShoppingBag, Tags, Users } from 'lucide-react';
import { useAdmin } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { brandAssets } from '../assets';
import { Drawer } from '../components/ui/Modal';
import { PageLoader } from '../components/ui/Feedback';
import { cx } from '../utils/format';

export const ADMIN_NAV = [
  { group: 'Overview', items: [{ to: '/admin', label: 'Dashboard', icon: LayoutDashboard, perm: 'dashboard', end: true }] },
  { group: 'Catalog', items: [
    { to: '/admin/products', label: 'Products', icon: Package, perm: 'products' },
    { to: '/admin/categories', label: 'Categories', icon: Tags, perm: 'categories' },
    { to: '/admin/inventory', label: 'Inventory', icon: Boxes, perm: 'inventory' },
    { to: '/admin/media', label: 'Media library', icon: Image, perm: 'media' },
  ] },
  { group: 'Sales', items: [
    { to: '/admin/orders', label: 'Orders', icon: ShoppingBag, perm: 'orders' },
    { to: '/admin/customers', label: 'Customers', icon: Users, perm: 'customers' },
    { to: '/admin/reviews', label: 'Reviews', icon: MessageSquare, perm: 'reviews' },
    { to: '/admin/inquiries', label: 'Inquiries', icon: Inbox, perm: 'inquiries' },
  ] },
  { group: 'Marketing & content', items: [
    { to: '/admin/banners', label: 'Banners', icon: Megaphone, perm: 'marketing' },
    { to: '/admin/coupons', label: 'Coupons', icon: Percent, perm: 'marketing' },
    { to: '/admin/homepage', label: 'Homepage sections', icon: LayoutTemplate, perm: 'marketing' },
    { to: '/admin/blog', label: 'Blog', icon: FileText, perm: 'content' },
    { to: '/admin/faqs', label: 'FAQs', icon: CircleHelp, perm: 'content' },
  ] },
  { group: 'System', items: [
    { to: '/admin/settings', label: 'Site settings', icon: Settings, perm: 'settings' },
    { to: '/admin/roles', label: 'Roles & permissions', icon: KeyRound, perm: 'roles' },
  ] },
];

function Sidebar({ onNavigate }) {
  const { can, user, role, logout } = useAdmin();
  const navigate = useNavigate();
  const toast = useToast();
  return (
    <div className="flex h-full flex-col bg-navy-950 text-white">
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
        <div className="rounded-lg bg-white px-2 py-1.5"><img src={brandAssets.logo} alt="Darzibabu" className="h-6 w-auto" /></div>
        <span className="rounded bg-brand-500 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">Admin</span>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4" aria-label="Admin">
        {ADMIN_NAV.map((g) => {
          const items = g.items.filter((i) => can(i.perm));
          if (!items.length) return null;
          return (
            <div key={g.group}>
              <p className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-widest text-white/40">{g.group}</p>
              {items.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} onClick={onNavigate} className={({ isActive }) => cx('flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition', isActive ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white')}>
                  <Icon className="h-4 w-4" />{label}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        <div className="mb-2 px-2"><p className="truncate text-sm font-semibold">{user?.name}</p><p className="truncate text-xs text-white/50">{role?.name}</p></div>
        <Link to="/" target="_blank" className="mb-1 flex items-center gap-2 rounded-lg px-2 py-2 text-xs text-white/70 hover:bg-white/10"><ExternalLink className="h-3.5 w-3.5" />View storefront</Link>
        <button onClick={() => { logout(); toast.info('Signed out of admin.'); navigate('/admin/login'); }} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs text-white/70 hover:bg-white/10"><LogOut className="h-3.5 w-3.5" />Sign out</button>
      </div>
    </div>
  );
}

export function RequirePermission({ perm, children }) {
  const { can } = useAdmin();
  if (!can(perm)) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
        <KeyRound className="mx-auto h-10 w-10 text-amber-600" />
        <h1 className="mt-3 font-display text-xl font-bold text-navy-900">Access restricted</h1>
        <p className="mt-1 text-sm text-slate-600">Your demo role does not include the "{perm}" permission. Permissions are enforced in the UI only in this prototype; a real backend must enforce them server-side.</p>
        <Link to="/admin" className="mt-4 inline-block text-sm font-semibold text-brand-600 hover:underline">Back to dashboard</Link>
      </div>
    );
  }
  return children;
}

export default function AdminLayout() {
  const { user, loading } = useAdmin();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => { setOpen(false); window.scrollTo(0, 0); }, [loc.pathname]);
  useEffect(() => {
    document.title = 'Admin | Darzibabu';
  }, [loc.pathname]);
  if (loading) return <PageLoader label="Loading admin…" className="min-h-screen" />;
  if (!user) return <Navigate to="/admin/login" state={{ from: loc.pathname }} replace />;
  return (
    <div className="min-h-screen bg-slate-100">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block"><Sidebar /></aside>
      <Drawer open={open} onClose={() => setOpen(false)} title="Admin menu"><div className="h-full"><Sidebar onNavigate={() => setOpen(false)} /></div></Drawer>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Open admin menu" className="rounded-lg p-2 hover:bg-slate-100"><Menu className="h-5 w-5" /></button>
          <img src={brandAssets.logo} alt="Darzibabu admin" className="h-7 w-auto" />
          <span className="w-9" />
        </header>
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-900">Demo admin: data and sign-in live in this browser only and are not secure.</div>
        <main className="mx-auto max-w-[96rem] p-4 sm:p-6 lg:p-8"><Outlet /></main>
      </div>
    </div>
  );
}

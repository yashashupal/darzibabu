import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone, Youtube } from 'lucide-react';
import { brandAssets } from '../../assets';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import { useCollection } from '../../hooks/useAsync';
import { submitInquiry } from '../../services/api';
import { isEmail } from '../../utils/validators';
import { DEMO_NOTICE } from '../../config/brand';
import Button from '../ui/Button';

function Newsletter() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!isEmail(email)) return setError('Enter a valid email address.');
    setError('');
    setBusy(true);
    try {
      await submitInquiry({ type: 'newsletter', name: 'Newsletter subscriber', email, phone: '', company: '', topic: 'Newsletter', message: 'Subscribed from the website footer.' });
      toast.success('Thanks for subscribing! (demo: stored in this browser only)');
      setEmail('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} noValidate className="mt-3">
      <div className="flex gap-2">
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" aria-label="Email address" placeholder="you@company.com" className="h-11 min-w-0 flex-1 rounded-xl border-0 bg-white/10 px-3 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-brand-400" />
        <Button type="submit" loading={busy} size="md">Join</Button>
      </div>
      {error ? <p role="alert" className="mt-1.5 text-xs text-brand-300">{error}</p> : null}
    </form>
  );
}

export default function Footer() {
  const { settings } = useSettings();
  const { items: categories } = useCollection('categories');
  const s = settings?.site || {};
  const socials = [[Instagram, s.social?.instagram, 'Instagram'], [Facebook, s.social?.facebook, 'Facebook'], [Linkedin, s.social?.linkedin, 'LinkedIn'], [Youtube, s.social?.youtube, 'YouTube']].filter((x) => x[1]);
  const col = 'space-y-2 text-sm text-white/75';
  const h = 'mb-3 text-sm font-bold uppercase tracking-wider text-white';
  return (
    <footer className="mt-20 bg-navy-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="inline-block rounded-xl bg-white px-4 py-3"><img src={brandAssets.logo} alt="Darzibabu" className="h-9 w-auto" /></div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/75">Premium custom apparel and corporate merchandise, from a single youth tee to large-scale uniform orders. Expert screen printing and embroidery, delivered with care.</p>
          <p className="mt-5 text-sm font-semibold">Get product news and offers</p>
          <div className="max-w-md"><Newsletter /></div>
          {socials.length ? <div className="mt-5 flex gap-2">{socials.map(([Icon, url, label]) => <a key={label} href={url} target="_blank" rel="noreferrer" aria-label={label} className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 hover:bg-brand-500"><Icon className="h-4 w-4" /></a>)}</div> : null}
        </div>
        <div>
          <h3 className={h}>Shop</h3>
          <ul className={col}>
            {categories.filter((c) => c.status === 'active').sort((a, b) => a.sortOrder - b.sortOrder).slice(0, 6).map((c) => <li key={c.id}><Link className="hover:text-white" to={`/category/${c.slug}`}>{c.name}</Link></li>)}
            <li><Link className="hover:text-white" to="/categories">All categories</Link></li>
          </ul>
        </div>
        <div>
          <h3 className={h}>Help</h3>
          <ul className={col}>
            {[['/track-order', 'Track your order'], ['/faqs', 'FAQs'], ['/contact', 'Contact us'], ['/contact?topic=quote', 'Bulk quote'], ['/blog', 'Blog'], ['/about', 'About Darzibabu'], ['/account', 'My account']].map(([to, l]) => <li key={to}><Link className="hover:text-white" to={to}>{l}</Link></li>)}
          </ul>
        </div>
        <div>
          <h3 className={h}>Reach us</h3>
          <ul className={col}>
            <li className="flex gap-2"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" /><a href={`tel:${(s.phone || '').replace(/\s/g, '')}`} className="hover:text-white">{s.phone}</a></li>
            <li className="flex gap-2"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" /><a href={`mailto:${s.email}`} className="break-all hover:text-white">{s.email}</a></li>
            <li className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" /><span>{s.address}</span></li>
            <li className="text-white/60">{s.hours}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-xs text-white/60 sm:px-6 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Darzibabu. The art of thread.</p>
          <p className="max-w-xl md:text-center">{DEMO_NOTICE}</p>
          <div className="flex flex-wrap gap-4">
            {[['shipping', 'Shipping'], ['returns', 'Returns'], ['privacy', 'Privacy'], ['terms', 'Terms']].map(([slug, l]) => <Link key={slug} to={`/policies/${slug}`} className="hover:text-white">{l}</Link>)}
            <Link to="/admin/login" className="hover:text-white">Admin demo</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

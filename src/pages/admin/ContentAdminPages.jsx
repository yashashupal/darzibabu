import { Mail } from 'lucide-react';
import CrudPage, { Toggle } from '../../components/admin/CrudPage';
import { Img } from '../../components/ui/Misc';
import { Badge, StatusBadge } from '../../components/ui/Feedback';
import Button from '../../components/ui/Button';
import { useCollection } from '../../hooks/useAsync';
import { recalcProductRating } from '../../services/api';
import { formatDate, formatINR } from '../../utils/format';

const LINK_RULE = { pattern: /^(\/|https?:\/\/)\S*$/, message: 'Use a site path like /products or a full https:// link.' };
const activeToggle = (key = 'active') => (r, ctx) => <Toggle checked={r[key]} label="Toggle active" onChange={(v) => ctx.update(r, { [key]: v })} />;

export function CategoriesAdmin() {
  const { items: products } = useCollection('products');
  return (
    <CrudPage repo="categories" title="Categories" noun="Category" subtitle="Organise the catalogue and control which collections appear on the storefront."
      defaultSort={{ key: 'sortOrder', dir: 'asc' }} searchKeys={['name', 'slug']}
      defaults={{ status: 'active', featured: false, sortOrder: 10, image: '' }}
      columns={[
        { key: 'image', header: 'Image', render: (r) => <Img src={r.image} alt="" className="h-10 w-10 rounded-lg object-cover" /> },
        { key: 'name', header: 'Name', sortable: true, render: (r) => <span className="font-semibold text-navy-900">{r.name}</span> },
        { key: 'slug', header: 'Slug', sortable: true },
        { key: 'products', header: 'Products', render: (r) => products.filter((p) => p.categoryId === r.id).length },
        { key: 'sortOrder', header: 'Order', sortable: true },
        { key: 'featured', header: 'Featured', render: (r, ctx) => <Toggle checked={r.featured} label="Featured on homepage" onChange={(v) => ctx.update(r, { featured: v })} /> },
        { key: 'status', header: 'Status', sortable: true, render: (r) => <StatusBadge status={r.status} /> },
      ]}
      fields={[
        { key: 'name', label: 'Name', required: true, full: true },
        { key: 'slug', label: 'URL slug', required: true, unique: true, slugFrom: 'name', hint: 'Used in /category/your-slug' },
        { key: 'sortOrder', label: 'Sort order', type: 'number' },
        { key: 'description', label: 'Description', type: 'textarea', full: true, rows: 3 },
        { key: 'image', label: 'Category image', type: 'image' },
        { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] },
        { key: 'featured', label: 'Show on homepage', type: 'checkbox' },
      ]}
      rules={{ name: ['required', { minLength: 2 }], slug: ['required', { pattern: /^[a-z0-9-]+$/, message: 'Slug may contain lowercase letters, numbers and hyphens only.' }], sortOrder: ['number'] }}
      guardDelete={(r) => (products.some((p) => p.categoryId === r.id) ? `"${r.name}" still has products. Move or delete them first.` : null)}
    />
  );
}

export function BannersAdmin() {
  const PLACEMENTS = [{ value: 'home-hero', label: 'Homepage hero slide' }, { value: 'promo-strip', label: 'Homepage bulk-quote banner' }, { value: 'announcement', label: 'Top announcement bar' }];
  return (
    <CrudPage repo="banners" title="Banners" noun="Banner" subtitle="Hero slides, promotional banner and the announcement bar shown across the storefront."
      defaultSort={{ key: 'sortOrder', dir: 'asc' }} searchKeys={['title', 'subtitle']} modalSize="lg"
      filters={[{ key: 'placement', label: 'All placements', options: PLACEMENTS }]}
      defaults={{ placement: 'home-hero', ctaLabel: 'Shop now', link: '/products', sortOrder: 10, active: true, image: '' }}
      columns={[
        { key: 'image', header: 'Image', render: (r) => (r.image ? <Img src={r.image} alt="" className="h-10 w-14 rounded-lg object-cover" /> : <span className="text-xs text-slate-400">-</span>) },
        { key: 'title', header: 'Title', sortable: true, render: (r) => <span className="line-clamp-2 max-w-xs font-semibold text-navy-900">{r.title}</span> },
        { key: 'placement', header: 'Placement', sortable: true, render: (r) => <Badge tone="navy">{PLACEMENTS.find((p) => p.value === r.placement)?.label || r.placement}</Badge> },
        { key: 'sortOrder', header: 'Order', sortable: true },
        { key: 'active', header: 'Active', render: activeToggle() },
      ]}
      fields={[
        { key: 'placement', label: 'Placement', type: 'select', options: PLACEMENTS },
        { key: 'sortOrder', label: 'Sort order', type: 'number' },
        { key: 'title', label: 'Headline', required: true, full: true },
        { key: 'subtitle', label: 'Sub-headline', type: 'textarea', rows: 2, full: true },
        { key: 'ctaLabel', label: 'Button label' },
        { key: 'link', label: 'Button link', required: true, hint: 'e.g. /category/caps-headwear' },
        { key: 'image', label: 'Image', type: 'image', hideWhen: (v) => v.placement === 'announcement' },
        { key: 'active', label: 'Active (visible on storefront)', type: 'checkbox', full: true },
      ]}
      rules={{ title: ['required', { minLength: 3 }], link: ['required', LINK_RULE], sortOrder: ['number'] }}
    />
  );
}

export function CouponsAdmin() {
  return (
    <CrudPage repo="coupons" title="Coupons" noun="Coupon" subtitle="Discount codes customers can apply in the cart and at checkout."
      searchKeys={['code', 'description']} defaultSort={{ key: 'code', dir: 'asc' }}
      defaults={{ type: 'percent', value: 10, minOrder: 0, maxDiscount: 0, usageLimit: 100, used: 0, active: true, expiresAt: '' }}
      csv={[{ header: 'Code', key: 'code' }, { header: 'Type', key: 'type' }, { header: 'Value', key: 'value' }, { header: 'Used', key: 'used' }]}
      columns={[
        { key: 'code', header: 'Code', sortable: true, render: (r) => <code className="rounded bg-slate-100 px-2 py-0.5 font-bold text-navy-900">{r.code}</code> },
        { key: 'description', header: 'Description' },
        { key: 'value', header: 'Discount', sortable: true, render: (r) => (r.type === 'percent' ? `${r.value}%${r.maxDiscount ? ` (max ${formatINR(r.maxDiscount)})` : ''}` : formatINR(r.value)) },
        { key: 'minOrder', header: 'Min order', sortable: true, render: (r) => formatINR(r.minOrder) },
        { key: 'used', header: 'Used', sortable: true, render: (r) => `${r.used}${r.usageLimit ? ` / ${r.usageLimit}` : ''}` },
        { key: 'expiresAt', header: 'Expires', sortable: true, render: (r) => (r.expiresAt ? <span className={new Date(r.expiresAt) < new Date() ? 'font-semibold text-red-600' : ''}>{formatDate(r.expiresAt)}</span> : 'Never') },
        { key: 'active', header: 'Active', render: activeToggle() },
      ]}
      fields={[
        { key: 'code', label: 'Coupon code', required: true, unique: true, hint: 'Letters and numbers, no spaces.' },
        { key: 'type', label: 'Discount type', type: 'select', options: [{ value: 'percent', label: 'Percentage' }, { value: 'flat', label: 'Flat amount (INR)' }] },
        { key: 'value', label: 'Value', type: 'number', required: true, min: 1 },
        { key: 'maxDiscount', label: 'Max discount (INR, 0 = none)', type: 'number', min: 0 },
        { key: 'minOrder', label: 'Minimum order (INR)', type: 'number', min: 0 },
        { key: 'usageLimit', label: 'Usage limit (0 = unlimited)', type: 'number', min: 0 },
        { key: 'expiresAt', label: 'Expiry date', type: 'date', hint: 'Leave empty for no expiry.' },
        { key: 'description', label: 'Description', full: true },
        { key: 'active', label: 'Active', type: 'checkbox', full: true },
      ]}
      rules={{ code: ['required', { pattern: /^[A-Za-z0-9]{3,20}$/, message: 'Use 3-20 letters or numbers with no spaces.' }], value: ['required', 'positive', { custom: (v, all) => (all.type === 'percent' && Number(v) > 100 ? 'Percentage cannot exceed 100.' : null) }], minOrder: ['number'], maxDiscount: ['number'], usageLimit: ['number'] }}
      beforeSave={(v) => ({ ...v, code: v.code.toUpperCase() })}
    />
  );
}

const ICONS = ['Shirt', 'Gift', 'Palette', 'Scissors', 'BadgeCheck', 'Sparkles'];
export function BlogAdmin() {
  return (
    <CrudPage repo="posts" title="Blog" noun="Article" subtitle="Publish guides and news. Use a line starting with ## inside the body for section headings."
      searchKeys={['title', 'category', 'excerpt']} defaultSort={{ key: 'date', dir: 'desc' }} modalSize="xl"
      filters={[{ key: 'status', label: 'All statuses', options: ['published', 'draft'] }]}
      defaults={{ author: 'Darzibabu Studio', category: 'Guides', status: 'draft', readMins: 4, date: new Date().toISOString().slice(0, 10), coverFrom: '#064072', coverTo: '#f24b69', coverIcon: 'Sparkles', content: [], tags: [] }}
      mapRecord={(r) => ({ date: (r.date || '').slice(0, 10), coverFrom: r.cover?.from, coverTo: r.cover?.to, coverIcon: r.cover?.icon })}
      columns={[
        { key: 'title', header: 'Title', sortable: true, render: (r) => <span className="line-clamp-2 max-w-sm font-semibold text-navy-900">{r.title}</span> },
        { key: 'category', header: 'Category', sortable: true },
        { key: 'date', header: 'Date', sortable: true, render: (r) => formatDate(r.date) },
        { key: 'status', header: 'Status', sortable: true, render: (r) => <StatusBadge status={r.status} /> },
      ]}
      fields={[
        { key: 'title', label: 'Title', required: true, full: true },
        { key: 'slug', label: 'URL slug', required: true, unique: true, slugFrom: 'title' },
        { key: 'category', label: 'Category', required: true },
        { key: 'author', label: 'Author' },
        { key: 'date', label: 'Publish date', type: 'date' },
        { key: 'readMins', label: 'Read time (minutes)', type: 'number', min: 1 },
        { key: 'status', label: 'Status', type: 'select', options: ['published', 'draft'] },
        { key: 'tags', label: 'Tags', type: 'tags', hint: 'Comma separated' },
        { key: 'coverFrom', label: 'Cover colour A (hex)' },
        { key: 'coverTo', label: 'Cover colour B (hex)' },
        { key: 'coverIcon', label: 'Cover icon', type: 'select', options: ICONS },
        { key: 'excerpt', label: 'Excerpt', type: 'textarea', rows: 2, full: true, required: true },
        { key: 'content', label: 'Article body', type: 'paragraphs', rows: 10, full: true, required: true, hint: 'Separate paragraphs with a blank line. Start a heading with "## ".' },
      ]}
      rules={{ title: ['required', { minLength: 5 }], slug: ['required', { pattern: /^[a-z0-9-]+$/, message: 'Use lowercase letters, numbers and hyphens.' }], category: ['required'], excerpt: ['required', { minLength: 10 }], content: ['required'], coverFrom: [{ pattern: /^#[0-9a-fA-F]{6}$/, message: 'Use a hex colour like #064072.' }], coverTo: [{ pattern: /^#[0-9a-fA-F]{6}$/, message: 'Use a hex colour like #f24b69.' }], readMins: ['number'] }}
      beforeSave={({ coverFrom, coverTo, coverIcon, date, ...rest }) => ({ ...rest, date: new Date(`${date || new Date().toISOString().slice(0, 10)}T09:00:00`).toISOString(), cover: { from: coverFrom || '#064072', to: coverTo || '#f24b69', icon: coverIcon || 'Sparkles' } })}
    />
  );
}

export function FaqsAdmin() {
  return (
    <CrudPage repo="faqs" title="FAQs" noun="FAQ" subtitle="Questions shown on the FAQ page and the homepage."
      searchKeys={['question', 'answer', 'category']} defaultSort={{ key: 'sortOrder', dir: 'asc' }} modalSize="lg"
      filters={[{ key: 'category', label: 'All categories', options: (items) => Array.from(new Set(items.map((i) => i.category))) }]}
      defaults={{ category: 'Ordering', sortOrder: 99, active: true }}
      columns={[
        { key: 'question', header: 'Question', sortable: true, render: (r) => <span className="line-clamp-2 max-w-md font-semibold text-navy-900">{r.question}</span> },
        { key: 'category', header: 'Category', sortable: true },
        { key: 'sortOrder', header: 'Order', sortable: true },
        { key: 'active', header: 'Active', render: activeToggle() },
      ]}
      fields={[
        { key: 'category', label: 'Category', required: true },
        { key: 'sortOrder', label: 'Sort order', type: 'number' },
        { key: 'question', label: 'Question', required: true, full: true },
        { key: 'answer', label: 'Answer', type: 'textarea', required: true, full: true, rows: 5 },
        { key: 'active', label: 'Active', type: 'checkbox', full: true },
      ]}
      rules={{ category: ['required'], question: ['required', { minLength: 8 }], answer: ['required', { minLength: 10 }], sortOrder: ['number'] }}
    />
  );
}

export function InquiriesAdmin() {
  return (
    <CrudPage repo="inquiries" title="Inquiries" noun="Inquiry" subtitle="Contact form messages, bulk quote requests and newsletter sign-ups." canCreate={false}
      searchKeys={['name', 'email', 'message', 'topic']} defaultSort={{ key: 'createdAt', dir: 'desc' }} modalSize="lg"
      filters={[{ key: 'status', label: 'All statuses', options: ['new', 'read', 'replied'] }, { key: 'type', label: 'All types', options: ['contact', 'quote', 'newsletter'] }]}
      columns={[
        { key: 'name', header: 'From', sortable: true, render: (r) => <div><p className="font-semibold text-navy-900">{r.name}</p><p className="text-xs text-slate-500">{r.email}</p></div> },
        { key: 'type', header: 'Type', sortable: true, render: (r) => <Badge tone={r.type === 'quote' ? 'pink' : 'navy'}>{r.type}</Badge> },
        { key: 'message', header: 'Message', render: (r) => <span className="line-clamp-2 max-w-sm text-slate-600">{r.message}</span> },
        { key: 'createdAt', header: 'Received', sortable: true, render: (r) => formatDate(r.createdAt) },
        { key: 'status', header: 'Status', sortable: true, render: (r) => <StatusBadge status={r.status} /> },
      ]}
      rowActions={(r) => <Button size="xs" variant="soft" icon={Mail} href={`mailto:${r.email}?subject=Re: ${encodeURIComponent(r.topic || 'Your enquiry')}`}>Reply</Button>}
      fields={[
        { key: 'name', label: 'Name', required: true }, { key: 'email', label: 'Email', required: true, type: 'email' }, { key: 'phone', label: 'Phone' }, { key: 'company', label: 'Company' },
        { key: 'topic', label: 'Topic' }, { key: 'status', label: 'Status', type: 'select', options: ['new', 'read', 'replied'] },
        { key: 'message', label: 'Message', type: 'textarea', rows: 6, full: true },
      ]}
      rules={{ name: ['required'], email: ['required', 'email'] }}
    />
  );
}

export function CustomersAdmin() {
  const { items: orders } = useCollection('orders');
  const stat = (c) => { const mine = orders.filter((o) => o.customerId === c.id && o.status !== 'Cancelled'); return { n: mine.length, spend: mine.reduce((s, o) => s + o.total, 0) }; };
  return (
    <CrudPage repo="customers" title="Customers" noun="Customer" subtitle="Everyone who has an account or has ordered. Passwords are never shown."
      searchKeys={['name', 'email', 'company', 'phone']} defaultSort={{ key: 'createdAt', dir: 'desc' }}
      filters={[{ key: 'status', label: 'All statuses', options: ['active', 'blocked'] }]}
      defaults={{ status: 'active', addresses: [], passwordHash: '' }}
      csv={[{ header: 'Name', key: 'name' }, { header: 'Email', key: 'email' }, { header: 'Phone', key: 'phone' }, { header: 'Company', key: 'company' }, { header: 'Joined', key: 'createdAt', get: (r) => formatDate(r.createdAt) }]}
      columns={[
        { key: 'name', header: 'Customer', sortable: true, render: (r) => <div><p className="font-semibold text-navy-900">{r.name}</p><p className="text-xs text-slate-500">{r.email}</p></div> },
        { key: 'company', header: 'Company', sortable: true },
        { key: 'orders', header: 'Orders', render: (r) => stat(r).n },
        { key: 'spend', header: 'Lifetime spend', render: (r) => formatINR(stat(r).spend) },
        { key: 'createdAt', header: 'Joined', sortable: true, render: (r) => formatDate(r.createdAt) },
        { key: 'status', header: 'Status', sortable: true, render: (r) => <StatusBadge status={r.status} /> },
      ]}
      rowActions={(r) => <Button size="xs" variant="soft" to={`/admin/orders?q=${encodeURIComponent(r.email)}`}>Orders</Button>}
      fields={[
        { key: 'name', label: 'Name', required: true }, { key: 'email', label: 'Email', required: true, unique: true, type: 'email' },
        { key: 'phone', label: 'Phone' }, { key: 'company', label: 'Company' }, { key: 'gstin', label: 'GSTIN' },
        { key: 'status', label: 'Status', type: 'select', options: ['active', 'blocked'] },
        { key: 'notes', label: 'Internal notes', type: 'textarea', full: true, rows: 3 },
      ]}
      rules={{ name: ['required', { minLength: 2 }], email: ['required', 'email'], phone: ['phone'] }}
    />
  );
}

export function ReviewsAdmin() {
  const { items: products } = useCollection('products');
  const pname = (id) => products.find((p) => p.id === id)?.name || 'Deleted product';
  return (
    <CrudPage repo="reviews" title="Reviews" noun="Review" subtitle="Moderate customer reviews. Approved reviews appear on product pages and update ratings." canCreate={false}
      searchKeys={['name', 'title', 'body']} defaultSort={{ key: 'createdAt', dir: 'desc' }} modalSize="lg"
      filters={[{ key: 'status', label: 'All statuses', options: ['pending', 'approved', 'rejected'] }]}
      afterChange={(r) => r?.productId && recalcProductRating(r.productId)}
      columns={[
        { key: 'productId', header: 'Product', render: (r) => <span className="font-semibold text-navy-900">{pname(r.productId)}</span> },
        { key: 'rating', header: 'Rating', sortable: true, render: (r) => `${r.rating} ★` },
        { key: 'title', header: 'Review', render: (r) => <div className="max-w-sm"><p className="font-medium text-slate-800">{r.title}</p><p className="line-clamp-1 text-xs text-slate-500">{r.body}</p><p className="text-xs text-slate-400">{r.name}</p></div> },
        { key: 'createdAt', header: 'Date', sortable: true, render: (r) => formatDate(r.createdAt) },
        { key: 'status', header: 'Status', sortable: true, render: (r) => <StatusBadge status={r.status} /> },
      ]}
      rowActions={(r, ctx) => (<>
        {r.status !== 'approved' ? <Button size="xs" variant="soft" onClick={async () => { await ctx.update(r, { status: 'approved' }); ctx.toast.success('Review approved.'); }}>Approve</Button> : null}
        {r.status !== 'rejected' ? <Button size="xs" variant="ghost" onClick={async () => { await ctx.update(r, { status: 'rejected' }); ctx.toast.info('Review rejected.'); }}>Reject</Button> : null}
      </>)}
      fields={[
        { key: 'name', label: 'Reviewer', required: true }, { key: 'rating', label: 'Rating (1-5)', type: 'number', min: 1 },
        { key: 'title', label: 'Title', full: true, required: true }, { key: 'body', label: 'Review', type: 'textarea', full: true, rows: 5, required: true },
        { key: 'status', label: 'Status', type: 'select', options: ['pending', 'approved', 'rejected'] }, { key: 'verified', label: 'Verified buyer', type: 'checkbox' },
      ]}
      rules={{ name: ['required'], title: ['required'], body: ['required', { minLength: 10 }], rating: ['required', { min: 1 }, { max: 5 }] }}
    />
  );
}

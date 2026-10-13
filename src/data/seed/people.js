import { products } from './catalog';
import { demoHash } from '../../utils/validators';
import { unitPrice } from '../../utils/pricing';
import { ORDER_STATUSES } from '../../config/brand';
import { assetKeys } from '../../assets';

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const R = rng(20261012);
const pick = (arr) => arr[Math.floor(R() * arr.length)];
const between = (a, b) => Math.floor(a + R() * (b - a + 1));
const daysAgo = (n, h = 0) => new Date(Date.now() - n * 86400000 - h * 3600000).toISOString();

export const DEMO_CUSTOMER = { email: 'demo@customer.test', password: 'Demo@123' };

const rawCustomers = [
  ['Aarav Mehta', 'aarav.mehta@brightlabs.example', 'Brightlabs Pvt Ltd', 'Mumbai', 'Maharashtra', '400001'],
  ['Neha Kulkarni', 'neha.k@greenleaf.example', 'GreenLeaf Cafe', 'Pune', 'Maharashtra', '411001'],
  ['Rohan Iyer', 'rohan.iyer@zenith.example', 'Zenith Logistics', 'Chennai', 'Tamil Nadu', '600001'],
  ['Priya Nair', 'priya.nair@hospicare.example', 'HospiCare Clinics', 'Kochi', 'Kerala', '682001'],
  ['Vikram Singh', 'vikram@campusclub.example', 'Campus Club', 'Delhi', 'Delhi', '110001'],
  ['Ananya Rao', 'ananya.rao@startupnest.example', 'StartupNest', 'Bengaluru', 'Karnataka', '560001'],
  ['Karan Shah', 'karan.shah@eventpro.example', 'EventPro India', 'Ahmedabad', 'Gujarat', '380001'],
  ['Sneha Joshi', 'sneha.joshi@finedine.example', 'FineDine Hospitality', 'Indore', 'Madhya Pradesh', '452001'],
  ['Demo Customer', DEMO_CUSTOMER.email, 'Demo Company', 'Bhopal', 'Madhya Pradesh', '462001'],
];

export const customers = rawCustomers.map((c, i) => ({
  id: `cus-${i + 1}`,
  name: c[0],
  email: c[1],
  phone: `+91 9${between(100000000, 999999999)}`,
  company: c[2],
  gstin: '',
  passwordHash: demoHash(i === rawCustomers.length - 1 ? DEMO_CUSTOMER.password : 'Customer@123'),
  status: 'active',
  notes: '',
  createdAt: daysAgo(between(4, 120)),
  addresses: [
    { id: `addr-${i + 1}`, label: 'Office', name: c[0], phone: '+91 90000 00000', line1: `${between(10, 999)}, Business Park Road`, line2: '', city: c[3], state: c[4], pincode: c[5], isDefault: true },
  ],
}));

const reviewText = [
  ['Excellent print quality', 'The logo came out sharp and the fabric feels premium. Our team loved it.'],
  ['Great for our uniforms', 'Consistent colours across the whole batch, and the sizes were accurate.'],
  ['Smooth process', 'Artwork proof was shared quickly and the order arrived a day early.'],
  ['Worth the price', 'Bulk pricing made it very affordable and quality did not drop.'],
  ['Looks very professional', 'Embroidery is clean and the finishing is neat. Will reorder.'],
  ['Good, but delivery took a little longer', 'Product quality is great. Delivery took two extra days, though support kept us updated.'],
  ['Our clients were impressed', 'We gifted these to clients and received great compliments.'],
  ['Solid and well packed', 'Everything was packed neatly and every piece was identical.'],
];
const reviewerNames = ['Aarav M.', 'Neha K.', 'Rohan I.', 'Priya N.', 'Vikram S.', 'Ananya R.', 'Karan S.', 'Sneha J.', 'Meera P.', 'Imran Q.', 'Divya T.', 'Arjun B.'];

export const reviews = [];
products.forEach((p, i) => {
  const count = i % 3 === 0 ? 3 : i % 3 === 1 ? 2 : 1;
  for (let k = 0; k < count; k++) {
    const t = reviewText[(i + k * 3) % reviewText.length];
    reviews.push({
      id: `rev-${reviews.length + 1}`,
      productId: p.id,
      name: reviewerNames[(i * 2 + k) % reviewerNames.length],
      email: `reviewer${reviews.length + 1}@example.com`,
      rating: [5, 5, 4, 5, 4, 3][(i + k) % 6],
      title: t[0],
      body: t[1],
      verified: k % 2 === 0,
      status: reviews.length % 13 === 5 ? 'pending' : 'approved',
      createdAt: daysAgo(between(2, 90)),
    });
  }
});

export const adminUsers = [
  { id: 'adm-1', name: 'Demo Super Admin', email: 'admin@darzibabu.demo', roleId: 'super_admin', passwordHash: demoHash('Admin@123'), status: 'active' },
  { id: 'adm-2', name: 'Catalog Manager', email: 'catalog@darzibabu.demo', roleId: 'catalog_manager', passwordHash: demoHash('Catalog@123'), status: 'active' },
  { id: 'adm-3', name: 'Order Manager', email: 'orders@darzibabu.demo', roleId: 'order_manager', passwordHash: demoHash('Orders@123'), status: 'active' },
  { id: 'adm-4', name: 'Content Editor', email: 'content@darzibabu.demo', roleId: 'content_editor', passwordHash: demoHash('Content@123'), status: 'active' },
];
export const ADMIN_DEMO_LOGINS = [
  { role: 'Super Admin', email: 'admin@darzibabu.demo', password: 'Admin@123' },
  { role: 'Catalog Manager', email: 'catalog@darzibabu.demo', password: 'Catalog@123' },
  { role: 'Order Manager', email: 'orders@darzibabu.demo', password: 'Orders@123' },
  { role: 'Content Editor', email: 'content@darzibabu.demo', password: 'Content@123' },
];

const payMethods = ['UPI', 'Credit / Debit card', 'Net banking', 'Bank transfer / proforma invoice'];
const publishable = products.filter((p) => p.status === 'published');

function makeOrder(n) {
  const cust = customers[n % customers.length];
  const age = Math.floor((n * 75) / 44) + (n % 3); // spread across last ~80 days
  const created = daysAgo(age, between(0, 10));
  const lineCount = between(1, 3);
  const items = [];
  for (let i = 0; i < lineCount; i++) {
    const p = pick(publishable);
    const options = {};
    p.options.forEach((o) => (options[o.name] = pick(o.values).label));
    const pm = pick(p.printMethods);
    const qty = Math.max(p.moq, between(1, 8) * p.moq);
    items.push({
      productId: p.id, name: p.name, image: p.images[0], options, printMethodId: pm.id, printMethodLabel: pm.label,
      qty, unit: unitPrice(p, { options, printMethodId: pm.id }, qty), logoName: 'company-logo.png', hasLogo: true,
    });
  }
  const subtotal = items.reduce((s, l) => s + l.unit * l.qty, 0);
  const useCoupon = n % 5 === 0 && subtotal >= 1000;
  const discount = useCoupon ? Math.min(Math.round(subtotal * 0.1), 2000) : 0;
  const shipping = subtotal - discount >= 5000 ? 0 : 150;
  const tax = Math.round(((subtotal - discount + shipping) * 18) / 100);
  const total = subtotal - discount + shipping + tax;

  let idx;
  if (age > 40) idx = 5; else if (age > 25) idx = pick([4, 5, 5]); else if (age > 14) idx = pick([2, 3, 4]); else if (age > 6) idx = pick([1, 2, 3]); else idx = pick([0, 1, 2]);
  if (n === 0 || n === 2) idx = 0; // keep a couple of brand-new orders for the demo
  const cancelled = n % 17 === 4;
  const history = [];
  for (let s = 0; s <= idx; s++) {
    history.push({ status: ORDER_STATUSES[s], at: new Date(new Date(created).getTime() + s * 86400000 * 1.6).toISOString(), note: s === 0 ? 'Order received.' : '' });
  }
  if (cancelled) history.push({ status: 'Cancelled', at: new Date(new Date(created).getTime() + 3600000 * 20).toISOString(), note: 'Cancelled at customer request.' });
  const a = cust.addresses[0];
  return {
    id: `ord-${n + 1}`,
    orderNo: `DB-${10001 + n}`,
    createdAt: created,
    customerId: cust.id,
    customer: { name: cust.name, email: cust.email, phone: cust.phone, company: cust.company, gstin: '' },
    shippingAddress: { name: a.name, phone: a.phone, line1: a.line1, line2: a.line2, city: a.city, state: a.state, pincode: a.pincode },
    items, subtotal, discount, couponCode: useCoupon ? 'WELCOME10' : '', shipping, tax, total,
    shippingMethodId: shipping === 0 ? 'standard' : 'standard',
    shippingMethodLabel: 'Standard delivery (5-7 days)',
    paymentMethod: pick(payMethods),
    paymentStatus: cancelled ? 'Refunded (demo)' : idx >= 1 ? 'Paid (demo)' : 'Pending',
    status: cancelled ? 'Cancelled' : ORDER_STATUSES[idx],
    history,
    notes: '',
  };
}

export const orders = Array.from({ length: 44 }, (_, n) => makeOrder(n)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

export const media = assetKeys.map((k, i) => ({
  id: `media-${i + 1}`, name: `${k}.jpg`, ref: `asset:${k}`, kind: 'bundled', alt: k.replace(/-/g, ' '), uploadedAt: daysAgo(70),
}));

export const inquiries = [
  { id: 'inq-1', type: 'quote', name: 'Rahul Verma', email: 'rahul@example.com', phone: '+91 98000 00001', company: 'Verma Textiles', topic: 'Bulk quote', message: 'We need 300 staff polos with embroidered logo for the festive season. Please share pricing and timelines.', status: 'new', createdAt: daysAgo(2) },
  { id: 'inq-2', type: 'contact', name: 'Isha Kapoor', email: 'isha@example.com', phone: '', company: '', topic: 'General question', message: 'Do you offer name embroidery on individual polos?', status: 'read', createdAt: daysAgo(5) },
];

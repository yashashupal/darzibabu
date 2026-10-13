/**
 * Service layer used by every screen. Each export maps 1:1 to something a Laravel API would offer
 * (resource controllers + a few custom endpoints), so the UI is decoupled from localStorage.
 */
import { createRepo, createDoc } from './repo';
import { storage } from './storage';
import * as catalogSeed from '../data/seed/catalog';
import * as contentSeed from '../data/seed/content';
import * as peopleSeed from '../data/seed/people';
import { demoHash } from '../utils/validators';
import { uid } from '../utils/format';
import { startingPrice, totalStock } from '../utils/pricing';

/* ------------------------------- seed prep ------------------------------- */
function seedProducts() {
  const approved = peopleSeed.reviews.filter((r) => r.status === 'approved');
  return catalogSeed.products.map((p) => {
    const rs = approved.filter((r) => r.productId === p.id);
    return { ...p, reviewCount: rs.length, rating: rs.length ? Math.round((rs.reduce((s, r) => s + r.rating, 0) / rs.length) * 10) / 10 : 0 };
  });
}

/* --------------------------------- repos --------------------------------- */
export const productsRepo = createRepo('products', { seed: seedProducts, prefix: 'prod' });
export const categoriesRepo = createRepo('categories', { seed: () => catalogSeed.categories, prefix: 'cat' });
export const reviewsRepo = createRepo('reviews', { seed: () => peopleSeed.reviews, prefix: 'rev' });
export const ordersRepo = createRepo('orders', { seed: () => peopleSeed.orders, prefix: 'ord' });
export const customersRepo = createRepo('customers', { seed: () => peopleSeed.customers, prefix: 'cus' });
export const bannersRepo = createRepo('banners', { seed: () => contentSeed.banners, prefix: 'ban' });
export const couponsRepo = createRepo('coupons', { seed: () => contentSeed.coupons, prefix: 'cp' });
export const postsRepo = createRepo('posts', { seed: () => contentSeed.posts, prefix: 'post' });
export const faqsRepo = createRepo('faqs', { seed: () => contentSeed.faqs, prefix: 'faq' });
export const mediaRepo = createRepo('media', { seed: () => peopleSeed.media, prefix: 'media' });
export const inquiriesRepo = createRepo('inquiries', { seed: () => peopleSeed.inquiries, prefix: 'inq' });
export const rolesRepo = createRepo('roles', { seed: () => contentSeed.roles, prefix: 'role' });
export const adminUsersRepo = createRepo('adminUsers', { seed: () => peopleSeed.adminUsers, prefix: 'adm' });

export const settingsDoc = createDoc('settings', () => contentSeed.settings);
export const homepageDoc = createDoc('homepage', () => contentSeed.homepageSections);

export const REPOS = {
  products: productsRepo, categories: categoriesRepo, reviews: reviewsRepo, orders: ordersRepo, customers: customersRepo,
  banners: bannersRepo, coupons: couponsRepo, posts: postsRepo, faqs: faqsRepo, media: mediaRepo, inquiries: inquiriesRepo,
  roles: rolesRepo, adminUsers: adminUsersRepo,
};

/* ------------------------------ product search ------------------------------ */
/**
 * Mirrors a server-side query: GET /products?q=&category=&minPrice=&maxPrice=&colors=&rating=&inStock=&sort=&page=&pageSize=
 */
export async function queryProducts(params = {}, productsList) {
  const all = productsList || (await productsRepo.list());
  const cats = await categoriesRepo.list();
  const {
    q = '', category = '', minPrice, maxPrice, colors = [], rating = 0, inStock = false, sort = 'featured', page = 1, pageSize = 12, includeDrafts = false, bestSeller = false, featured = false,
  } = params;
  let items = all.filter((p) => includeDrafts || p.status === 'published');
  if (category) {
    const cat = cats.find((c) => c.slug === category || c.id === category);
    items = items.filter((p) => (cat ? p.categoryId === cat.id : false));
  }
  if (q.trim()) {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    items = items.filter((p) => {
      const cat = cats.find((c) => c.id === p.categoryId);
      const hay = [p.name, p.shortDescription, p.description, (p.tags || []).join(' '), cat?.name || ''].join(' ').toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
  }
  if (minPrice !== undefined && minPrice !== '') items = items.filter((p) => startingPrice(p) >= Number(minPrice));
  if (maxPrice !== undefined && maxPrice !== '') items = items.filter((p) => startingPrice(p) <= Number(maxPrice));
  if (colors.length) {
    items = items.filter((p) => (p.options || []).some((o) => o.values.some((v) => colors.includes(v.label) && v.hex)));
  }
  if (rating) items = items.filter((p) => (p.rating || 0) >= Number(rating));
  if (inStock) items = items.filter((p) => !(p.inventory?.length) || totalStock(p) > 0);
  if (bestSeller) items = items.filter((p) => p.bestSeller);
  if (featured) items = items.filter((p) => p.featured);

  const sorters = {
    featured: (a, b) => Number(b.featured) - Number(a.featured) || Number(b.bestSeller) - Number(a.bestSeller) || a.name.localeCompare(b.name),
    newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    'price-asc': (a, b) => startingPrice(a) - startingPrice(b),
    'price-desc': (a, b) => startingPrice(b) - startingPrice(a),
    rating: (a, b) => (b.rating || 0) - (a.rating || 0) || (b.reviewCount || 0) - (a.reviewCount || 0),
    name: (a, b) => a.name.localeCompare(b.name),
  };
  items = [...items].sort(sorters[sort] || sorters.featured);
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, Number(page) || 1), pages);
  return { items: items.slice((safePage - 1) * pageSize, safePage * pageSize), total, page: safePage, pages, pageSize };
}

export async function recalcProductRating(productId) {
  const [rs, product] = await Promise.all([reviewsRepo.list(), productsRepo.get(productId)]);
  if (!product) return;
  const ok = rs.filter((r) => r.productId === productId && r.status === 'approved');
  const rating = ok.length ? Math.round((ok.reduce((s, r) => s + r.rating, 0) / ok.length) * 10) / 10 : 0;
  await productsRepo.update(productId, { rating, reviewCount: ok.length });
}

export async function submitReview(data) {
  const review = await reviewsRepo.create({ ...data, status: 'pending', verified: false });
  return review; // appears on the storefront after an admin approves it
}

/* --------------------------------- coupons --------------------------------- */
export async function validateCoupon(code, subtotal) {
  const list = await couponsRepo.list();
  const c = list.find((x) => x.code.toLowerCase() === String(code || '').trim().toLowerCase());
  if (!c) return { ok: false, error: 'This coupon code is not valid.' };
  if (!c.active) return { ok: false, error: 'This coupon is currently inactive.' };
  if (c.expiresAt && new Date(c.expiresAt + 'T23:59:59') < new Date()) return { ok: false, error: 'This coupon has expired.' };
  if (c.usageLimit && c.used >= c.usageLimit) return { ok: false, error: 'This coupon has reached its usage limit.' };
  if (subtotal < (c.minOrder || 0)) return { ok: false, error: `Add items worth Rs. ${(c.minOrder - subtotal).toLocaleString('en-IN')} more to use this coupon (minimum order Rs. ${c.minOrder.toLocaleString('en-IN')}).` };
  return { ok: true, coupon: c };
}

/* --------------------------------- orders --------------------------------- */
export async function placeOrder(payload) {
  const settings = await settingsDoc.get();
  const orders = await ordersRepo.list();
  const nextNum = Math.max(settings.orders?.nextNumber || 10001, ...orders.map((o) => Number(String(o.orderNo).replace(/\D/g, '')) || 0).map((n) => n + 1));
  const orderNo = `${settings.orders?.prefix || 'DB'}-${nextNum}`;
  const at = new Date().toISOString();

  // inventory check + decrement (demo only: not concurrency safe)
  const products = await productsRepo.list();
  for (const item of payload.items) {
    const p = products.find((x) => x.id === item.productId);
    if (!p) throw new Error(`"${item.name}" is no longer available.`);
    const names = Object.keys(item.options || {});
    const row = (p.inventory || []).find((r) => names.every((n) => r.options?.[n] === item.options[n]));
    if (row && row.stock < item.qty) throw new Error(`Only ${row.stock} units of "${item.name}" (${Object.values(item.options).join(' / ')}) are available.`);
  }
  for (const item of payload.items) {
    const p = products.find((x) => x.id === item.productId);
    const names = Object.keys(item.options || {});
    const inv = (p.inventory || []).map((r) => (names.every((n) => r.options?.[n] === item.options[n]) ? { ...r, stock: Math.max(0, r.stock - item.qty) } : r));
    p.inventory = inv;
    await productsRepo.update(p.id, { inventory: inv });
  }

  if (payload.couponCode) {
    const c = (await couponsRepo.list()).find((x) => x.code === payload.couponCode);
    if (c) await couponsRepo.update(c.id, { used: (c.used || 0) + 1 });
  }

  // find or create customer by email
  const customers = await customersRepo.list();
  let customer = customers.find((c) => c.email.toLowerCase() === payload.customer.email.toLowerCase());
  if (!customer) {
    customer = await customersRepo.create({ name: payload.customer.name, email: payload.customer.email, phone: payload.customer.phone, company: payload.customer.company || '', gstin: payload.customer.gstin || '', passwordHash: '', status: 'active', notes: 'Created from checkout (guest).', addresses: [{ id: uid('addr'), label: 'Shipping', ...payload.shippingAddress, isDefault: true }] });
  }

  const order = await ordersRepo.create({
    orderNo, customerId: customer.id,
    customer: payload.customer, shippingAddress: payload.shippingAddress, items: payload.items,
    subtotal: payload.totals.subtotal, discount: payload.totals.discount, couponCode: payload.couponCode || '',
    shipping: payload.totals.shipping, tax: payload.totals.tax, total: payload.totals.total,
    shippingMethodId: payload.shippingMethodId, shippingMethodLabel: payload.shippingMethodLabel,
    paymentMethod: payload.paymentMethod, paymentStatus: 'Pending',
    status: 'Placed', history: [{ status: 'Placed', at, note: 'Order received (demo checkout).' }], notes: payload.notes || '',
  });
  await settingsDoc.save({ ...settings, orders: { ...(settings.orders || {}), nextNumber: nextNum + 1 } });
  return order;
}

export async function updateOrderStatus(id, status, note = '', paymentStatus) {
  const order = await ordersRepo.get(id);
  if (!order) throw new Error('Order not found.');
  const history = [...(order.history || [])];
  if (status !== order.status) history.push({ status, at: new Date().toISOString(), note });
  const patch = { status, history };
  if (paymentStatus) patch.paymentStatus = paymentStatus;
  return ordersRepo.update(id, patch);
}

export async function cancelOrder(id, note = 'Cancelled by customer.') {
  const order = await ordersRepo.get(id);
  if (!order) throw new Error('Order not found.');
  if (!['Placed', 'Design Approval'].includes(order.status)) throw new Error('This order has entered production and can no longer be cancelled online.');
  return updateOrderStatus(id, 'Cancelled', note, order.paymentStatus === 'Paid (demo)' ? 'Refunded (demo)' : order.paymentStatus);
}

export async function trackOrder(orderNo, email) {
  const orders = await ordersRepo.list();
  return orders.find((o) => o.orderNo.toLowerCase() === String(orderNo).trim().toLowerCase() && o.customer?.email?.toLowerCase() === String(email).trim().toLowerCase()) || null;
}

/* ---------------------------------- auth ---------------------------------- */
// IMPORTANT: this is a UI demo only. Credentials are checked in the browser against localStorage data.
// Real authentication must be implemented on the server (e.g. Laravel Sanctum) before launch.
export async function customerLogin(email, password) {
  const list = await customersRepo.list();
  const c = list.find((x) => x.email.toLowerCase() === String(email).trim().toLowerCase());
  if (!c || !c.passwordHash || c.passwordHash !== demoHash(password)) throw new Error('Incorrect email or password.');
  if (c.status === 'blocked') throw new Error('This account is disabled. Please contact support.');
  storage.set('session:customer', { id: c.id });
  return c;
}
export async function customerRegister({ name, email, phone, password }) {
  const list = await customersRepo.list();
  const existing = list.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
  if (existing && existing.passwordHash) throw new Error('An account with this email already exists. Try signing in.');
  const data = { name, email: email.trim(), phone, passwordHash: demoHash(password) };
  const c = existing ? await customersRepo.update(existing.id, data) : await customersRepo.create({ ...data, company: '', gstin: '', status: 'active', notes: '', addresses: [] });
  storage.set('session:customer', { id: c.id });
  return c;
}
export const customerLogout = () => storage.remove('session:customer');
export const getCustomerSession = () => storage.get('session:customer');

export async function adminLogin(email, password) {
  const users = await adminUsersRepo.list();
  const u = users.find((x) => x.email.toLowerCase() === String(email).trim().toLowerCase());
  if (!u || u.passwordHash !== demoHash(password)) throw new Error('Incorrect email or password.');
  if (u.status !== 'active') throw new Error('This admin account is disabled.');
  storage.set('session:admin', { id: u.id });
  return u;
}
export const adminLogout = () => storage.remove('session:admin');
export const getAdminSession = () => storage.get('session:admin');

/* ------------------------------ demo utilities ------------------------------ */
export function resetDemoData() {
  storage.clearAll();
}

export async function submitInquiry(data) {
  return inquiriesRepo.create({ ...data, status: 'new' });
}

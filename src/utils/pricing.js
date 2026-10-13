import { clamp } from './format';

export const sortedTiers = (product) =>
  [...(product?.tiers || [])].filter((t) => t && t.min > 0).sort((a, b) => a.min - b.min);

/** Base per-unit price for a quantity, from the product's quantity tiers. */
export function tierPrice(product, qty) {
  const tiers = sortedTiers(product);
  if (!tiers.length) return Number(product?.basePrice) || 0;
  let price = tiers[0].price;
  tiers.forEach((t) => {
    if (qty >= t.min) price = t.price;
  });
  return price;
}

export function optionDelta(product, options = {}) {
  let delta = 0;
  (product?.options || []).forEach((opt) => {
    const chosen = options[opt.name];
    const val = opt.values.find((v) => v.label === chosen);
    if (val?.priceDelta) delta += Number(val.priceDelta);
  });
  return delta;
}

export function printMethodPrice(product, printMethodId) {
  const pm = (product?.printMethods || []).find((m) => m.id === printMethodId);
  return pm ? Number(pm.price) || 0 : 0;
}

/** Final per-unit demo price for a selection and quantity. */
export function unitPrice(product, selection, qty) {
  if (!product) return 0;
  const base = tierPrice(product, qty);
  return Math.max(0, Math.round(base + optionDelta(product, selection.options) + printMethodPrice(product, selection.printMethodId)));
}

export function minTierPrice(product) {
  const t = sortedTiers(product);
  return t.length ? Math.min(...t.map((x) => x.price)) : Number(product?.basePrice) || 0;
}

export function startingPrice(product) {
  const t = sortedTiers(product);
  return t.length ? t[0].price : Number(product?.basePrice) || 0;
}

export function savingsPercent(product) {
  const t = sortedTiers(product);
  if (t.length < 2) return 0;
  return Math.round((1 - t[t.length - 1].price / t[0].price) * 100);
}

/** Stock for a specific option combination (Infinity when not tracked). */
export function stockFor(product, options = {}) {
  const inv = product?.inventory;
  if (!inv || !inv.length) return Infinity;
  const names = Object.keys(options);
  const row = inv.find((r) => names.every((n) => r.options?.[n] === options[n]));
  return row ? Number(row.stock) : Infinity;
}

export function totalStock(product) {
  const inv = product?.inventory || [];
  return inv.reduce((s, r) => s + (Number(r.stock) || 0), 0);
}

export function stockStatus(product) {
  const inv = product?.inventory || [];
  if (!inv.length) return 'in';
  const total = totalStock(product);
  if (total <= 0) return 'out';
  if (total <= (product.lowStockThreshold ?? 50)) return 'low';
  return 'in';
}

/** Cartesian product of option values -> inventory rows, keeping existing stock where it matches. */
export function buildInventory(options = [], existing = [], defaultStock = 300) {
  const opts = options.filter((o) => o.name && o.values?.length);
  let combos = [{}];
  opts.forEach((o) => {
    const next = [];
    combos.forEach((c) => o.values.forEach((v) => next.push({ ...c, [o.name]: v.label })));
    combos = next;
  });
  return combos.map((c) => {
    const key = Object.values(c).join('-');
    const prev = existing.find((r) => JSON.stringify(r.options) === JSON.stringify(c));
    return { sku: prev?.sku || `SKU-${key.replace(/[^A-Za-z0-9]+/g, '').toUpperCase().slice(0, 14) || 'BASE'}`, options: c, stock: prev ? prev.stock : defaultStock };
  });
}

/** Totals for a cart/order from line items. */
export function computeTotals({ lines, settings, coupon, shippingMethodId }) {
  const subtotal = lines.reduce((s, l) => s + l.unit * l.qty, 0);
  let discount = 0;
  if (coupon) {
    discount = coupon.type === 'percent' ? (subtotal * coupon.value) / 100 : Number(coupon.value);
    if (coupon.maxDiscount) discount = Math.min(discount, Number(coupon.maxDiscount));
    discount = clamp(Math.round(discount), 0, subtotal);
  }
  const ship = settings?.shipping || {};
  const methods = ship.methods || [];
  const method = methods.find((m) => m.id === shippingMethodId) || methods[0];
  const afterDiscount = subtotal - discount;
  let shipping = 0;
  if (lines.length && method) {
    const free = method.id === 'standard' && afterDiscount >= (ship.freeShippingThreshold || Infinity);
    shipping = free ? 0 : Number(method.price) || 0;
  }
  const taxRate = Number(settings?.tax?.gstPercent ?? 18);
  const taxable = afterDiscount + shipping;
  const tax = settings?.tax?.pricesIncludeTax ? 0 : Math.round((taxable * taxRate) / 100);
  const total = taxable + tax;
  return { subtotal, discount, shipping, tax, taxRate, total, shippingMethod: method };
}

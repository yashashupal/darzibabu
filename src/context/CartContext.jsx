import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { storage } from '../services/storage';
import { validateCoupon } from '../services/api';
import { useCollection } from '../hooks/useAsync';
import { useSettings } from './SettingsContext';
import { useToast } from './ToastContext';
import { computeTotals, stockFor, unitPrice } from '../utils/pricing';

const Ctx = createContext(null);
export const useCart = () => useContext(Ctx);

const lineKey = (i) => [i.productId, JSON.stringify(i.options || {}), i.printMethodId || '', i.logo?.name || ''].join('|');

export function CartProvider({ children }) {
  const toast = useToast();
  const { settings } = useSettings();
  const { items: products } = useCollection('products');
  const [state, setState] = useState(() => storage.get('cart', { items: [], couponCode: '', shippingMethodId: 'standard' }));
  const [coupon, setCoupon] = useState(null);

  useEffect(() => {
    const res = storage.set('cart', state);
    if (!res.ok) toast.error('Could not save your cart: browser storage is full. Try a smaller logo file.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const lines = useMemo(
    () =>
      state.items.map((it) => {
        const product = products.find((p) => p.id === it.productId);
        const unit = product ? unitPrice(product, it, it.qty) : 0;
        const stock = product ? stockFor(product, it.options) : 0;
        return { ...it, key: lineKey(it), product, unit, lineTotal: unit * it.qty, stock, unavailable: !!products.length && (!product || product.status !== 'published') };
      }),
    [state.items, products]
  );
  const ready = products.length > 0;
  const validLines = lines.filter((l) => !l.unavailable && l.product);
  const subtotalForCoupon = validLines.reduce((s, l) => s + l.lineTotal, 0);

  // keep coupon valid as the cart changes
  useEffect(() => {
    let live = true;
    if (!state.couponCode || !ready) {
      setCoupon(null);
      return undefined;
    }
    validateCoupon(state.couponCode, subtotalForCoupon).then((res) => {
      if (!live) return;
      if (res.ok) setCoupon(res.coupon);
      else {
        setCoupon(null);
        setState((s) => ({ ...s, couponCode: '' }));
        toast.info(`Coupon ${state.couponCode} was removed: ${res.error}`);
      }
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.couponCode, subtotalForCoupon, ready]);

  const totals = useMemo(
    () => computeTotals({ lines: validLines, settings, coupon, shippingMethodId: state.shippingMethodId }),
    [validLines, settings, coupon, state.shippingMethodId]
  );

  const addItem = useCallback((item) => {
    setState((s) => {
      const key = lineKey(item);
      const idx = s.items.findIndex((i) => lineKey(i) === key);
      const items = [...s.items];
      if (idx >= 0) items[idx] = { ...items[idx], qty: items[idx].qty + item.qty, logo: item.logo || items[idx].logo };
      else items.push(item);
      return { ...s, items };
    });
  }, []);
  const updateQty = useCallback((key, qty) => setState((s) => ({ ...s, items: s.items.map((i) => (lineKey(i) === key ? { ...i, qty } : i)) })), []);
  const updateItem = useCallback((key, patch) => setState((s) => ({ ...s, items: s.items.map((i) => (lineKey(i) === key ? { ...i, ...patch } : i)) })), []);
  const removeItem = useCallback((key) => setState((s) => ({ ...s, items: s.items.filter((i) => lineKey(i) !== key) })), []);
  const clear = useCallback(() => setState({ items: [], couponCode: '', shippingMethodId: 'standard' }), []);
  const setShippingMethod = useCallback((id) => setState((s) => ({ ...s, shippingMethodId: id })), []);

  const applyCoupon = useCallback(
    async (code) => {
      const res = await validateCoupon(code, subtotalForCoupon);
      if (!res.ok) return res;
      setState((s) => ({ ...s, couponCode: res.coupon.code }));
      setCoupon(res.coupon);
      return res;
    },
    [subtotalForCoupon]
  );
  const removeCoupon = useCallback(() => {
    setState((s) => ({ ...s, couponCode: '' }));
    setCoupon(null);
  }, []);

  const count = state.items.reduce((s, i) => s + i.qty, 0);

  const value = { lines, validLines, count, totals, coupon, shippingMethodId: state.shippingMethodId, addItem, updateQty, updateItem, removeItem, clear, setShippingMethod, applyCoupon, removeCoupon, ready };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// Thin wrapper around localStorage with change notifications.
// Everything the demo persists goes through here, so replacing it later is a one-file job.
const NS = 'darzibabu:v1:';
const subs = new Set();

const emit = (key) => subs.forEach((fn) => fn(key));

export const storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(NS + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  /** Returns { ok, error }. Fails gracefully when the browser quota is exceeded. */
  set(key, value) {
    try {
      localStorage.setItem(NS + key, JSON.stringify(value));
      emit(key);
      return { ok: true };
    } catch (error) {
      return { ok: false, error };
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(NS + key);
    } catch {
      /* ignore */
    }
    emit(key);
  },
  has(key) {
    try {
      return localStorage.getItem(NS + key) !== null;
    } catch {
      return false;
    }
  },
  clearAll() {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(NS))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      /* ignore */
    }
    emit('*');
  },
  usageBytes() {
    try {
      return Object.keys(localStorage)
        .filter((k) => k.startsWith(NS))
        .reduce((s, k) => s + (localStorage.getItem(k) || '').length * 2, 0);
    } catch {
      return 0;
    }
  },
};

export function subscribe(fn) {
  subs.add(fn);
  return () => subs.delete(fn);
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key && e.key.startsWith(NS)) emit(e.key.slice(NS.length));
  });
}

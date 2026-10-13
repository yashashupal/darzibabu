/**
 * Data access layer.
 *
 * Every collection is exposed through the same small interface:
 *   list() get(idOrSlug) create(data) update(id, patch) remove(id)
 * plus createDoc(name) for single documents such as site settings.
 *
 * Driver "local"  -> browser localStorage (this demo).
 * Driver "rest"   -> fetch() against a Laravel-style REST API:
 *     GET    {API}/{resource}          -> { data: [...] } or [...]
 *     GET    {API}/{resource}/{id}
 *     POST   {API}/{resource}
 *     PUT    {API}/{resource}/{id}
 *     DELETE {API}/{resource}/{id}
 * Switch with VITE_API_DRIVER=rest and VITE_API_URL=https://your-api/api/v1.
 * The UI only ever talks to these repos, so no screens need to change.
 */
import { storage } from './storage';
import { uid } from '../utils/format';

const env = (typeof import.meta !== 'undefined' && import.meta.env) || {};
export const DRIVER = env.VITE_API_DRIVER || 'local';
const API_URL = (env.VITE_API_URL || '').replace(/\/$/, '');
const LATENCY = Number(env.VITE_DEMO_LATENCY ?? 180);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const delay = () => sleep(typeof window !== 'undefined' && window.__DZ_FAST ? 0 : LATENCY + Math.random() * 60);
const now = () => new Date().toISOString();

class StorageError extends Error {}
const persist = (key, data) => {
  const res = storage.set(key, data);
  if (!res.ok) throw new StorageError('Browser storage is full. Remove some uploaded images or reset demo data.');
};

/* ----------------------------- local driver ----------------------------- */
function localRepo(resource, { seed = () => [], prefix = resource.slice(0, 3) } = {}) {
  const read = () => {
    let items = storage.get(resource, null);
    if (items === null) {
      items = seed();
      storage.set(resource, items);
    }
    return items;
  };
  return {
    resource,
    async list() {
      await delay();
      return read();
    },
    /** synchronous snapshot for rare cases (e.g. computing derived data) */
    snapshot: read,
    async get(idOrSlug) {
      await delay();
      return read().find((x) => x.id === idOrSlug || x.slug === idOrSlug) || null;
    },
    async create(data) {
      await delay();
      const items = read();
      const item = { ...data, id: data.id || uid(prefix), createdAt: data.createdAt || now(), updatedAt: now() };
      persist(resource, [item, ...items]);
      return item;
    },
    async update(id, patch) {
      await delay();
      const items = read();
      const idx = items.findIndex((x) => x.id === id);
      if (idx < 0) throw new Error('Record not found.');
      const next = { ...items[idx], ...patch, id, updatedAt: now() };
      const copy = [...items];
      copy[idx] = next;
      persist(resource, copy);
      return next;
    },
    async remove(id) {
      await delay();
      persist(resource, read().filter((x) => x.id !== id));
      return true;
    },
    async replaceAll(items) {
      await delay();
      persist(resource, items);
      return items;
    },
  };
}

/* ------------------------------ rest driver ------------------------------ */
async function http(path, { method = 'GET', body } = {}) {
  const token = storage.get('apiToken');
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Request failed (${res.status})`);
  }
  if (res.status === 204) return null;
  const json = await res.json();
  return json && json.data !== undefined ? json.data : json;
}
function restRepo(resource) {
  return {
    resource,
    list: () => http(`/${resource}`),
    snapshot: () => [],
    get: (id) => http(`/${resource}/${id}`),
    create: (data) => http(`/${resource}`, { method: 'POST', body: data }),
    update: (id, patch) => http(`/${resource}/${id}`, { method: 'PUT', body: patch }),
    remove: (id) => http(`/${resource}/${id}`, { method: 'DELETE' }).then(() => true),
    replaceAll: async () => {
      throw new Error('replaceAll is only available with the local driver.');
    },
  };
}

export function createRepo(resource, opts) {
  return DRIVER === 'rest' ? restRepo(resource) : localRepo(resource, opts);
}

/** Single-document store (settings, homepage layout). */
export function createDoc(name, seed) {
  if (DRIVER === 'rest') {
    return { name, get: () => http(`/${name}`), save: (data) => http(`/${name}`, { method: 'PUT', body: data }), snapshot: () => seed() };
  }
  const read = () => {
    let d = storage.get(`doc:${name}`, null);
    if (d === null) {
      d = seed();
      storage.set(`doc:${name}`, d);
    }
    return d;
  };
  return {
    name,
    snapshot: read,
    async get() {
      await delay();
      return read();
    },
    async save(data) {
      await delay();
      persist(`doc:${name}`, data);
      return data;
    },
  };
}

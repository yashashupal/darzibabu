# Darzibabu - custom merchandise storefront + admin (frontend-only prototype)

**Darzibabu - The art of thread.** A complete React storefront and a separate interactive admin dashboard for
custom apparel, uniforms and corporate merchandise. Everything runs in the browser: demo data is seeded on first
load and every change is persisted in `localStorage`. A service layer isolates storage, so a future
**Laravel + MySQL REST API** can replace it without rebuilding the UI.

> **This is a demo prototype.** There is no real authentication, payment, inventory or order processing.
> Logins are checked in the browser against local data and are **not secure**. Never enter real passwords,
> card or bank details. Permissions only hide screens in the UI; a real backend must enforce them.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve the production build
```

Requires Node 18+. Fonts load from Google Fonts (falls back to system fonts offline).

### Demo logins

| Area | Email | Password |
|---|---|---|
| Customer | demo@customer.test | Demo@123 |
| Admin: Super Admin | admin@darzibabu.demo | Admin@123 |
| Admin: Catalog Manager | catalog@darzibabu.demo | Catalog@123 |
| Admin: Order Manager | orders@darzibabu.demo | Orders@123 |
| Admin: Content Editor | content@darzibabu.demo | Content@123 |

The login screens have one-click "use" buttons. Admin: `/admin/login`. Try order tracking with
`DB-10001` + `aarav.mehta@brightlabs.example`. Coupons: `WELCOME10`, `BULK500`, `TEAMUP15`.

## What is included

**Storefront**: homepage (config-driven sections + hero slider), categories, product listing (search, category,
price, colour, rating, stock filters, 6 sorts, pagination, mobile filter drawer), product detail (variants,
quantity-based demo pricing, decoration methods, stock per variant, logo upload with draggable placement
preview, reviews + review form, related items), header search with suggestions, wishlist, cart (qty rules,
coupons, shipping methods), validated demo checkout, order confirmation, order tracking timeline,
customer account (orders, cancel, reorder, addresses, profile), register/login, blog, FAQs, contact / bulk quote,
about, shipping / returns / privacy / terms pages, 404.

**Admin** (`/admin`): dashboard analytics (KPIs, revenue chart, status mix, top products, category share,
low stock), products (list, full editor with images, tiers, variants, decoration methods, per-variant stock,
duplicate, publish toggle), categories, inventory, orders (filters, CSV export, status + payment updates with
timeline notes, customer artwork download), customers, reviews moderation (updates product ratings), inquiries,
banners, coupons, homepage sections (show/hide/reorder/edit headings), blog, FAQs, media library, site settings
(business info, GST, minimum order, shipping methods, payment display), roles & permissions matrix with admin
users, and a "Reset demo data" tool.

Every list has search, sorting and pagination; every form validates; destructive actions ask for confirmation;
loading skeletons, empty states and toasts are used throughout.

## Project structure

```
src/
  assets/            logo + curated product images; index.js resolves "asset:key" references
  config/brand.js    brand constants, order statuses
  data/seed/         sample data: catalog, content/settings, people/orders/reviews
  services/
    storage.js       localStorage wrapper + change events
    repo.js          createRepo()/createDoc(): LOCAL driver (demo) or REST driver (Laravel)
    api.js           every repo + domain actions (queryProducts, placeOrder, updateOrderStatus, auth...)
  context/           Toast, Confirm, Settings, Cart, Wishlist, Customer/Admin auth
  hooks/             useAsync, useCollection, useDebounce...
  utils/             pricing (tiers, totals, stock), format, validators, image helpers
  components/ui/     Button, Modal/Drawer, Form fields, DataTable, Pagination, feedback, misc
  components/store/  Header, Footer, ProductCard, LogoUploader, TierTable, OrderTimeline...
  components/admin/  CrudPage (reusable CRUD screen), ImagePicker, Charts, AdminUI
  layouts/           StoreLayout, AdminLayout (+ permission guard)
  pages/store|admin/ route screens (admin screens are lazy-loaded)
```

## Moving to Laravel + MySQL

Screens never touch `localStorage`; they call `src/services/api.js`, which calls `createRepo(resource)` /
`createDoc(name)` in `repo.js`.

1. Copy `.env.example` to `.env` and set `VITE_API_DRIVER=rest` and `VITE_API_URL=https://your-api/api/v1`.
2. Implement these endpoints (JSON; either `{ "data": ... }` or a bare payload is accepted):

| Resource | Endpoints |
|---|---|
| products, categories, reviews, orders, customers, banners, coupons, posts, faqs, media, inquiries, roles, adminUsers | `GET /{r}`, `GET /{r}/{id or slug}`, `POST /{r}`, `PUT /{r}/{id}`, `DELETE /{r}/{id}` |
| settings, homepage | `GET /{name}`, `PUT /{name}` |

3. Move the logic in `api.js` that is client-side today to the server: `queryProducts` (filter/sort/paginate:
   already shaped like `q, category, minPrice, maxPrice, colors, rating, inStock, sort, page, pageSize`),
   `placeOrder` (stock decrement, order numbering, coupon usage), `validateCoupon`, `updateOrderStatus`,
   `trackOrder`, and authentication (use Laravel Sanctum; `repo.js` already sends `Authorization: Bearer <apiToken>`).
4. Enforce roles and permissions on the server, hash passwords with bcrypt/argon2, and add a payment gateway
   server-side. Replace image data URLs with real file uploads.

Data shapes are documented by the seed files in `src/data/seed/`.

## Notes and limits

- Browser storage is about 5 MB. Uploaded images are downscaled; the Media and Settings screens show usage.
- Reset everything from **Admin → Site settings → Demo data → Reset demo data**.
- For static hosting, route all paths to `index.html` (a Netlify `_redirects` file is included).
- Prices are demo figures in INR with GST added at checkout (configurable).
- Image assets: see `src/assets/README.md`. Only 13 distinct usable product visuals were in the supplied set,
  so the 33 seeded products reuse them. Upload your own through the Media library and product editor.
- The source has not been tested in the sandbox with a real `npm install` (no registry access there). It was
  bundled with esbuild and Tailwind 3 and exercised end to end in Chromium using test stand-ins for
  `react-router-dom` and `lucide-react`.

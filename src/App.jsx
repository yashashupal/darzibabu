import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';
import { SettingsProvider } from './context/SettingsContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { AdminAuthProvider, CustomerAuthProvider } from './context/AuthContext';
import StoreLayout from './layouts/StoreLayout';
import AdminLayout, { RequirePermission } from './layouts/AdminLayout';
import { PageLoader } from './components/ui/Feedback';

import HomePage from './pages/store/HomePage';
import CategoriesPage from './pages/store/CategoriesPage';
import ProductsPage from './pages/store/ProductsPage';
import ProductDetailPage from './pages/store/ProductDetailPage';
import CartPage from './pages/store/CartPage';
import CheckoutPage from './pages/store/CheckoutPage';
import OrderConfirmationPage from './pages/store/OrderConfirmationPage';
import TrackOrderPage from './pages/store/TrackOrderPage';
import { LoginPage, RegisterPage } from './pages/store/AuthPages';
import { AccountAddresses, AccountLayout, AccountOrderDetail, AccountOrders, AccountOverview, AccountProfile } from './pages/store/AccountPages';
import { AboutPage, BlogPage, BlogPostPage, ContactPage, FaqPage, NotFoundPage, PolicyPage, WishlistPage } from './pages/store/ContentPages';

// Admin screens are code-split so shoppers never download them.
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'));
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'));
const InventoryAdminPage = lazy(() => import('./pages/admin/InventoryAdminPage'));
const MediaAdminPage = lazy(() => import('./pages/admin/MediaAdminPage'));
const SettingsAdminPage = lazy(() => import('./pages/admin/SettingsAdminPage'));
const HomepageAdminPage = lazy(() => import('./pages/admin/HomepageAdminPage'));
const RolesAdminPage = lazy(() => import('./pages/admin/RolesAdminPage'));
const ProductsAdmin = lazy(() => import('./pages/admin/ProductsAdminPages').then((m) => ({ default: m.ProductsAdmin })));
const ProductEditorAdmin = lazy(() => import('./pages/admin/ProductsAdminPages').then((m) => ({ default: m.ProductEditorAdmin })));
const OrdersAdmin = lazy(() => import('./pages/admin/OrdersAdminPages').then((m) => ({ default: m.OrdersAdmin })));
const OrderDetailAdmin = lazy(() => import('./pages/admin/OrdersAdminPages').then((m) => ({ default: m.OrderDetailAdmin })));
const named = (name) => lazy(() => import('./pages/admin/ContentAdminPages').then((m) => ({ default: m[name] })));
const CategoriesAdmin = named('CategoriesAdmin');
const BannersAdmin = named('BannersAdmin');
const CouponsAdmin = named('CouponsAdmin');
const BlogAdmin = named('BlogAdmin');
const FaqsAdmin = named('FaqsAdmin');
const InquiriesAdmin = named('InquiriesAdmin');
const CustomersAdmin = named('CustomersAdmin');
const ReviewsAdmin = named('ReviewsAdmin');

const guard = (perm, el) => <RequirePermission perm={perm}>{el}</RequirePermission>;

export default function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <SettingsProvider>
          <CartProvider>
            <WishlistProvider>
              <CustomerAuthProvider>
                <AdminAuthProvider>
                  <Suspense fallback={<PageLoader className="min-h-screen" />}>
                    <Routes>
                      <Route element={<StoreLayout />}>
                        <Route index element={<HomePage />} />
                        <Route path="categories" element={<CategoriesPage />} />
                        <Route path="category/:slug" element={<ProductsPage mode="category" />} />
                        <Route path="products" element={<ProductsPage />} />
                        <Route path="search" element={<ProductsPage mode="search" />} />
                        <Route path="product/:slug" element={<ProductDetailPage />} />
                        <Route path="cart" element={<CartPage />} />
                        <Route path="checkout" element={<CheckoutPage />} />
                        <Route path="order-confirmation/:orderNo" element={<OrderConfirmationPage />} />
                        <Route path="track-order" element={<TrackOrderPage />} />
                        <Route path="login" element={<LoginPage />} />
                        <Route path="register" element={<RegisterPage />} />
                        <Route path="account" element={<AccountLayout />}>
                          <Route index element={<AccountOverview />} />
                          <Route path="orders" element={<AccountOrders />} />
                          <Route path="orders/:id" element={<AccountOrderDetail />} />
                          <Route path="addresses" element={<AccountAddresses />} />
                          <Route path="profile" element={<AccountProfile />} />
                        </Route>
                        <Route path="wishlist" element={<WishlistPage />} />
                        <Route path="blog" element={<BlogPage />} />
                        <Route path="blog/:slug" element={<BlogPostPage />} />
                        <Route path="faqs" element={<FaqPage />} />
                        <Route path="contact" element={<ContactPage />} />
                        <Route path="about" element={<AboutPage />} />
                        <Route path="policies/:slug" element={<PolicyPage />} />
                        <Route path="*" element={<NotFoundPage />} />
                      </Route>

                      <Route path="/admin/login" element={<AdminLoginPage />} />
                      <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={guard('dashboard', <DashboardPage />)} />
                        <Route path="products" element={guard('products', <ProductsAdmin />)} />
                        <Route path="products/:id" element={guard('products', <ProductEditorAdmin />)} />
                        <Route path="categories" element={guard('categories', <CategoriesAdmin />)} />
                        <Route path="inventory" element={guard('inventory', <InventoryAdminPage />)} />
                        <Route path="media" element={guard('media', <MediaAdminPage />)} />
                        <Route path="orders" element={guard('orders', <OrdersAdmin />)} />
                        <Route path="orders/:id" element={guard('orders', <OrderDetailAdmin />)} />
                        <Route path="customers" element={guard('customers', <CustomersAdmin />)} />
                        <Route path="reviews" element={guard('reviews', <ReviewsAdmin />)} />
                        <Route path="inquiries" element={guard('inquiries', <InquiriesAdmin />)} />
                        <Route path="banners" element={guard('marketing', <BannersAdmin />)} />
                        <Route path="coupons" element={guard('marketing', <CouponsAdmin />)} />
                        <Route path="homepage" element={guard('marketing', <HomepageAdminPage />)} />
                        <Route path="blog" element={guard('content', <BlogAdmin />)} />
                        <Route path="faqs" element={guard('content', <FaqsAdmin />)} />
                        <Route path="settings" element={guard('settings', <SettingsAdminPage />)} />
                        <Route path="roles" element={guard('roles', <RolesAdminPage />)} />
                        <Route path="*" element={<div className="py-20 text-center"><p className="font-display text-5xl font-extrabold text-brand-500">404</p><p className="mt-2 text-slate-600">This admin page does not exist.</p></div>} />
                      </Route>
                    </Routes>
                  </Suspense>
                </AdminAuthProvider>
              </CustomerAuthProvider>
            </WishlistProvider>
          </CartProvider>
        </SettingsProvider>
      </ConfirmProvider>
    </ToastProvider>
  );
}

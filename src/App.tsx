import { Lollipop } from 'lucide-react';
import type { ReactNode } from 'react';
import { lazy, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { CartOverlay } from './components/cart/CartOverlay';
import { AdminLayout } from './components/layout/AdminLayout';
import { ToastHost } from './components/ui/Toast';
import { Confirmation } from './screens/Confirmation';
import { History } from './screens/History';
import { Home } from './screens/Home';
import { Login } from './screens/Login';
import { Profile } from './screens/Profile';
import { ProductDetail } from './screens/ProductDetail';
import { Splash } from './screens/Splash';
import { useAuthStore } from './store/authStore';
import { useCartStore } from './store/cartStore';
import { useNotificationStore } from './store/notificationStore';

// Admin screens are only ever loaded by the 3 hardcoded admin phones, so they're split into
// their own lazily-fetched chunks instead of shipping in the main bundle every customer pays for.
// AdminLayout wraps its <Outlet /> in a Suspense boundary, so no fallback is needed here.
const Categories = lazy(() => import('./screens/admin/Categories').then((m) => ({ default: m.Categories })));
const Clients = lazy(() => import('./screens/admin/Clients').then((m) => ({ default: m.Clients })));
const Dashboard = lazy(() => import('./screens/admin/Dashboard').then((m) => ({ default: m.Dashboard })));
const AdminOrders = lazy(() => import('./screens/admin/Orders').then((m) => ({ default: m.Orders })));
const PasswordResets = lazy(() => import('./screens/admin/PasswordResets').then((m) => ({ default: m.PasswordResets })));
const Pickup = lazy(() => import('./screens/admin/Pickup').then((m) => ({ default: m.Pickup })));
const Prepare = lazy(() => import('./screens/admin/Prepare').then((m) => ({ default: m.Prepare })));
const AdminProducts = lazy(() => import('./screens/admin/Products').then((m) => ({ default: m.Products })));
const Reports = lazy(() => import('./screens/admin/Reports').then((m) => ({ default: m.Reports })));
const Settings = lazy(() => import('./screens/admin/Settings').then((m) => ({ default: m.Settings })));

function AuthLoading() {
  return (
    <div className="dc-app-bg flex min-h-dvh items-center justify-center">
      <div className="animate-dc-float flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink to-purple">
        <Lollipop size={30} strokeWidth={2} color="#fff" />
      </div>
    </div>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const status = useAuthStore((s) => s.status);
  if (status === 'loading') return <AuthLoading />;
  if (status === 'unauthenticated') return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const isAdmin = useAuthStore((s) => s.customer?.isAdmin ?? false);
  if (status === 'loading') return <AuthLoading />;
  if (status === 'unauthenticated') return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/home" replace />;
  return <>{children}</>;
}

function App() {
  const init = useAuthStore((s) => s.init);
  const authStatus = useAuthStore((s) => s.status);
  const fetchNotifications = useNotificationStore((s) => s.fetch);
  const hydrateCart = useCartStore((s) => s.hydrate);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (authStatus !== 'authenticated') return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    hydrateCart();
    return () => clearInterval(interval);
  }, [authStatus, fetchNotifications, hydrateCart]);

  return (
    <div className="relative">
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/home"
          element={
            <RequireAuth>
              <Home />
            </RequireAuth>
          }
        />
        <Route
          path="/product/:id"
          element={
            <RequireAuth>
              <ProductDetail />
            </RequireAuth>
          }
        />
        <Route
          path="/confirmation"
          element={
            <RequireAuth>
              <Confirmation />
            </RequireAuth>
          }
        />
        <Route
          path="/history"
          element={
            <RequireAuth>
              <History />
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <Profile />
            </RequireAuth>
          }
        />

        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="categories" element={<Categories />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="clients" element={<Clients />} />
          <Route path="reports" element={<Reports />} />
          <Route path="prepare" element={<Prepare />} />
          <Route path="pickup" element={<Pickup />} />
          <Route path="password-resets" element={<PasswordResets />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <CartOverlay />
      <ToastHost />
    </div>
  );
}

export default App;

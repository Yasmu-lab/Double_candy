import { Lollipop } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { CartOverlay } from './components/cart/CartOverlay';
import { AdminLayout } from './components/layout/AdminLayout';
import { ToastHost } from './components/ui/Toast';
import { Categories } from './screens/admin/Categories';
import { Clients } from './screens/admin/Clients';
import { Dashboard } from './screens/admin/Dashboard';
import { Orders as AdminOrders } from './screens/admin/Orders';
import { Pickup } from './screens/admin/Pickup';
import { Prepare } from './screens/admin/Prepare';
import { Products as AdminProducts } from './screens/admin/Products';
import { Reports } from './screens/admin/Reports';
import { Settings } from './screens/admin/Settings';
import { Confirmation } from './screens/Confirmation';
import { History } from './screens/History';
import { Home } from './screens/Home';
import { Login } from './screens/Login';
import { Profile } from './screens/Profile';
import { ProductDetail } from './screens/ProductDetail';
import { Splash } from './screens/Splash';
import { useAuthStore } from './store/authStore';

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

  useEffect(() => {
    init();
  }, [init]);

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

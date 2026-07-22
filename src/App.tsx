import type { ReactNode } from 'react';
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
import { ProductDetail } from './screens/ProductDetail';
import { Splash } from './screens/Splash';
import { useAuthStore } from './store/authStore';

function RequireAuth({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
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
          path="/admin"
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
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

import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { CartOverlay } from './components/cart/CartOverlay';
import { ToastHost } from './components/ui/Toast';
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <CartOverlay />
      <ToastHost />
    </div>
  );
}

export default App;

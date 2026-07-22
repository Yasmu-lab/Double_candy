import {
  AlertTriangle,
  Bell,
  ClipboardCheck,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Package,
  Search,
  Settings,
  ShoppingBag,
  Truck,
  Users,
  BarChart3,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useAdminStore } from '../../store/adminStore';
import { useAuthStore } from '../../store/authStore';
import { useOrderStore } from '../../store/orderStore';
import { useProductsStore } from '../../store/productsStore';

const LOW_STOCK_THRESHOLD = 8;

const NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/products', label: 'Produtos', icon: Package },
  { to: '/admin/categories', label: 'Categorias', icon: LayoutGrid },
  { to: '/admin/orders', label: 'Pedidos', icon: ShoppingBag, badgeKey: 'pending' as const },
  { to: '/admin/clients', label: 'Clientes', icon: Users },
  { to: '/admin/reports', label: 'Relatórios', icon: BarChart3 },
  { to: '/admin/prepare', label: 'Preparar amanhã', icon: ClipboardCheck },
  { to: '/admin/pickup', label: 'Retirada', icon: Truck },
  { to: '/admin/settings', label: 'Configurações', icon: Settings },
];

const TITLES: Record<string, [string, string]> = {
  '/admin/dashboard': ['Dashboard', 'Visão geral da sua cantina hoje'],
  '/admin/products': ['Produtos', 'Gerencie o cardápio de doces'],
  '/admin/categories': ['Categorias', 'Organize os tipos de doce'],
  '/admin/orders': ['Pedidos', 'Acompanhe e atualize os pedidos'],
  '/admin/clients': ['Clientes', 'Quem mais ama seus doces'],
  '/admin/reports': ['Relatórios', 'Métricas e desempenho'],
  '/admin/prepare': ['Preparar para amanhã', 'Tudo que precisa ser separado para a retirada'],
  '/admin/pickup': ['Retirada', 'Localize o pedido e entregue na hora'],
  '/admin/settings': ['Configurações', 'Preferências da loja'],
};

export function AdminLayout({ children }: { children?: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [title, subtitle] = TITLES[location.pathname] ?? ['', ''];

  const orders = useOrderStore((s) => s.orders);
  const fetchAll = useOrderStore((s) => s.fetchAll);
  const products = useProductsStore((s) => s.products);
  const fetchProducts = useProductsStore((s) => s.fetchProducts);
  const openProdModal = useAdminStore((s) => s.openProdModal);
  const setOpenOrderId = useAdminStore((s) => s.setOpenOrderId);
  const customer = useAuthStore((s) => s.customer);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const pendingOrders = useMemo(() => orders.filter((o) => o.status === 'pending'), [orders]);
  const lowStockProducts = useMemo(
    () => products.filter((p) => p.active && p.stock <= LOW_STOCK_THRESHOLD),
    [products],
  );

  useEffect(() => {
    fetchAll();
    fetchProducts();
  }, [fetchAll, fetchProducts]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { products: [], orders: [], clients: [] as { name: string; phone: string }[] };
    const qDigits = q.replace(/\D/g, '');
    const matchedProducts = products.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 4);
    const matchedOrders = orders
      .filter(
        (o) =>
          o.displayId.toLowerCase().includes(q) ||
          o.client.toLowerCase().includes(q) ||
          String(o.orderNumber).includes(q),
      )
      .slice(0, 4);
    const clientMap = new Map<string, { name: string; phone: string }>();
    for (const o of orders) {
      if (o.client.toLowerCase().includes(q) || (qDigits && o.phone.replace(/\D/g, '').includes(qDigits))) {
        clientMap.set(o.phone, { name: o.client, phone: o.phone });
      }
    }
    return { products: matchedProducts, orders: matchedOrders, clients: [...clientMap.values()].slice(0, 4) };
  }, [searchQuery, products, orders]);

  const hasSearchResults =
    searchResults.products.length > 0 || searchResults.orders.length > 0 || searchResults.clients.length > 0;

  const goToProduct = (id: string) => {
    openProdModal(id);
    setSearchQuery('');
    setSearchOpen(false);
    navigate('/admin/products');
  };
  const goToOrder = (id: string) => {
    setOpenOrderId(id);
    setSearchQuery('');
    setSearchOpen(false);
    navigate('/admin/orders');
  };
  const goToClients = () => {
    setSearchQuery('');
    setSearchOpen(false);
    navigate('/admin/clients');
  };

  const hasNotifications = pendingOrders.length > 0 || lowStockProducts.length > 0;

  return (
    <div className="dc-app-bg min-h-dvh px-5 py-6 lg:px-8 lg:py-7">
      <div className="mx-auto flex max-w-[1400px] items-start gap-5">
        <aside className="sticky top-6 hidden w-[250px] shrink-0 rounded-xl border border-white/[0.06] bg-surface/60 p-4 backdrop-blur-lg lg:block">
          <Link to="/home" className="flex items-center gap-3 px-2 pb-5 pt-1.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-gradient-to-br from-pink to-purple">
              <ShoppingBag size={20} strokeWidth={2.2} className="text-text" />
            </div>
            <div>
              <div className="font-display text-[15px] font-bold">Double Candy</div>
              <div className="text-[11px] text-text-2">Painel do vendedor</div>
            </div>
          </Link>

          <nav className="flex flex-col gap-[3px]">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const badge = item.badgeKey === 'pending' && pendingOrders.length > 0 ? pendingOrders.length : null;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      'flex items-center gap-3 rounded-sm px-3.5 py-3 text-sm font-semibold transition-all duration-200',
                      isActive
                        ? 'bg-gradient-to-br from-pink/20 to-purple/15 text-text shadow-[inset_3px_0_0_#FF4FA0]'
                        : 'text-text-2 hover:text-text',
                    ].join(' ')
                  }
                >
                  <Icon size={18} strokeWidth={2} />
                  {item.label}
                  {badge != null && (
                    <span className="ml-auto rounded-full bg-pink px-2 py-0.5 text-[11px] font-bold text-text">
                      {badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          <div className="mt-5 rounded-md border border-pink/20 bg-gradient-to-br from-pink/[0.15] to-purple/[0.15] p-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-card-2">
                <Users size={18} strokeWidth={2} className="text-lime" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-bold">{customer?.name ?? 'Você'}</div>
                <div className="text-[11px] text-text-2">Administradora</div>
              </div>
              <button
                onClick={handleLogout}
                title="Sair"
                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[10px] border-none bg-card-2 text-text-2 transition-colors hover:bg-red/20 hover:text-red"
              >
                <LogOut size={15} strokeWidth={2} />
              </button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mb-[22px] flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold tracking-[-0.5px] lg:text-[26px]">{title}</h1>
              <p className="mt-1 text-sm text-text-2">{subtitle}</p>
            </div>
            <div className="flex items-center gap-3">
              <div
                onFocus={() => setSearchOpen(true)}
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setSearchOpen(false);
                }}
                className="relative hidden sm:block"
              >
                <div className="flex h-[46px] w-60 items-center gap-2.5 rounded-sm border border-white/[0.06] bg-surface px-3.5">
                  <Search size={18} strokeWidth={2} className="shrink-0 text-text-2" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar..."
                    className="min-w-0 flex-1 bg-transparent font-body text-sm text-text outline-none placeholder:text-text-3"
                  />
                </div>
                {searchOpen && searchQuery.trim() && (
                  <div className="dc-scroll absolute right-0 top-[54px] z-30 max-h-[360px] w-[320px] overflow-y-auto rounded-md border border-white/[0.08] bg-surface p-2 shadow-[0_24px_50px_-16px_rgba(0,0,0,0.6)]">
                    {!hasSearchResults && (
                      <div className="px-3 py-6 text-center text-[13px] text-text-2">Nada encontrado.</div>
                    )}
                    {searchResults.products.length > 0 && (
                      <div className="mb-1">
                        <div className="px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-text-2">Produtos</div>
                        {searchResults.products.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => goToProduct(p.id)}
                            className="flex w-full cursor-pointer items-center gap-2.5 rounded-xs px-2.5 py-2 text-left text-[13.5px] font-semibold text-text transition-colors hover:bg-card-2"
                          >
                            <Package size={15} strokeWidth={2} className="shrink-0 text-purple" />
                            {p.name}
                          </button>
                        ))}
                      </div>
                    )}
                    {searchResults.orders.length > 0 && (
                      <div className="mb-1">
                        <div className="px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-text-2">Pedidos</div>
                        {searchResults.orders.map((o) => (
                          <button
                            key={o.id}
                            onClick={() => goToOrder(o.id)}
                            className="flex w-full cursor-pointer items-center gap-2.5 rounded-xs px-2.5 py-2 text-left text-[13.5px] font-semibold text-text transition-colors hover:bg-card-2"
                          >
                            <ShoppingBag size={15} strokeWidth={2} className="shrink-0 text-pink" />
                            {o.displayId} · {o.client}
                          </button>
                        ))}
                      </div>
                    )}
                    {searchResults.clients.length > 0 && (
                      <div>
                        <div className="px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-text-2">Clientes</div>
                        {searchResults.clients.map((c) => (
                          <button
                            key={c.phone}
                            onClick={goToClients}
                            className="flex w-full cursor-pointer items-center gap-2.5 rounded-xs px-2.5 py-2 text-left text-[13.5px] font-semibold text-text transition-colors hover:bg-card-2"
                          >
                            <Users size={15} strokeWidth={2} className="shrink-0 text-lime" />
                            {c.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setNotifOpen(false);
                }}
                className="relative"
              >
                <button
                  onClick={() => setNotifOpen((v) => !v)}
                  className="relative flex h-[46px] w-[46px] shrink-0 cursor-pointer items-center justify-center rounded-sm border border-white/[0.06] bg-surface text-text"
                >
                  <Bell size={20} strokeWidth={2} />
                  {hasNotifications && (
                    <span className="absolute right-3 top-2.5 h-2 w-2 rounded-full border-2 border-surface bg-red" />
                  )}
                </button>
                {notifOpen && (
                  <div className="dc-scroll absolute right-0 top-[54px] z-30 max-h-[400px] w-[320px] overflow-y-auto rounded-md border border-white/[0.08] bg-surface p-2 shadow-[0_24px_50px_-16px_rgba(0,0,0,0.6)]">
                    {!hasNotifications && (
                      <div className="px-3 py-6 text-center text-[13px] text-text-2">Tudo em dia por aqui.</div>
                    )}
                    {pendingOrders.length > 0 && (
                      <div className="mb-1">
                        <div className="px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-text-2">
                          Pedidos pendentes ({pendingOrders.length})
                        </div>
                        {pendingOrders.slice(0, 4).map((o) => (
                          <button
                            key={o.id}
                            onClick={() => {
                              setOpenOrderId(o.id);
                              setNotifOpen(false);
                              navigate('/admin/orders');
                            }}
                            className="flex w-full cursor-pointer items-center gap-2.5 rounded-xs px-2.5 py-2 text-left text-[13.5px] font-semibold text-text transition-colors hover:bg-card-2"
                          >
                            <ShoppingBag size={15} strokeWidth={2} className="shrink-0 text-pink" />
                            {o.displayId} · {o.client}
                          </button>
                        ))}
                      </div>
                    )}
                    {lowStockProducts.length > 0 && (
                      <div>
                        <div className="px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-text-2">
                          Estoque baixo ({lowStockProducts.length})
                        </div>
                        {lowStockProducts.slice(0, 4).map((p) => (
                          <button
                            key={p.id}
                            onClick={() => {
                              setNotifOpen(false);
                              navigate('/admin/products');
                            }}
                            className="flex w-full cursor-pointer items-center gap-2.5 rounded-xs px-2.5 py-2 text-left text-[13.5px] font-semibold text-text transition-colors hover:bg-card-2"
                          >
                            <AlertTriangle size={15} strokeWidth={2} className="shrink-0 text-red" />
                            {p.name} · {p.stock} un.
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}

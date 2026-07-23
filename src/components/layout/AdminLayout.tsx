import {
  ClipboardCheck,
  KeyRound,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Menu,
  Package,
  Search,
  Settings,
  ShoppingBag,
  Store,
  Truck,
  Users,
  BarChart3,
  X,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api';
import { NotificationBell } from '../notifications/NotificationBell';
import { Spinner } from '../ui/Skeleton';
import { useAdminStore } from '../../store/adminStore';
import { useAuthStore } from '../../store/authStore';
import { useOrderStore } from '../../store/orderStore';
import { useProductsStore } from '../../store/productsStore';

type NavItem = { to: string; label: string; icon: LucideIcon; badgeKey?: 'pending' | 'passwordResets' };

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Operação',
    items: [
      { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/admin/orders', label: 'Pedidos', icon: ShoppingBag, badgeKey: 'pending' as const },
      { to: '/admin/prepare', label: 'Preparar para amanhã', icon: ClipboardCheck },
      { to: '/admin/pickup', label: 'Retirada', icon: Truck },
    ],
  },
  {
    label: 'Catálogo',
    items: [
      { to: '/admin/products', label: 'Produtos', icon: Package },
      { to: '/admin/categories', label: 'Categorias', icon: LayoutGrid },
      { to: '/admin/clients', label: 'Clientes', icon: Users },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { to: '/admin/reports', label: 'Relatórios', icon: BarChart3 },
      { to: '/admin/password-resets', label: 'Recuperação de senha', icon: KeyRound, badgeKey: 'passwordResets' as const },
      { to: '/admin/settings', label: 'Configurações', icon: Settings },
    ],
  },
];

const TITLES: Record<string, [string, string]> = {
  '/admin/dashboard': ['Dashboard', 'Visão geral da sua loja hoje'],
  '/admin/products': ['Produtos', 'Gerencie o cardápio de doces'],
  '/admin/categories': ['Categorias', 'Organize os tipos de doce'],
  '/admin/orders': ['Pedidos', 'Acompanhe e atualize os pedidos'],
  '/admin/clients': ['Clientes', 'Quem mais ama seus doces'],
  '/admin/reports': ['Relatórios', 'Métricas e desempenho'],
  '/admin/prepare': ['Preparar para amanhã', 'Tudo que precisa ser separado para a retirada'],
  '/admin/pickup': ['Retirada', 'Localize o pedido e entregue na hora'],
  '/admin/password-resets': ['Recuperação de senha', 'Ajude clientes que esqueceram a senha'],
  '/admin/settings': ['Configurações', 'Preferências da loja'],
};

const navItemClass = ({ isActive }: { isActive: boolean }) =>
  [
    'flex items-center gap-3 rounded-sm px-3.5 py-3 text-sm font-semibold transition-all duration-200',
    isActive
      ? 'bg-gradient-to-br from-pink/20 to-purple/15 text-text shadow-[inset_3px_0_0_#FF4FA0]'
      : 'text-text-2 hover:text-text',
  ].join(' ');

function AdminNavList({
  pendingOrders,
  pendingResets,
  customerName,
  onNavigate,
  onLogout,
}: {
  pendingOrders: number;
  pendingResets: number;
  customerName: string | undefined;
  onNavigate?: () => void;
  onLogout: () => void;
}) {
  return (
    <>
      <div className="mb-4 flex items-center gap-2.5 rounded-md bg-card-2/60 px-3.5 py-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-card-2">
          <Users size={16} strokeWidth={2} className="text-lime" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-bold">{customerName ?? 'Você'}</div>
          <div className="text-[11px] text-text-2">Administradora</div>
        </div>
      </div>

      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="mb-4 last:mb-0">
          <div className="mb-1.5 px-3.5 text-[11px] font-bold uppercase tracking-wide text-text-2">{group.label}</div>
          <nav className="flex flex-col gap-[3px]">
            {group.items.map((item) => {
              const Icon = item.icon;
              const badge =
                (item.badgeKey === 'pending' && pendingOrders > 0 && pendingOrders) ||
                (item.badgeKey === 'passwordResets' && pendingResets > 0 && pendingResets) ||
                null;
              return (
                <NavLink key={item.to} to={item.to} onClick={onNavigate} className={navItemClass}>
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
        </div>
      ))}

      <div>
        <div className="mb-1.5 px-3.5 text-[11px] font-bold uppercase tracking-wide text-text-2">Conta</div>
        <nav className="flex flex-col gap-[3px]">
          <Link to="/home" onClick={onNavigate} className={navItemClass({ isActive: false })}>
            <Store size={18} strokeWidth={2} />
            Voltar para loja
          </Link>
          <button
            onClick={onLogout}
            className="flex cursor-pointer items-center gap-3 rounded-sm px-3.5 py-3 text-left text-sm font-semibold text-red transition-colors duration-200 hover:bg-red/[0.08]"
          >
            <LogOut size={18} strokeWidth={2} />
            Sair
          </button>
        </nav>
      </div>
    </>
  );
}

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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const pendingOrders = useMemo(() => orders.filter((o) => o.status === 'pending'), [orders]);
  const [pendingResets, setPendingResets] = useState<{ id: string; phone: string; customerName: string | null }[]>([]);

  useEffect(() => {
    fetchAll();
    fetchProducts();
    api
      .getPasswordResetRequests()
      .then((reqs) => setPendingResets(reqs.filter((r) => r.status === 'pending')))
      .catch(() => setPendingResets([]));
  }, [fetchAll, fetchProducts, location.pathname]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

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

  return (
    <div className="dc-app-bg min-h-dvh px-5 py-6 lg:px-8 lg:py-7">
      <div className="mx-auto flex max-w-[1400px] items-start gap-5">
        <aside className="sticky top-6 hidden w-[250px] shrink-0 rounded-xl border border-white/[0.06] bg-surface/60 p-4 backdrop-blur-lg print:hidden lg:block">
          <Link to="/home" className="flex items-center gap-3 px-2 pb-5 pt-1.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-gradient-to-br from-pink to-purple">
              <ShoppingBag size={20} strokeWidth={2.2} className="text-text" />
            </div>
            <div>
              <div className="font-display text-[15px] font-bold">Double Candy</div>
              <div className="text-[11px] text-text-2">Painel do vendedor</div>
            </div>
          </Link>

          <AdminNavList
            pendingOrders={pendingOrders.length}
            pendingResets={pendingResets.length}
            customerName={customer?.name}
            onLogout={handleLogout}
          />
        </aside>

        {mobileNavOpen && (
          <>
            <div
              onClick={() => setMobileNavOpen(false)}
              className="animate-dc-fade fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <div className="dc-scroll animate-dc-drawer-in-left fixed inset-y-0 left-0 z-[75] w-[280px] max-w-[85vw] overflow-y-auto border-r border-white/[0.08] bg-surface p-4 shadow-[24px_0_60px_-10px_rgba(0,0,0,0.6)] lg:hidden">
              <div className="mb-5 flex items-center justify-between px-1 pt-1.5">
                <Link to="/home" onClick={() => setMobileNavOpen(false)} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-gradient-to-br from-pink to-purple">
                    <ShoppingBag size={20} strokeWidth={2.2} className="text-text" />
                  </div>
                  <div>
                    <div className="font-display text-[15px] font-bold">Double Candy</div>
                    <div className="text-[11px] text-text-2">Painel do vendedor</div>
                  </div>
                </Link>
                <button
                  onClick={() => setMobileNavOpen(false)}
                  aria-label="Fechar menu"
                  className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xs border-none bg-card-2 text-text outline-none focus-visible:ring-2 focus-visible:ring-pink-light"
                >
                  <X size={18} strokeWidth={2.4} />
                </button>
              </div>

              <AdminNavList
                pendingOrders={pendingOrders.length}
                pendingResets={pendingResets.length}
                customerName={customer?.name}
                onNavigate={() => setMobileNavOpen(false)}
                onLogout={handleLogout}
              />
            </div>
          </>
        )}

        <main className="min-w-0 flex-1">
          <div className="mb-[22px] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileNavOpen(true)}
                aria-label="Abrir menu"
                className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-sm border border-white/[0.08] bg-surface text-text outline-none transition-colors hover:bg-card-2 focus-visible:ring-2 focus-visible:ring-pink-light lg:hidden"
              >
                <Menu size={20} strokeWidth={2.2} />
              </button>
              <div>
                <h1 className="font-display text-2xl font-bold tracking-[-0.5px] lg:text-[26px]">{title}</h1>
                <p className="mt-1 text-sm text-text-2">{subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 print:hidden">
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
                  <div className="dc-scroll absolute right-0 top-[54px] z-30 max-h-[360px] w-[320px] max-w-[92vw] overflow-y-auto rounded-md border border-white/[0.08] bg-surface p-2 shadow-[0_24px_50px_-16px_rgba(0,0,0,0.6)]">
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

              <NotificationBell />
            </div>
          </div>

          <Suspense
            fallback={
              <div className="flex min-h-[50vh] items-center justify-center">
                <Spinner size={32} />
              </div>
            }
          >
            {children ?? <Outlet />}
          </Suspense>
        </main>
      </div>
    </div>
  );
}

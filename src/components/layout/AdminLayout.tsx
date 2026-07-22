import {
  Bell,
  ClipboardCheck,
  LayoutDashboard,
  LayoutGrid,
  Package,
  Search,
  Settings,
  ShoppingBag,
  Truck,
  Users,
  BarChart3,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import { useOrderStore } from '../../store/orderStore';

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
  const [title, subtitle] = TITLES[location.pathname] ?? ['', ''];
  const orders = useOrderStore((s) => s.orders);
  const fetchAll = useOrderStore((s) => s.fetchAll);
  const pendingCount = useMemo(() => orders.filter((o) => o.status === 'pending').length, [orders]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

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
              const badge = item.badgeKey === 'pending' && pendingCount > 0 ? pendingCount : null;
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
              <div>
                <div className="text-[13px] font-bold">Ana (você)</div>
                <div className="text-[11px] text-text-2">Administradora</div>
              </div>
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
              <div className="hidden h-[46px] w-60 items-center gap-2.5 rounded-sm border border-white/[0.06] bg-surface px-3.5 sm:flex">
                <Search size={18} strokeWidth={2} className="shrink-0 text-text-2" />
                <input
                  placeholder="Buscar..."
                  className="min-w-0 flex-1 bg-transparent font-body text-sm text-text outline-none placeholder:text-text-3"
                />
              </div>
              <button className="relative flex h-[46px] w-[46px] shrink-0 cursor-pointer items-center justify-center rounded-sm border border-white/[0.06] bg-surface text-text">
                <Bell size={20} strokeWidth={2} />
                <span className="absolute right-3 top-2.5 h-2 w-2 rounded-full border-2 border-surface bg-red" />
              </button>
            </div>
          </div>

          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}

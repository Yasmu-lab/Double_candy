import {
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  DollarSign,
  Package,
  PackageCheck,
  ShoppingBag,
  Star,
  TrendingUp,
  TriangleAlert,
  User,
} from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart } from '../../components/charts/BarChart';
import { DonutChart } from '../../components/charts/DonutChart';
import { LineChart } from '../../components/charts/LineChart';
import { KpiCard } from '../../components/admin/KpiCard';
import { StatusBadge } from '../../components/ui/Badge';
import { PREP_ITEMS } from '../../data/prepItems';
import { formatBRL } from '../../lib/format';
import { useAdminStore } from '../../store/adminStore';
import { useOrderStore } from '../../store/orderStore';
import { useProductsStore } from '../../store/productsStore';

const LOW_STOCK_THRESHOLD = 8;

const REVENUE_WEEK = [180, 240, 210, 320, 290, 410, 380];
const REVENUE_DAYS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

const BEST_SELLERS = [
  { name: 'Choc. Recheado', value: 92, color: '#FF4FA0' },
  { name: 'Pirulito', value: 78, color: '#9B6BFF' },
  { name: 'Trufa Morango', value: 64, color: '#FFA347' },
  { name: 'Bala Rainbow', value: 51, color: '#C6FF4D' },
  { name: 'Marshmallow', value: 37, color: '#FF5C6C' },
];

const PAY_LEGEND = [
  { name: 'Pix', pct: 52, color: '#FF4FA0' },
  { name: 'Cartão', pct: 30, color: '#9B6BFF' },
  { name: 'Dinheiro', pct: 18, color: '#C6FF4D' },
];

export function Dashboard() {
  const navigate = useNavigate();
  const orders = useOrderStore((s) => s.orders);
  const deliveredToday = useOrderStore((s) => s.deliveredToday);
  const products = useProductsStore((s) => s.products);
  const prepSeparated = useAdminStore((s) => s.prepSeparated);

  const pendingCount = useMemo(() => orders.filter((o) => o.status === 'Reservado').length, [orders]);
  const lowStockCount = useMemo(
    () => products.filter((p) => p.stock <= LOW_STOCK_THRESHOLD).length,
    [products],
  );
  const prepTotalUnits = useMemo(() => PREP_ITEMS.reduce((s, p) => s + p.qty, 0), []);
  const sepUnits = useMemo(
    () => PREP_ITEMS.filter((p) => prepSeparated[p.key]).reduce((s, p) => s + p.qty, 0),
    [prepSeparated],
  );
  const recentOrders = useMemo(() => orders.slice(0, 4), [orders]);

  const kpis = [
    { icon: <ShoppingBag size={20} strokeWidth={2} color="#FF4FA0" />, iconBg: 'rgba(255,79,160,.16)', value: '42', label: 'Pedidos hoje', trend: '+12%', up: true },
    { icon: <CalendarDays size={20} strokeWidth={2} color="#9B6BFF" />, iconBg: 'rgba(155,107,255,.18)', value: '18', label: 'Pedidos amanhã', trend: 'reservas', up: true },
    { icon: <DollarSign size={20} strokeWidth={2} color="#C6FF4D" />, iconBg: 'rgba(198,255,77,.16)', value: 'R$ 486', label: 'Receita hoje', trend: '+8%', up: true },
    { icon: <TrendingUp size={20} strokeWidth={2} color="#FFA347" />, iconBg: 'rgba(255,163,71,.16)', value: 'R$ 8.240', label: 'Receita do mês', trend: '+18%', up: true },
    { icon: <CircleDollarSign size={20} strokeWidth={2} color="#FF5C6C" />, iconBg: 'rgba(255,92,108,.16)', value: 'R$ 11,60', label: 'Ticket médio', trend: '-2%', up: false },
    { icon: <Package size={20} strokeWidth={2} color="#9B6BFF" />, iconBg: 'rgba(155,107,255,.18)', value: '148', label: 'Produtos vendidos', trend: '+21%', up: true },
    { icon: <PackageCheck size={20} strokeWidth={2} color="#C6FF4D" />, iconBg: 'rgba(198,255,77,.16)', value: `${sepUnits}/${prepTotalUnits}`, label: 'Produtos separados', trend: 'ao vivo', up: true },
    { icon: <Clock size={20} strokeWidth={2} color="#FFA347" />, iconBg: 'rgba(255,163,71,.16)', value: String(pendingCount), label: 'Pedidos pendentes', trend: 'ao vivo', up: false },
    { icon: <CheckCircle2 size={20} strokeWidth={2} color="#C6FF4D" />, iconBg: 'rgba(198,255,77,.16)', value: String(deliveredToday), label: 'Pedidos entregues', trend: 'ao vivo', up: true },
    { icon: <Star size={20} strokeWidth={0} fill="#FF4FA0" />, iconBg: 'rgba(255,79,160,.16)', value: 'Choc. Recheado', label: 'Produto mais vendido', trend: '92 unidades', up: true, small: true },
    { icon: <User size={20} strokeWidth={2} color="#9B6BFF" />, iconBg: 'rgba(155,107,255,.18)', value: 'Beatriz Rocha', label: 'Cliente que mais comprou', trend: 'R$ 198,50', up: true, small: true },
    { icon: <TriangleAlert size={20} strokeWidth={2} color="#FF5C6C" />, iconBg: 'rgba(255,92,108,.16)', value: `${lowStockCount} itens`, label: 'Estoque baixo', trend: 'atenção', up: false, danger: true },
  ];

  return (
    <div className="animate-dc-fade-up">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        {kpis.map((k, i) => (
          <KpiCard key={i} {...k} />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
        <div className="rounded-xl border border-white/[0.06] bg-surface p-[22px]">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="font-display text-[17px] font-bold">Receita da semana</div>
              <div className="mt-0.5 text-[13px] text-text-2">Últimos 7 dias</div>
            </div>
            <span className="rounded-[10px] bg-card px-3 py-1.5 text-xs text-text-2">Semana</span>
          </div>
          <LineChart data={REVENUE_WEEK} labels={REVENUE_DAYS} />
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-surface p-[22px]">
          <div className="font-display text-[17px] font-bold">Pagamentos</div>
          <div className="mb-4 mt-0.5 text-[13px] text-text-2">Distribuição</div>
          <div className="flex justify-center">
            <DonutChart
              segments={PAY_LEGEND.map((l) => ({ value: l.pct, color: l.color }))}
              centerValue="148"
              centerLabel="pedidos"
            />
          </div>
          <div className="mt-4 flex flex-col gap-2.5">
            {PAY_LEGEND.map((l) => (
              <div key={l.name} className="flex items-center gap-2.5">
                <span className="h-[11px] w-[11px] rounded-[4px]" style={{ background: l.color }} />
                <span className="flex-1 text-[13px] text-text-2">{l.name}</span>
                <span className="text-[13px] font-bold">{l.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-white/[0.06] bg-surface p-[22px]">
          <div className="mb-[18px] font-display text-[17px] font-bold">Mais vendidos</div>
          <BarChart items={BEST_SELLERS} />
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-surface p-[22px]">
          <div className="mb-3.5 flex items-center justify-between">
            <div className="font-display text-[17px] font-bold">Pedidos recentes</div>
            <button onClick={() => navigate('/admin/orders')} className="cursor-pointer text-[13px] font-semibold text-purple">
              Ver todos
            </button>
          </div>
          {recentOrders.map((o) => (
            <div key={o.id} className="flex items-center gap-3 border-b border-white/5 py-2.5 last:border-b-0">
              <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] bg-card font-display text-[13px] font-bold text-purple">
                {o.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13.5px] font-bold">{o.client}</div>
                <div className="text-xs text-text-2">
                  {o.id} · {o.lines.reduce((s, l) => s + l.qty, 0)} itens
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-sm font-bold text-pink">{formatBRL(o.total)}</div>
                <div className="mt-1">
                  <StatusBadge status={o.status} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

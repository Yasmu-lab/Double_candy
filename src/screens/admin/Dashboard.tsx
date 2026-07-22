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
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart } from '../../components/charts/BarChart';
import { DonutChart } from '../../components/charts/DonutChart';
import { LineChart } from '../../components/charts/LineChart';
import { KpiCard } from '../../components/admin/KpiCard';
import { StatusBadge } from '../../components/ui/Badge';
import { api } from '../../lib/api';
import { formatBRLCents } from '../../lib/format';
import type { OrderStatus } from '../../types';

type DashboardData = Awaited<ReturnType<typeof api.getDashboard>>;

const REVENUE_DAYS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

export function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getDashboard()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  if (error) {
    return <div className="rounded-xl border border-red/30 bg-red/[0.08] p-6 text-sm text-red">Erro ao carregar: {error}</div>;
  }
  if (!data) {
    return <div className="py-10 text-center text-sm text-text-2">Carregando dashboard...</div>;
  }

  const kpis = [
    { icon: <ShoppingBag size={20} strokeWidth={2} color="#FF4FA0" />, iconBg: 'rgba(255,79,160,.16)', value: String(data.ordersToday), label: 'Pedidos hoje', trend: `${data.ordersTodayTrend >= 0 ? '+' : ''}${data.ordersTodayTrend}%`, up: data.ordersTodayTrend >= 0 },
    { icon: <CalendarDays size={20} strokeWidth={2} color="#9B6BFF" />, iconBg: 'rgba(155,107,255,.18)', value: String(data.ordersTomorrow), label: 'Pedidos amanhã', trend: 'reservas', up: true },
    { icon: <DollarSign size={20} strokeWidth={2} color="#C6FF4D" />, iconBg: 'rgba(198,255,77,.16)', value: formatBRLCents(data.revenueTodayCents), label: 'Receita hoje', trend: `${data.revenueTodayTrend >= 0 ? '+' : ''}${data.revenueTodayTrend}%`, up: data.revenueTodayTrend >= 0 },
    { icon: <TrendingUp size={20} strokeWidth={2} color="#FFA347" />, iconBg: 'rgba(255,163,71,.16)', value: formatBRLCents(data.revenueMonthCents), label: 'Receita do mês', trend: `${data.revenueMonthTrend >= 0 ? '+' : ''}${data.revenueMonthTrend}%`, up: data.revenueMonthTrend >= 0 },
    { icon: <CircleDollarSign size={20} strokeWidth={2} color="#FF5C6C" />, iconBg: 'rgba(255,92,108,.16)', value: formatBRLCents(data.avgTicketCents), label: 'Ticket médio', trend: `${data.avgTicketTrend >= 0 ? '+' : ''}${data.avgTicketTrend}%`, up: data.avgTicketTrend >= 0 },
    { icon: <Package size={20} strokeWidth={2} color="#9B6BFF" />, iconBg: 'rgba(155,107,255,.18)', value: String(data.productsSoldMonth), label: 'Produtos vendidos', trend: `${data.productsSoldTrend >= 0 ? '+' : ''}${data.productsSoldTrend}%`, up: data.productsSoldTrend >= 0 },
    { icon: <PackageCheck size={20} strokeWidth={2} color="#C6FF4D" />, iconBg: 'rgba(198,255,77,.16)', value: String(data.pendingCount), label: 'Pedidos pendentes', trend: 'ao vivo', up: false },
    { icon: <CheckCircle2 size={20} strokeWidth={2} color="#C6FF4D" />, iconBg: 'rgba(198,255,77,.16)', value: String(data.deliveredToday), label: 'Entregues hoje', trend: 'ao vivo', up: true },
    { icon: <Star size={20} strokeWidth={0} fill="#FF4FA0" />, iconBg: 'rgba(255,79,160,.16)', value: data.bestSellerName, label: 'Produto mais vendido', trend: `${data.bestSellerQty} unidades`, up: true, small: true },
    { icon: <User size={20} strokeWidth={2} color="#9B6BFF" />, iconBg: 'rgba(155,107,255,.18)', value: data.topClientName, label: 'Cliente que mais comprou', trend: formatBRLCents(data.topClientSpentCents), up: true, small: true },
    { icon: <TriangleAlert size={20} strokeWidth={2} color="#FF5C6C" />, iconBg: 'rgba(255,92,108,.16)', value: `${data.lowStockCount} itens`, label: 'Estoque baixo', trend: 'atenção', up: false, danger: true },
    { icon: <Clock size={20} strokeWidth={2} color="#FFA347" />, iconBg: 'rgba(255,163,71,.16)', value: String(data.deliveredTotal), label: 'Entregues (total)', trend: 'ao vivo', up: true },
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
          <LineChart data={data.weeklyRevenueCents.map((c) => c / 100)} labels={REVENUE_DAYS} />
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-surface p-[22px]">
          <div className="font-display text-[17px] font-bold">Pagamentos</div>
          <div className="mb-4 mt-0.5 text-[13px] text-text-2">Distribuição</div>
          <div className="flex justify-center">
            <DonutChart
              segments={[
                { value: data.paymentDistribution.pix, color: '#FF4FA0' },
                { value: data.paymentDistribution.cash, color: '#C6FF4D' },
              ]}
              centerValue={String(data.paymentDistribution.pixCount + data.paymentDistribution.cashCount)}
              centerLabel="pedidos"
            />
          </div>
          <div className="mt-4 flex flex-col gap-2.5">
            {[
              { name: 'Pix', pct: data.paymentDistribution.pix, color: '#FF4FA0' },
              { name: 'Dinheiro', pct: data.paymentDistribution.cash, color: '#C6FF4D' },
            ].map((l) => (
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
          {data.bestSellers.length === 0 ? (
            <div className="text-sm text-text-2">Sem vendas ainda.</div>
          ) : (
            <BarChart
              items={data.bestSellers.map((b, i) => ({
                name: b.name,
                value: b.qty,
                color: ['#FF4FA0', '#9B6BFF', '#FFA347', '#C6FF4D', '#FF5C6C'][i % 5],
              }))}
              max={Math.max(...data.bestSellers.map((b) => b.qty), 1)}
            />
          )}
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-surface p-[22px]">
          <div className="mb-3.5 flex items-center justify-between">
            <div className="font-display text-[17px] font-bold">Pedidos recentes</div>
            <button onClick={() => navigate('/admin/orders')} className="cursor-pointer text-[13px] font-semibold text-purple">
              Ver todos
            </button>
          </div>
          {data.recentOrders.length === 0 ? (
            <div className="text-sm text-text-2">Nenhum pedido ainda.</div>
          ) : (
            data.recentOrders.map((o) => (
              <div key={o.id} className="flex items-center gap-3 border-b border-white/5 py-2.5 last:border-b-0">
                <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] bg-card font-display text-[13px] font-bold text-purple">
                  {o.client.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-bold">{o.client}</div>
                  <div className="text-xs text-text-2">
                    {o.displayId} · {o.items} itens
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-sm font-bold text-pink">{formatBRLCents(o.totalCents)}</div>
                  <div className="mt-1">
                    <StatusBadge status={o.status as OrderStatus} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

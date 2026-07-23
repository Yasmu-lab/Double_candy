import { BadgeDollarSign, Banknote, CircleDollarSign, Star, TrendingDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { MonthlyBarChart } from '../../components/charts/MonthlyBarChart';
import { Skeleton } from '../../components/ui/Skeleton';
import { api } from '../../lib/api';
import { formatBRLCents } from '../../lib/format';

type ReportsData = Awaited<ReturnType<typeof api.getReports>>;

export function Reports() {
  const [data, setData] = useState<ReportsData | null>(null);

  useEffect(() => {
    api.getReports().then(setData);
  }, []);

  if (!data) {
    return (
      <div className="animate-dc-fade-up">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="rounded-lg border border-white/[0.06] bg-surface p-5">
              <div className="mb-3.5 flex items-center gap-2.5">
                <Skeleton className="h-[38px] w-[38px] rounded-xs" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-7 w-28" />
              <Skeleton className="mt-2 h-3.5 w-20" />
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl border border-white/[0.06] bg-surface p-[22px]">
          <Skeleton className="mb-5 h-5 w-40" />
          <Skeleton className="h-[180px] w-full" />
        </div>
      </div>
    );
  }

  const cards = [
    { icon: <Banknote size={18} strokeWidth={2} color="#C6FF4D" />, iconBg: 'rgba(198,255,77,.16)', label: 'Receita total', value: formatBRLCents(data.revenueTotalCents), trend: `${data.revenueMonthTrend >= 0 ? '+' : ''}${data.revenueMonthTrend}% vs. mês anterior`, up: data.revenueMonthTrend >= 0 },
    { icon: <Star size={18} strokeWidth={0} fill="#FF4FA0" />, iconBg: 'rgba(255,79,160,.16)', label: 'Produtos vendidos', value: String(data.productsSoldTotal), trend: 'no total', up: true },
    { icon: <CircleDollarSign size={18} strokeWidth={2} color="#9B6BFF" />, iconBg: 'rgba(155,107,255,.18)', label: 'Ticket médio', value: formatBRLCents(data.avgTicketCents), trend: 'por pedido', up: true },
    { icon: <Star size={18} strokeWidth={0} fill="#FFA347" />, iconBg: 'rgba(255,163,71,.16)', label: 'Mais vendido', value: data.bestSeller?.name ?? '—', trend: data.bestSeller ? `${data.bestSeller.qty} unidades` : '', up: true },
    { icon: <TrendingDown size={18} strokeWidth={2} color="#FF5C6C" />, iconBg: 'rgba(255,92,108,.16)', label: 'Menos vendido', value: data.worstSeller?.name ?? '—', trend: data.worstSeller ? `${data.worstSeller.qty} unidades` : '', up: false },
    { icon: <BadgeDollarSign size={18} strokeWidth={2} color="#C6FF4D" />, iconBg: 'rgba(198,255,77,.16)', label: 'Pagamento top', value: data.topPayment.method === 'pix' ? 'Pix' : 'Dinheiro', trend: `${data.topPayment.pct}% dos pedidos`, up: true },
  ];

  return (
    <div className="animate-dc-fade-up">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((r) => (
          <div key={r.label} className="rounded-lg border border-white/[0.06] bg-surface p-5">
            <div className="mb-3.5 flex items-center gap-2.5">
              <span className="flex h-[38px] w-[38px] items-center justify-center rounded-xs" style={{ background: r.iconBg }}>
                {r.icon}
              </span>
              <span className="text-sm font-semibold text-text-2">{r.label}</span>
            </div>
            <div className="font-display text-2xl font-bold tracking-[-0.5px]">{r.value}</div>
            <div className={`mt-2 text-[12.5px] font-semibold ${r.up ? 'text-lime' : 'text-red'}`}>{r.trend}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-white/[0.06] bg-surface p-[22px]">
        <div className="mb-5 font-display text-[17px] font-bold">Pedidos por período</div>
        <MonthlyBarChart
          data={data.monthly.map((m) => m.count)}
          labels={data.monthly.map((m) => m.label)}
          max={Math.max(...data.monthly.map((m) => m.count), 1)}
        />
      </div>
    </div>
  );
}

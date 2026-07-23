import {
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  DollarSign,
  Download,
  FileDown,
  Package,
  PackageCheck,
  ShoppingBag,
  Star,
  TrendingUp,
  TriangleAlert,
  User,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart } from '../../components/charts/BarChart';
import { DonutChart } from '../../components/charts/DonutChart';
import { LineChart } from '../../components/charts/LineChart';
import { KpiCard } from '../../components/admin/KpiCard';
import { Chip } from '../../components/ui/Chip';
import { StatusBadge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { api, type DashboardPeriod } from '../../lib/api';
import { formatBRLCents } from '../../lib/format';
import { useUiStore } from '../../store/uiStore';
import type { OrderStatus } from '../../types';

type DashboardData = Awaited<ReturnType<typeof api.getDashboard>>;

const PERIOD_FILTERS: { key: DashboardPeriod; label: string }[] = [
  { key: 'today', label: 'Hoje' },
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mês' },
  { key: 'year', label: 'Ano' },
  { key: 'custom', label: 'Personalizado' },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function csvCell(v: string | number) {
  const s = String(v);
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function Dashboard() {
  const navigate = useNavigate();
  const showToast = useUiStore((s) => s.showToast);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<DashboardPeriod>('month');
  const [customFrom, setCustomFrom] = useState(todayIso());
  const [customTo, setCustomTo] = useState(todayIso());

  useEffect(() => {
    if (period === 'custom' && (!customFrom || !customTo || customFrom > customTo)) return;
    setError(null);
    api
      .getDashboard(period === 'custom' ? { period, from: customFrom, to: customTo } : { period })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [period, customFrom, customTo]);

  const handleExportPdf = () => {
    if (!data) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Dashboard — Double Candy', 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`Período: ${data.periodLabel} · Gerado em ${new Date().toLocaleString('pt-BR')}`, 14, 24);
    doc.setTextColor(0);

    let y = 36;
    doc.setFontSize(12);
    doc.text('Indicadores do período', 14, y);
    y += 8;
    doc.setFontSize(10);
    const rows: [string, string][] = [
      ['Receita do período', formatBRLCents(data.revenuePeriodCents)],
      ['Produtos vendidos', String(data.productsSoldPeriod)],
      ['Ticket médio', formatBRLCents(data.avgTicketCents)],
      ['Produto mais vendido', `${data.bestSellerName} (${data.bestSellerQty} un)`],
      ['Cliente que mais comprou', `${data.topClientName} (${formatBRLCents(data.topClientSpentCents)})`],
      ['Pedidos hoje', String(data.ordersToday)],
      ['Pedidos amanhã', String(data.ordersTomorrow)],
      ['Receita hoje', formatBRLCents(data.revenueTodayCents)],
      ['Pedidos pendentes', String(data.pendingCount)],
      ['Entregues hoje', String(data.deliveredToday)],
      ['Estoque baixo', `${data.lowStockCount} itens`],
    ];
    for (const [label, value] of rows) {
      doc.text(label, 14, y);
      doc.text(value, 120, y);
      y += 7;
    }

    y += 6;
    doc.setFontSize(12);
    doc.text('Mais vendidos no período', 14, y);
    y += 8;
    doc.setFontSize(10);
    if (data.bestSellers.length === 0) {
      doc.text('Sem vendas no período.', 14, y);
      y += 7;
    }
    for (const b of data.bestSellers) {
      doc.text(b.name, 14, y);
      doc.text(`${b.qty} un`, 120, y);
      y += 7;
    }

    doc.save(`dashboard-${period}-${new Date().toISOString().slice(0, 10)}.pdf`);
    showToast('PDF gerado com sucesso.');
  };

  const handleExportExcel = () => {
    if (!data) return;
    const lines: string[] = [];
    lines.push(`Dashboard Double Candy;Período: ${data.periodLabel}`);
    lines.push('');
    lines.push('Indicador;Valor');
    lines.push(`Receita do período;${formatBRLCents(data.revenuePeriodCents)}`);
    lines.push(`Produtos vendidos;${data.productsSoldPeriod}`);
    lines.push(`Ticket médio;${formatBRLCents(data.avgTicketCents)}`);
    lines.push(`Produto mais vendido;${csvCell(data.bestSellerName)} (${data.bestSellerQty} un)`);
    lines.push(`Cliente que mais comprou;${csvCell(data.topClientName)} (${formatBRLCents(data.topClientSpentCents)})`);
    lines.push(`Pedidos hoje;${data.ordersToday}`);
    lines.push(`Pedidos amanhã;${data.ordersTomorrow}`);
    lines.push(`Receita hoje;${formatBRLCents(data.revenueTodayCents)}`);
    lines.push(`Pedidos pendentes;${data.pendingCount}`);
    lines.push(`Entregues hoje;${data.deliveredToday}`);
    lines.push(`Entregues (total);${data.deliveredTotal}`);
    lines.push(`Estoque baixo;${data.lowStockCount} itens`);
    lines.push('');
    lines.push('Mais vendidos no período');
    lines.push('Produto;Quantidade');
    for (const b of data.bestSellers) lines.push(`${csvCell(b.name)};${b.qty}`);
    lines.push('');
    lines.push('Pedidos recentes');
    lines.push('Pedido;Cliente;Itens;Total;Status');
    for (const o of data.recentOrders) lines.push(`${o.displayId};${csvCell(o.client)};${o.items};${formatBRLCents(o.totalCents)};${o.status}`);

    const csv = '﻿' + lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Planilha exportada — abre direto no Excel.');
  };

  if (error) {
    return <div className="rounded-xl border border-red/30 bg-red/[0.08] p-6 text-sm text-red">Erro ao carregar: {error}</div>;
  }
  if (!data) {
    return (
      <div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="rounded-lg border border-white/[0.06] bg-surface p-[18px]">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-[42px] w-[42px] rounded-[13px]" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
              <Skeleton className="mt-3.5 h-6 w-20" />
              <Skeleton className="mt-1.5 h-3.5 w-24" />
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
          <div className="rounded-xl border border-white/[0.06] bg-surface p-[22px]">
            <Skeleton className="mb-5 h-5 w-32" />
            <Skeleton className="h-[200px] w-full" />
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-surface p-[22px]">
            <Skeleton className="mb-4 h-5 w-24" />
            <div className="flex justify-center">
              <Skeleton className="h-[150px] w-[150px] rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const liveKpis = [
    { icon: <ShoppingBag size={20} strokeWidth={2} color="#FF4FA0" />, iconBg: 'rgba(255,79,160,.16)', value: String(data.ordersToday), label: 'Pedidos hoje', trend: `${data.ordersTodayTrend >= 0 ? '+' : ''}${data.ordersTodayTrend}%`, up: data.ordersTodayTrend >= 0 },
    { icon: <CalendarDays size={20} strokeWidth={2} color="#9B6BFF" />, iconBg: 'rgba(155,107,255,.18)', value: String(data.ordersTomorrow), label: 'Pedidos amanhã', trend: 'reservas', up: true },
    { icon: <DollarSign size={20} strokeWidth={2} color="#C6FF4D" />, iconBg: 'rgba(198,255,77,.16)', value: formatBRLCents(data.revenueTodayCents), label: 'Receita hoje', trend: `${data.revenueTodayTrend >= 0 ? '+' : ''}${data.revenueTodayTrend}%`, up: data.revenueTodayTrend >= 0 },
    { icon: <PackageCheck size={20} strokeWidth={2} color="#C6FF4D" />, iconBg: 'rgba(198,255,77,.16)', value: String(data.pendingCount), label: 'Pedidos pendentes', trend: 'ao vivo', up: false },
    { icon: <CheckCircle2 size={20} strokeWidth={2} color="#C6FF4D" />, iconBg: 'rgba(198,255,77,.16)', value: String(data.deliveredToday), label: 'Entregues hoje', trend: 'ao vivo', up: true },
    { icon: <Clock size={20} strokeWidth={2} color="#FFA347" />, iconBg: 'rgba(255,163,71,.16)', value: String(data.deliveredTotal), label: 'Entregues (total)', trend: 'ao vivo', up: true },
    { icon: <TriangleAlert size={20} strokeWidth={2} color="#FF5C6C" />, iconBg: 'rgba(255,92,108,.16)', value: `${data.lowStockCount} itens`, label: 'Estoque baixo', trend: 'atenção', up: false, danger: true },
  ];

  const periodKpis = [
    { icon: <TrendingUp size={20} strokeWidth={2} color="#FFA347" />, iconBg: 'rgba(255,163,71,.16)', value: formatBRLCents(data.revenuePeriodCents), label: `Receita (${data.periodLabel})`, trend: `${data.revenuePeriodTrend >= 0 ? '+' : ''}${data.revenuePeriodTrend}%`, up: data.revenuePeriodTrend >= 0 },
    { icon: <Package size={20} strokeWidth={2} color="#9B6BFF" />, iconBg: 'rgba(155,107,255,.18)', value: String(data.productsSoldPeriod), label: 'Produtos vendidos', trend: `${data.productsSoldTrend >= 0 ? '+' : ''}${data.productsSoldTrend}%`, up: data.productsSoldTrend >= 0 },
    { icon: <CircleDollarSign size={20} strokeWidth={2} color="#FF5C6C" />, iconBg: 'rgba(255,92,108,.16)', value: formatBRLCents(data.avgTicketCents), label: 'Ticket médio', trend: `${data.avgTicketTrend >= 0 ? '+' : ''}${data.avgTicketTrend}%`, up: data.avgTicketTrend >= 0 },
    { icon: <Star size={20} strokeWidth={0} fill="#FF4FA0" />, iconBg: 'rgba(255,79,160,.16)', value: data.bestSellerName, label: 'Produto mais vendido', trend: `${data.bestSellerQty} unidades`, up: true, small: true },
    { icon: <User size={20} strokeWidth={2} color="#9B6BFF" />, iconBg: 'rgba(155,107,255,.18)', value: data.topClientName, label: 'Cliente que mais comprou', trend: formatBRLCents(data.topClientSpentCents), up: true, small: true },
  ];

  return (
    <div className="animate-dc-fade-up">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        {liveKpis.map((k, i) => (
          <KpiCard key={i} {...k} />
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-display text-[17px] font-bold">Resumo do período</div>
          <div className="mt-0.5 text-[13px] text-text-2">{data.periodLabel}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
            {PERIOD_FILTERS.map((f) => (
              <Chip key={f.key} active={period === f.key} onClick={() => setPeriod(f.key)}>
                {f.label}
              </Chip>
            ))}
          </div>
          {period === 'custom' && (
            <div className="flex flex-wrap items-center gap-1.5">
              <input
                type="date"
                value={customFrom}
                max={customTo}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="h-9 rounded-sm border border-white/[0.08] bg-surface px-2.5 text-[13px] text-text outline-none"
              />
              <span className="text-text-2">–</span>
              <input
                type="date"
                value={customTo}
                min={customFrom}
                max={todayIso()}
                onChange={(e) => setCustomTo(e.target.value)}
                className="h-9 rounded-sm border border-white/[0.08] bg-surface px-2.5 text-[13px] text-text outline-none"
              />
            </div>
          )}
          <button
            onClick={handleExportExcel}
            className="flex h-9 cursor-pointer items-center gap-1.5 rounded-sm border border-white/[0.08] bg-surface px-3 text-[13px] font-semibold text-text-2 transition-colors hover:text-text"
          >
            <Download size={15} strokeWidth={2.2} />
            Excel
          </button>
          <button
            onClick={handleExportPdf}
            className="flex h-9 cursor-pointer items-center gap-1.5 rounded-sm border border-white/[0.08] bg-surface px-3 text-[13px] font-semibold text-text-2 transition-colors hover:text-text"
          >
            <FileDown size={15} strokeWidth={2.2} />
            PDF
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        {periodKpis.map((k, i) => (
          <KpiCard key={i} {...k} />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
        <div className="rounded-xl border border-white/[0.06] bg-surface p-[22px]">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="font-display text-[17px] font-bold">Receita</div>
              <div className="mt-0.5 text-[13px] text-text-2">{data.periodLabel}</div>
            </div>
          </div>
          {data.chartSeries.length > 0 ? (
            <LineChart data={data.chartSeries.map((s) => s.valueCents / 100)} labels={data.chartSeries.map((s) => s.label)} />
          ) : (
            <div className="py-10 text-center text-sm text-text-2">Sem dados no período.</div>
          )}
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-surface p-[22px]">
          <div className="font-display text-[17px] font-bold">Pagamentos</div>
          <div className="mb-4 mt-0.5 text-[13px] text-text-2">{data.periodLabel}</div>
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
            <div className="text-sm text-text-2">Sem vendas no período.</div>
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

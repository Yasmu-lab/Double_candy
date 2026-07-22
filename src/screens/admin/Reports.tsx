import { BadgeDollarSign, Banknote, CircleDollarSign, Package, Star, TrendingDown } from 'lucide-react';
import { MonthlyBarChart } from '../../components/charts/MonthlyBarChart';

const REPORT_CARDS = [
  { icon: <Banknote size={18} strokeWidth={2} color="#C6FF4D" />, iconBg: 'rgba(198,255,77,.16)', label: 'Receita total', value: 'R$ 8.240', trend: '+18% vs. mês anterior', up: true },
  { icon: <Package size={18} strokeWidth={2} color="#FF4FA0" />, iconBg: 'rgba(255,79,160,.16)', label: 'Produtos vendidos', value: '1.284', trend: '+24%', up: true },
  { icon: <CircleDollarSign size={18} strokeWidth={2} color="#9B6BFF" />, iconBg: 'rgba(155,107,255,.18)', label: 'Ticket médio', value: 'R$ 12,40', trend: '+3%', up: true },
  { icon: <Star size={18} strokeWidth={0} fill="#FFA347" />, iconBg: 'rgba(255,163,71,.16)', label: 'Mais vendido', value: 'Choc. Recheado', trend: '92 unidades', up: true },
  { icon: <TrendingDown size={18} strokeWidth={2} color="#FF5C6C" />, iconBg: 'rgba(255,92,108,.16)', label: 'Menos vendido', value: 'Chiclete Bomba', trend: '37 unidades', up: false },
  { icon: <BadgeDollarSign size={18} strokeWidth={2} color="#C6FF4D" />, iconBg: 'rgba(198,255,77,.16)', label: 'Pagamento top', value: 'Pix', trend: '52% dos pedidos', up: true },
];

const MONTHLY = [42, 38, 55, 61, 48, 72, 66, 58, 80, 74, 63, 90];
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function Reports() {
  return (
    <div className="animate-dc-fade-up">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {REPORT_CARDS.map((r) => (
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
        <MonthlyBarChart data={MONTHLY} labels={MONTHS} />
      </div>
    </div>
  );
}

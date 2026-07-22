import { CLIENTS } from '../../data/clients';
import { formatBRL } from '../../lib/format';

export function Clients() {
  return (
    <div className="animate-dc-fade-up overflow-hidden rounded-xl border border-white/[0.06] bg-surface">
      <div className="hidden grid-cols-[2.5fr_1.5fr_1fr_1.2fr_1.3fr] gap-3 border-b border-white/[0.06] px-[22px] py-[15px] text-xs font-bold uppercase tracking-wide text-text-2 md:grid">
        <span>Cliente</span>
        <span>Telefone</span>
        <span>Pedidos</span>
        <span>Gasto total</span>
        <span>Última compra</span>
      </div>
      {CLIENTS.map((c) => (
        <div
          key={c.phone}
          className="grid grid-cols-2 items-center gap-3 border-b border-white/[0.04] px-[22px] py-3.5 transition-colors duration-150 last:border-b-0 hover:bg-card-2/40 md:grid-cols-[2.5fr_1.5fr_1fr_1.2fr_1.3fr]"
        >
          <div className="col-span-2 flex items-center gap-3.5 md:col-span-1">
            <div
              className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full font-display text-sm font-bold"
              style={{ background: c.bg }}
            >
              {c.initials}
            </div>
            <span className="text-sm font-bold">{c.name}</span>
          </div>
          <span className="text-[13.5px] text-text-2">{c.phone}</span>
          <span className="text-sm font-semibold">{c.orders}</span>
          <span className="font-display text-sm font-bold text-lime">{formatBRL(c.spent)}</span>
          <span className="text-[13.5px] text-text-2">{c.last}</span>
        </div>
      ))}
    </div>
  );
}

import { Check, FileDown, Printer, Receipt, ShoppingBag, Wallet } from 'lucide-react';
import { useMemo } from 'react';
import { ProductImage } from '../../components/ui/ProductImage';
import { PREP_ITEMS } from '../../data/prepItems';
import { formatBRL } from '../../lib/format';
import { useAdminStore } from '../../store/adminStore';
import { useUiStore } from '../../store/uiStore';

export function Prepare() {
  const prepSeparated = useAdminStore((s) => s.prepSeparated);
  const togglePrep = useAdminStore((s) => s.togglePrep);
  const setAllPrep = useAdminStore((s) => s.setAllPrep);
  const showToast = useUiStore((s) => s.showToast);

  const doneCount = useMemo(() => PREP_ITEMS.filter((p) => prepSeparated[p.key]).length, [prepSeparated]);
  const allDone = doneCount === PREP_ITEMS.length;
  const totalUnits = useMemo(() => PREP_ITEMS.reduce((s, p) => s + p.qty, 0), []);
  const totalOrders = useMemo(() => PREP_ITEMS.reduce((s, p) => s + p.orders, 0), []);
  const totalValue = useMemo(() => PREP_ITEMS.reduce((s, p) => s + p.qty * p.unit, 0), []);

  return (
    <div className="animate-dc-fade-up grid grid-cols-1 items-start gap-4 xl:grid-cols-[1fr_320px]">
      <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-surface">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-[22px] py-[18px]">
          <div>
            <div className="font-display text-[17px] font-bold">Lista de separação</div>
            <div className="mt-0.5 text-[13px] text-text-2">
              {doneCount} de {PREP_ITEMS.length} itens separados
            </div>
          </div>
          <button
            onClick={() => setAllPrep(PREP_ITEMS.map((p) => p.key), !allDone)}
            className="flex h-[42px] cursor-pointer items-center gap-2 rounded-sm border border-lime/30 bg-lime/10 px-4 text-[13px] font-bold text-lime transition-colors hover:bg-lime/[0.18]"
          >
            <Check size={16} strokeWidth={2.4} />
            Marcar tudo
          </button>
        </div>
        <div className="hidden grid-cols-[auto_2.2fr_1fr_1.1fr_1fr] gap-4 border-b border-white/5 px-[22px] py-3 text-[11.5px] font-bold uppercase tracking-wide text-text-2 md:grid">
          <span />
          <span>Produto</span>
          <span>Quantidade</span>
          <span>Pedidos</span>
          <span>Valor previsto</span>
        </div>
        {PREP_ITEMS.map((p) => {
          const done = !!prepSeparated[p.key];
          return (
            <div
              key={p.key}
              className="grid grid-cols-[auto_1fr] items-center gap-4 border-b border-white/5 px-[22px] py-[15px] transition-opacity duration-200 last:border-b-0 md:grid-cols-[auto_2.2fr_1fr_1.1fr_1fr]"
              style={{ opacity: done ? 0.5 : 1 }}
            >
              <button
                onClick={() => togglePrep(p.key)}
                className={[
                  'flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-[9px] border-2 transition-all duration-200',
                  done ? 'border-lime bg-lime' : 'border-card-2 bg-transparent',
                ].join(' ')}
              >
                {done && <Check size={16} strokeWidth={3.2} className="text-bg-deep" />}
              </button>
              <div className="flex items-center gap-3.5">
                <ProductImage product={p} className="h-[42px] w-[42px] shrink-0 rounded-xs" />
                <span className={`text-[15px] font-bold ${done ? 'line-through' : ''}`}>{p.name}</span>
              </div>
              <span className="font-display text-xl font-bold text-pink">
                {p.qty}
                <span className="text-xs font-semibold text-text-2"> un</span>
              </span>
              <span className="text-[13.5px] text-text-2">{p.orders} pedidos</span>
              <span className="font-display text-sm font-bold text-lime">{formatBRL(p.qty * p.unit)}</span>
            </div>
          );
        })}
      </div>

      <div className="sticky top-6 flex flex-col gap-3.5">
        <div className="rounded-xl border border-white/[0.06] bg-surface p-[22px]">
          <div className="mb-4 font-display text-base font-bold">Resumo do dia</div>
          <div className="flex flex-col gap-3.5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xs bg-pink/[0.16]">
                <ShoppingBag size={19} strokeWidth={2} className="text-pink" />
              </span>
              <div>
                <div className="font-display text-xl font-bold">{totalUnits} un</div>
                <div className="text-[12.5px] text-text-2">Total a separar</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xs bg-purple/[0.18]">
                <Receipt size={19} strokeWidth={2} className="text-purple" />
              </span>
              <div>
                <div className="font-display text-xl font-bold">{totalOrders}</div>
                <div className="text-[12.5px] text-text-2">Pedidos relacionados</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xs bg-lime/[0.16]">
                <Wallet size={19} strokeWidth={2} className="text-lime" />
              </span>
              <div>
                <div className="font-display text-xl font-bold text-lime">{formatBRL(totalValue)}</div>
                <div className="text-[12.5px] text-text-2">Valor previsto</div>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={() => showToast('Enviando lista para impressão...')}
          className="flex h-[52px] cursor-pointer items-center justify-center gap-2 rounded-md border-none bg-card-2 font-display text-sm font-semibold text-text transition-colors hover:bg-[#453769]"
        >
          <Printer size={19} strokeWidth={2} />
          Imprimir lista
        </button>
        <button
          onClick={() => showToast('Gerando PDF da lista...')}
          className="flex h-[52px] cursor-pointer items-center justify-center gap-2 rounded-md border-none bg-gradient-to-br from-pink to-pink-dark font-display text-sm font-semibold text-text shadow-[0_12px_26px_-10px_rgba(255,79,160,0.6)] transition-transform active:scale-[0.98]"
        >
          <FileDown size={19} strokeWidth={2} />
          Exportar PDF
        </button>
      </div>
    </div>
  );
}

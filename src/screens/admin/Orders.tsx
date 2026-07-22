import { Clock, Phone } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { StatusBadge } from '../../components/ui/Badge';
import { Chip } from '../../components/ui/Chip';
import { formatBRLCents, formatRelativeDate, isSaoPauloDay } from '../../lib/format';
import { useAdminStore } from '../../store/adminStore';
import { paymentLabel, useOrderStore } from '../../store/orderStore';
import { useUiStore } from '../../store/uiStore';
import type { OrderStatus } from '../../types';

const FILTERS = ['Hoje', 'Amanhã', 'Semana', 'Mês'] as const;

export function Orders() {
  const orders = useOrderStore((s) => s.orders);
  const loading = useOrderStore((s) => s.loading);
  const fetchAll = useOrderStore((s) => s.fetchAll);
  const setStatus = useOrderStore((s) => s.setStatus);
  const openOrderId = useAdminStore((s) => s.openOrderId);
  const setOpenOrderId = useAdminStore((s) => s.setOpenOrderId);
  const showToast = useUiStore((s) => s.showToast);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('Hoje');

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const filtered = useMemo(() => {
    if (filter === 'Hoje') return orders.filter((o) => isSaoPauloDay(o.createdAt, 0));
    if (filter === 'Amanhã') return orders.filter((o) => isSaoPauloDay(o.pickupWindowStart, 1));
    return orders;
  }, [orders, filter]);

  useEffect(() => {
    if (!openOrderId && orders.length > 0) setOpenOrderId(orders[0].id);
  }, [openOrderId, orders, setOpenOrderId]);

  const openOrder = orders.find((o) => o.id === openOrderId) ?? orders[0] ?? null;

  const act = (label: string, status: OrderStatus) => {
    if (!openOrder) return;
    setStatus(openOrder.id, status)
      .then(() => showToast(`${openOrder.displayId} marcado como ${label}`))
      .catch(() => showToast('Não deu pra atualizar o pedido.'));
  };

  return (
    <div className="animate-dc-fade-up grid grid-cols-1 items-start gap-4 xl:grid-cols-[1fr_380px]">
      <div>
        <div className="mb-4 flex gap-2">
          {FILTERS.map((f) => (
            <Chip key={f} active={f === filter} onClick={() => setFilter(f)}>
              {f}
            </Chip>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          {loading && filtered.length === 0 && (
            <div className="rounded-xl border border-white/[0.06] bg-surface px-5 py-10 text-center text-sm text-text-2">
              Carregando...
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="rounded-xl border border-white/[0.06] bg-surface px-5 py-10 text-center text-sm text-text-2">
              Nenhum pedido para este período.
            </div>
          )}
          {filtered.map((o) => (
            <div
              key={o.id}
              onClick={() => setOpenOrderId(o.id)}
              className={[
                'flex cursor-pointer flex-wrap items-center justify-between gap-3.5 rounded-md border px-[18px] py-[15px] transition-all duration-200',
                openOrder?.id === o.id ? 'border-pink/40 bg-card-2' : 'border-white/[0.06] bg-surface',
              ].join(' ')}
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xs bg-card font-display text-sm font-bold text-purple">
                  {o.client.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-[14.5px] font-bold">{o.client}</div>
                  <div className="mt-0.5 text-[12.5px] text-text-2">
                    {o.displayId} · {formatRelativeDate(o.createdAt)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[12.5px] text-text-2">{paymentLabel(o.paymentMethod)}</span>
                <span className="font-display text-[15px] font-bold text-pink">{formatBRLCents(o.totalCents)}</span>
                <StatusBadge status={o.status} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {openOrder && (
        <div className="sticky top-6 rounded-xl border border-white/[0.06] bg-surface p-[22px]">
          <div className="flex items-center justify-between">
            <div className="font-display text-lg font-bold">{openOrder.displayId}</div>
            <StatusBadge status={openOrder.status} />
          </div>
          <div className="mt-[18px] flex items-center gap-3 border-b border-white/[0.07] pb-[18px]">
            <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-gradient-to-br from-purple to-purple-dark font-display font-bold">
              {openOrder.client.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="text-[15px] font-bold">{openOrder.client}</div>
              <div className="mt-0.5 flex items-center gap-1.5 text-[13px] text-text-2">
                <Phone size={13} strokeWidth={2} />
                {openOrder.phone}
              </div>
            </div>
          </div>
          <div className="border-b border-white/[0.07] py-4">
            <div className="mb-3 text-xs font-bold uppercase tracking-wide text-text-2">Itens</div>
            {openOrder.lines.map((li) => (
              <div key={li.productId} className="flex items-center justify-between py-1.5 text-sm">
                <span>
                  {li.qty}× {li.name}
                </span>
                <span className="font-bold">{formatBRLCents(li.priceCents * li.qty)}</span>
              </div>
            ))}
            {openOrder.note && (
              <div className="mt-2 rounded-sm bg-bg px-3 py-2 text-[13px] text-text-2">Obs: {openOrder.note}</div>
            )}
          </div>
          <div className="flex flex-col gap-2.5 py-4">
            <div className="flex justify-between text-[13.5px]">
              <span className="text-text-2">Pagamento</span>
              <span className="font-semibold">{paymentLabel(openOrder.paymentMethod)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-white/[0.07] pt-2.5">
              <span className="font-bold">Total</span>
              <span className="font-display text-xl font-bold text-pink">{formatBRLCents(openOrder.totalCents)}</span>
            </div>
          </div>
          <div className="mt-1.5 flex flex-col gap-2">
            <button
              onClick={() => act('Preparando', 'confirmed')}
              className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-sm border-none bg-gradient-to-br from-orange to-orange-dark font-display text-sm font-bold text-bg-deep transition-transform active:scale-[0.98]"
            >
              <Clock size={18} strokeWidth={2.2} />
              Preparar
            </button>
            <div className="flex gap-2.5">
              <button
                onClick={() => act('Entregue', 'delivered')}
                className="flex-1 cursor-pointer rounded-sm border-none bg-gradient-to-br from-lime to-lime-dark py-3 font-display text-sm font-bold text-bg-deep transition-transform active:scale-[0.98]"
              >
                Entregue
              </button>
              <button
                onClick={() => act('Cancelado', 'cancelled')}
                className="flex-1 cursor-pointer rounded-sm border border-red/40 bg-red/[0.12] py-3 text-sm font-bold text-red transition-colors hover:bg-red/20"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

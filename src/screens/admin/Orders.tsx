import { AlertTriangle, ArrowRight, Clock3, History as HistoryIcon, Phone, User, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { StatusBadge } from '../../components/ui/Badge';
import { Chip } from '../../components/ui/Chip';
import { Skeleton } from '../../components/ui/Skeleton';
import { api, type OrderStatusHistoryDto } from '../../lib/api';
import { formatBRLCents, formatRelativeDate, isSaoPauloDay } from '../../lib/format';
import { useAdminStore } from '../../store/adminStore';
import { paymentLabel, useOrderStore } from '../../store/orderStore';
import { useUiStore } from '../../store/uiStore';
import type { OrderStatus } from '../../types';

const FILTERS = ['Hoje', 'Amanhã', 'Semana', 'Mês'] as const;

// The primary "advance" action offered per current status — guides the happy path without
// locking admins out of manually picking any other status later if they need to.
const NEXT_STATUS: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
  pending: { status: 'confirmed', label: 'Confirmar' },
  confirmed: { status: 'preparing', label: 'Iniciar preparo' },
  preparing: { status: 'separated', label: 'Marcar separado' },
  separated: { status: 'ready_for_pickup', label: 'Pronto para retirada' },
  ready_for_pickup: { status: 'delivered', label: 'Marcar entregue' },
};

const CANCELLABLE: OrderStatus[] = ['pending', 'confirmed'];

export function Orders() {
  const orders = useOrderStore((s) => s.orders);
  const loading = useOrderStore((s) => s.loading);
  const fetchAll = useOrderStore((s) => s.fetchAll);
  const setStatus = useOrderStore((s) => s.setStatus);
  const openOrderId = useAdminStore((s) => s.openOrderId);
  const setOpenOrderId = useAdminStore((s) => s.setOpenOrderId);
  const showToast = useUiStore((s) => s.showToast);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('Hoje');
  const [updating, setUpdating] = useState(false);
  const [history, setHistory] = useState<OrderStatusHistoryDto[] | null>(null);

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

  useEffect(() => {
    if (!openOrder) {
      setHistory(null);
      return;
    }
    setHistory(null);
    api
      .getOrderHistory(openOrder.id)
      .then(setHistory)
      .catch(() => setHistory([]));
  }, [openOrder?.id]);

  const act = (label: string, status: OrderStatus) => {
    if (!openOrder || updating) return;
    setUpdating(true);
    setStatus(openOrder.id, status)
      .then(() => {
        showToast(`${openOrder.displayId} marcado como ${label}`);
        return api.getOrderHistory(openOrder.id).then(setHistory);
      })
      .catch(() => showToast('Não deu pra atualizar o pedido.', 'error'))
      .finally(() => setUpdating(false));
  };

  const next = openOrder ? NEXT_STATUS[openOrder.status] : undefined;

  return (
    <div className="animate-dc-fade-up grid grid-cols-1 items-start gap-4 xl:grid-cols-[1fr_380px]">
      <div>
        <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
          {FILTERS.map((f) => (
            <Chip key={f} active={f === filter} onClick={() => setFilter(f)}>
              {f}
            </Chip>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          {loading &&
            filtered.length === 0 &&
            [0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex flex-wrap items-center justify-between gap-3.5 rounded-md border border-white/[0.06] bg-surface px-[18px] py-[15px]"
              >
                <div className="flex items-center gap-3.5">
                  <Skeleton className="h-11 w-11 shrink-0 rounded-xs" />
                  <div>
                    <Skeleton className="mb-1.5 h-4 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-3.5 w-10" />
                  <Skeleton className="h-4 w-14" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </div>
            ))}
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
        <div className="dc-scroll sticky top-6 max-h-[calc(100vh-48px)] overflow-y-auto rounded-xl border border-white/[0.06] bg-surface p-[22px]">
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
          <div className="flex flex-col gap-2.5 border-b border-white/[0.07] py-4">
            <div className="flex justify-between text-[13.5px]">
              <span className="text-text-2">Pagamento</span>
              <span className="font-semibold">{paymentLabel(openOrder.paymentMethod)}</span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="font-bold">Total</span>
              <span className="font-display text-xl font-bold text-pink">{formatBRLCents(openOrder.totalCents)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 py-4">
            {next && (
              <button
                onClick={() => act(next.label, next.status)}
                disabled={updating}
                className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-sm border-none bg-gradient-to-br from-pink to-pink-dark font-display text-sm font-bold text-text transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ArrowRight size={18} strokeWidth={2.2} />
                {next.label}
              </button>
            )}
            <div className="flex gap-2.5">
              {openOrder.status === 'ready_for_pickup' && (
                <button
                  onClick={() => act('Não retirado', 'no_show')}
                  disabled={updating}
                  className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-sm border border-orange/40 bg-orange/[0.12] py-3 text-sm font-bold text-orange transition-colors hover:bg-orange/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <AlertTriangle size={16} strokeWidth={2.2} />
                  Não retirado
                </button>
              )}
              {CANCELLABLE.includes(openOrder.status) && (
                <button
                  onClick={() => act('Cancelado', 'cancelled')}
                  disabled={updating}
                  className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-sm border border-red/40 bg-red/[0.12] py-3 text-sm font-bold text-red transition-colors hover:bg-red/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <XCircle size={16} strokeWidth={2.2} />
                  Cancelar
                </button>
              )}
            </div>
          </div>

          <div className="border-t border-white/[0.07] pt-4">
            <div className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-text-2">
              <HistoryIcon size={14} strokeWidth={2.2} />
              Histórico
            </div>
            {history === null ? (
              <div className="flex flex-col gap-2.5">
                {[0, 1].map((i) => (
                  <Skeleton key={i} className="h-9 w-full rounded-sm" />
                ))}
              </div>
            ) : history.length === 0 ? (
              <div className="text-[13px] text-text-2">Sem alterações registradas.</div>
            ) : (
              <div className="flex flex-col gap-3">
                {[...history].reverse().map((h) => (
                  <div key={h.id} className="flex items-start gap-2.5">
                    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-card">
                      {h.changedByType === 'admin' ? (
                        <User size={12} strokeWidth={2.2} className="text-purple" />
                      ) : (
                        <Clock3 size={12} strokeWidth={2.2} className="text-pink" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={h.toStatus} />
                      </div>
                      <div className="mt-1 text-[12.5px] text-text-2">
                        {h.changedByName} · {formatRelativeDate(h.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

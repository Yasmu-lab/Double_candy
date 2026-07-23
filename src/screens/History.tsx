import { ShoppingBag } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BottomNav } from '../components/layout/BottomNav';
import { StatusBadge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { formatBRLCents, formatRelativeDate } from '../lib/format';
import { paymentLabel, useOrderStore } from '../store/orderStore';
import { useUiStore } from '../store/uiStore';
import type { OrderStatus } from '../types';

const CANCELLABLE: OrderStatus[] = ['pending', 'confirmed'];

const statusIconBg: Record<OrderStatus, string> = {
  delivered: 'linear-gradient(135deg,#C6FF4D,#8fbf20)',
  cancelled: 'linear-gradient(135deg,#FF5C6C,#E63B8C)',
  no_show: 'linear-gradient(135deg,#FF5C6C,#E63B8C)',
  confirmed: 'linear-gradient(135deg,#FFA347,#e6842a)',
  preparing: 'linear-gradient(135deg,#FFA347,#e6842a)',
  separated: 'linear-gradient(135deg,#FF4FA0,#E63B8C)',
  ready_for_pickup: 'linear-gradient(135deg,#C6FF4D,#8fbf20)',
  pending: 'linear-gradient(135deg,#9B6BFF,#6b3fd6)',
};

export function History() {
  const orders = useOrderStore((s) => s.orders);
  const loading = useOrderStore((s) => s.loading);
  const fetchMine = useOrderStore((s) => s.fetchMine);
  const setStatus = useOrderStore((s) => s.setStatus);
  const showToast = useUiStore((s) => s.showToast);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    fetchMine();
  }, [fetchMine]);

  const handleCancel = async (id: string, displayId: string) => {
    setCancellingId(id);
    try {
      await setStatus(id, 'cancelled', { cancelledBy: 'client' });
      showToast(`${displayId} cancelado`);
    } catch {
      showToast('Não deu pra cancelar esse pedido.', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="dc-app-bg animate-dc-fade-up min-h-dvh px-5 pb-32 pt-8 lg:px-8 lg:pt-10">
      <div className="lg:mx-auto lg:max-w-2xl">
        <h1 className="font-display text-[26px] font-bold tracking-[-0.5px]">Meus pedidos</h1>
        <p className="mb-5 mt-1 text-sm text-text-2">Acompanhe tudo o que você reservou.</p>

        {loading && orders.length === 0 ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-[22px] border border-white/5 bg-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-[46px] w-[46px] shrink-0 rounded-sm" />
                    <div>
                      <Skeleton className="mb-1.5 h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <div className="mt-3.5 flex items-center justify-between border-t border-white/[0.06] pt-3.5">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-14" />
                </div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag size={44} strokeWidth={1.8} />}
            title="Nada por aqui ainda"
            description="Seus pedidos reservados vão aparecer nesta lista."
          />
        ) : (
          orders.map((o) => (
            <div
              key={o.id}
              className="mb-3 rounded-[22px] border border-white/5 bg-card p-4 transition-transform duration-150 hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-sm"
                    style={{ background: statusIconBg[o.status] }}
                  >
                    <ShoppingBag size={22} strokeWidth={2} className="text-text" />
                  </div>
                  <div>
                    <div className="font-display text-[15px] font-bold">{o.displayId}</div>
                    <div className="mt-0.5 text-xs text-text-2">
                      {formatRelativeDate(o.createdAt)} · {o.lines.reduce((s, l) => s + l.qty, 0)} itens
                    </div>
                  </div>
                </div>
                <StatusBadge status={o.status} />
              </div>
              <div className="mt-3.5 flex items-center justify-between border-t border-white/[0.06] pt-3.5">
                <span className="text-[12.5px] text-text-2">{paymentLabel(o.paymentMethod)}</span>
                <span className="font-display text-[17px] font-bold text-pink">{formatBRLCents(o.totalCents)}</span>
              </div>
              {CANCELLABLE.includes(o.status) && (
                <button
                  onClick={() => handleCancel(o.id, o.displayId)}
                  disabled={cancellingId === o.id}
                  className="mt-3 w-full cursor-pointer rounded-sm border border-red/40 bg-red/[0.1] py-2.5 text-[13px] font-bold text-red transition-colors hover:bg-red/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {cancellingId === o.id ? 'Cancelando...' : 'Cancelar pedido'}
                </button>
              )}
            </div>
          ))
        )}
      </div>
      <BottomNav />
    </div>
  );
}

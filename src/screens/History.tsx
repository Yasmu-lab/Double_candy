import { ShoppingBag } from 'lucide-react';
import { useMemo } from 'react';
import { BottomNav } from '../components/layout/BottomNav';
import { StatusBadge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { formatBRL } from '../lib/format';
import { paymentLabel, useOrderStore } from '../store/orderStore';
import type { OrderStatus } from '../types';

const statusIconBg: Record<OrderStatus, string> = {
  Entregue: 'linear-gradient(135deg,#C6FF4D,#8fbf20)',
  Cancelado: 'linear-gradient(135deg,#FF5C6C,#E63B8C)',
  Preparando: 'linear-gradient(135deg,#FFA347,#e6842a)',
  Reservado: 'linear-gradient(135deg,#9B6BFF,#6b3fd6)',
};

export function History() {
  const allOrders = useOrderStore((s) => s.orders);
  const orders = useMemo(() => allOrders.filter((o) => o.isMine), [allOrders]);

  return (
    <div className="dc-app-bg min-h-dvh px-5 pb-32 pt-8 lg:px-8 lg:pt-10">
      <div className="lg:mx-auto lg:max-w-2xl">
        <h1 className="font-display text-[26px] font-bold tracking-[-0.5px]">Meus pedidos</h1>
        <p className="mb-5 mt-1 text-sm text-text-2">Acompanhe tudo o que você reservou.</p>

        {orders.length === 0 ? (
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
                    <div className="font-display text-[15px] font-bold">{o.id}</div>
                    <div className="mt-0.5 text-xs text-text-2">
                      {o.createdAt} · {o.lines.reduce((s, l) => s + l.qty, 0)} itens
                    </div>
                  </div>
                </div>
                <StatusBadge status={o.status} />
              </div>
              <div className="mt-3.5 flex items-center justify-between border-t border-white/[0.06] pt-3.5">
                <span className="text-[12.5px] text-text-2">{paymentLabel(o.payment)}</span>
                <span className="font-display text-[17px] font-bold text-pink">{formatBRL(o.total)}</span>
              </div>
            </div>
          ))
        )}
      </div>
      <BottomNav />
    </div>
  );
}

import { formatBRL } from '../../lib/format';
import { paymentLabel } from '../../store/orderStore';
import type { Order } from '../../types';

export function OrderSummary({ order }: { order: Order }) {
  return (
    <div className="w-full rounded-lg border border-white/[0.06] bg-surface p-5 text-left">
      <div className="flex items-center justify-between border-b border-dashed border-white/[0.12] pb-4">
        <div>
          <div className="text-xs text-text-2">Número do pedido</div>
          <div className="font-display text-lg font-bold">{order.id}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-text-2">Retirada</div>
          <div className="font-display text-lg font-bold text-lime">{order.pickupLabel}</div>
        </div>
      </div>
      {order.lines.map((line) => (
        <div key={line.productId} className="flex items-center justify-between py-[11px] text-sm">
          <span>
            {line.qty}× {line.name}
          </span>
          <span className="font-semibold">{formatBRL(line.price * line.qty)}</span>
        </div>
      ))}
      <div className="mt-1.5 flex items-center justify-between border-t border-white/[0.08] pt-3.5">
        <span className="text-sm text-text-2">Total · {paymentLabel(order.payment)}</span>
        <span className="font-display text-[22px] font-bold text-pink">{formatBRL(order.total)}</span>
      </div>
    </div>
  );
}

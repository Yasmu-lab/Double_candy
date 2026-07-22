import type { ReactNode } from 'react';
import type { OrderStatus } from '../../types';

const statusClasses: Record<OrderStatus, string> = {
  pending: 'bg-purple/[0.18] text-purple',
  confirmed: 'bg-orange/[0.16] text-orange',
  preparing: 'bg-orange/[0.16] text-orange',
  separated: 'bg-pink/[0.16] text-pink',
  ready_for_pickup: 'bg-lime/[0.16] text-lime',
  delivered: 'bg-lime/[0.16] text-lime',
  no_show: 'bg-red/[0.16] text-red',
  cancelled: 'bg-red/[0.16] text-red',
};

const statusLabels: Record<OrderStatus, string> = {
  pending: 'Recebido',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  separated: 'Separado',
  ready_for_pickup: 'Pronto para retirada',
  delivered: 'Entregue',
  no_show: 'Não retirado',
  cancelled: 'Cancelado',
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={[
        'inline-flex items-center px-[11px] py-[5px] rounded-full text-[11.5px] font-bold whitespace-nowrap',
        statusClasses[status],
      ].join(' ')}
    >
      {statusLabels[status]}
    </span>
  );
}

type Tone = 'lime' | 'pink' | 'purple' | 'red' | 'neutral';

const toneClasses: Record<Tone, string> = {
  lime: 'bg-lime text-bg-deep',
  pink: 'bg-pink text-text',
  purple: 'bg-card-2 text-purple',
  red: 'bg-red text-text',
  neutral: 'bg-bg-deep/70 backdrop-blur-sm text-text',
};

export function Badge({ tone = 'neutral', icon, children }: { tone?: Tone; icon?: ReactNode; children: ReactNode }) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 px-[11px] py-[5px] rounded-full text-[11px] font-bold',
        toneClasses[tone],
      ].join(' ')}
    >
      {icon}
      {children}
    </span>
  );
}

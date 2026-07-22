import type { ReactNode } from 'react';
import type { OrderStatus } from '../../types';

const statusClasses: Record<OrderStatus, string> = {
  Entregue: 'bg-lime/[0.16] text-lime',
  Preparando: 'bg-orange/[0.16] text-orange',
  Reservado: 'bg-purple/[0.18] text-purple',
  Cancelado: 'bg-red/[0.16] text-red',
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={[
        'inline-flex items-center px-[11px] py-[5px] rounded-full text-[11.5px] font-bold whitespace-nowrap',
        statusClasses[status],
      ].join(' ')}
    >
      {status}
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

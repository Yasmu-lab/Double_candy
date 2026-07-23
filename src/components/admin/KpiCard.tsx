import type { ReactNode } from 'react';

interface KpiCardProps {
  icon: ReactNode;
  iconBg: string;
  value: string;
  label: string;
  trend: string;
  up: boolean;
  small?: boolean;
  danger?: boolean;
}

export function KpiCard({ icon, iconBg, value, label, trend, up, small, danger }: KpiCardProps) {
  return (
    <div
      className={[
        'rounded-lg border p-[18px] transition-all duration-200 hover:-translate-y-[3px] hover:shadow-[0_18px_34px_-16px_rgba(0,0,0,0.5)]',
        danger ? 'border-red/25 bg-red/[0.06]' : 'border-white/[0.06] bg-surface',
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[13px]" style={{ background: iconBg }}>
          {icon}
        </span>
        <span
          className={[
            'min-w-0 rounded-full px-2.5 py-1 text-right text-xs font-bold leading-tight',
            up ? 'bg-lime/[0.12] text-lime' : 'bg-red/[0.12] text-red',
          ].join(' ')}
        >
          {trend}
        </span>
      </div>
      <div
        className={[
          'mt-3.5 font-display font-bold leading-[1.15] tracking-[-0.5px]',
          small ? 'truncate text-lg' : 'text-2xl',
          danger ? 'text-red' : '',
        ].join(' ')}
      >
        {value}
      </div>
      <div className="mt-0.5 text-[13px] text-text-2">{label}</div>
    </div>
  );
}

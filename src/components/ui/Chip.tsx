import type { ButtonHTMLAttributes } from 'react';

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export function Chip({ active = false, className = '', children, ...rest }: ChipProps) {
  return (
    <button
      className={[
        'shrink-0 px-[18px] py-[9px] rounded-sm text-[13.5px] font-semibold whitespace-nowrap cursor-pointer transition-all duration-150',
        active
          ? 'bg-gradient-to-br from-pink to-pink-dark text-text'
          : 'bg-surface text-text-2 hover:text-text',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
}

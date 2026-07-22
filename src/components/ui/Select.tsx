import { ChevronDown } from 'lucide-react';
import type { SelectHTMLAttributes } from 'react';

export function Select({ className = '', children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={[
          'h-[52px] w-full appearance-none rounded-sm border border-white/[0.07] bg-card px-4 pr-10 font-body text-[15px] text-text outline-none focus:border-pink',
          className,
        ].join(' ')}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown
        size={18}
        strokeWidth={2}
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-text-2"
      />
    </div>
  );
}

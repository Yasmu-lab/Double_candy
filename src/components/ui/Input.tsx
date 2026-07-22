import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  trailing?: ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ icon, trailing, containerClassName = '', className = '', ...rest }, ref) => (
    <div
      className={[
        'flex items-center gap-3 h-[58px] rounded-md border-[1.5px] border-white/[0.07] bg-card px-4',
        'focus-within:border-pink focus-within:shadow-[0_0_0_4px_rgba(255,79,160,0.12)]',
        'transition-shadow duration-150',
        containerClassName,
      ].join(' ')}
    >
      {icon}
      <input
        ref={ref}
        className={[
          'flex-1 min-w-0 bg-transparent border-none outline-none text-text text-base font-body placeholder:text-text-3',
          className,
        ].join(' ')}
        {...rest}
      />
      {trailing}
    </div>
  ),
);
Input.displayName = 'Input';

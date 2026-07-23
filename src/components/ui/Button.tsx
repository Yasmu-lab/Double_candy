import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { useRipple } from '../../lib/useRipple';

type Variant = 'primary' | 'secondary' | 'outline' | 'success' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  ripple?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-gradient-to-br from-pink to-pink-dark text-text shadow-[0_16px_34px_-10px_rgba(255,79,160,0.65)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]',
  secondary:
    'bg-card-2 text-text hover:bg-[#453769] active:scale-[0.98]',
  outline:
    'bg-transparent text-text-2 border-[1.5px] border-white/10 hover:border-pink hover:text-text active:scale-[0.98]',
  success:
    'bg-gradient-to-br from-lime to-lime-dark text-bg-deep shadow-[0_14px_30px_-10px_rgba(198,255,77,0.5)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]',
  danger:
    'bg-transparent text-red border-[1.5px] border-red/40 hover:bg-red/10 active:scale-[0.98]',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-11 px-4 text-sm rounded-sm gap-1.5',
  md: 'h-[52px] px-5 text-[15px] rounded-md gap-2',
  lg: 'h-[58px] px-6 text-[16px] rounded-md gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = 'primary', size = 'md', ripple = false, icon, iconRight, fullWidth, className = '', children, onMouseDown, ...rest },
    ref,
  ) => {
    const makeRipple = useRipple();
    return (
      <button
        ref={ref}
        className={[
          'relative overflow-hidden inline-flex items-center justify-center font-display font-semibold transition-all duration-150 ease-out cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed outline-none focus-visible:ring-2 focus-visible:ring-pink-light',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth ? 'w-full' : '',
          className,
        ].join(' ')}
        onMouseDown={(e) => {
          if (ripple) makeRipple(e);
          onMouseDown?.(e);
        }}
        {...rest}
      >
        {icon}
        {children}
        {iconRight}
      </button>
    );
  },
);
Button.displayName = 'Button';

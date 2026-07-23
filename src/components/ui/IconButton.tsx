import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Tone = 'card' | 'glass' | 'primary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: Tone;
  size?: Size;
  children: ReactNode;
}

const toneClasses: Record<Tone, string> = {
  card: 'bg-card border border-white/[0.06] text-text hover:bg-card-2',
  glass: 'bg-bg-deep/60 backdrop-blur-md border border-white/[0.12] text-text',
  primary:
    'bg-gradient-to-br from-pink to-pink-dark text-text shadow-[0_8px_18px_-6px_rgba(255,79,160,0.6)]',
  ghost: 'bg-transparent text-text-2 hover:bg-card-2 hover:text-text',
};

const sizeClasses: Record<Size, string> = {
  sm: 'w-8 h-8 rounded-xs',
  md: 'w-11 h-11 rounded-sm',
  lg: 'w-[52px] h-[52px] rounded-md',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ tone = 'card', size = 'md', className = '', children, ...rest }, ref) => (
    <button
      ref={ref}
      className={[
        'inline-flex items-center justify-center shrink-0 cursor-pointer transition-all duration-150 active:scale-90 outline-none focus-visible:ring-2 focus-visible:ring-pink-light',
        toneClasses[tone],
        sizeClasses[size],
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  ),
);
IconButton.displayName = 'IconButton';

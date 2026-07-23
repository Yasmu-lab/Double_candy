import { Minus, Plus } from 'lucide-react';

interface QuantityStepperProps {
  qty: number;
  onDec: () => void;
  onInc: () => void;
  size?: 'sm' | 'md';
  disableInc?: boolean;
}

export function QuantityStepper({ qty, onDec, onInc, size = 'md', disableInc }: QuantityStepperProps) {
  const btnSize = size === 'sm' ? 'w-[30px] h-[30px] rounded-[9px]' : 'w-10 h-10 rounded-xs';
  const iconSize = size === 'sm' ? 15 : 18;
  return (
    <div className="flex items-center gap-2.5 bg-card rounded-md p-1.5">
      <button
        onClick={onDec}
        className={`${btnSize} bg-card-2 text-text flex items-center justify-center cursor-pointer transition-transform active:scale-90 outline-none focus-visible:ring-2 focus-visible:ring-pink-light`}
      >
        <Minus size={iconSize} strokeWidth={2.6} />
      </button>
      <span className="font-display font-bold text-[15px] min-w-[20px] text-center tabular-nums">{qty}</span>
      <button
        onClick={onInc}
        disabled={disableInc}
        className={`${btnSize} bg-gradient-to-br from-pink to-pink-dark text-text flex items-center justify-center cursor-pointer transition-transform active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed outline-none focus-visible:ring-2 focus-visible:ring-pink-light`}
      >
        <Plus size={iconSize} strokeWidth={2.6} />
      </button>
    </div>
  );
}

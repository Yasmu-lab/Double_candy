import { Check, Plus, Sparkles } from 'lucide-react';
import type { MouseEvent } from 'react';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRipple } from '../../lib/useRipple';
import { formatBRLCents } from '../../lib/format';
import { useCartStore } from '../../store/cartStore';
import { useUiStore } from '../../store/uiStore';
import type { Product } from '../../types';
import { ProductImage } from '../ui/ProductImage';

const LOW_STOCK_THRESHOLD = 5;
const JUST_ADDED_MS = 900;

export function ProductCard({ product }: { product: Product }) {
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);
  const showToast = useUiStore((s) => s.showToast);
  const makeRipple = useRipple();
  const [justAdded, setJustAdded] = useState(false);
  const justAddedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const outOfStock = product.stock <= 0;
  const onPromo = !outOfStock && product.compareAtPriceCents != null && product.compareAtPriceCents > product.priceCents;
  const lowStock = !outOfStock && product.stock <= LOW_STOCK_THRESHOLD;

  const handleAdd = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (outOfStock) return;
    addItem(product.id, 1);
    showToast(`${product.name} no carrinho`);
    makeRipple(e);
    setJustAdded(true);
    clearTimeout(justAddedTimer.current);
    justAddedTimer.current = setTimeout(() => setJustAdded(false), JUST_ADDED_MS);
  };

  return (
    <div
      onClick={() => navigate(`/product/${product.id}`)}
      className={[
        'group cursor-pointer rounded-[22px] border border-white/5 bg-card p-[11px] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_34px_-14px_rgba(0,0,0,0.6)] lg:p-[13px] lg:hover:-translate-y-[5px] lg:hover:shadow-[0_22px_40px_-16px_rgba(0,0,0,0.6)]',
        outOfStock ? 'opacity-70' : '',
      ].join(' ')}
    >
      <div className="relative h-[140px] overflow-hidden rounded-sm lg:h-[190px]">
        <ProductImage
          product={product}
          className="h-full w-full transition-transform duration-300 group-hover:scale-[1.06]"
        />
        <div className="absolute left-[9px] top-[9px] flex flex-col items-start gap-1.5">
          {onPromo && (
            <span className="flex items-center gap-1 rounded-full bg-gradient-to-br from-pink to-purple px-2 py-1 text-[10px] font-bold text-text">
              <Sparkles size={10} strokeWidth={2.4} />
              Promoção
            </span>
          )}
          {lowStock && (
            <span className="rounded-full bg-orange px-2 py-1 text-[10px] font-bold text-bg-deep">
              Só {product.stock} un.
            </span>
          )}
        </div>
        {outOfStock && (
          <span className="absolute right-[9px] top-[9px] rounded-full bg-red px-2 py-1 text-[10px] font-bold text-text">
            Esgotado
          </span>
        )}
      </div>

      <div className="mt-[9px] text-sm font-bold lg:mt-[11px] lg:text-[15px]">{product.name}</div>
      <div className="mt-0.5 text-[11.5px] text-text-2 lg:text-[12.5px]">{product.category ?? ''}</div>

      <div className="mt-[9px] flex items-baseline gap-1.5 lg:mt-3">
        {onPromo && (
          <span className="text-[11.5px] text-text-3 line-through">{formatBRLCents(product.compareAtPriceCents!)}</span>
        )}
        <span className="font-display text-[15px] font-bold text-pink lg:text-[17px]">
          {formatBRLCents(product.priceCents)}
        </span>
      </div>

      <button
        onClick={handleAdd}
        disabled={outOfStock}
        className={[
          'relative mt-[9px] flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 overflow-hidden rounded-xs border-none text-[12.5px] font-bold text-text transition-all duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 outline-none focus-visible:ring-2 focus-visible:ring-pink-light lg:mt-2.5 lg:h-11 lg:text-[13.5px]',
          justAdded ? 'bg-lime text-bg-deep' : 'bg-card-2 hover:bg-pink',
        ].join(' ')}
      >
        {justAdded ? (
          <span className="animate-dc-pop flex items-center gap-1.5">
            <Check size={16} strokeWidth={2.8} />
            Adicionado!
          </span>
        ) : (
          <>
            <Plus size={16} strokeWidth={2.4} />
            {outOfStock ? 'Esgotado' : 'Adicionar ao carrinho'}
          </>
        )}
      </button>
    </div>
  );
}

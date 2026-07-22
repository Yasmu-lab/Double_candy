import { ArrowLeft, Heart, Minus, Plus, Star } from 'lucide-react';
import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { IconButton } from '../components/ui/IconButton';
import { ProductImage } from '../components/ui/ProductImage';
import { findProduct } from '../data/products';
import { formatBRL } from '../lib/format';
import { useCartStore } from '../store/cartStore';
import { useUiStore } from '../store/uiStore';

export function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);
  const showToast = useUiStore((s) => s.showToast);
  const [qty, setQty] = useState(1);

  const product = findProduct(Number(id));
  if (!product) return <Navigate to="/home" replace />;

  const handleAdd = () => {
    addItem(product.id, qty);
    showToast(`${product.name} no carrinho`);
    setQty(1);
  };

  return (
    <div className="min-h-dvh bg-bg pb-[128px]">
      <div className="relative h-[300px] sm:h-[348px]" style={{ background: product.tint }}>
        <ProductImage product={product} className="h-full w-full" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg,rgba(20,14,36,.35) 0%,rgba(20,14,36,0) 30%,rgba(27,19,48,.9) 100%)',
          }}
        />
        <IconButton tone="glass" size="lg" onClick={() => navigate(-1)} className="absolute left-5 top-[52px]">
          <ArrowLeft size={22} strokeWidth={2.2} />
        </IconButton>
        <IconButton tone="glass" size="lg" className="absolute right-5 top-[52px] text-pink">
          <Heart size={20} strokeWidth={2} />
        </IconButton>
      </div>

      <div className="relative -mt-[26px] mx-auto max-w-2xl px-6">
        <div className="flex items-start justify-between gap-3.5">
          <div>
            <span className="inline-block rounded-full bg-card-2 px-[11px] py-[5px] text-[11px] font-bold text-purple">
              {product.category}
            </span>
            <h1 className="mt-3 font-display text-[27px] font-bold tracking-[-0.5px]">{product.name}</h1>
          </div>
          <div className="mt-1 flex shrink-0 items-center gap-1.5 rounded-sm bg-card px-3 py-[7px]">
            <Star size={15} strokeWidth={0} fill="#C6FF4D" />
            <span className="text-sm font-bold">{product.rating}</span>
          </div>
        </div>

        <p className="mt-4 text-[14.5px] leading-[1.6] text-text-2">{product.desc}</p>

        <div className="mt-5 flex gap-3">
          <div className="flex-1 rounded-md border border-white/5 bg-surface px-4 py-3.5">
            <div className="text-xs text-text-2">Estoque</div>
            <div className="mt-[3px] font-display text-lg font-bold text-lime">{product.stock} un.</div>
          </div>
          <div className="flex-1 rounded-md border border-white/5 bg-surface px-4 py-3.5">
            <div className="text-xs text-text-2">Retirada</div>
            <div className="mt-[3px] font-display text-lg font-bold">Amanhã</div>
          </div>
        </div>

        <div className="mt-[22px] flex items-center justify-between">
          <span className="text-sm font-semibold text-text-2">Quantidade</span>
          <div className="flex items-center gap-4 rounded-md bg-card p-1.5">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xs border-none bg-card-2 text-text transition-transform active:scale-90"
            >
              <Minus size={18} strokeWidth={2.6} />
            </button>
            <span className="min-w-[24px] text-center font-display text-xl font-bold tabular-nums">{qty}</span>
            <button
              onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
              disabled={qty >= product.stock}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xs border-none bg-gradient-to-br from-pink to-pink-dark text-text transition-transform active:scale-90 disabled:opacity-40"
            >
              <Plus size={18} strokeWidth={2.6} />
            </button>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-bg via-bg to-transparent px-6 pb-6 pt-4">
        <div className="mx-auto flex max-w-2xl items-center gap-3.5">
          <div>
            <div className="text-xs text-text-2">Total</div>
            <div className="font-display text-2xl font-bold text-pink">{formatBRL(product.price * qty)}</div>
          </div>
          <Button ripple size="lg" fullWidth className="flex-1" onClick={handleAdd}>
            Adicionar
          </Button>
        </div>
      </div>
    </div>
  );
}

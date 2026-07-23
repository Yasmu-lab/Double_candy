import { ArrowLeft, Check, Heart, Minus, Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { IconButton } from '../components/ui/IconButton';
import { ProductImage } from '../components/ui/ProductImage';
import { Skeleton } from '../components/ui/Skeleton';
import { formatBRLCents } from '../lib/format';
import { tintForId } from '../lib/tint';
import { useCartStore } from '../store/cartStore';
import { useProductsStore } from '../store/productsStore';
import { useUiStore } from '../store/uiStore';

export function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);
  const showToast = useUiStore((s) => s.showToast);
  const products = useProductsStore((s) => s.products);
  const fetchProducts = useProductsStore((s) => s.fetchProducts);
  const loading = useProductsStore((s) => s.loading);
  const fetched = useProductsStore((s) => s.fetched);
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const justAddedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const product = products.find((p) => p.id === id);

  if (!product) {
    if (loading || !fetched) {
      return (
        <div className="min-h-dvh bg-bg pb-[128px]">
          <Skeleton className="h-[300px] w-full rounded-none sm:h-[348px]" />
          <div className="relative -mt-[26px] mx-auto max-w-2xl px-6">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="mt-3 h-8 w-2/3" />
            <Skeleton className="mt-4 h-4 w-full" />
            <Skeleton className="mt-1.5 h-4 w-4/5" />
            <div className="mt-5 flex gap-3">
              <Skeleton className="h-[70px] flex-1 rounded-md" />
              <Skeleton className="h-[70px] flex-1 rounded-md" />
            </div>
          </div>
        </div>
      );
    }
    return <Navigate to="/home" replace />;
  }

  const handleAdd = () => {
    addItem(product.id, qty);
    showToast(`${product.name} no carrinho`);
    setQty(1);
    setJustAdded(true);
    clearTimeout(justAddedTimer.current);
    justAddedTimer.current = setTimeout(() => setJustAdded(false), 900);
  };

  return (
    <div className="animate-dc-fade-up min-h-dvh bg-bg pb-[128px]">
      <div className="relative h-[300px] sm:h-[348px]" style={{ background: tintForId(product.id) }}>
        <ProductImage product={product} className="h-full w-full" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg,rgba(20,14,36,.35) 0%,rgba(20,14,36,0) 30%,rgba(27,19,48,.9) 100%)',
          }}
        />
        <IconButton
          tone="glass"
          size="lg"
          onClick={() => navigate(-1)}
          aria-label="Voltar"
          className="absolute left-5 top-[52px]"
        >
          <ArrowLeft size={22} strokeWidth={2.2} />
        </IconButton>
        <IconButton tone="glass" size="lg" aria-label="Favoritar" className="absolute right-5 top-[52px] text-pink">
          <Heart size={20} strokeWidth={2} />
        </IconButton>
      </div>

      <div className="relative -mt-[26px] mx-auto max-w-2xl px-6">
        <div>
          {product.category && (
            <span className="inline-block rounded-full bg-card-2 px-[11px] py-[5px] text-[11px] font-bold text-purple">
              {product.category}
            </span>
          )}
          <h1 className="mt-3 font-display text-[27px] font-bold tracking-[-0.5px]">{product.name}</h1>
        </div>

        {product.description && <p className="mt-4 text-[14.5px] leading-[1.6] text-text-2">{product.description}</p>}

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
            <div className="font-display text-2xl font-bold text-pink">{formatBRLCents(product.priceCents * qty)}</div>
          </div>
          <Button
            ripple
            variant={justAdded ? 'success' : 'primary'}
            size="lg"
            fullWidth
            className="flex-1"
            disabled={product.stock <= 0}
            onClick={handleAdd}
          >
            {justAdded ? (
              <span className="animate-dc-pop flex items-center gap-2">
                <Check size={18} strokeWidth={2.8} />
                Adicionado!
              </span>
            ) : product.stock <= 0 ? (
              'Esgotado'
            ) : (
              'Adicionar'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

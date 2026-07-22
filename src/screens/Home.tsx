import { Bell, Plus, Search, ShoppingBag, SlidersHorizontal, Star } from 'lucide-react';
import { useMemo, useState, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { BottomNav } from '../components/layout/BottomNav';
import { Chip } from '../components/ui/Chip';
import { IconButton } from '../components/ui/IconButton';
import { ProductImage } from '../components/ui/ProductImage';
import { CATEGORIES, PRODUCTS } from '../data/products';
import { formatBRL } from '../lib/format';
import { firstName, useAuthStore } from '../store/authStore';
import { useCartCount, useCartStore } from '../store/cartStore';
import { useUiStore } from '../store/uiStore';
import type { CategoryName, Product } from '../types';

function greetingForNow() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function Home() {
  const navigate = useNavigate();
  const name = useAuthStore((s) => s.name);
  const cartCount = useCartCount();
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useUiStore((s) => s.openCart);
  const showToast = useUiStore((s) => s.showToast);
  const [category, setCategory] = useState<CategoryName>('Todos');
  const [query, setQuery] = useState('');

  const greeting = greetingForNow();

  const filtered = useMemo(() => {
    return PRODUCTS.filter((p) => {
      if (category === 'Promoções' && !p.promo) return false;
      if (category !== 'Todos' && category !== 'Promoções' && p.category !== category) return false;
      if (query.trim() && !p.name.toLowerCase().includes(query.trim().toLowerCase())) return false;
      return true;
    });
  }, [category, query]);

  const bestSellers = PRODUCTS.filter((p) => p.best);

  const quickAdd = (e: MouseEvent, p: Product) => {
    e.stopPropagation();
    addItem(p.id, 1);
    showToast(`${p.name} no carrinho`);
  };

  return (
    <div className="dc-app-bg min-h-dvh px-5 pb-32 pt-8 lg:px-8 lg:pb-16 lg:pt-10">
      <div className="lg:mx-auto lg:max-w-[1180px]">
        {/* header */}
        <header className="flex items-center gap-5">
          <div className="shrink-0">
            <div className="text-[13.5px] text-text-2">{greeting}</div>
            <div className="font-display text-[23px] font-bold tracking-[-0.4px] lg:text-2xl">
              E aí, {firstName(name) || 'visitante'}
            </div>
          </div>

          <div className="mx-auto hidden h-[54px] max-w-[520px] flex-1 items-center gap-3 rounded-md border border-white/[0.06] bg-surface px-[18px] lg:flex">
            <Search size={20} strokeWidth={2} className="shrink-0 text-text-2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar doce..."
              className="min-w-0 flex-1 bg-transparent font-body text-[15px] text-text outline-none placeholder:text-text-3"
            />
          </div>

          <IconButton tone="card" className="relative shrink-0 lg:hidden">
            <Bell size={20} strokeWidth={2} />
            <span className="absolute right-[11px] top-[9px] h-2 w-2 rounded-full border-2 border-bg-deep bg-pink" />
          </IconButton>

          <button
            onClick={openCart}
            className="relative hidden h-[54px] shrink-0 cursor-pointer items-center gap-2.5 rounded-md border-none bg-gradient-to-br from-pink to-pink-dark px-[22px] font-display text-[15px] font-semibold text-text shadow-[0_12px_26px_-10px_rgba(255,79,160,0.6)] transition-transform hover:-translate-y-0.5 lg:flex"
          >
            <ShoppingBag size={21} strokeWidth={2} />
            Carrinho
            {cartCount > 0 && (
              <span className="flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-lime px-1 text-xs font-extrabold text-bg-deep">
                {cartCount}
              </span>
            )}
          </button>
        </header>

        {/* mobile search */}
        <div className="mt-[18px] flex h-[52px] items-center gap-3 rounded-md border border-white/[0.06] bg-surface px-4 lg:hidden">
          <Search size={19} strokeWidth={2} className="shrink-0 text-text-2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar doce..."
            className="min-w-0 flex-1 bg-transparent font-body text-[15px] text-text outline-none placeholder:text-text-3"
          />
          <SlidersHorizontal size={19} strokeWidth={2} className="shrink-0 text-purple" />
        </div>

        {/* categories */}
        <div className="no-scrollbar mt-[18px] flex gap-2.5 overflow-x-auto pb-1 lg:mt-5 lg:flex-wrap">
          {CATEGORIES.map((c) => (
            <Chip key={c} active={c === category} onClick={() => setCategory(c)}>
              {c}
            </Chip>
          ))}
        </div>

        {/* promo banner */}
        <div
          onClick={() => navigate('/product/2')}
          className="relative mt-[18px] h-[158px] cursor-pointer overflow-hidden rounded-[24px] shadow-[0_20px_40px_-16px_rgba(155,107,255,0.6)] lg:mt-6 lg:h-[180px] lg:rounded-[26px]"
          style={{ background: 'linear-gradient(120deg,#E63B8C,#9B6BFF)' }}
        >
          <Star
            size={200}
            strokeWidth={0}
            fill="#ffffff"
            className="pointer-events-none absolute -right-8 -top-10 opacity-10"
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: 'linear-gradient(90deg,rgba(20,14,36,.75) 0%,rgba(20,14,36,.1) 70%)' }}
          />
          <div className="relative flex h-full flex-col items-start justify-center p-[22px] lg:px-10 lg:py-8">
            <Badge tone="lime" icon={<Star size={12} strokeWidth={0} fill="currentColor" />}>
              PROMO DO DIA
            </Badge>
            <div className="mt-2.5 max-w-[70%] font-display text-2xl font-bold leading-[1.05] lg:max-w-none lg:text-[32px]">
              Leve 3
              <br />
              pague 2
            </div>
            <div className="mt-1.5 text-[13px] text-[#EADFFF] lg:text-[15px]">Em toda a linha de chocolates</div>
          </div>
        </div>

        {/* best sellers */}
        {bestSellers.length > 0 && (
          <section className="mt-6 lg:hidden">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Mais vendidos</h2>
              <button className="cursor-pointer text-[13px] font-semibold text-purple">Ver tudo</button>
            </div>
            <div className="no-scrollbar -mx-5 flex gap-3.5 overflow-x-auto px-5 pb-1">
              {bestSellers.map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/product/${p.id}`)}
                  className="w-[168px] shrink-0 cursor-pointer rounded-[22px] border border-white/5 bg-card p-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_34px_-14px_rgba(0,0,0,0.6)]"
                >
                  <div className="relative h-[126px] overflow-hidden rounded-sm">
                    <ProductImage product={p} className="h-full w-full" />
                    <span className="absolute left-[9px] top-[9px] flex items-center gap-1 rounded-full bg-bg-deep/70 px-[9px] py-1 text-[11px] font-bold text-lime backdrop-blur-md">
                      <Star size={11} strokeWidth={0} fill="currentColor" />
                      {p.rating}
                    </span>
                  </div>
                  <div className="mt-2.5 text-[14.5px] font-bold">{p.name}</div>
                  <div className="mt-0.5 text-xs text-text-2">{p.category}</div>
                  <div className="mt-2.5 flex items-center justify-between">
                    <span className="font-display text-base font-bold text-pink">{formatBRL(p.price)}</span>
                    <button
                      onClick={(e) => quickAdd(e, p)}
                      className="flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-[11px] border-none bg-gradient-to-br from-pink to-pink-dark shadow-[0_8px_18px_-6px_rgba(255,79,160,0.6)] transition-transform active:scale-90"
                    >
                      <Plus size={18} strokeWidth={2.4} className="text-text" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* menu grid */}
        <section className="mt-6 lg:mt-6">
          <div className="mb-3 flex items-center justify-between lg:mb-4">
            <h2 className="font-display text-lg font-bold lg:text-xl">Cardápio</h2>
            <span className="text-xs text-text-2 lg:text-[13px]">{filtered.length} itens</span>
          </div>
          <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4 lg:gap-[18px]">
            {filtered.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(`/product/${p.id}`)}
                className="cursor-pointer rounded-[22px] border border-white/5 bg-card p-[11px] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_34px_-14px_rgba(0,0,0,0.6)] lg:p-[13px] lg:hover:-translate-y-[5px] lg:hover:shadow-[0_22px_40px_-16px_rgba(0,0,0,0.6)]"
              >
                <div className="relative h-[118px] overflow-hidden rounded-sm lg:h-[158px]">
                  <ProductImage product={p} className="h-full w-full" />
                  <span className="absolute left-[9px] top-[9px] hidden items-center gap-1 rounded-full bg-bg-deep/70 px-[9px] py-1 text-[11px] font-bold text-lime backdrop-blur-md lg:flex">
                    <Star size={11} strokeWidth={0} fill="currentColor" />
                    {p.rating}
                  </span>
                  {p.promo && (
                    <span className="absolute right-[9px] top-[9px] rounded-full bg-red px-2 py-1 text-[10px] font-bold text-text lg:right-[10px] lg:top-[10px] lg:px-[9px]">
                      -20%
                    </span>
                  )}
                </div>
                <div className="mt-[9px] text-sm font-bold lg:mt-[11px] lg:text-[15px]">{p.name}</div>
                <div className="mt-0.5 text-[11.5px] text-text-2 lg:text-[12.5px]">{p.category}</div>
                <div className="mt-[9px] flex items-center justify-between lg:mt-3">
                  <span className="font-display text-[15px] font-bold text-pink lg:text-[17px]">
                    {formatBRL(p.price)}
                  </span>
                  <button
                    onClick={(e) => quickAdd(e, p)}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-[10px] border-none bg-card-2 transition-all duration-200 hover:bg-pink active:scale-90 lg:hidden"
                  >
                    <Plus size={17} strokeWidth={2.4} className="text-text" />
                  </button>
                  <button
                    onClick={(e) => quickAdd(e, p)}
                    className="hidden h-[38px] cursor-pointer items-center gap-1.5 rounded-xs border-none bg-card-2 px-[15px] text-[13px] font-bold text-text transition-all duration-200 hover:bg-pink active:scale-95 lg:flex"
                  >
                    <Plus size={16} strokeWidth={2.4} />
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <BottomNav />
    </div>
  );
}

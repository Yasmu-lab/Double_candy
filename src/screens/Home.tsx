import { Bell, LayoutDashboard, LogOut, Plus, Search, ShoppingBag, SlidersHorizontal, Star, User } from 'lucide-react';
import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { BottomNav } from '../components/layout/BottomNav';
import { Chip } from '../components/ui/Chip';
import { IconButton } from '../components/ui/IconButton';
import { ProductImage } from '../components/ui/ProductImage';
import { formatBRLCents } from '../lib/format';
import { firstName, useAuthStore } from '../store/authStore';
import { useCartCount, useCartStore } from '../store/cartStore';
import { useCategoriesStore } from '../store/categoriesStore';
import { useProductsStore } from '../store/productsStore';
import { useUiStore } from '../store/uiStore';
import type { Product } from '../types';

function greetingForNow() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function Home() {
  const navigate = useNavigate();
  const customer = useAuthStore((s) => s.customer);
  const logout = useAuthStore((s) => s.logout);
  const justLoggedIn = useAuthStore((s) => s.justLoggedIn);
  const clearJustLoggedIn = useAuthStore((s) => s.clearJustLoggedIn);
  const cartCount = useCartCount();
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useUiStore((s) => s.openCart);
  const showToast = useUiStore((s) => s.showToast);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const products = useProductsStore((s) => s.products);
  const productsLoading = useProductsStore((s) => s.loading);
  const fetchProducts = useProductsStore((s) => s.fetchProducts);
  const categories = useCategoriesStore((s) => s.categories);
  const fetchCategories = useCategoriesStore((s) => s.fetchCategories);

  const [category, setCategory] = useState('Todos');
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  useEffect(() => {
    if (justLoggedIn && customer) {
      showToast(`Bem-vindo novamente, ${firstName(customer.name)}`);
      clearJustLoggedIn();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const greeting = greetingForNow();
  const activeProducts = useMemo(() => products.filter((p) => p.active), [products]);

  const filtered = useMemo(() => {
    return activeProducts.filter((p) => {
      if (category !== 'Todos' && p.category !== category) return false;
      if (query.trim() && !p.name.toLowerCase().includes(query.trim().toLowerCase())) return false;
      return true;
    });
  }, [activeProducts, category, query]);

  const quickAdd = (e: MouseEvent, p: Product) => {
    e.stopPropagation();
    if (p.stock <= 0) return;
    addItem(p.id, 1);
    showToast(`${p.name} no carrinho`);
  };

  return (
    <div className="dc-app-bg min-h-dvh px-5 pb-32 pt-8 lg:px-8 lg:pb-16 lg:pt-10">
      <div className="lg:mx-auto lg:max-w-[1180px]">
        {/* header */}
        <header className="flex items-center gap-5">
          <div
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setAccountMenuOpen(false);
            }}
            className="relative shrink-0"
          >
            <button
              onClick={() => setAccountMenuOpen((v) => !v)}
              className="cursor-pointer text-left"
            >
              <div className="text-[13.5px] text-text-2">{greeting}</div>
              <div className="font-display text-[23px] font-bold tracking-[-0.4px] lg:text-2xl">
                E aí, {firstName(customer?.name ?? '') || 'visitante'}
              </div>
            </button>
            {accountMenuOpen && (
              <div className="absolute left-0 top-full z-30 mt-2 w-56 rounded-md border border-white/[0.08] bg-surface p-2 shadow-[0_24px_50px_-16px_rgba(0,0,0,0.6)]">
                <div className="mb-1 border-b border-white/[0.06] px-2.5 py-2">
                  <div className="text-sm font-bold">{customer?.name || 'Visitante'}</div>
                  <div className="text-xs text-text-2">{customer?.phone}</div>
                </div>
                <button
                  onClick={() => {
                    setAccountMenuOpen(false);
                    navigate('/profile');
                  }}
                  className="flex w-full cursor-pointer items-center gap-2.5 rounded-xs px-2.5 py-2.5 text-left text-[13.5px] font-semibold text-text transition-colors hover:bg-card-2"
                >
                  <User size={16} strokeWidth={2} />
                  Meu Perfil
                </button>
                {customer?.isAdmin && (
                  <button
                    onClick={() => {
                      setAccountMenuOpen(false);
                      navigate('/admin/dashboard');
                    }}
                    className="flex w-full cursor-pointer items-center gap-2.5 rounded-xs px-2.5 py-2.5 text-left text-[13.5px] font-semibold text-text transition-colors hover:bg-card-2"
                  >
                    <LayoutDashboard size={16} strokeWidth={2} />
                    Painel admin
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="flex w-full cursor-pointer items-center gap-2.5 rounded-xs px-2.5 py-2.5 text-left text-[13.5px] font-semibold text-red transition-colors hover:bg-red/10"
                >
                  <LogOut size={16} strokeWidth={2} />
                  Sair
                </button>
              </div>
            )}
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
          <Chip active={category === 'Todos'} onClick={() => setCategory('Todos')}>
            Todos
          </Chip>
          {categories.map((c) => (
            <Chip key={c.id} active={c.name === category} onClick={() => setCategory(c.name)}>
              {c.name}
            </Chip>
          ))}
        </div>

        {/* promo banner */}
        <div
          className="relative mt-[18px] h-[158px] overflow-hidden rounded-[24px] shadow-[0_20px_40px_-16px_rgba(155,107,255,0.6)] lg:mt-6 lg:h-[180px] lg:rounded-[26px]"
          style={{ background: 'linear-gradient(120deg,#E63B8C,#9B6BFF)' }}
        >
          <Star
            size={200}
            strokeWidth={0}
            fill="#ffffff"
            className="pointer-events-none absolute -right-8 -top-10 opacity-10"
          />
          <div className="relative flex h-full flex-col items-start justify-center p-[22px] lg:px-10 lg:py-8">
            <Badge tone="lime" icon={<Star size={12} strokeWidth={0} fill="currentColor" />}>
              CANTINA DA ESCOLA
            </Badge>
            <div className="mt-2.5 max-w-[70%] font-display text-2xl font-bold leading-[1.05] lg:max-w-none lg:text-[32px]">
              Retirada
              <br />
              amanhã na escola
            </div>
            <div className="mt-1.5 text-[13px] text-[#EADFFF] lg:text-[15px]">Reserva agora, retira e paga na hora</div>
          </div>
        </div>

        {/* menu grid */}
        <section className="mt-6 lg:mt-6">
          <div className="mb-3 flex items-center justify-between lg:mb-4">
            <h2 className="font-display text-lg font-bold lg:text-xl">Cardápio</h2>
            <span className="text-xs text-text-2 lg:text-[13px]">{filtered.length} itens</span>
          </div>

          {productsLoading && filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-text-2">Carregando cardápio...</div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-text-2">Nenhum doce encontrado.</div>
          ) : (
            <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4 lg:gap-[18px]">
              {filtered.map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/product/${p.id}`)}
                  className="cursor-pointer rounded-[22px] border border-white/5 bg-card p-[11px] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_34px_-14px_rgba(0,0,0,0.6)] lg:p-[13px] lg:hover:-translate-y-[5px] lg:hover:shadow-[0_22px_40px_-16px_rgba(0,0,0,0.6)]"
                >
                  <div className="relative h-[118px] overflow-hidden rounded-sm lg:h-[158px]">
                    <ProductImage product={p} className="h-full w-full" />
                    {p.stock <= 0 && (
                      <span className="absolute right-[9px] top-[9px] rounded-full bg-red px-2 py-1 text-[10px] font-bold text-text">
                        Esgotado
                      </span>
                    )}
                  </div>
                  <div className="mt-[9px] text-sm font-bold lg:mt-[11px] lg:text-[15px]">{p.name}</div>
                  <div className="mt-0.5 text-[11.5px] text-text-2 lg:text-[12.5px]">{p.category ?? ''}</div>
                  <div className="mt-[9px] flex items-center justify-between lg:mt-3">
                    <span className="font-display text-[15px] font-bold text-pink lg:text-[17px]">
                      {formatBRLCents(p.priceCents)}
                    </span>
                    <button
                      onClick={(e) => quickAdd(e, p)}
                      disabled={p.stock <= 0}
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-[10px] border-none bg-card-2 transition-all duration-200 hover:bg-pink active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 lg:hidden"
                    >
                      <Plus size={17} strokeWidth={2.4} className="text-text" />
                    </button>
                    <button
                      onClick={(e) => quickAdd(e, p)}
                      disabled={p.stock <= 0}
                      className="hidden h-[38px] cursor-pointer items-center gap-1.5 rounded-xs border-none bg-card-2 px-[15px] text-[13px] font-bold text-text transition-all duration-200 hover:bg-pink active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 lg:flex"
                    >
                      <Plus size={16} strokeWidth={2.4} />
                      Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <BottomNav />
    </div>
  );
}

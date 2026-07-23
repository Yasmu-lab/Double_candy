import { Clock, Flame, LayoutDashboard, LogOut, Search, ShoppingBag, Sparkles, Star, User } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { BottomNav } from '../components/layout/BottomNav';
import { Chip } from '../components/ui/Chip';
import { NotificationBell } from '../components/notifications/NotificationBell';
import { ProductCard } from '../components/product/ProductCard';
import { ProductCarousel } from '../components/product/ProductCarousel';
import { Skeleton } from '../components/ui/Skeleton';
import { firstName, useAuthStore } from '../store/authStore';
import { useCartCount } from '../store/cartStore';
import { useCategoriesStore } from '../store/categoriesStore';
import { useProductsStore } from '../store/productsStore';
import { useUiStore } from '../store/uiStore';

const CAROUSEL_LIMIT = 10;
const RECENT_DAYS = 14;

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
  const openCart = useUiStore((s) => s.openCart);
  const showToast = useUiStore((s) => s.showToast);
  const focusSearchSignal = useUiStore((s) => s.focusSearchSignal);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const mobileSearchRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (focusSearchSignal > 0) mobileSearchRef.current?.focus();
  }, [focusSearchSignal]);

  const greeting = greetingForNow();
  const activeProducts = useMemo(() => products.filter((p) => p.active), [products]);
  const browsing = category === 'Todos' && !query.trim();

  // Esgotados ficam no fim do cardápio completo — o resto da lista mantém a ordem original.
  const filtered = useMemo(() => {
    return activeProducts
      .filter((p) => {
        if (category !== 'Todos' && p.category !== category) return false;
        if (query.trim() && !p.name.toLowerCase().includes(query.trim().toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => Number(a.stock <= 0) - Number(b.stock <= 0));
  }, [activeProducts, category, query]);

  const featured = useMemo(
    () => (browsing ? activeProducts.filter((p) => p.isFeatured && p.stock > 0).slice(0, CAROUSEL_LIMIT) : []),
    [activeProducts, browsing],
  );
  const onPromo = useMemo(
    () =>
      browsing
        ? activeProducts
            .filter((p) => p.stock > 0 && p.compareAtPriceCents != null && p.compareAtPriceCents > p.priceCents)
            .slice(0, CAROUSEL_LIMIT)
        : [],
    [activeProducts, browsing],
  );
  const bestSellers = useMemo(
    () =>
      browsing
        ? [...activeProducts]
            .filter((p) => p.stock > 0 && p.unitsSold > 0)
            .sort((a, b) => b.unitsSold - a.unitsSold)
            .slice(0, CAROUSEL_LIMIT)
        : [],
    [activeProducts, browsing],
  );
  const recent = useMemo(() => {
    if (!browsing) return [];
    const cutoff = Date.now() - RECENT_DAYS * 24 * 3600_000;
    return [...activeProducts]
      .filter((p) => p.stock > 0 && new Date(p.createdAt).getTime() >= cutoff)
      .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
      .slice(0, CAROUSEL_LIMIT);
  }, [activeProducts, browsing]);

  return (
    <div className="dc-app-bg animate-dc-fade-up min-h-dvh px-5 pb-32 pt-8 lg:px-8 lg:pb-16 lg:pt-10">
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

          <NotificationBell />

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
            ref={mobileSearchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar doce..."
            className="min-w-0 flex-1 bg-transparent font-body text-[15px] text-text outline-none placeholder:text-text-3"
          />
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
              DOUBLE CANDY
            </Badge>
            <div className="mt-2.5 max-w-[70%] font-display text-2xl font-bold leading-[1.05] lg:max-w-none lg:text-[32px]">
              Retirada
              <br />
              amanhã na loja
            </div>
            <div className="mt-1.5 text-[13px] text-[#EADFFF] lg:text-[15px]">Reserva agora, retira e paga na hora</div>
          </div>
        </div>

        <ProductCarousel title="Destaques" icon={<Sparkles size={19} strokeWidth={2.2} className="text-pink" />} products={featured} />
        <ProductCarousel title="Promoções" icon={<Star size={19} strokeWidth={2.2} className="text-purple" />} products={onPromo} />
        <ProductCarousel title="Mais vendidos" icon={<Flame size={19} strokeWidth={2.2} className="text-orange" />} products={bestSellers} />
        <ProductCarousel title="Novidades" icon={<Clock size={19} strokeWidth={2.2} className="text-lime" />} products={recent} />

        {/* menu grid */}
        <section className="mt-6 lg:mt-6">
          <div className="mb-3 flex items-center justify-between lg:mb-4">
            <h2 className="font-display text-lg font-bold lg:text-xl">Cardápio</h2>
            <span className="text-xs text-text-2 lg:text-[13px]">{filtered.length} itens</span>
          </div>

          {productsLoading && filtered.length === 0 ? (
            <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4 lg:gap-[18px]">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="rounded-[22px] border border-white/5 bg-card p-[11px] lg:p-[13px]">
                  <Skeleton className="h-[140px] w-full rounded-sm lg:h-[190px]" />
                  <Skeleton className="mt-[9px] h-4 w-4/5 lg:mt-[11px]" />
                  <Skeleton className="mt-1.5 h-3 w-1/2" />
                  <Skeleton className="mt-2.5 h-5 w-1/3" />
                  <Skeleton className="mt-2.5 h-10 w-full rounded-xs lg:h-11" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-text-2">Nenhum doce encontrado.</div>
          ) : (
            <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4 lg:gap-[18px]">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>
      </div>

      <BottomNav />
    </div>
  );
}

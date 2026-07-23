import { Home, Search, ShoppingBag, User, Clock } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCartCount } from '../../store/cartStore';
import { useUiStore } from '../../store/uiStore';

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const count = useCartCount();
  const openCart = useUiStore((s) => s.openCart);
  const requestSearchFocus = useUiStore((s) => s.requestSearchFocus);

  const handleSearch = () => {
    requestSearchFocus();
    if (location.pathname !== '/home') navigate('/home');
  };

  const navBtn = (active: boolean) =>
    `w-[52px] h-11 rounded-sm flex items-center justify-center cursor-pointer transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-pink-light ${
      active ? 'bg-pink text-text shadow-[0_8px_18px_-6px_rgba(255,79,160,0.6)]' : 'bg-transparent text-text-2'
    }`;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 px-5 pb-6 pt-3 bg-gradient-to-t from-bg-deep via-bg-deep/95 to-transparent">
      <div className="mx-auto flex max-w-md items-center justify-around rounded-lg border border-white/[0.08] bg-card-2/85 px-2 py-2.5 shadow-[0_16px_40px_-14px_rgba(0,0,0,0.6)] backdrop-blur-xl">
        <button onClick={() => navigate('/home')} aria-label="Início" className={navBtn(location.pathname === '/home')}>
          <Home size={23} strokeWidth={2} />
        </button>
        <button
          onClick={handleSearch}
          aria-label="Buscar"
          className="w-[52px] h-11 rounded-sm flex items-center justify-center text-text-2 cursor-pointer outline-none transition-colors focus-visible:ring-2 focus-visible:ring-pink-light active:scale-90"
        >
          <Search size={23} strokeWidth={2} />
        </button>
        <button
          onClick={openCart}
          aria-label={count > 0 ? `Carrinho (${count} itens)` : 'Carrinho'}
          className="relative w-[60px] h-14 rounded-md border-none bg-gradient-to-br from-pink to-pink-dark text-text flex items-center justify-center cursor-pointer shadow-[0_12px_26px_-8px_rgba(255,79,160,0.7)] outline-none transition-transform active:scale-90 focus-visible:ring-2 focus-visible:ring-pink-light"
        >
          <ShoppingBag size={24} strokeWidth={2} />
          {count > 0 && (
            <span
              key={count}
              className="animate-dc-pop absolute -top-1 -right-1 flex h-[22px] min-w-[22px] items-center justify-center rounded-full border-[2.5px] border-bg-deep bg-lime px-1 text-xs font-extrabold text-bg-deep"
            >
              {count}
            </span>
          )}
        </button>
        <button onClick={() => navigate('/profile')} aria-label="Perfil" className={navBtn(location.pathname === '/profile')}>
          <User size={23} strokeWidth={2} />
        </button>
        <button onClick={() => navigate('/history')} aria-label="Meus pedidos" className={navBtn(location.pathname === '/history')}>
          <Clock size={23} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

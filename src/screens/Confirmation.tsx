import { Check } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { OrderSummary } from '../components/cart/OrderSummary';
import { useOrderStore } from '../store/orderStore';

export function Confirmation() {
  const navigate = useNavigate();
  const order = useOrderStore((s) => s.lastOrder);

  if (!order) return <Navigate to="/home" replace />;

  return (
    <div
      className="min-h-dvh px-6 py-20"
      style={{ background: 'radial-gradient(500px 400px at 50% 20%, #2a1a4d, #1B1330 70%)' }}
    >
      <div className="mx-auto flex max-w-sm flex-col items-center text-center">
        <div className="animate-dc-scale-in flex h-[98px] w-[98px] items-center justify-center rounded-full bg-lime/[0.14]">
          <div className="animate-dc-pop flex h-[72px] w-[72px] items-center justify-center rounded-full bg-gradient-to-br from-lime to-lime-dark shadow-[0_14px_30px_-8px_rgba(198,255,77,0.6)] [animation-delay:.15s]">
            <Check size={40} strokeWidth={3} className="text-bg-deep" />
          </div>
        </div>
        <h1 className="animate-dc-fade-up mt-[22px] font-display text-[26px] font-bold [animation-delay:.2s]">
          Reserva confirmada!
        </h1>
        <p className="animate-dc-fade-up mt-1.5 max-w-[280px] text-[14.5px] text-text-2 [animation-delay:.3s]">
          Seu pedido tá guardado. É só passar na loja pra retirar.
        </p>

        <div className="animate-dc-fade-up mt-7 w-full [animation-delay:.4s]">
          <OrderSummary order={order} />
        </div>

        <button
          onClick={() => navigate('/history')}
          className="animate-dc-fade-up mt-5 h-14 w-full cursor-pointer rounded-md border-none bg-card-2 font-display text-base font-semibold text-text outline-none transition-colors hover:bg-[#453769] focus-visible:ring-2 focus-visible:ring-pink-light [animation-delay:.5s]"
        >
          Ver meus pedidos
        </button>
        <button
          onClick={() => navigate('/home')}
          className="animate-dc-fade-up mt-2 h-14 w-full cursor-pointer rounded-md border-none bg-transparent text-[15px] font-semibold text-text-2 outline-none focus-visible:ring-2 focus-visible:ring-pink-light [animation-delay:.5s]"
        >
          Voltar ao início
        </button>
      </div>
    </div>
  );
}

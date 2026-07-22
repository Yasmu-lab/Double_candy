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
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-gradient-to-br from-lime to-lime-dark shadow-[0_14px_30px_-8px_rgba(198,255,77,0.6)]">
            <Check size={40} strokeWidth={3} className="text-bg-deep" />
          </div>
        </div>
        <h1 className="mt-[22px] font-display text-[26px] font-bold">Reserva confirmada!</h1>
        <p className="mt-1.5 max-w-[280px] text-[14.5px] text-text-2">
          Seu pedido tá guardado. É só passar na cantina pra retirar.
        </p>

        <div className="mt-7 w-full">
          <OrderSummary order={order} />
        </div>

        <button
          onClick={() => navigate('/history')}
          className="mt-5 h-14 w-full cursor-pointer rounded-md border-none bg-card-2 font-display text-base font-semibold text-text transition-colors hover:bg-[#453769]"
        >
          Ver meus pedidos
        </button>
        <button
          onClick={() => navigate('/home')}
          className="mt-2 h-14 w-full cursor-pointer rounded-md border-none bg-transparent text-[15px] font-semibold text-text-2"
        >
          Voltar ao início
        </button>
      </div>
    </div>
  );
}

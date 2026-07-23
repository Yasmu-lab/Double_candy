import { Banknote, Check, Diamond, Minus, Pencil, Plus, ShoppingBag, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsDesktop } from '../../lib/useMediaQuery';
import { formatBRLCents } from '../../lib/format';
import { ApiError } from '../../lib/api';
import { useCartLines, useCartStore, useCartSubtotalCents } from '../../store/cartStore';
import { useOrderStore } from '../../store/orderStore';
import { useUiStore } from '../../store/uiStore';
import type { PaymentMethod } from '../../types';
import { ProductImage } from '../ui/ProductImage';
import { OrderSummary } from './OrderSummary';

const PAYMENT_OPTIONS: { key: PaymentMethod; label: string; icon: typeof Diamond; tint: string; iconColor: string }[] = [
  { key: 'pix', label: 'Pix', icon: Diamond, tint: 'bg-lime/[0.16]', iconColor: 'text-lime' },
  { key: 'cash', label: 'Dinheiro', icon: Banknote, tint: 'bg-orange/[0.16]', iconColor: 'text-orange' },
];

export function CartOverlay() {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const cartOpen = useUiStore((s) => s.cartOpen);
  const closeCart = useUiStore((s) => s.closeCart);
  const deskConfirmed = useUiStore((s) => s.deskConfirmed);
  const setDeskConfirmed = useUiStore((s) => s.setDeskConfirmed);
  const showToast = useUiStore((s) => s.showToast);

  const lines = useCartLines();
  const subtotalCents = useCartSubtotalCents();
  const payment = useCartStore((s) => s.payment);
  const setPayment = useCartStore((s) => s.setPayment);
  const note = useCartStore((s) => s.note);
  const setNote = useCartStore((s) => s.setNote);
  const incItem = useCartStore((s) => s.incItem);
  const decItem = useCartStore((s) => s.decItem);
  const clear = useCartStore((s) => s.clear);

  const placeOrder = useOrderStore((s) => s.placeOrder);
  const lastOrder = useOrderStore((s) => s.lastOrder);
  const [submitting, setSubmitting] = useState(false);

  if (!cartOpen) return null;

  const hasCart = lines.length > 0;

  const handleConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await placeOrder(lines, payment, note);
      clear();
      if (isDesktop) {
        setDeskConfirmed(true);
      } else {
        closeCart();
        navigate('/confirmation');
      }
    } catch (e) {
      const msg = e instanceof ApiError && e.code === 'OUT_OF_STOCK' ? 'Um dos itens acabou de esgotar.' : 'Não deu pra confirmar. Tenta de novo.';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const containerClass = isDesktop
    ? 'dc-scroll fixed right-0 top-0 bottom-0 z-50 w-[430px] max-w-[92vw] overflow-y-auto border-l border-white/10 bg-surface px-6 py-7 shadow-[-24px_0_60px_-10px_rgba(0,0,0,0.6)] animate-dc-drawer-in'
    : 'dc-scroll fixed inset-x-0 bottom-0 z-50 max-h-[88%] overflow-y-auto rounded-t-[30px] border-t border-white/[0.08] bg-surface px-[22px] pb-7 pt-3.5 shadow-[0_-20px_50px_-10px_rgba(0,0,0,0.6)] animate-dc-sheet-up';

  return (
    <>
      <div onClick={closeCart} className="animate-dc-fade fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
      <div className={containerClass}>
        {isDesktop && deskConfirmed && lastOrder ? (
          <div className="flex flex-col items-center pt-8 text-center">
            <div className="animate-dc-scale-in flex h-24 w-24 items-center justify-center rounded-full bg-lime/[0.14]">
              <div className="flex h-[70px] w-[70px] items-center justify-center rounded-full bg-gradient-to-br from-lime to-lime-dark shadow-[0_14px_30px_-8px_rgba(198,255,77,0.6)]">
                <Check size={38} strokeWidth={3} className="text-bg-deep" />
              </div>
            </div>
            <h2 className="mt-[22px] font-display text-2xl font-bold">Reserva confirmada!</h2>
            <p className="mt-1.5 max-w-[280px] text-[14.5px] text-text-2">
              É só passar na loja amanhã ao meio-dia pra retirar.
            </p>
            <div className="mt-[26px] w-full">
              <OrderSummary order={lastOrder} />
            </div>
            <button
              onClick={closeCart}
              className="mt-5 h-[54px] w-full cursor-pointer rounded-md border-none bg-gradient-to-br from-pink to-pink-dark font-display text-[15px] font-semibold text-text shadow-[0_12px_26px_-10px_rgba(255,79,160,0.6)]"
            >
              Continuar comprando
            </button>
          </div>
        ) : (
          <>
            {!isDesktop && <div className="mx-auto mb-4 h-[5px] w-[46px] rounded-full bg-card-2" />}
            <div className="mb-1.5 flex items-center justify-between">
              <h2 className="font-display text-[22px] font-bold lg:text-[23px]">
                {isDesktop ? 'Seu carrinho' : 'Carrinho'}
              </h2>
              <button
                onClick={closeCart}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xs border-none bg-card-2 text-text transition-colors hover:bg-[#453769] lg:h-[38px] lg:w-[38px]"
              >
                <X size={18} strokeWidth={2.4} />
              </button>
            </div>

            {hasCart ? (
              <>
                <div className="mt-3">
                  {lines.map(({ product, qty }) => (
                    <div
                      key={product.id}
                      className="mb-[11px] flex items-center gap-3.5 rounded-md border border-white/5 bg-card p-[11px]"
                    >
                      <ProductImage product={product} className="h-[60px] w-[60px] shrink-0 rounded-sm" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold">{product.name}</div>
                        <div className="mt-[3px] font-display text-sm font-bold text-pink">
                          {formatBRLCents(product.priceCents)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 rounded-xs bg-bg p-1.5">
                        <button
                          onClick={() => decItem(product.id)}
                          className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-[9px] border-none bg-card-2 text-text transition-transform active:scale-90"
                        >
                          <Minus size={15} strokeWidth={2.6} />
                        </button>
                        <span className="min-w-[18px] text-center font-display text-[15px] font-bold tabular-nums">
                          {qty}
                        </span>
                        <button
                          onClick={() => incItem(product.id)}
                          disabled={qty >= product.stock}
                          className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-[9px] border-none bg-pink text-text transition-transform active:scale-90 disabled:opacity-40"
                        >
                          <Plus size={15} strokeWidth={2.6} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-[18px]">
                  <div className="mb-2.5 text-[13px] font-bold text-text-2">Forma de pagamento</div>
                  <div className="flex gap-2.5">
                    {PAYMENT_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      const active = payment === opt.key;
                      return (
                        <button
                          key={opt.key}
                          onClick={() => setPayment(opt.key)}
                          className={[
                            'flex flex-1 cursor-pointer flex-col items-center gap-2 rounded-sm border-[1.5px] px-2 py-3.5 transition-all duration-200',
                            active ? 'border-pink bg-pink/[0.12]' : 'border-white/[0.07] bg-card',
                          ].join(' ')}
                        >
                          <span className={`flex h-[34px] w-[34px] items-center justify-center rounded-[11px] ${opt.tint}`}>
                            <Icon size={18} strokeWidth={2} className={opt.iconColor} />
                          </span>
                          <span className="text-[13px] font-bold">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="mb-2 text-[13px] font-bold text-text-2">Observação</div>
                  <div className="flex h-[50px] items-center gap-2.5 rounded-md border border-white/[0.06] bg-card px-3.5">
                    <Pencil size={18} strokeWidth={2} className="shrink-0 text-purple" />
                    <input
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Ex: sem açúcar, tirar na entrada..."
                      className="min-w-0 flex-1 bg-transparent font-body text-sm text-text outline-none placeholder:text-text-3"
                    />
                  </div>
                </div>

                <div className="mt-[18px] rounded-md bg-bg p-4">
                  <div className="mb-2 flex justify-between text-[13.5px] text-text-2">
                    <span>Subtotal</span>
                    <span>{formatBRLCents(subtotalCents)}</span>
                  </div>
                  <div className="mb-3 flex justify-between text-[13.5px] text-text-2">
                    <span>Retirada</span>
                    <span className="text-lime">Grátis</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-white/[0.08] pt-3">
                    <span className="text-[15px] font-bold">Total</span>
                    <span className="font-display text-[22px] font-bold text-pink">{formatBRLCents(subtotalCents)}</span>
                  </div>
                </div>

                <button
                  onClick={handleConfirm}
                  disabled={submitting}
                  className="relative mt-4 flex h-[58px] w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-md border-none bg-gradient-to-br from-pink to-pink-dark font-display text-base font-semibold text-text shadow-[0_14px_30px_-10px_rgba(255,79,160,0.65)] transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? 'Confirmando...' : 'Confirmar reserva'}
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center px-5 py-10 text-center">
                <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-card">
                  <ShoppingBag size={44} strokeWidth={1.8} className="text-card-2" />
                </div>
                <h3 className="mb-1.5 font-display text-lg font-bold">Carrinho vazio</h3>
                <p className="mb-5 max-w-[220px] text-sm text-text-2">Adiciona uns docinhos e volta aqui.</p>
                <button
                  onClick={closeCart}
                  className="h-[50px] cursor-pointer rounded-sm border-none bg-card-2 px-[26px] text-sm font-bold text-text"
                >
                  Ver cardápio
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

import { Check, Phone, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { StatusBadge } from '../../components/ui/Badge';
import { useRipple } from '../../lib/useRipple';
import { api, type OrderDto } from '../../lib/api';
import { formatBRLCents } from '../../lib/format';
import { useAdminStore } from '../../store/adminStore';
import { paymentLabel } from '../../store/orderStore';

export function Pickup() {
  const query = useAdminStore((s) => s.pickupQuery);
  const setQuery = useAdminStore((s) => s.setPickupQuery);
  const selId = useAdminStore((s) => s.pickupSelId);
  const setSelId = useAdminStore((s) => s.setPickupSelId);
  const deliveredAnim = useAdminStore((s) => s.deliveredAnim);
  const triggerDeliveredAnim = useAdminStore((s) => s.triggerDeliveredAnim);

  const [results, setResults] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const makeRipple = useRipple();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(() => {
      api
        .searchPickup(query)
        .then((data) => {
          if (cancelled) return;
          setResults(data);
          setLoading(false);
          if (data.length > 0 && !data.some((o) => o.id === selId)) setSelId(data[0].id);
        })
        .catch(() => !cancelled && setLoading(false));
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const selected = results.find((o) => o.id === selId) ?? results[0] ?? null;

  const handleDeliver = async () => {
    if (!selected) return;
    await api.setOrderStatus(selected.id, 'delivered');
    setResults((prev) => prev.map((o) => (o.id === selected.id ? { ...o, status: 'delivered' } : o)));
    triggerDeliveredAnim();
  };

  return (
    <div className="animate-dc-fade-up grid grid-cols-1 items-start gap-4 xl:grid-cols-[380px_1fr]">
      <div>
        <div className="mb-4 flex h-14 items-center gap-3 rounded-md border-[1.5px] border-pink/40 bg-surface px-4 shadow-[0_0_0_4px_rgba(255,79,160,0.1)]">
          <Search size={20} strokeWidth={2} className="shrink-0 text-pink" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nome, telefone ou nº do pedido..."
            className="min-w-0 flex-1 bg-transparent font-body text-base text-text outline-none placeholder:text-text-3"
          />
        </div>
        <div className="mb-2.5 pl-1 text-xs font-bold uppercase tracking-wide text-text-2">
          {loading ? 'Buscando...' : `${results.length} pedidos encontrados`}
        </div>
        <div className="flex flex-col gap-2.5">
          {results.map((o) => (
            <div
              key={o.id}
              onClick={() => setSelId(o.id)}
              className={[
                'flex cursor-pointer items-center gap-3 rounded-md border px-[15px] py-[13px] transition-all duration-200',
                selected?.id === o.id ? 'border-pink/40 bg-card-2' : 'border-white/[0.06] bg-surface',
              ].join(' ')}
            >
              <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xs bg-card-2 font-display text-sm font-bold text-purple">
                {o.client.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold">{o.client}</div>
                <div className="mt-px text-xs text-text-2">{o.displayId}</div>
              </div>
              <StatusBadge status={o.status} />
            </div>
          ))}
          {!loading && results.length === 0 && (
            <div className="rounded-xl border border-white/[0.06] bg-surface px-5 py-10 text-center text-sm text-text-2">
              Nada encontrado.
            </div>
          )}
        </div>
      </div>

      {selected && (
        <div className="sticky top-6 rounded-2xl border border-white/[0.06] bg-surface p-7">
          <div className="mb-[22px] flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="flex h-[54px] w-[54px] items-center justify-center rounded-md bg-gradient-to-br from-purple to-purple-dark font-display text-lg font-bold">
                {selected.client.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="font-display text-xl font-bold">{selected.client}</div>
                <div className="mt-[3px] flex items-center gap-1.5 text-[13.5px] text-text-2">
                  <Phone size={14} strokeWidth={2} />
                  {selected.phone} · {selected.displayId}
                </div>
              </div>
            </div>
            <StatusBadge status={selected.status} />
          </div>

          <div className="mb-[18px] rounded-md bg-bg p-[18px]">
            <div className="mb-3 text-xs font-bold uppercase tracking-wide text-text-2">Produtos</div>
            {selected.lines.map((li) => (
              <div key={li.productId} className="flex items-center justify-between border-b border-white/5 py-2 last:border-b-0">
                <span className="flex items-center gap-2.5 text-[15px]">
                  <span className="flex h-[30px] min-w-[30px] items-center justify-center rounded-[9px] bg-card-2 px-2 font-display text-[13px] font-bold text-pink">
                    {li.qty}×
                  </span>
                  {li.name}
                </span>
                <span className="text-sm font-bold">{formatBRLCents(li.priceCents * li.qty)}</span>
              </div>
            ))}
          </div>

          <div className="mb-5 flex gap-3">
            <div className="flex-1 rounded-md bg-card px-[18px] py-[15px]">
              <div className="text-xs text-text-2">Pagamento</div>
              <div className="mt-0.5 font-display text-base font-bold">{paymentLabel(selected.paymentMethod)}</div>
            </div>
            <div className="flex-1 rounded-md bg-card px-[18px] py-[15px]">
              <div className="text-xs text-text-2">Valor total</div>
              <div className="mt-0.5 font-display text-base font-bold text-pink">{formatBRLCents(selected.totalCents)}</div>
            </div>
          </div>

          {selected.status === 'delivered' ? (
            <div className="flex h-[68px] items-center justify-center gap-2.5 rounded-md border border-lime/30 bg-lime/[0.12] font-display text-[17px] font-bold text-lime">
              <Check size={24} strokeWidth={2.6} />
              Pedido entregue
            </div>
          ) : (
            <button
              onClick={(e) => {
                makeRipple(e);
                handleDeliver();
              }}
              className="relative flex h-[68px] w-full cursor-pointer items-center justify-center gap-3 overflow-hidden rounded-md border-none bg-gradient-to-br from-lime to-lime-dark font-display text-lg font-bold uppercase tracking-wide text-bg-deep shadow-[0_16px_34px_-10px_rgba(198,255,77,0.5)] outline-none transition-transform hover:-translate-y-0.5 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-pink-light"
            >
              Entregar pedido
            </button>
          )}
        </div>
      )}

      {deliveredAnim && (
        <div className="animate-dc-fade fixed inset-0 z-[95] flex flex-col items-center justify-center bg-black/70 backdrop-blur-md">
          <div className="animate-dc-scale-in flex h-[140px] w-[140px] items-center justify-center rounded-full bg-lime/[0.14]">
            <div className="animate-dc-pop flex h-[100px] w-[100px] items-center justify-center rounded-full bg-gradient-to-br from-lime to-lime-dark shadow-[0_20px_44px_-10px_rgba(198,255,77,0.6)] [animation-delay:.15s]">
              <Check size={56} strokeWidth={3} className="text-bg-deep" />
            </div>
          </div>
          <div className="animate-dc-fade-up mt-[26px] font-display text-[28px] font-bold [animation-delay:.2s]">
            Pedido entregue!
          </div>
          <div className="animate-dc-fade-up mt-1.5 text-[15px] text-text-2 [animation-delay:.3s]">
            Dashboard atualizado automaticamente
          </div>
        </div>
      )}
    </div>
  );
}

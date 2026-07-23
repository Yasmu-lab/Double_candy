import { useEffect, useState } from 'react';
import { Skeleton } from '../../components/ui/Skeleton';
import { api } from '../../lib/api';
import { formatBRLCents, formatRelativeDate } from '../../lib/format';

type ClientRow = Awaited<ReturnType<typeof api.getClients>>[number];

const AVATAR_COLORS = [
  'linear-gradient(135deg,#FF4FA0,#E63B8C)',
  'linear-gradient(135deg,#9B6BFF,#6b3fd6)',
  'linear-gradient(135deg,#FFA347,#e6842a)',
  'linear-gradient(135deg,#C6FF4D,#8fbf20)',
  'linear-gradient(135deg,#FF5C6C,#E63B8C)',
];

function avatarBg(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function Clients() {
  const [clients, setClients] = useState<ClientRow[] | null>(null);

  useEffect(() => {
    api.getClients().then(setClients).catch(() => setClients([]));
  }, []);

  return (
    <div className="animate-dc-fade-up overflow-hidden rounded-xl border border-white/[0.06] bg-surface">
      <div className="hidden grid-cols-[2.5fr_1.5fr_1fr_1.2fr_1.3fr] gap-3 border-b border-white/[0.06] px-[22px] py-[15px] text-xs font-bold uppercase tracking-wide text-text-2 md:grid">
        <span>Cliente</span>
        <span>Telefone</span>
        <span>Pedidos</span>
        <span>Gasto total</span>
        <span>Última compra</span>
      </div>
      {!clients && (
        <div className="px-[22px]">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="grid grid-cols-2 items-center gap-3 border-b border-white/[0.04] py-3.5 last:border-b-0 md:grid-cols-[2.5fr_1.5fr_1fr_1.2fr_1.3fr]"
            >
              <div className="col-span-2 flex items-center gap-3.5 md:col-span-1">
                <Skeleton className="h-[42px] w-[42px] shrink-0 rounded-full" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="hidden h-3.5 w-24 md:block" />
              <Skeleton className="hidden h-4 w-6 md:block" />
              <Skeleton className="hidden h-4 w-16 md:block" />
              <Skeleton className="hidden h-3.5 w-20 md:block" />
            </div>
          ))}
        </div>
      )}
      {clients?.length === 0 && <div className="px-[22px] py-10 text-center text-sm text-text-2">Nenhum cliente ainda.</div>}
      {clients?.map((c) => (
        <div
          key={c.id}
          className="grid grid-cols-2 items-center gap-3 border-b border-white/[0.04] px-[22px] py-3.5 transition-colors duration-150 last:border-b-0 hover:bg-card-2/40 md:grid-cols-[2.5fr_1.5fr_1fr_1.2fr_1.3fr]"
        >
          <div className="col-span-2 flex items-center gap-3.5 md:col-span-1">
            <div
              className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full font-display text-sm font-bold"
              style={{ background: avatarBg(c.id) }}
            >
              {c.name.slice(0, 2).toUpperCase()}
            </div>
            <span className="text-sm font-bold">{c.name}</span>
          </div>
          <span className="text-[13.5px] text-text-2">{c.phone}</span>
          <span className="text-sm font-semibold">{c.orders}</span>
          <span className="font-display text-sm font-bold text-lime">{formatBRLCents(c.spentCents)}</span>
          <span className="text-[13.5px] text-text-2">{formatRelativeDate(c.lastOrderAt)}</span>
        </div>
      ))}
    </div>
  );
}

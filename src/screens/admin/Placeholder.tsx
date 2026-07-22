import { Settings2 } from 'lucide-react';

export function Placeholder({ title }: { title: string }) {
  return (
    <div className="animate-dc-fade-up flex flex-col items-center rounded-xl border border-white/[0.06] bg-surface px-8 py-16 text-center">
      <div className="mb-5 flex h-[84px] w-[84px] items-center justify-center rounded-xl bg-card">
        <Settings2 size={40} strokeWidth={1.7} className="text-card-2" />
      </div>
      <h3 className="mb-2 font-display text-xl font-bold">{title}</h3>
      <p className="max-w-[340px] text-sm text-text-2">
        Área em construção. Os fluxos principais (Dashboard, Produtos, Pedidos, Preparar amanhã, Retirada, Clientes e
        Relatórios) já estão navegáveis.
      </p>
    </div>
  );
}

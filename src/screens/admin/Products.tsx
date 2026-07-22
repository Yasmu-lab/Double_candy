import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ProductModal } from '../../components/admin/ProductModal';
import { Chip } from '../../components/ui/Chip';
import { ProductImage } from '../../components/ui/ProductImage';
import { formatBRL } from '../../lib/format';
import { useAdminStore } from '../../store/adminStore';
import { useProductsStore } from '../../store/productsStore';
import { useUiStore } from '../../store/uiStore';
import type { CategoryName } from '../../types';

const LOW_STOCK_THRESHOLD = 8;
const FILTERS: CategoryName[] = ['Todos', 'Balas', 'Chocolates', 'Doces'];

export function Products() {
  const products = useProductsStore((s) => s.products);
  const removeProduct = useProductsStore((s) => s.removeProduct);
  const openProdModal = useAdminStore((s) => s.openProdModal);
  const showToast = useUiStore((s) => s.showToast);
  const [filter, setFilter] = useState<CategoryName>('Todos');

  const filtered = useMemo(
    () => (filter === 'Todos' ? products : products.filter((p) => p.category === filter)),
    [products, filter],
  );

  const handleDelete = (id: number, name: string) => {
    removeProduct(id);
    showToast(`${name} removido`);
  };

  return (
    <div className="animate-dc-fade-up">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <Chip key={f} active={f === filter} onClick={() => setFilter(f)}>
              {f}
            </Chip>
          ))}
        </div>
        <button
          onClick={() => openProdModal()}
          className="flex h-[46px] cursor-pointer items-center gap-2 rounded-sm border-none bg-gradient-to-br from-pink to-pink-dark px-5 font-display text-sm font-semibold text-text shadow-[0_12px_26px_-10px_rgba(255,79,160,0.6)] transition-transform active:scale-[0.97]"
        >
          <Plus size={18} strokeWidth={2.4} />
          Cadastrar produto
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-surface">
        <div className="hidden grid-cols-[3fr_1.4fr_1fr_1fr_1.2fr_0.8fr] gap-3 border-b border-white/[0.06] px-[22px] py-[15px] text-xs font-bold uppercase tracking-wide text-text-2 md:grid">
          <span>Produto</span>
          <span>Categoria</span>
          <span>Preço</span>
          <span>Estoque</span>
          <span>Status</span>
          <span className="text-right">Ações</span>
        </div>
        {filtered.map((p) => {
          const low = p.stock <= LOW_STOCK_THRESHOLD;
          const statusLabel = !p.active ? 'Inativo' : low ? 'Estoque baixo' : 'Ativo';
          const statusClass = !p.active
            ? 'bg-card-2 text-text-2'
            : low
              ? 'bg-red/[0.16] text-red'
              : 'bg-lime/[0.16] text-lime';
          return (
            <div
              key={p.id}
              className="grid grid-cols-2 items-center gap-3 border-b border-white/[0.04] px-[22px] py-3.5 transition-colors duration-150 last:border-b-0 hover:bg-card-2/40 md:grid-cols-[3fr_1.4fr_1fr_1fr_1.2fr_0.8fr]"
            >
              <div className="col-span-2 flex items-center gap-3.5 md:col-span-1">
                <ProductImage product={p} className="h-11 w-11 shrink-0 rounded-xs" />
                <span className="text-sm font-bold">{p.name}</span>
              </div>
              <span className="text-[13.5px] text-text-2">{p.category}</span>
              <span className="font-display text-sm font-bold">{formatBRL(p.price)}</span>
              <span className="text-sm">{p.stock}</span>
              <span>
                <span className={`inline-block rounded-full px-[11px] py-[5px] text-[11.5px] font-bold ${statusClass}`}>
                  {statusLabel}
                </span>
              </span>
              <div className="col-span-2 flex justify-end gap-1.5 md:col-span-1">
                <button
                  onClick={() => openProdModal(p.id)}
                  className="flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-[10px] border-none bg-card text-purple transition-colors hover:bg-card-2"
                >
                  <Pencil size={16} strokeWidth={2} />
                </button>
                <button
                  onClick={() => handleDelete(p.id, p.name)}
                  className="flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-[10px] border-none bg-card text-red transition-colors hover:bg-red/20"
                >
                  <Trash2 size={16} strokeWidth={2} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <ProductModal />
    </div>
  );
}

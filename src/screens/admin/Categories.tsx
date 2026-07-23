import { ChevronDown, ChevronUp, LayoutGrid, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { ApiError } from '../../lib/api';
import { useCategoriesStore } from '../../store/categoriesStore';
import { useProductsStore } from '../../store/productsStore';
import { useUiStore } from '../../store/uiStore';

function CategoryModal({
  editingId,
  onClose,
}: {
  editingId: string | 'new' | null;
  onClose: () => void;
}) {
  const categories = useCategoriesStore((s) => s.categories);
  const addCategory = useCategoriesStore((s) => s.addCategory);
  const renameCategory = useCategoriesStore((s) => s.renameCategory);
  const showToast = useUiStore((s) => s.showToast);
  const editing = editingId && editingId !== 'new' ? categories.find((c) => c.id === editingId) : undefined;
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(editing?.name ?? '');
  }, [editing, editingId]);

  if (!editingId) return null;
  const canSave = name.trim().length > 1;

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      if (editing) await renameCategory(editing.id, name.trim());
      else await addCategory(name.trim());
      onClose();
      showToast('Categoria salva com sucesso');
    } catch {
      showToast('Não deu pra salvar. Tenta de novo.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="animate-dc-fade fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-dc-scale-in w-full max-w-[420px] rounded-xl border border-white/[0.08] bg-surface p-[26px] shadow-[0_40px_90px_-20px_rgba(0,0,0,0.7)]"
      >
        <div className="mb-[22px] flex items-center justify-between">
          <div>
            <h2 className="font-display text-[22px] font-bold">{editing ? 'Editar categoria' : 'Nova categoria'}</h2>
            <p className="mt-1 text-[13.5px] text-text-2">Organize os tipos de doce do cardápio</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-[38px] w-[38px] cursor-pointer items-center justify-center rounded-xs border-none bg-card text-text"
          >
            <X size={18} strokeWidth={2.4} />
          </button>
        </div>

        <label className="mb-[7px] block text-[13px] font-semibold text-text-2">Nome</label>
        <div className="flex h-[52px] items-center rounded-sm border border-white/[0.07] bg-card px-[15px]">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="Ex: Bolos"
            className="min-w-0 flex-1 bg-transparent font-body text-[15px] text-text outline-none placeholder:text-text-3"
          />
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" className="flex-[1.4]" disabled={!canSave || saving} onClick={handleSave}>
            {saving ? 'Salvando...' : 'Salvar categoria'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Categories() {
  const categories = useCategoriesStore((s) => s.categories);
  const loading = useCategoriesStore((s) => s.loading);
  const fetchCategories = useCategoriesStore((s) => s.fetchCategories);
  const removeCategory = useCategoriesStore((s) => s.removeCategory);
  const swapOrder = useCategoriesStore((s) => s.swapOrder);
  const products = useProductsStore((s) => s.products);
  const fetchProducts = useProductsStore((s) => s.fetchProducts);
  const showToast = useUiStore((s) => s.showToast);
  const [modalId, setModalId] = useState<string | 'new' | null>(null);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [fetchCategories, fetchProducts]);

  const productCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) {
      if (!p.categoryId) continue;
      map.set(p.categoryId, (map.get(p.categoryId) ?? 0) + 1);
    }
    return map;
  }, [products]);

  const handleDelete = async (id: string, name: string) => {
    try {
      await removeCategory(id);
      showToast(`${name} removida`);
    } catch (e) {
      if (e instanceof ApiError && e.code === 'CATEGORY_IN_USE') {
        showToast('Essa categoria tem produtos vinculados. Mova ou remova os produtos antes.', 'error');
      } else {
        showToast('Não deu pra remover essa categoria.', 'error');
      }
    }
  };

  return (
    <div className="animate-dc-fade-up">
      <div className="mb-4 flex items-center justify-end">
        <button
          onClick={() => setModalId('new')}
          className="flex h-[46px] cursor-pointer items-center gap-2 rounded-sm border-none bg-gradient-to-br from-pink to-pink-dark px-5 font-display text-sm font-semibold text-text shadow-[0_12px_26px_-10px_rgba(255,79,160,0.6)] transition-transform active:scale-[0.97]"
        >
          <Plus size={18} strokeWidth={2.4} />
          Nova categoria
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-surface">
        <div className="hidden grid-cols-[3fr_1fr_1fr] gap-3 border-b border-white/[0.06] px-[22px] py-[15px] text-xs font-bold uppercase tracking-wide text-text-2 md:grid">
          <span>Categoria</span>
          <span>Produtos</span>
          <span className="text-right">Ações</span>
        </div>

        {loading && categories.length === 0 && (
          <div className="px-[22px]">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="grid grid-cols-2 items-center gap-3 border-b border-white/[0.04] py-3.5 last:border-b-0 md:grid-cols-[3fr_1fr_1fr]"
              >
                <Skeleton className="col-span-2 h-4 w-32 md:col-span-1" />
                <Skeleton className="hidden h-3.5 w-10 md:block" />
                <Skeleton className="hidden h-8 w-16 justify-self-end md:block" />
              </div>
            ))}
          </div>
        )}

        {!loading && categories.length === 0 && (
          <div className="flex flex-col items-center px-[22px] py-16 text-center">
            <div className="mb-4 flex h-[64px] w-[64px] items-center justify-center rounded-xl bg-card">
              <LayoutGrid size={28} strokeWidth={1.7} className="text-card-2" />
            </div>
            <h3 className="mb-1 font-display text-lg font-bold">Nenhuma categoria ainda</h3>
            <p className="max-w-[320px] text-sm text-text-2">Crie categorias para organizar o cardápio, como "Doces" ou "Bolos".</p>
          </div>
        )}

        {categories.map((c, i) => (
          <div
            key={c.id}
            className="grid grid-cols-2 items-center gap-3 border-b border-white/[0.04] px-[22px] py-3.5 transition-colors duration-150 last:border-b-0 hover:bg-card-2/40 md:grid-cols-[3fr_1fr_1fr]"
          >
            <div className="col-span-2 flex items-center gap-3 md:col-span-1">
              <div className="flex flex-col">
                <button
                  disabled={i === 0}
                  onClick={() => swapOrder(c.id, categories[i - 1].id)}
                  className="flex h-4 w-5 cursor-pointer items-center justify-center text-text-2 transition-colors hover:text-text disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronUp size={14} strokeWidth={2.4} />
                </button>
                <button
                  disabled={i === categories.length - 1}
                  onClick={() => swapOrder(c.id, categories[i + 1].id)}
                  className="flex h-4 w-5 cursor-pointer items-center justify-center text-text-2 transition-colors hover:text-text disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronDown size={14} strokeWidth={2.4} />
                </button>
              </div>
              <span className="text-sm font-bold">{c.name}</span>
            </div>
            <span className="text-[13.5px] text-text-2">{productCount.get(c.id) ?? 0} produtos</span>
            <div className="col-span-2 flex justify-end gap-1.5 md:col-span-1">
              <button
                onClick={() => setModalId(c.id)}
                className="flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-[10px] border-none bg-card text-purple transition-colors hover:bg-card-2"
              >
                <Pencil size={16} strokeWidth={2} />
              </button>
              <button
                onClick={() => handleDelete(c.id, c.name)}
                className="flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-[10px] border-none bg-card text-red transition-colors hover:bg-red/20"
              >
                <Trash2 size={16} strokeWidth={2} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <CategoryModal editingId={modalId} onClose={() => setModalId(null)} />
    </div>
  );
}

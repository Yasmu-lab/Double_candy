import { ImagePlus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Switch } from '../ui/Switch';
import { useAdminStore } from '../../store/adminStore';
import { useCategoriesStore } from '../../store/categoriesStore';
import { useProductsStore } from '../../store/productsStore';
import { useUiStore } from '../../store/uiStore';

export function ProductModal() {
  const open = useAdminStore((s) => s.prodModalOpen);
  const editingId = useAdminStore((s) => s.editingProductId);
  const closeProdModal = useAdminStore((s) => s.closeProdModal);
  const products = useProductsStore((s) => s.products);
  const addProduct = useProductsStore((s) => s.addProduct);
  const updateProduct = useProductsStore((s) => s.updateProduct);
  const categories = useCategoriesStore((s) => s.categories);
  const showToast = useUiStore((s) => s.showToast);

  const editing = editingId != null ? products.find((p) => p.id === editingId) : undefined;

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? '');
    setCategoryId(editing?.categoryId ?? categories[0]?.id ?? '');
    setPrice(editing ? (editing.priceCents / 100).toFixed(2).replace('.', ',') : '');
    setStock(editing ? String(editing.stock) : '');
    setActive(editing?.active ?? true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingId]);

  if (!open) return null;

  const priceCents = Math.round(Number(price.replace(',', '.')) * 100);
  const canSave = name.trim().length > 1 && priceCents > 0;

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      const input = {
        name: name.trim(),
        categoryId: categoryId || null,
        priceCents,
        stock: Number(stock) || 0,
        active,
      };
      if (editing) await updateProduct(editing.id, input);
      else await addProduct(input);
      closeProdModal();
      showToast('Produto salvo com sucesso');
    } catch {
      showToast('Não deu pra salvar. Tenta de novo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onClick={closeProdModal}
      className="animate-dc-fade fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="dc-scroll animate-dc-scale-in max-h-[90vh] w-full max-w-[520px] overflow-y-auto rounded-xl border border-white/[0.08] bg-surface p-[26px] shadow-[0_40px_90px_-20px_rgba(0,0,0,0.7)]"
      >
        <div className="mb-[22px] flex items-center justify-between">
          <div>
            <h2 className="font-display text-[22px] font-bold">{editing ? 'Editar produto' : 'Cadastrar produto'}</h2>
            <p className="mt-1 text-[13.5px] text-text-2">Preencha os dados do doce</p>
          </div>
          <button
            onClick={closeProdModal}
            className="flex h-[38px] w-[38px] cursor-pointer items-center justify-center rounded-xs border-none bg-card text-text"
          >
            <X size={18} strokeWidth={2.4} />
          </button>
        </div>

        <div className="mb-[18px] flex h-[150px] flex-col items-center justify-center gap-2 rounded-md bg-card text-text-2">
          <ImagePlus size={28} strokeWidth={1.6} className="opacity-60" />
          <span className="text-[13px]">Arraste a foto do produto</span>
        </div>

        <div className="flex flex-col gap-3.5">
          <div>
            <label className="mb-[7px] block text-[13px] font-semibold text-text-2">Nome</label>
            <div className="flex h-[52px] items-center rounded-sm border border-white/[0.07] bg-card px-[15px]">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Brigadeiro gourmet"
                className="min-w-0 flex-1 bg-transparent font-body text-[15px] text-text outline-none placeholder:text-text-3"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-[7px] block text-[13px] font-semibold text-text-2">Categoria</label>
              <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex-1">
              <label className="mb-[7px] block text-[13px] font-semibold text-text-2">Preço</label>
              <div className="flex h-[52px] items-center gap-1.5 rounded-sm border border-white/[0.07] bg-card px-[15px]">
                <span className="text-[15px] text-text-2">R$</span>
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0,00"
                  inputMode="decimal"
                  className="min-w-0 flex-1 bg-transparent font-body text-[15px] text-text outline-none placeholder:text-text-3"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="mb-[7px] block text-[13px] font-semibold text-text-2">Estoque</label>
            <div className="flex h-[52px] items-center rounded-sm border border-white/[0.07] bg-card px-[15px]">
              <input
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="Quantidade disponível"
                inputMode="numeric"
                className="min-w-0 flex-1 bg-transparent font-body text-[15px] text-text outline-none placeholder:text-text-3"
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-sm bg-card px-4 py-3.5">
            <div>
              <div className="text-sm font-semibold">Produto ativo</div>
              <div className="mt-0.5 text-[12.5px] text-text-2">Visível no cardápio</div>
            </div>
            <Switch checked={active} onChange={setActive} />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={closeProdModal}>
            Cancelar
          </Button>
          <Button variant="primary" className="flex-[1.4]" disabled={!canSave || saving} onClick={handleSave}>
            {saving ? 'Salvando...' : 'Salvar produto'}
          </Button>
        </div>
      </div>
    </div>
  );
}

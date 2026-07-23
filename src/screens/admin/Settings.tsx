import { Store } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { api } from '../../lib/api';
import { useUiStore } from '../../store/uiStore';

type StoreData = Awaited<ReturnType<typeof api.getStore>>;

export function Settings() {
  const showToast = useUiStore((s) => s.showToast);
  const [store, setStore] = useState<StoreData | null>(null);
  const [name, setName] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupCutoffMinutes, setPickupCutoffMinutes] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const loadStore = () => {
    setLoadError(false);
    api
      .getStore()
      .then((s) => {
        setStore(s);
        setName(s.name);
        setPickupLocation(s.pickupLocation ?? '');
        setPickupCutoffMinutes(String(s.pickupCutoffMinutes));
      })
      .catch(() => setLoadError(true));
  };

  useEffect(() => {
    loadStore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loadError) {
    return (
      <div className="max-w-[560px] rounded-xl border border-white/[0.06] bg-surface p-[26px] text-center">
        <p className="text-sm text-text-2">Não deu pra carregar as configurações.</p>
        <Button variant="outline" className="mt-4" onClick={loadStore}>
          Tentar de novo
        </Button>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="max-w-[560px]">
        <div className="rounded-xl border border-white/[0.06] bg-surface p-[26px]">
          <div className="mb-[22px] flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-[13px]" />
            <Skeleton className="h-5 w-40" />
          </div>
          <Skeleton className="mb-2 h-3.5 w-24" />
          <Skeleton className="h-[52px] w-full rounded-sm" />
          <Skeleton className="mb-2 mt-5 h-3.5 w-24" />
          <Skeleton className="h-[52px] w-full rounded-sm" />
          <Skeleton className="mb-2 mt-5 h-3.5 w-32" />
          <Skeleton className="h-[52px] w-full rounded-sm" />
          <Skeleton className="mt-6 h-[52px] w-full rounded-md" />
        </div>
      </div>
    );
  }

  const canSave = name.trim().length > 1 && Number(pickupCutoffMinutes) >= 0;

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await api.updateStore({
        name: name.trim(),
        pickupLocation: pickupLocation.trim(),
        pickupCutoffMinutes: Number(pickupCutoffMinutes),
      });
      showToast('Configurações salvas com sucesso');
    } catch {
      showToast('Não deu pra salvar. Tenta de novo.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-dc-fade-up max-w-[560px]">
      <div className="rounded-xl border border-white/[0.06] bg-surface p-[26px]">
        <div className="mb-[22px] flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-gradient-to-br from-pink to-purple">
            <Store size={18} strokeWidth={2.2} className="text-text" />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold">Dados da loja</h2>
            <p className="text-[13px] text-text-2">Essas informações aparecem para os clientes</p>
          </div>
        </div>

        <div className="flex flex-col gap-3.5">
          <div>
            <label className="mb-[7px] block text-[13px] font-semibold text-text-2">Nome da loja</label>
            <div className="flex h-[52px] items-center rounded-sm border border-white/[0.07] bg-card px-[15px]">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Double Candy"
                className="min-w-0 flex-1 bg-transparent font-body text-base text-text outline-none placeholder:text-text-3"
              />
            </div>
          </div>
          <div>
            <label className="mb-[7px] block text-[13px] font-semibold text-text-2">Local de retirada</label>
            <div className="flex h-[52px] items-center rounded-sm border border-white/[0.07] bg-card px-[15px]">
              <input
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                placeholder="Ex: Double Candy, bloco A"
                className="min-w-0 flex-1 bg-transparent font-body text-base text-text outline-none placeholder:text-text-3"
              />
            </div>
          </div>
          <div>
            <label className="mb-[7px] block text-[13px] font-semibold text-text-2">Tolerância antes da retirada (minutos)</label>
            <div className="flex h-[52px] items-center rounded-sm border border-white/[0.07] bg-card px-[15px]">
              <input
                value={pickupCutoffMinutes}
                onChange={(e) => setPickupCutoffMinutes(e.target.value.replace(/\D/g, ''))}
                placeholder="15"
                inputMode="numeric"
                className="min-w-0 flex-1 bg-transparent font-body text-base text-text outline-none placeholder:text-text-3"
              />
            </div>
            <p className="mt-1.5 text-[12.5px] text-text-2">
              Tempo mínimo de antecedência exigido para um pedido ser preparado a tempo da retirada.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="primary" disabled={!canSave || saving} onClick={handleSave}>
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </div>
      </div>
    </div>
  );
}

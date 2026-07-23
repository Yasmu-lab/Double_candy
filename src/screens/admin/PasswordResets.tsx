import { Check, Copy, KeyRound, Phone, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { api, ApiError, type PasswordResetRequestDto } from '../../lib/api';
import { formatRelativeDate } from '../../lib/format';
import { useUiStore } from '../../store/uiStore';

export function PasswordResets() {
  const [requests, setRequests] = useState<PasswordResetRequestDto[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const showToast = useUiStore((s) => s.showToast);

  const load = () => {
    api
      .getPasswordResetRequests()
      .then(setRequests)
      .catch(() => setRequests([]));
  };

  useEffect(() => {
    load();
  }, []);

  const resolve = async (id: string) => {
    setBusyId(id);
    try {
      const { tempPassword } = await api.resolvePasswordReset(id);
      setRevealed((r) => ({ ...r, [id]: tempPassword }));
      showToast('Senha redefinida! Copie e repasse pro cliente.');
      load();
    } catch (e) {
      showToast(e instanceof ApiError && e.code === 'CUSTOMER_NOT_FOUND' ? 'Não achamos uma conta com esse telefone.' : 'Não deu pra redefinir a senha.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const dismiss = async (id: string) => {
    setBusyId(id);
    try {
      await api.dismissPasswordReset(id);
      showToast('Pedido dispensado.');
      load();
    } catch {
      showToast('Não deu pra dispensar o pedido.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const copyPassword = async (password: string) => {
    try {
      await navigator.clipboard.writeText(password);
      showToast('Senha copiada!');
    } catch {
      showToast('Não deu pra copiar. Copie manualmente.', 'error');
    }
  };

  if (!requests) {
    return (
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-md border border-white/[0.06] bg-surface px-[18px] py-[15px]">
            <div className="flex items-center gap-3.5">
              <Skeleton className="h-11 w-11 shrink-0 rounded-xs" />
              <div className="flex-1">
                <Skeleton className="mb-2 h-4 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="animate-dc-fade-up rounded-xl border border-white/[0.06] bg-surface">
        <EmptyState
          icon={<KeyRound size={36} strokeWidth={1.8} />}
          title="Nenhum pedido de recuperação"
          description="Quando alguém esquecer a senha e pedir ajuda, o pedido aparece aqui."
        />
      </div>
    );
  }

  return (
    <div className="animate-dc-fade-up flex flex-col gap-3">
      {requests.map((r) => (
        <div
          key={r.id}
          className="flex flex-col gap-3.5 rounded-md border border-white/[0.06] bg-surface px-[18px] py-[15px] transition-colors duration-200 hover:bg-card-2/30"
        >
          <div className="flex flex-wrap items-center justify-between gap-3.5">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xs bg-card font-display text-sm font-bold text-purple">
                {(r.customerName ?? '??').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-[14.5px] font-bold">{r.customerName ?? 'Cliente não encontrado'}</div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-text-2">
                  <Phone size={13} strokeWidth={2} />
                  {r.phone} · {formatRelativeDate(r.createdAt)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              {r.status === 'pending' && (
                <Badge tone="purple" icon={<KeyRound size={12} strokeWidth={2.4} />}>
                  Pendente
                </Badge>
              )}
              {r.status === 'resolved' && (
                <Badge tone="lime" icon={<Check size={12} strokeWidth={2.4} />}>
                  Resolvido
                </Badge>
              )}
              {r.status === 'dismissed' && (
                <Badge tone="neutral" icon={<X size={12} strokeWidth={2.4} />}>
                  Dispensado
                </Badge>
              )}
              {r.status === 'pending' && (
                <>
                  <Button
                    variant="success"
                    size="sm"
                    disabled={busyId === r.id}
                    onClick={() => resolve(r.id)}
                  >
                    {busyId === r.id ? 'Redefinindo...' : 'Redefinir senha'}
                  </Button>
                  <Button variant="danger" size="sm" disabled={busyId === r.id} onClick={() => dismiss(r.id)}>
                    Dispensar
                  </Button>
                </>
              )}
            </div>
          </div>

          {revealed[r.id] && (
            <div className="flex flex-wrap items-center gap-3 rounded-sm border border-lime/30 bg-lime/[0.08] px-3.5 py-3">
              <span className="text-[12.5px] font-semibold text-text-2">Senha temporária:</span>
              <code className="font-display text-sm font-bold tracking-wide text-lime">{revealed[r.id]}</code>
              <button
                onClick={() => copyPassword(revealed[r.id])}
                className="ml-auto flex cursor-pointer items-center gap-1.5 rounded-xs bg-card-2 px-2.5 py-1.5 text-[12px] font-semibold text-text transition-colors hover:bg-[#453769]"
              >
                <Copy size={13} strokeWidth={2} />
                Copiar
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

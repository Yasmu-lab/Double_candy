import { Check, X } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';

export function ToastHost() {
  const toast = useUiStore((s) => s.toast);
  if (!toast) return null;
  const isError = toast.type === 'error';
  return (
    <div className="pointer-events-none fixed top-5 left-5 right-5 z-[60] flex justify-center" role="status" aria-live="polite">
      <div
        key={toast.id}
        className={[
          'animate-dc-toast-in pointer-events-auto flex max-w-full items-center gap-3 rounded-md border bg-surface/95 px-4 py-3.5 shadow-[0_16px_40px_-10px_rgba(0,0,0,0.6)] backdrop-blur-lg',
          isError ? 'border-red/30' : 'border-lime/30',
        ].join(' ')}
      >
        <span
          className={[
            'flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px]',
            isError ? 'bg-red/[0.16]' : 'bg-lime/[0.16]',
          ].join(' ')}
        >
          {isError ? (
            <X size={17} strokeWidth={2.6} className="text-red" />
          ) : (
            <Check size={17} strokeWidth={2.6} className="text-lime" />
          )}
        </span>
        <span className="text-sm font-semibold">{toast.message}</span>
      </div>
    </div>
  );
}

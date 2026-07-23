import { create } from 'zustand';

export type ToastType = 'success' | 'error';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface UiState {
  cartOpen: boolean;
  deskConfirmed: boolean;
  toast: Toast | null;
  focusSearchSignal: number;
  openCart: () => void;
  closeCart: () => void;
  setDeskConfirmed: (v: boolean) => void;
  showToast: (message: string, type?: ToastType) => void;
  requestSearchFocus: () => void;
}

let toastSeq = 0;
let toastTimer: ReturnType<typeof setTimeout> | undefined;

export const useUiStore = create<UiState>()((set) => ({
  cartOpen: false,
  deskConfirmed: false,
  toast: null,
  focusSearchSignal: 0,
  openCart: () => set({ cartOpen: true, deskConfirmed: false }),
  closeCart: () => set({ cartOpen: false, deskConfirmed: false }),
  setDeskConfirmed: (v) => set({ deskConfirmed: v }),
  showToast: (message, type = 'success') => {
    toastSeq += 1;
    const id = toastSeq;
    set({ toast: { id, message, type } });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      set((state) => (state.toast?.id === id ? { toast: null } : state));
    }, 1900);
  },
  requestSearchFocus: () => set((state) => ({ focusSearchSignal: state.focusSearchSignal + 1 })),
}));

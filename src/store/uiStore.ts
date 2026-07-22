import { create } from 'zustand';

interface Toast {
  id: number;
  message: string;
}

interface UiState {
  cartOpen: boolean;
  deskConfirmed: boolean;
  toast: Toast | null;
  openCart: () => void;
  closeCart: () => void;
  setDeskConfirmed: (v: boolean) => void;
  showToast: (message: string) => void;
}

let toastSeq = 0;
let toastTimer: ReturnType<typeof setTimeout> | undefined;

export const useUiStore = create<UiState>()((set) => ({
  cartOpen: false,
  deskConfirmed: false,
  toast: null,
  openCart: () => set({ cartOpen: true, deskConfirmed: false }),
  closeCart: () => set({ cartOpen: false, deskConfirmed: false }),
  setDeskConfirmed: (v) => set({ deskConfirmed: v }),
  showToast: (message) => {
    toastSeq += 1;
    const id = toastSeq;
    set({ toast: { id, message } });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      set((state) => (state.toast?.id === id ? { toast: null } : state));
    }, 1900);
  },
}));

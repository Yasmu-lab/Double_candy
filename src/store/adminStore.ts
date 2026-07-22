import { create } from 'zustand';

interface AdminState {
  prepSeparated: Record<string, boolean>;
  togglePrep: (key: string) => void;
  setAllPrep: (keys: string[], value: boolean) => void;

  pickupQuery: string;
  setPickupQuery: (q: string) => void;
  pickupSelId: string | null;
  setPickupSelId: (id: string) => void;
  deliveredAnim: boolean;
  triggerDeliveredAnim: () => void;

  openOrderId: string | null;
  setOpenOrderId: (id: string) => void;

  prodModalOpen: boolean;
  editingProductId: string | null;
  openProdModal: (productId?: string) => void;
  closeProdModal: () => void;
}

let deliveredAnimTimer: ReturnType<typeof setTimeout> | undefined;

export const useAdminStore = create<AdminState>()((set) => ({
  prepSeparated: {},
  togglePrep: (key) =>
    set((state) => ({ prepSeparated: { ...state.prepSeparated, [key]: !state.prepSeparated[key] } })),
  setAllPrep: (keys, value) =>
    set(() => ({ prepSeparated: Object.fromEntries(keys.map((k) => [k, value])) })),

  pickupQuery: '',
  setPickupQuery: (q) => set({ pickupQuery: q }),
  pickupSelId: null,
  setPickupSelId: (id) => set({ pickupSelId: id }),
  deliveredAnim: false,
  triggerDeliveredAnim: () => {
    set({ deliveredAnim: true });
    clearTimeout(deliveredAnimTimer);
    deliveredAnimTimer = setTimeout(() => set({ deliveredAnim: false }), 1900);
  },

  openOrderId: null,
  setOpenOrderId: (id) => set({ openOrderId: id }),

  prodModalOpen: false,
  editingProductId: null,
  openProdModal: (productId) => set({ prodModalOpen: true, editingProductId: productId ?? null }),
  closeProdModal: () => set({ prodModalOpen: false, editingProductId: null }),
}));

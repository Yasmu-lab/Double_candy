import { useMemo } from 'react';
import { create } from 'zustand';
import { api } from '../lib/api';
import { useProductsStore } from './productsStore';
import type { CartLine, PaymentMethod, Product } from '../types';

interface CartState {
  items: Record<string, number>;
  payment: PaymentMethod;
  note: string;
  hydrated: boolean;
  addItem: (productId: string, qty?: number) => void;
  incItem: (productId: string) => void;
  decItem: (productId: string) => void;
  setPayment: (method: PaymentMethod) => void;
  setNote: (note: string) => void;
  clear: () => void;
  hydrate: () => Promise<void>;
  resetLocal: () => void;
}

// Debounced per-product so a burst of +/- clicks collapses into one request instead of
// spamming the API — only the final quantity after the pause actually gets persisted.
const persistTimers: Record<string, ReturnType<typeof setTimeout>> = {};
function persistQty(productId: string, qty: number) {
  clearTimeout(persistTimers[productId]);
  persistTimers[productId] = setTimeout(() => {
    api.setCartItem(productId, qty).catch(() => {});
  }, 400);
}

export const useCartStore = create<CartState>()((set, get) => ({
  items: {},
  payment: 'pix',
  note: '',
  hydrated: false,
  addItem: (productId, qty = 1) => {
    const next = (get().items[productId] ?? 0) + qty;
    set((state) => ({ items: { ...state.items, [productId]: next } }));
    persistQty(productId, next);
  },
  incItem: (productId) => {
    const next = (get().items[productId] ?? 0) + 1;
    set((state) => ({ items: { ...state.items, [productId]: next } }));
    persistQty(productId, next);
  },
  decItem: (productId) => {
    const next = (get().items[productId] ?? 0) - 1;
    set((state) => {
      const items = { ...state.items };
      if (next <= 0) delete items[productId];
      else items[productId] = next;
      return { items };
    });
    persistQty(productId, Math.max(0, next));
  },
  setPayment: (payment) => set({ payment }),
  setNote: (note) => set({ note }),
  clear: () => {
    set({ items: {}, note: '' });
    api.clearCart().catch(() => {});
  },
  // Cart lives server-side per customer, so a fresh login on any device picks up where the
  // customer left off. Called once when the auth session settles (see App.tsx).
  hydrate: async () => {
    try {
      const serverItems = await api.getCart();
      set({ items: Object.fromEntries(serverItems.map((i) => [i.productId, i.qty])), hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },
  // Clears the local view on logout without touching the server rows, so the next login
  // (same or different customer, same device) starts from a clean slate until hydrate() runs.
  resetLocal: () => set({ items: {}, note: '', hydrated: false }),
}));

function computeLines(items: Record<string, number>, products: Product[]): CartLine[] {
  if (products.length === 0) return [];
  const byId = new Map(products.map((p) => [p.id, p]));
  return Object.entries(items)
    .map(([id, qty]) => {
      const product = byId.get(id);
      return product && qty > 0 ? { product, qty } : null;
    })
    .filter((line): line is CartLine => line !== null);
}

// `items` and `products` are both stable state fields (only reassigned via
// their store's set()), so this selector never allocates — safe to use
// directly. The derived array is memoized off of both so consumers get a
// stable reference instead of a fresh one every render (a fresh array from a
// selector trips useSyncExternalStore's tearing check and causes an
// infinite render loop).
export function useCartLines(): CartLine[] {
  const items = useCartStore((s) => s.items);
  const products = useProductsStore((s) => s.products);
  return useMemo(() => computeLines(items, products), [items, products]);
}

export function useCartCount(): number {
  const lines = useCartLines();
  return useMemo(() => lines.reduce((sum, l) => sum + l.qty, 0), [lines]);
}

export function useCartSubtotalCents(): number {
  const lines = useCartLines();
  return useMemo(() => lines.reduce((sum, l) => sum + l.product.priceCents * l.qty, 0), [lines]);
}

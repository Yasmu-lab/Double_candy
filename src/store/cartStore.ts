import { useMemo } from 'react';
import { create } from 'zustand';
import { findProduct } from '../data/products';
import type { CartLine, PaymentMethod } from '../types';

interface CartState {
  items: Record<number, number>;
  payment: PaymentMethod;
  note: string;
  addItem: (productId: number, qty?: number) => void;
  incItem: (productId: number) => void;
  decItem: (productId: number) => void;
  setPayment: (method: PaymentMethod) => void;
  setNote: (note: string) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()((set) => ({
  items: {},
  payment: 'pix',
  note: '',
  addItem: (productId, qty = 1) =>
    set((state) => ({
      items: { ...state.items, [productId]: (state.items[productId] ?? 0) + qty },
    })),
  incItem: (productId) =>
    set((state) => ({
      items: { ...state.items, [productId]: (state.items[productId] ?? 0) + 1 },
    })),
  decItem: (productId) =>
    set((state) => {
      const next = (state.items[productId] ?? 0) - 1;
      const items = { ...state.items };
      if (next <= 0) delete items[productId];
      else items[productId] = next;
      return { items };
    }),
  setPayment: (payment) => set({ payment }),
  setNote: (note) => set({ note }),
  clear: () => set({ items: {}, note: '' }),
}));

function computeLines(items: Record<number, number>): CartLine[] {
  return Object.entries(items)
    .map(([id, qty]) => {
      const product = findProduct(Number(id));
      return product && qty > 0 ? { product, qty } : null;
    })
    .filter((line): line is CartLine => line !== null);
}

// `items` is the raw stable state field, so this selector never allocates —
// safe to use directly. The derived array/number values are memoized off of
// it so consumers get a stable reference instead of a fresh one every render
// (a fresh array/object from a selector trips useSyncExternalStore's tearing
// check and causes an infinite render loop).
export function useCartLines(): CartLine[] {
  const items = useCartStore((s) => s.items);
  return useMemo(() => computeLines(items), [items]);
}

export function useCartCount(): number {
  const lines = useCartLines();
  return useMemo(() => lines.reduce((sum, l) => sum + l.qty, 0), [lines]);
}

export function useCartSubtotal(): number {
  const lines = useCartLines();
  return useMemo(() => lines.reduce((sum, l) => sum + l.product.price * l.qty, 0), [lines]);
}

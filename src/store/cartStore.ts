import { useMemo } from 'react';
import { create } from 'zustand';
import { useProductsStore } from './productsStore';
import type { CartLine, PaymentMethod, Product } from '../types';

interface CartState {
  items: Record<string, number>;
  payment: PaymentMethod;
  note: string;
  addItem: (productId: string, qty?: number) => void;
  incItem: (productId: string) => void;
  decItem: (productId: string) => void;
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

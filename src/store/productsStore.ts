import { create } from 'zustand';
import { api } from '../lib/api';
import type { Product } from '../types';

interface NewProductInput {
  name: string;
  categoryId: string | null;
  priceCents: number;
  stock: number;
  active: boolean;
}

interface ProductsState {
  products: Product[];
  loading: boolean;
  error: string | null;
  fetched: boolean;
  fetchProducts: (opts?: { force?: boolean }) => Promise<void>;
  addProduct: (input: NewProductInput) => Promise<void>;
  updateProduct: (id: string, input: Partial<NewProductInput>) => Promise<void>;
  removeProduct: (id: string) => Promise<void>;
}

export const useProductsStore = create<ProductsState>()((set, get) => ({
  products: [],
  loading: false,
  error: null,
  fetched: false,
  fetchProducts: async (opts) => {
    if ((get().fetched && !opts?.force) || get().loading) return;
    set({ loading: true, error: null });
    try {
      const products = await api.getProducts();
      set({ products, loading: false, fetched: true });
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : String(e) });
    }
  },
  addProduct: async (input) => {
    await api.createProduct(input);
    await get().fetchProducts({ force: true });
  },
  updateProduct: async (id, input) => {
    await api.updateProduct(id, input);
    await get().fetchProducts({ force: true });
  },
  removeProduct: async (id) => {
    await api.deleteProduct(id);
    await get().fetchProducts({ force: true });
  },
}));

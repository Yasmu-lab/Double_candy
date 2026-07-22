import { create } from 'zustand';
import { api } from '../lib/api';
import type { Category } from '../types';

interface CategoriesState {
  categories: Category[];
  loading: boolean;
  fetched: boolean;
  fetchCategories: (opts?: { force?: boolean }) => Promise<void>;
  addCategory: (name: string) => Promise<void>;
  renameCategory: (id: string, name: string) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;
  swapOrder: (idA: string, idB: string) => Promise<void>;
}

export const useCategoriesStore = create<CategoriesState>()((set, get) => ({
  categories: [],
  loading: false,
  fetched: false,
  fetchCategories: async (opts) => {
    if ((get().fetched && !opts?.force) || get().loading) return;
    set({ loading: true });
    try {
      const categories = await api.getCategories();
      set({ categories, loading: false, fetched: true });
    } catch {
      set({ loading: false });
    }
  },
  addCategory: async (name) => {
    await api.createCategory({ name });
    await get().fetchCategories({ force: true });
  },
  renameCategory: async (id, name) => {
    await api.updateCategory(id, { name });
    await get().fetchCategories({ force: true });
  },
  removeCategory: async (id) => {
    await api.deleteCategory(id);
    await get().fetchCategories({ force: true });
  },
  swapOrder: async (idA, idB) => {
    const { categories } = get();
    const a = categories.find((c) => c.id === idA);
    const b = categories.find((c) => c.id === idB);
    if (!a || !b) return;
    await Promise.all([
      api.updateCategory(a.id, { sortOrder: b.sortOrder }),
      api.updateCategory(b.id, { sortOrder: a.sortOrder }),
    ]);
    await get().fetchCategories({ force: true });
  },
}));

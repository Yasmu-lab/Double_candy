import { create } from 'zustand';
import { api } from '../lib/api';
import type { Category } from '../types';

interface CategoriesState {
  categories: Category[];
  loading: boolean;
  fetched: boolean;
  fetchCategories: () => Promise<void>;
}

export const useCategoriesStore = create<CategoriesState>()((set, get) => ({
  categories: [],
  loading: false,
  fetched: false,
  fetchCategories: async () => {
    if (get().fetched || get().loading) return;
    set({ loading: true });
    try {
      const categories = await api.getCategories();
      set({ categories, loading: false, fetched: true });
    } catch {
      set({ loading: false });
    }
  },
}));

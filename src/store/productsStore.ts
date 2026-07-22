import { create } from 'zustand';
import { PRODUCTS } from '../data/products';
import type { Product } from '../types';

interface NewProductInput {
  name: string;
  category: Product['category'];
  price: number;
  stock: number;
  active: boolean;
}

interface ProductsState {
  products: (Product & { active: boolean })[];
  addProduct: (input: NewProductInput) => void;
  updateProduct: (id: number, input: NewProductInput) => void;
  removeProduct: (id: number) => void;
}

const TINTS = [
  'linear-gradient(135deg,#9B6BFF,#6b3fd6)',
  'linear-gradient(135deg,#FFA347,#e6842a)',
  'linear-gradient(135deg,#FF4FA0,#E63B8C)',
  'linear-gradient(135deg,#C6FF4D,#8fbf20)',
  'linear-gradient(135deg,#FF5C6C,#E63B8C)',
];

let nextId = Math.max(...PRODUCTS.map((p) => p.id)) + 1;

export const useProductsStore = create<ProductsState>()((set) => ({
  products: PRODUCTS.map((p) => ({ ...p, active: true })),
  addProduct: (input) =>
    set((state) => ({
      products: [
        ...state.products,
        {
          id: nextId++,
          name: input.name,
          category: input.category,
          price: input.price,
          stock: input.stock,
          rating: 5,
          tint: TINTS[state.products.length % TINTS.length],
          promo: false,
          best: false,
          desc: '',
          active: input.active,
        },
      ],
    })),
  updateProduct: (id, input) =>
    set((state) => ({
      products: state.products.map((p) => (p.id === id ? { ...p, ...input } : p)),
    })),
  removeProduct: (id) =>
    set((state) => ({ products: state.products.filter((p) => p.id !== id) })),
}));

import { create } from 'zustand';
import { api } from '../lib/api';
import type { CartLine, Order, OrderStatus, PaymentMethod } from '../types';

const payLabelMap: Record<PaymentMethod, string> = {
  pix: 'Pix',
  cash: 'Dinheiro',
};

interface OrderState {
  orders: Order[];
  loading: boolean;
  error: string | null;
  lastOrder: Order | null;
  fetchMine: () => Promise<void>;
  fetchAll: () => Promise<void>;
  placeOrder: (lines: CartLine[], payment: PaymentMethod, note: string) => Promise<Order>;
  setStatus: (id: string, status: OrderStatus, opts?: { cancelledBy?: string; reason?: string }) => Promise<void>;
}

export const useOrderStore = create<OrderState>()((set) => ({
  orders: [],
  loading: false,
  error: null,
  lastOrder: null,
  fetchMine: async () => {
    set({ loading: true, error: null });
    try {
      const orders = await api.getMyOrders();
      set({ orders, loading: false });
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : String(e) });
    }
  },
  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const orders = await api.getOrders();
      set({ orders, loading: false });
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : String(e) });
    }
  },
  placeOrder: async (lines, payment, note) => {
    const order = await api.createOrder({
      paymentMethod: payment,
      note: note || undefined,
      items: lines.map((l) => ({ productId: l.product.id, qty: l.qty })),
    });
    set((state) => ({ orders: [order, ...state.orders], lastOrder: order }));
    return order;
  },
  setStatus: async (id, status, opts) => {
    await api.setOrderStatus(id, status, opts);
    set((state) => ({
      orders: state.orders.map((o) => (o.id === id ? { ...o, status } : o)),
    }));
  },
}));

export const paymentLabel = (method: PaymentMethod) => payLabelMap[method];

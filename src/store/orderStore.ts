import { create } from 'zustand';
import type { CartLine, Order, PaymentMethod } from '../types';

const seedOrders: Order[] = [
  {
    id: '#DC-2044',
    createdAt: 'Hoje · 15h',
    pickupLabel: 'Hoje · 15h',
    lines: [
      { productId: 6, name: 'Trufa de Morango', qty: 2, price: 6.5 },
      { productId: 7, name: 'Chiclete Bomba', qty: 2, price: 1.5 },
    ],
    total: 16.0,
    payment: 'pix',
    status: 'Entregue',
  },
  {
    id: '#DC-2039',
    createdAt: 'Ontem',
    pickupLabel: 'Ontem · 12h',
    lines: [{ productId: 3, name: 'Pirulito Espiral', qty: 3, price: 2.0 }],
    total: 6.0,
    payment: 'dinheiro',
    status: 'Cancelado',
  },
];

const payLabel: Record<PaymentMethod, string> = {
  pix: 'Pix',
  dinheiro: 'Dinheiro',
  cartao: 'Cartão',
};

interface OrderState {
  orders: Order[];
  lastOrder: Order | null;
  placeOrder: (lines: CartLine[], total: number, payment: PaymentMethod, note: string) => Order;
}

let seq = 2048;

export const useOrderStore = create<OrderState>()((set) => ({
  orders: seedOrders,
  lastOrder: null,
  placeOrder: (lines, total, payment, note) => {
    seq += 1;
    const order: Order = {
      id: `#DC-${seq}`,
      createdAt: 'agora',
      pickupLabel: 'Amanhã · 12h',
      lines: lines.map((l) => ({
        productId: l.product.id,
        name: l.product.name,
        qty: l.qty,
        price: l.product.price,
      })),
      total,
      payment,
      note: note || undefined,
      status: 'Reservado',
    };
    set((state) => ({ orders: [order, ...state.orders], lastOrder: order }));
    return order;
  },
}));

export const paymentLabel = (method: PaymentMethod) => payLabel[method];

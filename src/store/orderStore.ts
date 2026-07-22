import { create } from 'zustand';
import type { CartLine, Order, OrderLine, OrderStatus, PaymentMethod } from '../types';

const line = (productId: number, name: string, qty: number, total: number): OrderLine => ({
  productId,
  name,
  qty,
  price: total / qty,
});

// Mirrors the admin demo dataset from the design handoff: five orders from
// other customers so the admin panel (dashboard, orders, prepare, pickup)
// has something to show beyond whatever the logged-in client has placed.
const seedOrders: Order[] = [
  {
    id: '#DC-2047',
    createdAt: 'há 10 min',
    pickupLabel: 'Amanhã · 12h',
    client: 'Pedro Alves',
    phone: '(11) 98812-3401',
    initials: 'PA',
    lines: [
      line(2, 'Chocolate Recheado', 2, 10.0),
      line(3, 'Pirulito Espiral', 1, 2.0),
      line(1, 'Bala Rainbow', 1, 2.5),
    ],
    total: 14.5,
    payment: 'pix',
    status: 'Reservado',
    isMine: false,
  },
  {
    id: '#DC-2046',
    createdAt: 'há 25 min',
    pickupLabel: 'Amanhã · 12h',
    client: 'Julia Costa',
    phone: '(11) 99934-7712',
    initials: 'JC',
    lines: [
      line(6, 'Trufa de Morango', 2, 13.0),
      line(7, 'Chiclete Bomba', 2, 3.0),
      line(5, 'Bala Azeda', 1, 3.0),
    ],
    total: 19.0,
    payment: 'dinheiro',
    status: 'Preparando',
    isMine: false,
  },
  {
    id: '#DC-2045',
    createdAt: 'há 1h',
    pickupLabel: 'Hoje · 15h',
    client: 'Rafael Lima',
    phone: '(11) 97721-8890',
    initials: 'RL',
    lines: [line(8, 'Marshmallow Torcido', 1, 4.5), line(3, 'Pirulito Espiral', 2, 4.0)],
    total: 8.5,
    payment: 'cartao',
    status: 'Entregue',
    isMine: false,
  },
  {
    id: '#DC-2044',
    createdAt: 'há 2h',
    pickupLabel: 'Hoje · 15h',
    client: 'Beatriz Rocha',
    phone: '(11) 98800-1122',
    initials: 'BR',
    lines: [
      line(2, 'Chocolate Recheado', 3, 15.0),
      line(5, 'Bala Azeda', 2, 6.0),
      line(3, 'Pirulito', 1, 2.0),
    ],
    total: 23.0,
    payment: 'pix',
    status: 'Entregue',
    isMine: false,
  },
  {
    id: '#DC-2043',
    createdAt: 'ontem',
    pickupLabel: 'Ontem',
    client: 'Lucas Melo',
    phone: '(11) 99123-4455',
    initials: 'LM',
    lines: [line(1, 'Bala Rainbow', 1, 3.5), line(5, 'Bala Azeda', 1, 3.0)],
    total: 6.0,
    payment: 'dinheiro',
    status: 'Cancelado',
    isMine: false,
  },
];

const payLabelMap: Record<PaymentMethod, string> = {
  pix: 'Pix',
  dinheiro: 'Dinheiro',
  cartao: 'Cartão',
};

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase() || '?';
}

interface OrderState {
  orders: Order[];
  lastOrder: Order | null;
  deliveredToday: number;
  placeOrder: (
    lines: CartLine[],
    total: number,
    payment: PaymentMethod,
    note: string,
    client: { name: string; phone: string },
  ) => Order;
  setStatus: (id: string, status: OrderStatus) => void;
}

let seq = 2048;

export const useOrderStore = create<OrderState>()((set) => ({
  orders: seedOrders,
  lastOrder: null,
  deliveredToday: 28,
  placeOrder: (cartLines, total, payment, note, client) => {
    seq += 1;
    const order: Order = {
      id: `#DC-${seq}`,
      createdAt: 'agora',
      pickupLabel: 'Amanhã · 12h',
      client: client.name || 'Cliente',
      phone: client.phone,
      initials: initialsOf(client.name || '?'),
      lines: cartLines.map((l) => ({
        productId: l.product.id,
        name: l.product.name,
        qty: l.qty,
        price: l.product.price,
      })),
      total,
      payment,
      note: note || undefined,
      status: 'Reservado',
      isMine: true,
    };
    set((state) => ({ orders: [order, ...state.orders], lastOrder: order }));
    return order;
  },
  setStatus: (id, status) =>
    set((state) => ({
      orders: state.orders.map((o) => (o.id === id ? { ...o, status } : o)),
      deliveredToday: status === 'Entregue' ? state.deliveredToday + 1 : state.deliveredToday,
    })),
}));

export const paymentLabel = (method: PaymentMethod) => payLabelMap[method];

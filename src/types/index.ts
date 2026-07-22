export type CategoryName =
  | 'Todos'
  | 'Balas'
  | 'Chocolates'
  | 'Pirulitos'
  | 'Doces'
  | 'Promoções';

export interface Product {
  id: number;
  name: string;
  category: Exclude<CategoryName, 'Todos' | 'Promoções'>;
  price: number;
  stock: number;
  rating: number;
  tint: string;
  image?: string;
  promo: boolean;
  best: boolean;
  desc: string;
}

export type PaymentMethod = 'pix' | 'dinheiro' | 'cartao';

export interface CartLine {
  product: Product;
  qty: number;
}

export type OrderStatus = 'Reservado' | 'Preparando' | 'Entregue' | 'Cancelado';

export interface OrderLine {
  productId: number;
  name: string;
  qty: number;
  price: number;
}

export interface Order {
  id: string;
  createdAt: string;
  pickupLabel: string;
  client: string;
  phone: string;
  initials: string;
  lines: OrderLine[];
  total: number;
  payment: PaymentMethod;
  note?: string;
  status: OrderStatus;
  /** Placed by the logged-in client in this session (vs. seeded admin demo data). */
  isMine: boolean;
}

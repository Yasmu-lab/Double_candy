export interface Category {
  id: string;
  name: string;
  sortOrder: number;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
  active: boolean;
  categoryId: string | null;
  category: string | null;
  stock: number;
}

export type PaymentMethod = 'pix' | 'cash';

export interface CartLine {
  product: Product;
  qty: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'no_show' | 'cancelled';

export interface OrderLine {
  productId: string;
  name: string;
  priceCents: number;
  qty: number;
}

export interface Order {
  id: string;
  displayId: string;
  orderNumber: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  totalCents: number;
  note: string | null;
  pickupWindowStart: string | null;
  createdAt: string;
  client: string;
  phone: string;
  lines: OrderLine[];
}

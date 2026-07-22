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
  compareAtPriceCents: number | null;
  imageUrl: string | null;
  active: boolean;
  isFeatured: boolean;
  categoryId: string | null;
  category: string | null;
  stock: number;
  createdAt: string;
  unitsSold: number;
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

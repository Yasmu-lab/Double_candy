import { supabase } from './supabaseClient';
import type { OrderStatus } from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const isFormData = init?.body instanceof FormData;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${session?.access_token ?? ANON_KEY}`,
      ...(init?.body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await res.json().catch(() => null) : null;
  if (!res.ok) {
    throw new ApiError(body?.error ?? res.statusText, res.status, body?.error);
  }
  return body as T;
}

export const api = {
  getStore: () => request<{ id: string; name: string; pickupLocation: string; timezone: string; pickupCutoffMinutes: number }>('/store'),

  updateStore: (input: Partial<{ name: string; pickupLocation: string; pickupCutoffMinutes: number }>) =>
    request<{ ok: true }>('/store', { method: 'PUT', body: JSON.stringify(input) }),

  getCategories: () => request<{ id: string; name: string; sortOrder: number }[]>('/categories'),

  createCategory: (input: { name: string; sortOrder?: number }) =>
    request<{ id: string }>('/categories', { method: 'POST', body: JSON.stringify(input) }),

  updateCategory: (id: string, input: Partial<{ name: string; sortOrder: number }>) =>
    request<{ ok: true }>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(input) }),

  deleteCategory: (id: string) => request<{ ok: true }>(`/categories/${id}`, { method: 'DELETE' }),

  getProducts: () => request<ProductDto[]>('/products'),

  createProduct: (input: {
    name: string;
    categoryId: string | null;
    priceCents: number;
    compareAtPriceCents?: number | null;
    stock: number;
    active: boolean;
    isFeatured?: boolean;
    description?: string;
  }) => request<{ id: string }>('/products', { method: 'POST', body: JSON.stringify(input) }),

  updateProduct: (
    id: string,
    input: Partial<{
      name: string;
      categoryId: string | null;
      priceCents: number;
      compareAtPriceCents: number | null;
      stock: number;
      active: boolean;
      isFeatured: boolean;
      description: string;
    }>,
  ) => request<{ ok: true }>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(input) }),

  deleteProduct: (id: string) => request<{ ok: true; softDeleted: boolean }>(`/products/${id}`, { method: 'DELETE' }),

  uploadProductImage: (id: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<{ imageUrl: string }>(`/products/${id}/image`, { method: 'POST', body: form });
  },

  getOrders: () => request<OrderDto[]>('/orders'),

  getMyOrders: () => request<OrderDto[]>('/orders/mine'),

  createOrder: (input: { paymentMethod: 'pix' | 'cash'; note?: string; items: { productId: string; qty: number }[] }) =>
    request<OrderDto>('/orders', { method: 'POST', body: JSON.stringify(input) }),

  setOrderStatus: (id: string, status: OrderStatus, opts?: { cancelledBy?: string; reason?: string }) =>
    request<{ ok: true }>(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, ...opts }) }),

  getOrderHistory: (id: string) => request<OrderStatusHistoryDto[]>(`/orders/${id}/history`),

  searchPickup: (q: string) => request<OrderDto[]>(`/pickup?q=${encodeURIComponent(q)}`),

  getClients: () =>
    request<{ id: string; name: string; phone: string; orders: number; spentCents: number; lastOrderAt: string | null }[]>('/clients'),

  getPrepare: () => request<{ productId: string; name: string; qty: number; orders: number; valueCents: number }[]>('/prepare'),

  getDashboard: (params?: { period: DashboardPeriod; from?: string; to?: string }) => {
    const q = new URLSearchParams();
    if (params) {
      q.set('period', params.period);
      if (params.from) q.set('from', params.from);
      if (params.to) q.set('to', params.to);
    }
    const qs = q.toString();
    return request<{
      ordersToday: number;
      ordersTodayTrend: number;
      ordersTomorrow: number;
      revenueTodayCents: number;
      revenueTodayTrend: number;
      deliveredToday: number;
      deliveredTotal: number;
      pendingCount: number;
      lowStockCount: number;
      period: DashboardPeriod;
      periodLabel: string;
      revenuePeriodCents: number;
      revenuePeriodTrend: number;
      avgTicketCents: number;
      avgTicketTrend: number;
      productsSoldPeriod: number;
      productsSoldTrend: number;
      bestSellerName: string;
      bestSellerQty: number;
      topClientName: string;
      topClientSpentCents: number;
      bestSellers: { name: string; qty: number }[];
      chartSeries: { label: string; valueCents: number }[];
      paymentDistribution: { pix: number; cash: number; pixCount: number; cashCount: number };
      recentOrders: { id: string; displayId: string; client: string; items: number; totalCents: number; status: string }[];
    }>(`/dashboard${qs ? `?${qs}` : ''}`);
  },

  getReports: () =>
    request<{
      revenueTotalCents: number;
      revenueMonthTrend: number;
      productsSoldTotal: number;
      avgTicketCents: number;
      bestSeller: { name: string; qty: number } | null;
      worstSeller: { name: string; qty: number } | null;
      topPayment: { method: 'pix' | 'cash'; pct: number };
      monthly: { label: string; count: number }[];
    }>('/reports'),

  bootstrapMe: (input: { name: string; phone: string }) =>
    request<CustomerDto>('/me/bootstrap', { method: 'POST', body: JSON.stringify(input) }),

  getMe: () => request<CustomerDto>('/me'),

  updateMe: (input: Partial<{ name: string; phone: string; email: string | null }>) =>
    request<CustomerDto>('/me', { method: 'PUT', body: JSON.stringify(input) }),

  // Public: resolves a phone number to the Supabase Auth identity email behind it (real, once
  // set, or the deterministic synthetic fallback) — sign-in and forgot-password both need this
  // since Auth accounts are keyed by email but the UI only ever asks for a phone number.
  resolvePhoneEmail: (phone: string) =>
    request<{ email: string; hasRealEmail: boolean }>('/auth/resolve-phone', { method: 'POST', body: JSON.stringify({ phone }) }),

  uploadMyPhoto: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<{ photoUrl: string }>('/me/photo', { method: 'POST', body: form });
  },

  requestPasswordReset: (phone: string) =>
    request<{ ok: true }>('/password-reset-requests', { method: 'POST', body: JSON.stringify({ phone }) }),

  getPasswordResetRequests: () => request<PasswordResetRequestDto[]>('/password-reset-requests'),

  resolvePasswordReset: (id: string) =>
    request<{ ok: true; tempPassword: string }>(`/password-reset-requests/${id}/resolve`, { method: 'POST' }),

  dismissPasswordReset: (id: string) =>
    request<{ ok: true }>(`/password-reset-requests/${id}/dismiss`, { method: 'POST' }),

  getNotifications: () => request<NotificationDto[]>('/notifications'),

  markNotificationRead: (id: string) => request<{ ok: true }>(`/notifications/${id}/read`, { method: 'PATCH' }),

  markAllNotificationsRead: () => request<{ ok: true }>('/notifications/read-all', { method: 'POST' }),

  deleteNotification: (id: string) => request<{ ok: true }>(`/notifications/${id}`, { method: 'DELETE' }),

  getCart: () => request<CartItemDto[]>('/cart'),

  setCartItem: (productId: string, qty: number) =>
    request<{ ok: true }>(`/cart/${productId}`, { method: 'PUT', body: JSON.stringify({ qty }) }),

  removeCartItem: (productId: string) => request<{ ok: true }>(`/cart/${productId}`, { method: 'DELETE' }),

  clearCart: () => request<{ ok: true }>('/cart/clear', { method: 'POST' }),
};

export interface CustomerDto {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  photoUrl: string | null;
  isAdmin: boolean;
}

export interface ProductDto {
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

export interface CartItemDto {
  productId: string;
  qty: number;
}

export interface PasswordResetRequestDto {
  id: string;
  phone: string;
  customerName: string | null;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
}

export type NotificationType =
  | 'order_received'
  | 'order_confirmed'
  | 'order_preparing'
  | 'order_separated'
  | 'order_ready'
  | 'order_delivered'
  | 'order_no_show'
  | 'order_cancelled'
  | 'new_order'
  | 'out_of_stock'
  | 'low_stock'
  | 'new_customer'
  | 'new_product';

export type DashboardPeriod = 'today' | 'week' | 'month' | 'year' | 'custom';

export interface OrderStatusHistoryDto {
  id: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  changedByType: 'customer' | 'admin' | 'system';
  changedByName: string;
  createdAt: string;
}

export interface NotificationDto {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  link: string | null;
  relatedId: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface OrderDto {
  id: string;
  orderNumber: number;
  displayId: string;
  status: OrderStatus;
  paymentMethod: 'pix' | 'cash';
  totalCents: number;
  note: string | null;
  pickupWindowStart: string | null;
  createdAt: string;
  client: string;
  phone: string;
  lines: { productId: string; name: string; priceCents: number; qty: number }[];
}

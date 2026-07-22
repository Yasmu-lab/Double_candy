import { supabase } from './supabaseClient';

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

  getProducts: () =>
    request<
      {
        id: string;
        name: string;
        description: string | null;
        priceCents: number;
        imageUrl: string | null;
        active: boolean;
        categoryId: string | null;
        category: string | null;
        stock: number;
      }[]
    >('/products'),

  createProduct: (input: { name: string; categoryId: string | null; priceCents: number; stock: number; active: boolean; description?: string }) =>
    request<{ id: string }>('/products', { method: 'POST', body: JSON.stringify(input) }),

  updateProduct: (
    id: string,
    input: Partial<{ name: string; categoryId: string | null; priceCents: number; stock: number; active: boolean; description: string }>,
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

  setOrderStatus: (
    id: string,
    status: 'pending' | 'confirmed' | 'delivered' | 'no_show' | 'cancelled',
    opts?: { cancelledBy?: string; reason?: string },
  ) => request<{ ok: true }>(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, ...opts }) }),

  searchPickup: (q: string) => request<OrderDto[]>(`/pickup?q=${encodeURIComponent(q)}`),

  getClients: () =>
    request<{ id: string; name: string; phone: string; orders: number; spentCents: number; lastOrderAt: string | null }[]>('/clients'),

  getPrepare: () => request<{ productId: string; name: string; qty: number; orders: number; valueCents: number }[]>('/prepare'),

  getDashboard: () =>
    request<{
      ordersToday: number;
      ordersTodayTrend: number;
      ordersTomorrow: number;
      revenueTodayCents: number;
      revenueTodayTrend: number;
      revenueMonthCents: number;
      revenueMonthTrend: number;
      avgTicketCents: number;
      avgTicketTrend: number;
      productsSoldMonth: number;
      productsSoldTrend: number;
      deliveredToday: number;
      deliveredTotal: number;
      pendingCount: number;
      bestSellerName: string;
      bestSellerQty: number;
      topClientName: string;
      topClientSpentCents: number;
      lowStockCount: number;
      weeklyRevenueCents: number[];
      paymentDistribution: { pix: number; cash: number; pixCount: number; cashCount: number };
      bestSellers: { name: string; qty: number }[];
      recentOrders: { id: string; displayId: string; client: string; items: number; totalCents: number; status: string }[];
    }>('/dashboard'),

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

  updateMe: (input: Partial<{ name: string; phone: string }>) =>
    request<CustomerDto>('/me', { method: 'PUT', body: JSON.stringify(input) }),

  uploadMyPhoto: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<{ photoUrl: string }>('/me/photo', { method: 'POST', body: form });
  },
};

export interface CustomerDto {
  id: string;
  name: string;
  phone: string;
  photoUrl: string | null;
  isAdmin: boolean;
}

export interface OrderDto {
  id: string;
  orderNumber: number;
  displayId: string;
  status: 'pending' | 'confirmed' | 'delivered' | 'no_show' | 'cancelled';
  paymentMethod: 'pix' | 'cash';
  totalCents: number;
  note: string | null;
  pickupWindowStart: string | null;
  createdAt: string;
  client: string;
  phone: string;
  lines: { productId: string; name: string; priceCents: number; qty: number }[];
}

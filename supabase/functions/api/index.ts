import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const STORE_ID = '6ce2d2f9-7841-4568-9cf3-e97c1b19db10';
const LOW_STOCK_THRESHOLD = 8;
const TZ_OFFSET_HOURS = -3; // America/Sao_Paulo, fixed (Brazil no longer observes DST)
const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
// Must match phoneToEmail() in src/lib/supabaseClient.ts — the synthetic Auth identity email
// used for accounts that predate real-email support (or signed up before adding one).
const SYNTHETIC_EMAIL_DOMAIN = 'doublecandy.internal';

let cachedClient: SupabaseClient | null = null;
function sb(): SupabaseClient {
  if (cachedClient) return cachedClient;
  cachedClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  return cachedClient;
}

function err(c: any, error: unknown, status = 500) {
  console.error(error);
  const message = error && typeof error === 'object' && 'message' in error ? (error as Error).message : String(error);
  return c.json({ error: message }, status);
}

// ---- auth: resolve the caller's real Supabase Auth identity from the bearer JWT ----
async function getAuthUser(c: any) {
  const authHeader = c.req.header('authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data, error } = await sb().auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

// Phone is the identity key matched against store_admins and legacy customer rows, so it must
// be stored consistently regardless of how the client formats it (parens, dashes, spaces).
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

function syntheticEmailFor(phone: string): string {
  return `${normalizePhone(phone)}@${SYNTHETIC_EMAIL_DOMAIN}`;
}

async function isAdminPhone(phone: string): Promise<boolean> {
  const { data } = await sb().from('store_admins').select('id').eq('store_id', STORE_ID).eq('phone', phone).maybeSingle();
  return !!data;
}

async function customerDto(row: any) {
  const isAdmin = await isAdminPhone(row.phone);
  return { id: row.id, name: row.name, phone: row.phone, email: row.email, photoUrl: row.photo_url, isAdmin };
}

function formatCents(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;
}

type NotificationType =
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

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'separated' | 'ready_for_pickup' | 'delivered' | 'no_show' | 'cancelled';

// Content for the customer-facing notification fired on each admin-driven status change.
// 'pending'/'cancelled' aren't here on purpose: 'pending' is covered by the order_received
// notification at creation time, and 'cancelled' has its own branch (admin-cancel vs
// client-cancel need different copy — see PATCH /orders/:id/status).
const STATUS_NOTIFY: Partial<Record<OrderStatus, { type: NotificationType; title: string; message: (displayId: string) => string }>> = {
  confirmed: { type: 'order_confirmed', title: 'Pedido confirmado', message: (id) => `Seu pedido ${id} foi confirmado!` },
  preparing: { type: 'order_preparing', title: 'Pedido em preparo', message: (id) => `Seu pedido ${id} está sendo preparado.` },
  separated: { type: 'order_separated', title: 'Pedido separado', message: (id) => `Seu pedido ${id} foi separado e já vai pra embalagem.` },
  ready_for_pickup: { type: 'order_ready', title: 'Pronto para retirada', message: (id) => `Seu pedido ${id} está pronto para retirada!` },
  delivered: { type: 'order_delivered', title: 'Pedido entregue', message: (id) => `Seu pedido ${id} foi entregue. Bom apetite!` },
  no_show: { type: 'order_no_show', title: 'Pedido não retirado', message: (id) => `Seu pedido ${id} foi marcado como não retirado.` },
};

// Single insertion point for every notification in the app. Centralizing here means a future
// push-notification provider (web push / FCM) only needs to be wired in once, right after the
// DB insert below — every call site below stays unchanged.
async function notify(
  userIds: string[],
  input: { title: string; message: string; type: NotificationType; link?: string; relatedId?: string },
) {
  if (userIds.length === 0) return;
  const rows = userIds.map((userId) => ({
    store_id: STORE_ID,
    user_id: userId,
    title: input.title,
    message: input.message,
    type: input.type,
    link: input.link ?? null,
    related_id: input.relatedId ?? null,
  }));
  const { error } = await sb().from('notifications').insert(rows);
  if (error) console.error('notify failed', error);
  // TODO(push): once a push provider is configured, send here too, keyed off userIds.
}

// Resolves the auth_user_id of every store admin, so an event can notify all of them at once.
async function adminUserIds(excludeUserId?: string): Promise<string[]> {
  const client = sb();
  const { data: admins } = await client.from('store_admins').select('phone').eq('store_id', STORE_ID);
  const phones = (admins ?? []).map((a) => a.phone);
  if (!phones.length) return [];
  const { data: customers } = await client
    .from('customers')
    .select('auth_user_id')
    .eq('store_id', STORE_ID)
    .in('phone', phones);
  return (customers ?? [])
    .map((cst) => cst.auth_user_id as string | null)
    .filter((id): id is string => !!id && id !== excludeUserId);
}

// Single insertion point for order status changes — every transition (including the implicit
// "Recebido" at creation) is recorded here so every order has a full audit trail: who changed
// it, and when (created_at doubles as date + time).
async function recordStatusChange(input: {
  orderId: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  actorType: 'customer' | 'admin';
  actorId: string;
  actorName: string;
}) {
  const { error } = await sb().from('order_status_history').insert({
    store_id: STORE_ID,
    order_id: input.orderId,
    from_status: input.fromStatus,
    to_status: input.toStatus,
    changed_by_type: input.actorType,
    changed_by_id: input.actorId,
    changed_by_name: input.actorName,
  });
  if (error) console.error('recordStatusChange failed', error);
}

// Requires a real logged-in customer (not just the anon key). Returns the response to send
// straight back if unauthorized/not-yet-linked, or { userId, customerId, customer } on success.
async function requireCustomer(c: any) {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'UNAUTHORIZED' }, 401);
  const { data: customer, error } = await sb()
    .from('customers')
    .select('*')
    .eq('auth_user_id', user.id)
    .eq('store_id', STORE_ID)
    .maybeSingle();
  if (error) return err(c, error);
  if (!customer) return c.json({ error: 'CUSTOMER_NOT_LINKED' }, 404);
  return { userId: user.id, customerId: customer.id, customer };
}

// Requires the caller to be one of the store's admins (store_admins.phone match), on top of
// being a real logged-in customer. This is the only real authorization boundary for the admin
// panel — the anon key alone is no longer enough for any of the routes below.
async function requireAdmin(c: any) {
  const auth = await requireCustomer(c);
  if (auth instanceof Response) return auth;
  const admin = await isAdminPhone(auth.customer.phone);
  if (!admin) return c.json({ error: 'FORBIDDEN' }, 403);
  return auth;
}

// ---- time helpers (fixed -03:00 offset) ----
function localNow(): Date {
  return new Date(Date.now() + TZ_OFFSET_HOURS * 3600_000);
}
function localDayRangeUtc(dayOffset = 0) {
  const local = localNow();
  local.setUTCHours(0, 0, 0, 0);
  local.setUTCDate(local.getUTCDate() + dayOffset);
  const startUtc = new Date(local.getTime() - TZ_OFFSET_HOURS * 3600_000);
  const endUtc = new Date(startUtc.getTime() + 24 * 3600_000);
  return { start: startUtc.toISOString(), end: endUtc.toISOString() };
}
function localMonthRangeUtc(monthOffset = 0) {
  const local = localNow();
  const y = local.getUTCFullYear();
  const m = local.getUTCMonth() + monthOffset;
  const startLocal = new Date(Date.UTC(y, m, 1, 0, 0, 0));
  const endLocal = new Date(Date.UTC(y, m + 1, 1, 0, 0, 0));
  const startUtc = new Date(startLocal.getTime() - TZ_OFFSET_HOURS * 3600_000);
  const endUtc = new Date(endLocal.getTime() - TZ_OFFSET_HOURS * 3600_000);
  return { start: startUtc.toISOString(), end: endUtc.toISOString() };
}
function localYearRangeUtc(yearOffset = 0) {
  const local = localNow();
  const y = local.getUTCFullYear() + yearOffset;
  const startLocal = new Date(Date.UTC(y, 0, 1, 0, 0, 0));
  const endLocal = new Date(Date.UTC(y + 1, 0, 1, 0, 0, 0));
  const startUtc = new Date(startLocal.getTime() - TZ_OFFSET_HOURS * 3600_000);
  const endUtc = new Date(endLocal.getTime() - TZ_OFFSET_HOURS * 3600_000);
  return { start: startUtc.toISOString(), end: endUtc.toISOString() };
}
function lastNDaysRangeUtc(n: number) {
  return { start: localDayRangeUtc(-(n - 1)).start, end: localDayRangeUtc(1).start };
}
// from/to are 'YYYY-MM-DD' local calendar dates, inclusive on both ends.
function customRangeUtc(from: string, to: string) {
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  const startLocal = new Date(Date.UTC(fy, fm - 1, fd, 0, 0, 0));
  const endLocalExclusive = new Date(Date.UTC(ty, tm - 1, td + 1, 0, 0, 0));
  const startUtc = new Date(startLocal.getTime() - TZ_OFFSET_HOURS * 3600_000);
  const endUtc = new Date(endLocalExclusive.getTime() - TZ_OFFSET_HOURS * 3600_000);
  return { start: startUtc.toISOString(), end: endUtc.toISOString() };
}
function periodRange(period: string, from?: string, to?: string) {
  switch (period) {
    case 'today':
      return localDayRangeUtc(0);
    case 'week':
      return lastNDaysRangeUtc(7);
    case 'year':
      return localYearRangeUtc(0);
    case 'custom':
      return from && to ? customRangeUtc(from, to) : localMonthRangeUtc(0);
    case 'month':
    default:
      return localMonthRangeUtc(0);
  }
}
// Same-length window immediately preceding the period, used for the trend (% change) comparison.
function previousPeriodRange(range: { start: string; end: string }) {
  const durationMs = new Date(range.end).getTime() - new Date(range.start).getTime();
  return { start: new Date(new Date(range.start).getTime() - durationMs).toISOString(), end: range.start };
}
function periodLabelFor(period: string, range: { start: string; end: string }, from?: string, to?: string) {
  switch (period) {
    case 'today':
      return 'Hoje';
    case 'week':
      return 'Últimos 7 dias';
    case 'year':
      return `Ano de ${new Date(range.start).getUTCFullYear()}`;
    case 'custom':
      return from && to ? `${from.split('-').reverse().join('/')} – ${to.split('-').reverse().join('/')}` : 'Este mês';
    case 'month':
    default:
      return 'Este mês';
  }
}
// Buckets orders' revenue into a chart series, adapting granularity to the period's span:
// hourly for a single day, daily for up to ~45 days, monthly beyond that (e.g. a full year).
function bucketRevenue(orders: any[], range: { start: string; end: string }) {
  const startMs = new Date(range.start).getTime();
  const endMs = new Date(range.end).getTime();
  const spanDays = (endMs - startMs) / 86_400_000;
  const inRange = orders.filter((o) => within(o.created_at, range) && o.status !== 'cancelled');

  if (spanDays <= 1.5) {
    const series = Array.from({ length: 12 }, (_, i) => ({ label: `${String(i * 2).padStart(2, '0')}h`, valueCents: 0 }));
    for (const o of inRange) {
      const localDate = new Date(new Date(o.created_at).getTime() + TZ_OFFSET_HOURS * 3600_000);
      series[Math.floor(localDate.getUTCHours() / 2)].valueCents += o.total_cents;
    }
    return series;
  }
  if (spanDays <= 45) {
    const days = Math.round(spanDays);
    const series = Array.from({ length: days }, (_, i) => {
      const localDate = new Date(startMs + i * 86_400_000 + TZ_OFFSET_HOURS * 3600_000);
      return { label: `${String(localDate.getUTCDate()).padStart(2, '0')}/${String(localDate.getUTCMonth() + 1).padStart(2, '0')}`, valueCents: 0 };
    });
    for (const o of inRange) {
      const idx = Math.floor((new Date(o.created_at).getTime() - startMs) / 86_400_000);
      if (idx >= 0 && idx < series.length) series[idx].valueCents += o.total_cents;
    }
    return series;
  }
  const monthLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const months: { y: number; m: number }[] = [];
  let cursor = new Date(startMs + TZ_OFFSET_HOURS * 3600_000);
  const endLocalMs = endMs + TZ_OFFSET_HOURS * 3600_000;
  while (cursor.getTime() < endLocalMs) {
    months.push({ y: cursor.getUTCFullYear(), m: cursor.getUTCMonth() });
    cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
  }
  const series = months.map(({ m }) => ({ label: monthLabels[m], valueCents: 0 }));
  for (const o of inRange) {
    const localDate = new Date(new Date(o.created_at).getTime() + TZ_OFFSET_HOURS * 3600_000);
    const idx = months.findIndex((mo) => mo.y === localDate.getUTCFullYear() && mo.m === localDate.getUTCMonth());
    if (idx >= 0) series[idx].valueCents += o.total_cents;
  }
  return series;
}
function tomorrowNoonUtcIso() {
  const local = localNow();
  const y = local.getUTCFullYear();
  const m = local.getUTCMonth();
  const d = local.getUTCDate();
  const noonLocal = new Date(Date.UTC(y, m, d + 1, 12, 0, 0));
  return new Date(noonLocal.getTime() - TZ_OFFSET_HOURS * 3600_000).toISOString();
}
function within(iso: string | null, range: { start: string; end: string }) {
  return !!iso && iso >= range.start && iso < range.end;
}
function pctChange(cur: number, prev: number) {
  if (prev === 0) return cur > 0 ? 100 : 0;
  return Math.round(((cur - prev) / prev) * 100);
}

// ---- row shape helpers (PostgREST embeds can be object or array depending on FK cardinality) ----
function one<T>(rel: T | T[] | null | undefined): T | null {
  if (!rel) return null;
  return Array.isArray(rel) ? (rel[0] ?? null) : rel;
}

function mapOrder(o: any) {
  const cust = one<{ name: string; phone: string }>(o.customers);
  return {
    id: o.id,
    orderNumber: o.order_number,
    displayId: `#DC-${o.order_number}`,
    status: o.status,
    paymentMethod: o.payment_method,
    totalCents: o.total_cents,
    note: o.note,
    pickupWindowStart: o.pickup_window_start,
    createdAt: o.created_at,
    client: cust?.name ?? '—',
    phone: cust?.phone ?? '',
    lines: (o.order_items ?? []).map((li: any) => ({
      productId: li.product_id,
      name: li.product_name_snapshot,
      priceCents: li.unit_price_cents,
      qty: li.quantity,
    })),
  };
}

const ORDER_SELECT =
  'id,order_number,status,payment_method,total_cents,note,pickup_window_start,created_at,customer_id,customers(name,phone),order_items(product_id,product_name_snapshot,unit_price_cents,quantity)';

const app = new Hono().basePath('/api');

app.use('*', cors({ origin: '*', allowHeaders: ['authorization', 'apikey', 'content-type'] }));

app.get('/', (c) => c.json({ ok: true }));

// ---- store ----
app.get('/store', async (c) => {
  const { data, error } = await sb().from('stores').select('*').eq('id', STORE_ID).single();
  if (error) return err(c, error);
  return c.json({
    id: data.id,
    name: data.name,
    pickupLocation: data.pickup_location,
    timezone: data.timezone,
    pickupCutoffMinutes: data.pickup_cutoff_minutes,
  });
});

app.put('/store', async (c) => {
  const auth = await requireAdmin(c);
  if (auth instanceof Response) return auth;
  const body = await c.req.json();
  const patch: Record<string, unknown> = {};
  if (body.name !== undefined) patch.name = body.name;
  if (body.pickupLocation !== undefined) patch.pickup_location = body.pickupLocation;
  if (body.pickupCutoffMinutes !== undefined) patch.pickup_cutoff_minutes = body.pickupCutoffMinutes;
  if (!Object.keys(patch).length) return c.json({ ok: true });
  const { error } = await sb().from('stores').update(patch).eq('id', STORE_ID);
  if (error) return err(c, error);
  return c.json({ ok: true });
});

// ---- auth: phone -> Auth-identity email resolution ----
// Public (no auth): sign-in and forgot-password both start with a phone number, but Supabase
// Auth accounts are keyed by email. Always returns 200 with a best-guess email (falling back to
// the deterministic synthetic one for unknown phones) so this never becomes an account-existence
// oracle — the downstream signInWithPassword/resetPasswordForEmail call is where a real mismatch
// surfaces, exactly like before this endpoint existed.
app.post('/auth/resolve-phone', async (c) => {
  const body = await c.req.json();
  if (typeof body.phone !== 'string' || !body.phone.trim()) {
    return c.json({ error: 'INVALID_INPUT' }, 400);
  }
  const phone = normalizePhone(body.phone);
  const { data: customer } = await sb()
    .from('customers')
    .select('email')
    .eq('store_id', STORE_ID)
    .eq('phone', phone)
    .maybeSingle();
  const hasRealEmail = !!customer?.email;
  return c.json({ email: hasRealEmail ? customer!.email : syntheticEmailFor(phone), hasRealEmail });
});

// ---- me (customer profile, tied to the real Supabase Auth session) ----

// Called once right after client-side signUp(). Links the new auth user to an existing
// customers row with the same phone (preserving order history from before real auth existed),
// or creates a new one. Idempotent: safe to call again for an already-linked user.
app.post('/me/bootstrap', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'UNAUTHORIZED' }, 401);
  const body = await c.req.json();
  if (typeof body.name !== 'string' || !body.name.trim() || typeof body.phone !== 'string' || !body.phone.trim()) {
    return c.json({ error: 'INVALID_INPUT' }, 400);
  }
  const phone = normalizePhone(body.phone);
  // user.email is already the real address for new signups (the client passes it straight to
  // signUp) — trust that over any client-supplied `email` field, which only matters for the
  // legacy path below where an account can predate real-email support.
  const email = user.email && user.email !== syntheticEmailFor(phone) ? user.email : null;
  const client = sb();

  const { data: existing, error: existingErr } = await client
    .from('customers')
    .select('*')
    .eq('auth_user_id', user.id)
    .maybeSingle();
  if (existingErr) return err(c, existingErr);
  if (existing) return c.json(await customerDto(existing));

  const { data: legacy, error: legacyErr } = await client
    .from('customers')
    .select('*')
    .eq('store_id', STORE_ID)
    .eq('phone', phone)
    .is('auth_user_id', null)
    .maybeSingle();
  if (legacyErr) return err(c, legacyErr);

  if (legacy) {
    const { data: updated, error } = await client
      .from('customers')
      .update({ auth_user_id: user.id, name: body.name.trim(), email: email ?? legacy.email })
      .eq('id', legacy.id)
      .select()
      .single();
    if (error) return err(c, error);
    return c.json(await customerDto(updated));
  }

  const { data: created, error } = await client
    .from('customers')
    .insert({ store_id: STORE_ID, auth_user_id: user.id, name: body.name.trim(), phone, email })
    .select()
    .single();
  if (error) return err(c, error);

  const adminIds = await adminUserIds(user.id);
  await notify(adminIds, {
    type: 'new_customer',
    title: 'Novo cliente',
    message: `${created.name} acabou de se cadastrar.`,
    link: '/admin/clients',
    relatedId: created.id,
  });

  return c.json(await customerDto(created), 201);
});

app.get('/me', async (c) => {
  const auth = await requireCustomer(c);
  if (auth instanceof Response) return auth;
  return c.json(await customerDto(auth.customer));
});

app.put('/me', async (c) => {
  const auth = await requireCustomer(c);
  if (auth instanceof Response) return auth;
  const body = await c.req.json();
  const patch: Record<string, unknown> = {};
  if (body.name !== undefined) patch.name = body.name;
  if (body.phone !== undefined) patch.phone = normalizePhone(body.phone);
  if (body.email !== undefined) patch.email = typeof body.email === 'string' && body.email.trim() ? body.email.trim().toLowerCase() : null;
  if (!Object.keys(patch).length) return c.json(await customerDto(auth.customer));
  const client = sb();

  // Setting a real email also has to become this customer's actual Auth-identity email —
  // that's what unlocks the native supabase.auth.resetPasswordForEmail() flow for them going
  // forward. email_confirm:true skips the double opt-in since this is an admin-API call, not
  // the client-facing signup flow (which is where "Confirm email" project settings still apply).
  if (patch.email) {
    const { error: authErr } = await client.auth.admin.updateUserById(auth.userId, {
      email: patch.email as string,
      email_confirm: true,
    });
    if (authErr) {
      if (String(authErr.message).toLowerCase().includes('already been registered')) {
        return c.json({ error: 'EMAIL_IN_USE' }, 409);
      }
      return err(c, authErr);
    }
  }

  const { data, error } = await client.from('customers').update(patch).eq('id', auth.customerId).select().single();
  if (error) {
    if (error.code === '23505') {
      return c.json({ error: String(error.message).includes('email') ? 'EMAIL_IN_USE' : 'PHONE_IN_USE' }, 409);
    }
    return err(c, error);
  }
  return c.json(await customerDto(data));
});

app.post('/me/photo', async (c) => {
  const auth = await requireCustomer(c);
  if (auth instanceof Response) return auth;
  const body = await c.req.parseBody();
  const file = body.file;
  if (!(file instanceof File)) return c.json({ error: 'INVALID_INPUT' }, 400);
  if (!IMAGE_MIME_TYPES.has(file.type)) return c.json({ error: 'INVALID_FILE_TYPE' }, 400);
  if (file.size > MAX_IMAGE_BYTES) return c.json({ error: 'FILE_TOO_LARGE' }, 400);

  const client = sb();
  const ext = file.type.split('/')[1];
  const path = `${auth.customerId}-${Date.now()}.${ext}`;
  const { error: upErr } = await client.storage.from('customer-photos').upload(path, file, { contentType: file.type, upsert: true });
  if (upErr) return err(c, upErr);

  const { data: pub } = client.storage.from('customer-photos').getPublicUrl(path);
  const { error: updErr } = await client.from('customers').update({ photo_url: pub.publicUrl }).eq('id', auth.customerId);
  if (updErr) return err(c, updErr);

  return c.json({ photoUrl: pub.publicUrl });
});

// ---- notifications ----
app.get('/notifications', async (c) => {
  const auth = await requireCustomer(c);
  if (auth instanceof Response) return auth;
  const { data, error } = await sb()
    .from('notifications')
    .select('*')
    .eq('user_id', auth.userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) return err(c, error);
  return c.json(
    data.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      link: n.link,
      relatedId: n.related_id,
      isRead: n.is_read,
      createdAt: n.created_at,
    })),
  );
});

app.patch('/notifications/:id/read', async (c) => {
  const auth = await requireCustomer(c);
  if (auth instanceof Response) return auth;
  const id = c.req.param('id');
  const { error } = await sb().from('notifications').update({ is_read: true }).eq('id', id).eq('user_id', auth.userId);
  if (error) return err(c, error);
  return c.json({ ok: true });
});

app.post('/notifications/read-all', async (c) => {
  const auth = await requireCustomer(c);
  if (auth instanceof Response) return auth;
  const { error } = await sb().from('notifications').update({ is_read: true }).eq('user_id', auth.userId).eq('is_read', false);
  if (error) return err(c, error);
  return c.json({ ok: true });
});

app.delete('/notifications/:id', async (c) => {
  const auth = await requireCustomer(c);
  if (auth instanceof Response) return auth;
  const id = c.req.param('id');
  const { error } = await sb().from('notifications').delete().eq('id', id).eq('user_id', auth.userId);
  if (error) return err(c, error);
  return c.json({ ok: true });
});

// ---- cart (server-persisted, so a logged-in customer's cart follows them across devices) ----
app.get('/cart', async (c) => {
  const auth = await requireCustomer(c);
  if (auth instanceof Response) return auth;
  const { data, error } = await sb().from('cart_items').select('product_id,quantity').eq('customer_id', auth.customerId);
  if (error) return err(c, error);
  return c.json(data.map((r) => ({ productId: r.product_id, qty: r.quantity })));
});

// Upsert absolute quantity for one product. qty <= 0 removes the line — mirrors how the
// client-side cart already computes the next quantity before calling this.
app.put('/cart/:productId', async (c) => {
  const auth = await requireCustomer(c);
  if (auth instanceof Response) return auth;
  const productId = c.req.param('productId');
  const body = await c.req.json();
  const qty = Number(body.qty);
  const client = sb();
  if (!Number.isFinite(qty) || qty <= 0) {
    const { error } = await client.from('cart_items').delete().eq('customer_id', auth.customerId).eq('product_id', productId);
    if (error) return err(c, error);
    return c.json({ ok: true });
  }
  const { error } = await client.from('cart_items').upsert(
    { store_id: STORE_ID, customer_id: auth.customerId, product_id: productId, quantity: qty, updated_at: new Date().toISOString() },
    { onConflict: 'customer_id,product_id' },
  );
  if (error) return err(c, error);
  return c.json({ ok: true });
});

app.delete('/cart/:productId', async (c) => {
  const auth = await requireCustomer(c);
  if (auth instanceof Response) return auth;
  const productId = c.req.param('productId');
  const { error } = await sb().from('cart_items').delete().eq('customer_id', auth.customerId).eq('product_id', productId);
  if (error) return err(c, error);
  return c.json({ ok: true });
});

// Called after a successful checkout, or when the customer wants to start over.
app.post('/cart/clear', async (c) => {
  const auth = await requireCustomer(c);
  if (auth instanceof Response) return auth;
  const { error } = await sb().from('cart_items').delete().eq('customer_id', auth.customerId);
  if (error) return err(c, error);
  return c.json({ ok: true });
});

// ---- password reset requests ----
// Public (no auth): the whole point is to help someone who is locked out. Never reveals
// whether the phone actually belongs to a customer — always responds the same way.
app.post('/password-reset-requests', async (c) => {
  const body = await c.req.json();
  if (typeof body.phone !== 'string' || !body.phone.trim()) {
    return c.json({ error: 'INVALID_INPUT' }, 400);
  }
  const phone = normalizePhone(body.phone);
  const client = sb();
  const { data: existing, error: existingErr } = await client
    .from('password_reset_requests')
    .select('id')
    .eq('store_id', STORE_ID)
    .eq('phone', phone)
    .eq('status', 'pending')
    .maybeSingle();
  if (existingErr) return err(c, existingErr);
  if (!existing) {
    const { error } = await client.from('password_reset_requests').insert({ store_id: STORE_ID, phone });
    if (error) return err(c, error);
  }
  return c.json({ ok: true }, 201);
});

app.get('/password-reset-requests', async (c) => {
  const auth = await requireAdmin(c);
  if (auth instanceof Response) return auth;
  const client = sb();
  const { data: requests, error } = await client
    .from('password_reset_requests')
    .select('*')
    .eq('store_id', STORE_ID)
    .order('created_at', { ascending: false });
  if (error) return err(c, error);
  const phones = [...new Set(requests.map((r) => r.phone))];
  const { data: customers, error: custErr } = await client
    .from('customers')
    .select('name,phone')
    .eq('store_id', STORE_ID)
    .in('phone', phones.length ? phones : ['']);
  if (custErr) return err(c, custErr);
  const nameByPhone = new Map(customers.map((cst) => [cst.phone, cst.name]));
  return c.json(
    requests.map((r) => ({
      id: r.id,
      phone: r.phone,
      customerName: nameByPhone.get(r.phone) ?? null,
      status: r.status,
      createdAt: r.created_at,
      resolvedAt: r.resolved_at,
      resolvedBy: r.resolved_by,
    })),
  );
});

app.post('/password-reset-requests/:id/resolve', async (c) => {
  const auth = await requireAdmin(c);
  if (auth instanceof Response) return auth;
  const id = c.req.param('id');
  const client = sb();

  const { data: request, error: reqErr } = await client
    .from('password_reset_requests')
    .select('*')
    .eq('id', id)
    .eq('store_id', STORE_ID)
    .maybeSingle();
  if (reqErr) return err(c, reqErr);
  if (!request) return c.json({ error: 'NOT_FOUND' }, 404);
  if (request.status !== 'pending') return c.json({ error: 'ALREADY_RESOLVED' }, 409);

  const { data: customer, error: custErr } = await client
    .from('customers')
    .select('auth_user_id')
    .eq('store_id', STORE_ID)
    .eq('phone', request.phone)
    .maybeSingle();
  if (custErr) return err(c, custErr);
  if (!customer?.auth_user_id) return c.json({ error: 'CUSTOMER_NOT_FOUND' }, 404);

  const tempPassword = crypto.randomUUID().replace(/-/g, '').slice(0, 10);
  const { error: pwErr } = await client.auth.admin.updateUserById(customer.auth_user_id, { password: tempPassword });
  if (pwErr) return err(c, pwErr);

  const { error: updErr } = await client
    .from('password_reset_requests')
    .update({ status: 'resolved', resolved_at: new Date().toISOString(), resolved_by: auth.customer.name })
    .eq('id', id);
  if (updErr) return err(c, updErr);

  return c.json({ ok: true, tempPassword });
});

app.post('/password-reset-requests/:id/dismiss', async (c) => {
  const auth = await requireAdmin(c);
  if (auth instanceof Response) return auth;
  const id = c.req.param('id');
  const { error } = await sb()
    .from('password_reset_requests')
    .update({ status: 'dismissed', resolved_at: new Date().toISOString(), resolved_by: auth.customer.name })
    .eq('id', id)
    .eq('store_id', STORE_ID)
    .eq('status', 'pending');
  if (error) return err(c, error);
  return c.json({ ok: true });
});

// ---- categories ----
app.get('/categories', async (c) => {
  const { data, error } = await sb()
    .from('categories')
    .select('id,name,sort_order')
    .eq('store_id', STORE_ID)
    .order('sort_order');
  if (error) return err(c, error);
  return c.json(data.map((x) => ({ id: x.id, name: x.name, sortOrder: x.sort_order })));
});

app.post('/categories', async (c) => {
  const auth = await requireAdmin(c);
  if (auth instanceof Response) return auth;
  const body = await c.req.json();
  if (typeof body.name !== 'string' || !body.name.trim()) {
    return c.json({ error: 'INVALID_INPUT' }, 400);
  }
  const client = sb();
  const { data: last } = await client
    .from('categories')
    .select('sort_order')
    .eq('store_id', STORE_ID)
    .order('sort_order', { ascending: false })
    .limit(1);
  const nextSort = (last?.[0]?.sort_order ?? -1) + 1;
  const { data, error } = await client
    .from('categories')
    .insert({ store_id: STORE_ID, name: body.name.trim(), sort_order: body.sortOrder ?? nextSort })
    .select()
    .single();
  if (error) return err(c, error);
  return c.json({ id: data.id }, 201);
});

app.put('/categories/:id', async (c) => {
  const auth = await requireAdmin(c);
  if (auth instanceof Response) return auth;
  const id = c.req.param('id');
  const body = await c.req.json();
  const patch: Record<string, unknown> = {};
  if (body.name !== undefined) patch.name = body.name;
  if (body.sortOrder !== undefined) patch.sort_order = body.sortOrder;
  if (!Object.keys(patch).length) return c.json({ ok: true });
  const { error } = await sb().from('categories').update(patch).eq('id', id).eq('store_id', STORE_ID);
  if (error) return err(c, error);
  return c.json({ ok: true });
});

app.delete('/categories/:id', async (c) => {
  const auth = await requireAdmin(c);
  if (auth instanceof Response) return auth;
  const id = c.req.param('id');
  const { error } = await sb().from('categories').delete().eq('id', id).eq('store_id', STORE_ID);
  if (error) {
    if (error.code === '23503') return c.json({ error: 'CATEGORY_IN_USE' }, 409);
    return err(c, error);
  }
  return c.json({ ok: true });
});

// ---- products ----
function mapProduct(p: any) {
  const stock = one<{ quantity_available: number }>(p.product_stock);
  const category = one<{ name: string }>(p.categories);
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    priceCents: p.price_cents,
    compareAtPriceCents: p.compare_at_price_cents,
    imageUrl: p.image_url,
    active: p.is_active,
    isFeatured: p.is_featured,
    categoryId: p.category_id,
    category: category?.name ?? null,
    stock: stock?.quantity_available ?? 0,
    createdAt: p.created_at,
  };
}

// A product's price can conflict with its "de/por" compare-at price on either create or
// edit, since the admin form always resubmits both together — catch it early with a clear
// error instead of surfacing the raw Postgres check-constraint failure.
function invalidCompareAtPrice(body: any): boolean {
  return body.compareAtPriceCents != null && body.priceCents != null && body.compareAtPriceCents <= body.priceCents;
}

app.get('/products', async (c) => {
  const client = sb();
  const { data, error } = await client
    .from('products')
    .select(
      'id,name,description,price_cents,compare_at_price_cents,image_url,is_active,is_featured,category_id,created_at,categories(name),product_stock(quantity_available)',
    )
    .eq('store_id', STORE_ID)
    .order('created_at');
  if (error) return err(c, error);

  // Units sold powers the "Mais vendidos" section — computed here rather than stored, same
  // full-scan approach already used by /dashboard and /reports for this single-store app.
  const { data: orderItems, error: oiErr } = await client.from('order_items').select('product_id,quantity,orders(store_id,status)');
  if (oiErr) return err(c, oiErr);
  const soldByProduct = new Map<string, number>();
  for (const oi of orderItems ?? []) {
    const order = one<{ store_id: string; status: string }>((oi as any).orders);
    if (!order || order.store_id !== STORE_ID || order.status === 'cancelled') continue;
    soldByProduct.set(oi.product_id, (soldByProduct.get(oi.product_id) ?? 0) + oi.quantity);
  }

  return c.json(data.map((p) => ({ ...mapProduct(p), unitsSold: soldByProduct.get(p.id) ?? 0 })));
});

app.post('/products', async (c) => {
  const auth = await requireAdmin(c);
  if (auth instanceof Response) return auth;
  const body = await c.req.json();
  if (invalidCompareAtPrice(body)) return c.json({ error: 'INVALID_COMPARE_AT_PRICE' }, 400);
  const client = sb();
  const { data: product, error } = await client
    .from('products')
    .insert({
      store_id: STORE_ID,
      category_id: body.categoryId ?? null,
      name: body.name,
      description: body.description ?? null,
      price_cents: body.priceCents,
      compare_at_price_cents: body.compareAtPriceCents ?? null,
      is_active: body.active ?? true,
      is_featured: body.isFeatured ?? false,
    })
    .select()
    .single();
  if (error) {
    if (error.code === '23514') return c.json({ error: 'INVALID_COMPARE_AT_PRICE' }, 400);
    return err(c, error);
  }
  const { error: stockError } = await client
    .from('product_stock')
    .insert({ product_id: product.id, quantity_available: body.stock ?? 0 });
  if (stockError) return err(c, stockError);

  const adminIds = await adminUserIds(auth.userId);
  await notify(adminIds, {
    type: 'new_product',
    title: 'Novo produto',
    message: `${product.name} foi adicionado ao cardápio.`,
    link: '/admin/products',
    relatedId: product.id,
  });

  return c.json({ id: product.id }, 201);
});

app.put('/products/:id', async (c) => {
  const auth = await requireAdmin(c);
  if (auth instanceof Response) return auth;
  const id = c.req.param('id');
  const body = await c.req.json();
  if (invalidCompareAtPrice(body)) return c.json({ error: 'INVALID_COMPARE_AT_PRICE' }, 400);
  const client = sb();
  const patch: Record<string, unknown> = {};
  if (body.name !== undefined) patch.name = body.name;
  if (body.categoryId !== undefined) patch.category_id = body.categoryId;
  if (body.priceCents !== undefined) patch.price_cents = body.priceCents;
  if (body.compareAtPriceCents !== undefined) patch.compare_at_price_cents = body.compareAtPriceCents;
  if (body.active !== undefined) patch.is_active = body.active;
  if (body.isFeatured !== undefined) patch.is_featured = body.isFeatured;
  if (body.description !== undefined) patch.description = body.description;
  if (Object.keys(patch).length) {
    const { error } = await client.from('products').update(patch).eq('id', id).eq('store_id', STORE_ID);
    if (error) {
      if (error.code === '23514') return c.json({ error: 'INVALID_COMPARE_AT_PRICE' }, 400);
      return err(c, error);
    }
  }
  if (body.stock !== undefined) {
    const { error } = await client
      .from('product_stock')
      .update({ quantity_available: body.stock, updated_at: new Date().toISOString() })
      .eq('product_id', id);
    if (error) return err(c, error);
  }
  return c.json({ ok: true });
});

app.post('/products/:id/image', async (c) => {
  const auth = await requireAdmin(c);
  if (auth instanceof Response) return auth;
  const id = c.req.param('id');
  const client = sb();
  const { data: product } = await client.from('products').select('id').eq('id', id).eq('store_id', STORE_ID).maybeSingle();
  if (!product) return c.json({ error: 'NOT_FOUND' }, 404);

  const body = await c.req.parseBody();
  const file = body.file;
  if (!(file instanceof File)) return c.json({ error: 'INVALID_INPUT' }, 400);
  if (!IMAGE_MIME_TYPES.has(file.type)) return c.json({ error: 'INVALID_FILE_TYPE' }, 400);
  if (file.size > MAX_IMAGE_BYTES) return c.json({ error: 'FILE_TOO_LARGE' }, 400);

  const ext = file.type.split('/')[1];
  const path = `${STORE_ID}/${id}-${Date.now()}.${ext}`;
  const { error: upErr } = await client.storage.from('product-images').upload(path, file, { contentType: file.type, upsert: true });
  if (upErr) return err(c, upErr);

  const { data: pub } = client.storage.from('product-images').getPublicUrl(path);
  const { error: updErr } = await client.from('products').update({ image_url: pub.publicUrl }).eq('id', id).eq('store_id', STORE_ID);
  if (updErr) return err(c, updErr);

  return c.json({ imageUrl: pub.publicUrl });
});

app.delete('/products/:id', async (c) => {
  const auth = await requireAdmin(c);
  if (auth instanceof Response) return auth;
  const id = c.req.param('id');
  const client = sb();
  const { error } = await client.from('products').delete().eq('id', id).eq('store_id', STORE_ID);
  if (error) {
    // Referenced by past order_items — soft delete instead of losing order history.
    const { error: softErr } = await client.from('products').update({ is_active: false }).eq('id', id);
    if (softErr) return err(c, softErr);
    return c.json({ ok: true, softDeleted: true });
  }
  return c.json({ ok: true, softDeleted: false });
});

// ---- orders ----

// Admin view: every order for the store.
app.get('/orders', async (c) => {
  const auth = await requireAdmin(c);
  if (auth instanceof Response) return auth;
  const { data, error } = await sb()
    .from('orders')
    .select(ORDER_SELECT)
    .eq('store_id', STORE_ID)
    .order('created_at', { ascending: false });
  if (error) return err(c, error);
  return c.json(data.map(mapOrder));
});

// Customer view: only the authenticated caller's own orders.
app.get('/orders/mine', async (c) => {
  const auth = await requireCustomer(c);
  if (auth instanceof Response) return auth;
  const { data, error } = await sb()
    .from('orders')
    .select(ORDER_SELECT)
    .eq('store_id', STORE_ID)
    .eq('customer_id', auth.customerId)
    .order('created_at', { ascending: false });
  if (error) return err(c, error);
  return c.json(data.map(mapOrder));
});

app.post('/orders', async (c) => {
  const auth = await requireCustomer(c);
  if (auth instanceof Response) return auth;
  const body = await c.req.json();
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return c.json({ error: 'INVALID_INPUT' }, 400);
  }
  const client = sb();

  const { data: created, error: rpcErr } = await client.rpc('create_order', {
    p_store_id: STORE_ID,
    p_customer_id: auth.customerId,
    p_payment_method: body.paymentMethod,
    p_pickup_window_start: body.pickupWindowStart ?? tomorrowNoonUtcIso(),
    p_items: body.items.map((i: { productId: string; qty: number }) => ({ product_id: i.productId, quantity: i.qty })),
  });
  if (rpcErr) {
    if (String(rpcErr.message).startsWith('OUT_OF_STOCK')) return c.json({ error: 'OUT_OF_STOCK' }, 409);
    return err(c, rpcErr);
  }
  const row = created[0];
  if (body.note) {
    await client.from('orders').update({ note: body.note }).eq('id', row.order_id);
  }
  const { data: full, error: fetchErr } = await client.from('orders').select(ORDER_SELECT).eq('id', row.order_id).single();
  if (fetchErr) return err(c, fetchErr);
  const orderDto = mapOrder(full);

  await recordStatusChange({
    orderId: orderDto.id,
    fromStatus: null,
    toStatus: 'pending',
    actorType: 'customer',
    actorId: auth.customerId,
    actorName: auth.customer.name,
  });

  await notify([auth.userId], {
    type: 'order_received',
    title: 'Pedido recebido',
    message: `Recebemos seu pedido ${orderDto.displayId}!`,
    link: '/history',
    relatedId: orderDto.id,
  });
  const adminIds = await adminUserIds(auth.userId);
  await notify(adminIds, {
    type: 'new_order',
    title: 'Novo pedido',
    message: `${auth.customer.name} fez um pedido de ${formatCents(orderDto.totalCents)}.`,
    link: '/admin/orders',
    relatedId: orderDto.id,
  });

  return c.json(orderDto, 201);
});

const ADMIN_SETTABLE_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'preparing',
  'separated',
  'ready_for_pickup',
  'delivered',
  'no_show',
];

// Admins can advance the order through the full lifecycle. A regular customer may only cancel
// their own order (and only while it's still pending/confirmed — cancel_order() enforces that).
app.patch('/orders/:id/status', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const client = sb();

  const auth = await requireCustomer(c);
  if (auth instanceof Response) return auth;
  const admin = await isAdminPhone(auth.customer.phone);

  const { data: order, error: orderErr } = await client
    .from('orders')
    .select('id,order_number,status,customer_id,customers(auth_user_id,name)')
    .eq('id', id)
    .eq('store_id', STORE_ID)
    .maybeSingle();
  if (orderErr) return err(c, orderErr);
  if (!order) return c.json({ error: 'NOT_FOUND' }, 404);

  if (!admin) {
    if (body.status !== 'cancelled') return c.json({ error: 'FORBIDDEN' }, 403);
    if (order.customer_id !== auth.customerId) return c.json({ error: 'FORBIDDEN' }, 403);
  }

  const displayId = `#DC-${order.order_number}`;
  const fromStatus = order.status as OrderStatus;
  const orderCustomer = one<{ auth_user_id: string | null; name: string }>(order.customers);

  if (body.status === 'cancelled') {
    const { error } = await client.rpc('cancel_order', {
      p_order_id: id,
      p_cancelled_by: admin ? (body.cancelledBy ?? 'admin') : 'client',
      p_reason: body.reason ?? null,
    });
    if (error) return err(c, error, 409);

    await recordStatusChange({
      orderId: id,
      fromStatus,
      toStatus: 'cancelled',
      actorType: admin ? 'admin' : 'customer',
      actorId: auth.customerId,
      actorName: auth.customer.name,
    });

    if (admin) {
      if (orderCustomer?.auth_user_id) {
        await notify([orderCustomer.auth_user_id], {
          type: 'order_cancelled',
          title: 'Pedido cancelado',
          message: `Seu pedido ${displayId} foi cancelado.`,
          link: '/history',
          relatedId: id,
        });
      }
    } else {
      const adminIds = await adminUserIds();
      await notify(adminIds, {
        type: 'order_cancelled',
        title: 'Pedido cancelado',
        message: `${auth.customer.name} cancelou o pedido ${displayId}.`,
        link: '/admin/orders',
        relatedId: id,
      });
    }
    return c.json({ ok: true });
  }
  if (!admin) return c.json({ error: 'FORBIDDEN' }, 403);
  if (!ADMIN_SETTABLE_STATUSES.includes(body.status)) {
    return c.json({ error: 'INVALID_STATUS' }, 400);
  }
  const toStatus = body.status as OrderStatus;
  const { error } = await client.from('orders').update({ status: toStatus }).eq('id', id).eq('store_id', STORE_ID);
  if (error) return err(c, error);

  await recordStatusChange({
    orderId: id,
    fromStatus,
    toStatus,
    actorType: 'admin',
    actorId: auth.customerId,
    actorName: auth.customer.name,
  });

  const notifyInfo = STATUS_NOTIFY[toStatus];
  if (orderCustomer?.auth_user_id && notifyInfo) {
    await notify([orderCustomer.auth_user_id], {
      type: notifyInfo.type,
      title: notifyInfo.title,
      message: notifyInfo.message(displayId),
      link: '/history',
      relatedId: id,
    });
  }
  return c.json({ ok: true });
});

// Full audit trail for one order: who changed it, from what, to what, and when. Admins can
// view any order's history; a customer can only view their own.
app.get('/orders/:id/history', async (c) => {
  const auth = await requireCustomer(c);
  if (auth instanceof Response) return auth;
  const id = c.req.param('id');
  const client = sb();
  const admin = await isAdminPhone(auth.customer.phone);

  if (!admin) {
    const { data: order } = await client.from('orders').select('customer_id').eq('id', id).eq('store_id', STORE_ID).maybeSingle();
    if (!order || order.customer_id !== auth.customerId) return c.json({ error: 'FORBIDDEN' }, 403);
  }

  const { data, error } = await client
    .from('order_status_history')
    .select('*')
    .eq('order_id', id)
    .order('created_at', { ascending: true });
  if (error) return err(c, error);
  return c.json(
    data.map((h) => ({
      id: h.id,
      fromStatus: h.from_status,
      toStatus: h.to_status,
      changedByType: h.changed_by_type,
      changedByName: h.changed_by_name,
      createdAt: h.created_at,
    })),
  );
});

// ---- pickup search ----
app.get('/pickup', async (c) => {
  const auth = await requireAdmin(c);
  if (auth instanceof Response) return auth;
  const q = (c.req.query('q') ?? '').trim().toLowerCase();
  const qDigits = q.replace(/\D/g, '');
  const { data, error } = await sb()
    .from('orders')
    .select(ORDER_SELECT)
    .eq('store_id', STORE_ID)
    // Cancelled orders were never going to be picked up, so they don't belong in a
    // "find the order and deliver it" search — there's nothing to deliver.
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false });
  if (error) return err(c, error);
  const filtered = q
    ? data.filter((o) => {
        const cust = one<{ name: string; phone: string }>(o.customers);
        return (
          cust?.name?.toLowerCase().includes(q) ||
          String(o.order_number).includes(q) ||
          (qDigits && cust?.phone?.replace(/\D/g, '').includes(qDigits))
        );
      })
    : data;
  return c.json(filtered.map(mapOrder));
});

// ---- clients ----
app.get('/clients', async (c) => {
  const auth = await requireAdmin(c);
  if (auth instanceof Response) return auth;
  const client = sb();
  const [{ data: customers, error: ce }, { data: orders, error: oe }] = await Promise.all([
    client.from('customers').select('id,name,phone').eq('store_id', STORE_ID),
    client.from('orders').select('customer_id,total_cents,status,created_at').eq('store_id', STORE_ID),
  ]);
  if (ce) return err(c, ce);
  if (oe) return err(c, oe);
  const byCustomer = new Map<string, { orders: number; spentCents: number; last: string | null }>();
  for (const o of orders) {
    if (o.status === 'cancelled') continue;
    const cur = byCustomer.get(o.customer_id) ?? { orders: 0, spentCents: 0, last: null };
    cur.orders += 1;
    cur.spentCents += o.total_cents;
    if (!cur.last || o.created_at > cur.last) cur.last = o.created_at;
    byCustomer.set(o.customer_id, cur);
  }
  const result = customers
    .map((cust) => {
      const agg = byCustomer.get(cust.id);
      return {
        id: cust.id,
        name: cust.name,
        phone: cust.phone,
        orders: agg?.orders ?? 0,
        spentCents: agg?.spentCents ?? 0,
        lastOrderAt: agg?.last ?? null,
      };
    })
    .filter((x) => x.orders > 0)
    .sort((a, b) => b.spentCents - a.spentCents);
  return c.json(result);
});

// ---- prepare tomorrow ----
app.get('/prepare', async (c) => {
  const auth = await requireAdmin(c);
  if (auth instanceof Response) return auth;
  const { data: allOrders, error } = await sb()
    .from('orders')
    .select('id,pickup_window_start,order_items(product_id,product_name_snapshot,quantity,unit_price_cents)')
    .eq('store_id', STORE_ID)
    .in('status', ['pending', 'confirmed', 'preparing']);
  if (error) return err(c, error);
  const tomorrowR = localDayRangeUtc(1);
  const orders = allOrders.filter((o) => within(o.pickup_window_start, tomorrowR));
  const byProduct = new Map<string, { productId: string; name: string; qty: number; orderIds: Set<string>; unitCents: number }>();
  for (const o of orders) {
    for (const li of o.order_items) {
      const cur = byProduct.get(li.product_id) ?? {
        productId: li.product_id,
        name: li.product_name_snapshot,
        qty: 0,
        orderIds: new Set<string>(),
        unitCents: li.unit_price_cents,
      };
      cur.qty += li.quantity;
      cur.orderIds.add(o.id);
      byProduct.set(li.product_id, cur);
    }
  }
  const items = [...byProduct.values()]
    .map((x) => ({ productId: x.productId, name: x.name, qty: x.qty, orders: x.orderIds.size, valueCents: x.qty * x.unitCents }))
    .sort((a, b) => b.qty - a.qty);
  return c.json(items);
});

// ---- dashboard ----
app.get('/dashboard', async (c) => {
  const auth = await requireAdmin(c);
  if (auth instanceof Response) return auth;
  const period = c.req.query('period') ?? 'month';
  const from = c.req.query('from') ?? undefined;
  const to = c.req.query('to') ?? undefined;

  const client = sb();
  const [{ data: products, error: pe }, { data: stock, error: se }, { data: orders, error: oe }] = await Promise.all([
    client.from('products').select('id,name').eq('store_id', STORE_ID),
    client.from('product_stock').select('product_id,quantity_available'),
    client.from('orders').select(ORDER_SELECT).eq('store_id', STORE_ID),
  ]);
  if (pe) return err(c, pe);
  if (se) return err(c, se);
  if (oe) return err(c, oe);

  const notCancelled = (o: any) => o.status !== 'cancelled';

  // "Right now" operational metrics — always today/tomorrow, independent of the selected period.
  const todayR = localDayRangeUtc(0);
  const yesterdayR = localDayRangeUtc(-1);
  const tomorrowR = localDayRangeUtc(1);
  const ordersToday = orders.filter((o) => within(o.created_at, todayR));
  const ordersYesterday = orders.filter((o) => within(o.created_at, yesterdayR));
  const ordersTomorrow = orders.filter((o) => within(o.pickup_window_start, tomorrowR));
  const revenueToday = ordersToday.filter(notCancelled).reduce((s, o) => s + o.total_cents, 0);
  const revenueYesterday = ordersYesterday.filter(notCancelled).reduce((s, o) => s + o.total_cents, 0);
  const deliveredToday = orders.filter((o) => o.status === 'delivered' && within(o.created_at, todayR)).length;
  const deliveredTotal = orders.filter((o) => o.status === 'delivered').length;
  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const lowStockCount = stock.filter((s) => s.quantity_available <= LOW_STOCK_THRESHOLD).length;

  // Report-style metrics — scoped to the selected period (Hoje/Semana/Mês/Ano/personalizado).
  const range = periodRange(period, from, to);
  const prevRange = previousPeriodRange(range);
  const periodOrders = orders.filter((o) => within(o.created_at, range) && notCancelled(o));
  const prevPeriodOrders = orders.filter((o) => within(o.created_at, prevRange) && notCancelled(o));

  const revenuePeriod = periodOrders.reduce((s, o) => s + o.total_cents, 0);
  const revenuePrevPeriod = prevPeriodOrders.reduce((s, o) => s + o.total_cents, 0);
  const avgTicket = periodOrders.length ? Math.round(revenuePeriod / periodOrders.length) : 0;
  const avgTicketPrev = prevPeriodOrders.length ? Math.round(revenuePrevPeriod / prevPeriodOrders.length) : 0;
  const qtyOfItems = (o: any) => o.order_items.reduce((s: number, li: any) => s + li.quantity, 0);
  const productsSoldPeriod = periodOrders.reduce((s, o) => s + qtyOfItems(o), 0);
  const productsSoldPrevPeriod = prevPeriodOrders.reduce((s, o) => s + qtyOfItems(o), 0);

  const qtyByProduct = new Map<string, number>();
  for (const o of periodOrders) {
    for (const li of o.order_items) qtyByProduct.set(li.product_id, (qtyByProduct.get(li.product_id) ?? 0) + li.quantity);
  }
  let bestSellerId: string | null = null;
  let bestSellerQty = 0;
  for (const [pid, qty] of qtyByProduct) {
    if (qty > bestSellerQty) {
      bestSellerId = pid;
      bestSellerQty = qty;
    }
  }
  const bestSellerName = bestSellerId ? (products.find((p) => p.id === bestSellerId)?.name ?? '—') : '—';

  const spentByCustomer = new Map<string, { name: string; total: number }>();
  for (const o of periodOrders) {
    const cust = one<{ name: string }>((o as any).customers);
    const cur = spentByCustomer.get(o.customer_id) ?? { name: cust?.name ?? '—', total: 0 };
    cur.total += o.total_cents;
    spentByCustomer.set(o.customer_id, cur);
  }
  let topClient: { name: string; total: number } | null = null;
  for (const v of spentByCustomer.values()) {
    if (!topClient || v.total > topClient.total) topClient = v;
  }

  const payCounts = { pix: 0, cash: 0 };
  for (const o of periodOrders) {
    payCounts[o.payment_method as 'pix' | 'cash'] = (payCounts[o.payment_method as 'pix' | 'cash'] ?? 0) + 1;
  }
  const payTotal = payCounts.pix + payCounts.cash || 1;

  const bestSellers = [...qtyByProduct.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([pid, qty]) => ({ name: products.find((p) => p.id === pid)?.name ?? '—', qty }));

  const chartSeries = bucketRevenue(orders, range);

  const recentOrders = [...orders]
    .sort((a, b) => (b.created_at > a.created_at ? 1 : -1))
    .slice(0, 4)
    .map((o) => {
      const cust = one<{ name: string }>((o as any).customers);
      return {
        id: o.id,
        displayId: `#DC-${o.order_number}`,
        client: cust?.name ?? '—',
        items: o.order_items.reduce((s: number, li: any) => s + li.quantity, 0),
        totalCents: o.total_cents,
        status: o.status,
      };
    });

  return c.json({
    ordersToday: ordersToday.length,
    ordersTodayTrend: pctChange(ordersToday.length, ordersYesterday.length),
    ordersTomorrow: ordersTomorrow.length,
    revenueTodayCents: revenueToday,
    revenueTodayTrend: pctChange(revenueToday, revenueYesterday),
    deliveredToday,
    deliveredTotal,
    pendingCount,
    lowStockCount,

    period,
    periodLabel: periodLabelFor(period, range, from, to),
    revenuePeriodCents: revenuePeriod,
    revenuePeriodTrend: pctChange(revenuePeriod, revenuePrevPeriod),
    avgTicketCents: avgTicket,
    avgTicketTrend: pctChange(avgTicket, avgTicketPrev),
    productsSoldPeriod,
    productsSoldTrend: pctChange(productsSoldPeriod, productsSoldPrevPeriod),
    bestSellerName,
    bestSellerQty,
    topClientName: topClient?.name ?? '—',
    topClientSpentCents: topClient?.total ?? 0,
    bestSellers,
    chartSeries,
    paymentDistribution: {
      pix: Math.round((payCounts.pix / payTotal) * 100),
      cash: Math.round((payCounts.cash / payTotal) * 100),
      pixCount: payCounts.pix,
      cashCount: payCounts.cash,
    },
    recentOrders,
  });
});

// ---- reports ----
app.get('/reports', async (c) => {
  const auth = await requireAdmin(c);
  if (auth instanceof Response) return auth;
  const { data: orders, error } = await sb().from('orders').select(ORDER_SELECT).eq('store_id', STORE_ID);
  if (error) return err(c, error);
  const notCancelled = (o: any) => o.status !== 'cancelled';
  const all = orders.filter(notCancelled);

  const revenueTotal = all.reduce((s, o) => s + o.total_cents, 0);
  const monthR = localMonthRangeUtc(0);
  const prevMonthR = localMonthRangeUtc(-1);
  const revenueMonth = all.filter((o) => within(o.created_at, monthR)).reduce((s, o) => s + o.total_cents, 0);
  const revenuePrevMonth = all.filter((o) => within(o.created_at, prevMonthR)).reduce((s, o) => s + o.total_cents, 0);

  const qtyByProduct = new Map<string, number>();
  let productsSoldTotal = 0;
  for (const o of all) {
    for (const li of o.order_items) {
      qtyByProduct.set(li.product_id, (qtyByProduct.get(li.product_id) ?? 0) + li.quantity);
      productsSoldTotal += li.quantity;
    }
  }
  const sorted = [...qtyByProduct.entries()].sort((a, b) => b[1] - a[1]);
  const bestId = sorted[0];
  const worstId = sorted[sorted.length - 1];
  const nameOf = (pid: string) => {
    for (const o of all) {
      const line = o.order_items.find((li: any) => li.product_id === pid);
      if (line) return line.product_name_snapshot;
    }
    return '—';
  };

  const payCounts = { pix: 0, cash: 0 };
  for (const o of all) payCounts[o.payment_method as 'pix' | 'cash'] = (payCounts[o.payment_method as 'pix' | 'cash'] ?? 0) + 1;
  const payTotal = payCounts.pix + payCounts.cash || 1;
  const topPayment = payCounts.pix >= payCounts.cash ? 'pix' : 'cash';

  const months: { label: string; count: number }[] = [];
  const monthLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  for (let i = 11; i >= 0; i--) {
    const r = localMonthRangeUtc(-i);
    const local = localNow();
    const idx = (((local.getUTCMonth() - i) % 12) + 12) % 12;
    months.push({ label: monthLabels[idx], count: all.filter((o) => within(o.created_at, r)).length });
  }

  return c.json({
    revenueTotalCents: revenueTotal,
    revenueMonthTrend: pctChange(revenueMonth, revenuePrevMonth),
    productsSoldTotal,
    avgTicketCents: all.length ? Math.round(revenueTotal / all.length) : 0,
    bestSeller: bestId ? { name: nameOf(bestId[0]), qty: bestId[1] } : null,
    worstSeller: worstId ? { name: nameOf(worstId[0]), qty: worstId[1] } : null,
    topPayment: { method: topPayment, pct: Math.round((payCounts[topPayment as 'pix' | 'cash'] / payTotal) * 100) },
    monthly: months,
  });
});

Deno.serve(app.fetch);

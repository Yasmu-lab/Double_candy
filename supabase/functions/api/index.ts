import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const STORE_ID = '6ce2d2f9-7841-4568-9cf3-e97c1b19db10';
const LOW_STOCK_THRESHOLD = 8;
const TZ_OFFSET_HOURS = -3; // America/Sao_Paulo, fixed (Brazil no longer observes DST)
const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

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

function mapCustomer(row: any) {
  return { id: row.id, name: row.name, phone: row.phone, photoUrl: row.photo_url };
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
  const client = sb();

  const { data: existing, error: existingErr } = await client
    .from('customers')
    .select('*')
    .eq('auth_user_id', user.id)
    .maybeSingle();
  if (existingErr) return err(c, existingErr);
  if (existing) return c.json(mapCustomer(existing));

  const { data: legacy, error: legacyErr } = await client
    .from('customers')
    .select('*')
    .eq('store_id', STORE_ID)
    .eq('phone', body.phone.trim())
    .is('auth_user_id', null)
    .maybeSingle();
  if (legacyErr) return err(c, legacyErr);

  if (legacy) {
    const { data: updated, error } = await client
      .from('customers')
      .update({ auth_user_id: user.id, name: body.name.trim() })
      .eq('id', legacy.id)
      .select()
      .single();
    if (error) return err(c, error);
    return c.json(mapCustomer(updated));
  }

  const { data: created, error } = await client
    .from('customers')
    .insert({ store_id: STORE_ID, auth_user_id: user.id, name: body.name.trim(), phone: body.phone.trim() })
    .select()
    .single();
  if (error) return err(c, error);
  return c.json(mapCustomer(created), 201);
});

app.get('/me', async (c) => {
  const auth = await requireCustomer(c);
  if (auth instanceof Response) return auth;
  return c.json(mapCustomer(auth.customer));
});

app.put('/me', async (c) => {
  const auth = await requireCustomer(c);
  if (auth instanceof Response) return auth;
  const body = await c.req.json();
  const patch: Record<string, unknown> = {};
  if (body.name !== undefined) patch.name = body.name;
  if (body.phone !== undefined) patch.phone = body.phone;
  if (!Object.keys(patch).length) return c.json(mapCustomer(auth.customer));
  const { data, error } = await sb().from('customers').update(patch).eq('id', auth.customerId).select().single();
  if (error) {
    if (error.code === '23505') return c.json({ error: 'PHONE_IN_USE' }, 409);
    return err(c, error);
  }
  return c.json(mapCustomer(data));
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
    imageUrl: p.image_url,
    active: p.is_active,
    categoryId: p.category_id,
    category: category?.name ?? null,
    stock: stock?.quantity_available ?? 0,
  };
}

app.get('/products', async (c) => {
  const { data, error } = await sb()
    .from('products')
    .select('id,name,description,price_cents,image_url,is_active,category_id,categories(name),product_stock(quantity_available)')
    .eq('store_id', STORE_ID)
    .order('created_at');
  if (error) return err(c, error);
  return c.json(data.map(mapProduct));
});

app.post('/products', async (c) => {
  const body = await c.req.json();
  const client = sb();
  const { data: product, error } = await client
    .from('products')
    .insert({
      store_id: STORE_ID,
      category_id: body.categoryId ?? null,
      name: body.name,
      description: body.description ?? null,
      price_cents: body.priceCents,
      is_active: body.active ?? true,
    })
    .select()
    .single();
  if (error) return err(c, error);
  const { error: stockError } = await client
    .from('product_stock')
    .insert({ product_id: product.id, quantity_available: body.stock ?? 0 });
  if (stockError) return err(c, stockError);
  return c.json({ id: product.id }, 201);
});

app.put('/products/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const client = sb();
  const patch: Record<string, unknown> = {};
  if (body.name !== undefined) patch.name = body.name;
  if (body.categoryId !== undefined) patch.category_id = body.categoryId;
  if (body.priceCents !== undefined) patch.price_cents = body.priceCents;
  if (body.active !== undefined) patch.is_active = body.active;
  if (body.description !== undefined) patch.description = body.description;
  if (Object.keys(patch).length) {
    const { error } = await client.from('products').update(patch).eq('id', id).eq('store_id', STORE_ID);
    if (error) return err(c, error);
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

// Admin view: every order for the store. Still gated only by the shared anon key today —
// there is no real admin-role separation yet (tracked as a follow-up, not part of this change).
app.get('/orders', async (c) => {
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
  return c.json(mapOrder(full), 201);
});

app.patch('/orders/:id/status', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const client = sb();
  if (body.status === 'cancelled') {
    const { error } = await client.rpc('cancel_order', {
      p_order_id: id,
      p_cancelled_by: body.cancelledBy ?? 'admin',
      p_reason: body.reason ?? null,
    });
    if (error) return err(c, error, 409);
    return c.json({ ok: true });
  }
  if (!['pending', 'confirmed', 'delivered', 'no_show'].includes(body.status)) {
    return c.json({ error: 'INVALID_STATUS' }, 400);
  }
  const { error } = await client.from('orders').update({ status: body.status }).eq('id', id).eq('store_id', STORE_ID);
  if (error) return err(c, error);
  return c.json({ ok: true });
});

// ---- pickup search ----
app.get('/pickup', async (c) => {
  const q = (c.req.query('q') ?? '').trim().toLowerCase();
  const qDigits = q.replace(/\D/g, '');
  const { data, error } = await sb()
    .from('orders')
    .select(ORDER_SELECT)
    .eq('store_id', STORE_ID)
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
  const { data: orders, error } = await sb()
    .from('orders')
    .select('id,order_items(product_id,product_name_snapshot,quantity,unit_price_cents)')
    .eq('store_id', STORE_ID)
    .in('status', ['pending', 'confirmed']);
  if (error) return err(c, error);
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
  const client = sb();
  const [{ data: products, error: pe }, { data: stock, error: se }, { data: orders, error: oe }] = await Promise.all([
    client.from('products').select('id,name').eq('store_id', STORE_ID),
    client.from('product_stock').select('product_id,quantity_available'),
    client.from('orders').select(ORDER_SELECT).eq('store_id', STORE_ID),
  ]);
  if (pe) return err(c, pe);
  if (se) return err(c, se);
  if (oe) return err(c, oe);

  const todayR = localDayRangeUtc(0);
  const yesterdayR = localDayRangeUtc(-1);
  const tomorrowR = localDayRangeUtc(1);
  const monthR = localMonthRangeUtc(0);
  const prevMonthR = localMonthRangeUtc(-1);
  const notCancelled = (o: any) => o.status !== 'cancelled';

  const ordersToday = orders.filter((o) => within(o.created_at, todayR));
  const ordersYesterday = orders.filter((o) => within(o.created_at, yesterdayR));
  const ordersTomorrow = orders.filter((o) => within(o.pickup_window_start, tomorrowR));

  const revenueToday = ordersToday.filter(notCancelled).reduce((s, o) => s + o.total_cents, 0);
  const revenueYesterday = ordersYesterday.filter(notCancelled).reduce((s, o) => s + o.total_cents, 0);

  const monthOrders = orders.filter((o) => within(o.created_at, monthR) && notCancelled(o));
  const prevMonthOrders = orders.filter((o) => within(o.created_at, prevMonthR) && notCancelled(o));
  const revenueMonth = monthOrders.reduce((s, o) => s + o.total_cents, 0);
  const revenuePrevMonth = prevMonthOrders.reduce((s, o) => s + o.total_cents, 0);

  const avgTicket = monthOrders.length ? Math.round(revenueMonth / monthOrders.length) : 0;
  const avgTicketPrev = prevMonthOrders.length ? Math.round(revenuePrevMonth / prevMonthOrders.length) : 0;

  const qtyOf = (o: any) => o.lines.reduce((s: number, li: any) => s + li.qty, 0);
  const productsSoldMonth = monthOrders.reduce((s, o) => s + qtyOf(mapOrder(o)), 0);
  const productsSoldPrevMonth = prevMonthOrders.reduce((s, o) => s + qtyOf(mapOrder(o)), 0);

  const deliveredToday = orders.filter((o) => o.status === 'delivered' && within(o.created_at, todayR)).length;
  const deliveredTotal = orders.filter((o) => o.status === 'delivered').length;
  const pendingCount = orders.filter((o) => o.status === 'pending').length;

  const qtyByProduct = new Map<string, number>();
  for (const o of orders) {
    if (!notCancelled(o)) continue;
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
  for (const o of orders) {
    if (!notCancelled(o)) continue;
    const cust = one<{ name: string }>((o as any).customers);
    const cur = spentByCustomer.get(o.customer_id) ?? { name: cust?.name ?? '—', total: 0 };
    cur.total += o.total_cents;
    spentByCustomer.set(o.customer_id, cur);
  }
  let topClient: { name: string; total: number } | null = null;
  for (const v of spentByCustomer.values()) {
    if (!topClient || v.total > topClient.total) topClient = v;
  }

  const lowStockCount = stock.filter((s) => s.quantity_available <= LOW_STOCK_THRESHOLD).length;

  const weeklyRevenueCents = [6, 5, 4, 3, 2, 1, 0]
    .reverse()
    .map((offset) => {
      const r = localDayRangeUtc(-offset);
      return orders.filter((o) => notCancelled(o) && within(o.created_at, r)).reduce((s, o) => s + o.total_cents, 0);
    });

  const payCounts = { pix: 0, cash: 0 };
  for (const o of orders) {
    if (!notCancelled(o)) continue;
    payCounts[o.payment_method as 'pix' | 'cash'] = (payCounts[o.payment_method as 'pix' | 'cash'] ?? 0) + 1;
  }
  const payTotal = payCounts.pix + payCounts.cash || 1;

  const bestSellers = [...qtyByProduct.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([pid, qty]) => ({ name: products.find((p) => p.id === pid)?.name ?? '—', qty }));

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
    revenueMonthCents: revenueMonth,
    revenueMonthTrend: pctChange(revenueMonth, revenuePrevMonth),
    avgTicketCents: avgTicket,
    avgTicketTrend: pctChange(avgTicket, avgTicketPrev),
    productsSoldMonth,
    productsSoldTrend: pctChange(productsSoldMonth, productsSoldPrevMonth),
    deliveredToday,
    deliveredTotal,
    pendingCount,
    bestSellerName,
    bestSellerQty,
    topClientName: topClient?.name ?? '—',
    topClientSpentCents: topClient?.total ?? 0,
    lowStockCount,
    weeklyRevenueCents,
    paymentDistribution: {
      pix: Math.round((payCounts.pix / payTotal) * 100),
      cash: Math.round((payCounts.cash / payTotal) * 100),
      pixCount: payCounts.pix,
      cashCount: payCounts.cash,
    },
    bestSellers,
    recentOrders,
  });
});

// ---- reports ----
app.get('/reports', async (c) => {
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

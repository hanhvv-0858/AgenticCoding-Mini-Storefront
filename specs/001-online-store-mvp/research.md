# Phase 0 Research: Mini Storefront — Online Store MVP

**Branch**: `001-online-store-mvp` | **Date**: 2026-02-23  
**Input**: Technical topics derived from [plan.md](plan.md) and [spec.md](spec.md)

---

## Topic 1: Supabase Auth with Next.js App Router

### Decision

Use **`@supabase/ssr`** (v0.5+) for all Supabase client creation in Next.js 14 App Router. Create three client factories:

1. **Browser client** — for Client Components (`createBrowserClient`)
2. **Server client** — for Server Components, Route Handlers, Server Actions (`createServerClient` with cookie adapter)
3. **Middleware client** — for `middleware.ts` (`createServerClient` with request/response cookie handling)

Distinguish admin vs customer via a **`profiles` table** with a `role` column (`'customer' | 'admin'`).

### Rationale

- `@supabase/auth-helpers-nextjs` is **deprecated** as of 2024. The Supabase team consolidated all SSR auth into `@supabase/ssr`, which is framework-agnostic and directly supports the App Router cookie model.
- `@supabase/ssr` uses `CookieOptions` adapters, giving precise control over how auth tokens are stored/refreshed in both server and client contexts.
- A `profiles` table approach (vs Supabase custom claims via `app_metadata`) is simpler for this project: no need for admin API calls or service-role keys to update JWT claims. RLS policies can join against `profiles` directly. Custom claims would require a webhook or Edge Function to sync role into the JWT — unnecessary complexity for a single-admin store.

### Alternatives Considered

| Alternative | Why Rejected |
|---|---|
| `@supabase/auth-helpers-nextjs` | Deprecated. No longer maintained; docs redirect to `@supabase/ssr`. |
| Custom claims in `app_metadata` | Requires service-role key to set claims, plus a trigger/webhook to embed role in JWT. Overkill for single-admin. Harder to change roles dynamically. |
| NextAuth.js + Supabase adapter | Adds a separate auth layer. Supabase Auth is already full-featured (email/password, session management). Extra dependency with no benefit for this use case. |

### Key Code Patterns

**1. Browser client (`lib/supabase/client.ts`)**

```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**2. Server client (`lib/supabase/server.ts`)**

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from Server Component — ignore.
            // Middleware will handle refresh.
          }
        },
      },
    }
  )
}
```

**3. Middleware for admin route protection (`middleware.ts`)**

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do NOT use getSession() — it reads from localStorage/cookies 
  // without validation. getUser() makes a server call to verify the JWT.
  const { data: { user } } = await supabase.auth.getUser()

  // Protect /admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/account'
      url.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }

    // Check admin role from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Match all routes except static files and _next
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**4. Role check pattern — reusable helper**

```typescript
// lib/supabase/auth.ts
import { createClient } from './server'

export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', user.id)
    .single()

  return profile ? { ...user, profile } : null
}

export async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user || user.profile.role !== 'admin') {
    throw new Error('Unauthorized')
  }
  return user
}
```

### Important Notes

- **Always use `getUser()`, never `getSession()`** in server contexts for auth checks. `getSession()` reads the JWT from cookies without server-side verification — it can be spoofed. `getUser()` makes a network call to Supabase Auth to validate the token.
- The middleware profile lookup adds one DB query per admin request. For this project's scale (single admin, tens of concurrent users), this is negligible. For larger scale, move role into custom claims.
- Create a `profiles` row automatically via a Supabase database trigger on `auth.users` insert:

```sql
-- In migration: create trigger to auto-create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (NEW.id, 'customer', COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## Topic 2: Supabase RPC for Atomic Stock Operations

### Decision

Use a single **PostgreSQL function** (`checkout_order`) called via `supabase.rpc('checkout_order', {...})` that performs the entire checkout in one transaction:

1. Validates stock ≥ requested quantity for every item (using `SELECT ... FOR UPDATE` to lock rows)
2. Decrements stock on each product
3. Creates the `order` row
4. Creates all `order_items` rows with price snapshots
5. Returns the new order ID or raises an exception

Additionally, add a **CHECK constraint** on `products.stock` as a safety net: `CHECK (stock >= 0)`.

### Rationale

- PostgreSQL functions run in an **implicit transaction**. If any step fails (stock check, insert, constraint violation), the entire operation rolls back automatically. No partial state.
- `SELECT ... FOR UPDATE` acquires a **row-level exclusive lock** on the product rows being purchased. A second concurrent checkout for the same product will block until the first transaction commits or rolls back — eliminating the race condition.
- The CHECK constraint is a **defense-in-depth** measure. Even if application logic has a bug, the database will never allow `stock < 0`.
- Calling this via RPC means the client sends one request. No multi-step client-side transaction logic needed.

### Alternatives Considered

| Alternative | Why Rejected |
|---|---|
| Application-level transaction (multiple queries) | Supabase JS client doesn't support multi-statement transactions. Would require multiple round-trips with no atomicity guarantee. |
| CHECK constraint only (no `FOR UPDATE`) | CHECK prevents negative stock but doesn't prevent two concurrent transactions from both reading `stock = 1`, both passing the check, and then one failing on commit. With `FOR UPDATE`, the second transaction waits, reads the updated stock, and fails gracefully. |
| Optimistic locking (version column) | More complex. Requires retry logic on the client. `FOR UPDATE` is simpler and deterministic for this scale. |
| Edge Function for checkout | Adds deployment complexity. The PostgreSQL function approach keeps all logic in the database layer — simpler, faster (no network hop to Edge Function), and guaranteed transactional. |

### Key Code Patterns

**1. PostgreSQL RPC function (`supabase/migrations/007_functions.sql`)**

```sql
CREATE OR REPLACE FUNCTION checkout_order(
  p_customer_id UUID DEFAULT NULL,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_customer_address TEXT,
  p_items JSONB  -- [{"product_id": "uuid", "quantity": 2}, ...]
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_order_id UUID;
  v_item JSONB;
  v_product RECORD;
  v_total BIGINT := 0;
BEGIN
  -- Validate input
  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  -- Lock and validate all products
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT id, name, price, stock, is_published
    INTO v_product
    FROM products
    WHERE id = (v_item->>'product_id')::UUID
    FOR UPDATE;  -- Row-level lock

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product not found: %', v_item->>'product_id';
    END IF;

    IF NOT v_product.is_published THEN
      RAISE EXCEPTION 'Product not available: %', v_product.name;
    END IF;

    IF v_product.stock < (v_item->>'quantity')::INT THEN
      RAISE EXCEPTION 'Insufficient stock for %: requested %, available %',
        v_product.name, (v_item->>'quantity')::INT, v_product.stock;
    END IF;

    v_total := v_total + (v_product.price * (v_item->>'quantity')::INT);
  END LOOP;

  -- Create order
  INSERT INTO orders (customer_id, customer_name, customer_phone, customer_address, total_amount, status, payment_method)
  VALUES (p_customer_id, p_customer_name, p_customer_phone, p_customer_address, v_total, 'pending', 'cod')
  RETURNING id INTO v_order_id;

  -- Create order items and decrement stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT id, name, price INTO v_product
    FROM products
    WHERE id = (v_item->>'product_id')::UUID;

    INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity)
    VALUES (v_order_id, v_product.id, v_product.name, v_product.price, (v_item->>'quantity')::INT);

    UPDATE products
    SET stock = stock - (v_item->>'quantity')::INT
    WHERE id = v_product.id;
  END LOOP;

  RETURN v_order_id;
END;
$$;
```

**2. Client-side RPC call (`app/api/orders/route.ts`)**

```typescript
// In the POST route handler
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()

const { data: orderId, error } = await supabase.rpc('checkout_order', {
  p_customer_id: user?.id ?? null,
  p_customer_name: validated.customerName,
  p_customer_phone: validated.customerPhone,
  p_customer_address: validated.customerAddress,
  p_items: validated.items, // JSONB array
})

if (error) {
  // Parse the PostgreSQL exception message for user-friendly errors
  if (error.message.includes('Insufficient stock')) {
    return NextResponse.json({ error: 'Một số sản phẩm đã hết hàng' }, { status: 409 })
  }
  return NextResponse.json({ error: 'Checkout failed' }, { status: 500 })
}

return NextResponse.json({ orderId }, { status: 201 })
```

**3. Order cancellation with stock restore**

```sql
CREATE OR REPLACE FUNCTION cancel_order(p_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Verify order is cancellable
  IF NOT EXISTS (
    SELECT 1 FROM orders WHERE id = p_order_id AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'Order cannot be cancelled (not in pending status)';
  END IF;

  -- Restore stock for each item
  UPDATE products p
  SET stock = p.stock + oi.quantity
  FROM order_items oi
  WHERE oi.order_id = p_order_id AND oi.product_id = p.id;

  -- Update order status
  UPDATE orders SET status = 'cancelled', updated_at = NOW()
  WHERE id = p_order_id;
END;
$$;
```

**4. CHECK constraint (migration)**

```sql
ALTER TABLE products ADD CONSTRAINT products_stock_non_negative CHECK (stock >= 0);
ALTER TABLE products ADD CONSTRAINT products_price_non_negative CHECK (price >= 0);
```

### Important Notes

- The `FOR UPDATE` lock is held only for the duration of the transaction (milliseconds). At the project's scale (tens of concurrent users), lock contention is negligible.
- The RPC function uses `SECURITY INVOKER` by default, meaning RLS policies apply. If the function needs to bypass RLS (e.g., for guest checkout writing to `orders`), use `SECURITY DEFINER` with care and validate inputs within the function.
- For the checkout RPC that needs to write orders for unauthenticated users, mark it as `SECURITY DEFINER` and set `search_path = public` to prevent privilege escalation.
- Error messages from `RAISE EXCEPTION` are returned in the `error.message` field of the Supabase response. Parse these to provide localized user-facing messages.

---

## Topic 3: Next.js App Router — Server Components vs Client Components

### Decision

**Default to Server Components** for all pages. Only add `'use client'` to components that need browser APIs (event handlers, `useState`, `useEffect`, localStorage, `window`).

| Page / Component | Type | Reason |
|---|---|---|
| Product listing (`(storefront)/page.tsx`) | **Server** | Fetch products from Supabase at request time. SEO-critical. |
| Product detail (`products/[id]/page.tsx`) | **Server** | SEO, SSR with dynamic params. |
| Search page (`search/page.tsx`) | **Server** (shell) + **Client** (filters/search input) | Server fetches initial data; client handles interactive filtering. |
| Cart page (`cart/page.tsx`) | **Client** | Entirely driven by localStorage state. |
| Checkout page (`checkout/page.tsx`) | **Client** | Form state, validation, submission. Reads cart from localStorage. |
| Checkout success (`checkout/success/page.tsx`) | **Server** | Fetches order from DB by ID. Static display. |
| Account page (`account/page.tsx`) | **Client** (auth forms) + **Server** (order history) | Auth forms need client interactivity; order history is server-fetched. |
| Admin dashboard (`admin/page.tsx`) | **Server** | Fetches stats from DB. |
| Admin product list (`admin/products/page.tsx`) | **Server** (data) + **Client** (inline edit, actions) | Server fetches all products; client handles mutations. |
| Admin product form (`admin/products/new` & `[id]`) | **Client** | Form state, image upload, validation. |
| Admin orders (`admin/orders/page.tsx`) | **Server** (data) + **Client** (status buttons) | Server fetches orders; client handles status changes. |
| Bottom navigation (`BottomNav.tsx`) | **Client** | Needs `usePathname()`, badge state from cart context. |

### Rationale

- Server Components **reduce client JS bundle size** — critical for mobile-first LCP ≤ 2.5s target (SC-002).
- Product pages are SEO-critical — Server Components deliver fully rendered HTML.
- Cart and checkout are inherently client-side (localStorage, form state) — no server rendering benefit.
- The "server shell + client islands" pattern (e.g., `SearchPage` server component renders `<SearchBar />` and `<CategoryFilter />` client components) maximizes server rendering while enabling interactivity.

### Alternatives Considered

| Alternative | Why Rejected |
|---|---|
| Full client-side SPA approach | Defeats the purpose of Next.js App Router. No SSR, no SEO, larger JS bundle, slower LCP. |
| Full SSR for cart/checkout | Cart is in localStorage — server has no access. Would require syncing cart to server, adding complexity with no benefit for a guest-friendly store. |
| React Server Components with streaming | Useful for slow data fetches. Our queries are simple single-table reads (< 100ms). Streaming adds complexity without visible benefit at this scale. Can add later via `loading.tsx` Suspense boundaries if needed. |

### Key Code Patterns

**1. Product listing — Server Component with client interactivity**

```typescript
// app/(storefront)/page.tsx — Server Component
import { createClient } from '@/lib/supabase/server'
import { ProductGrid } from '@/components/storefront/ProductGrid'
import { CategoryFilter } from '@/components/storefront/CategoryFilter'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('products')
    .select('*, categories(name)')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (category) {
    query = query.eq('category_id', category)
  }

  const { data: products } = await query
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .order('name')

  return (
    <div>
      {/* Client Component for interactivity */}
      <CategoryFilter categories={categories ?? []} current={category} />
      {/* Client Component for "Add to Cart" buttons */}
      <ProductGrid products={products ?? []} />
    </div>
  )
}
```

**2. Cart state — React Context + localStorage**

```typescript
// hooks/useCart.ts
'use client'
import { createContext, useContext, useEffect, useState, useCallback } from 'react'

interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  imageUrl: string
  maxStock: number
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalAmount: number
}

const CART_KEY = 'mini-storefront-cart'

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(CART_KEY)
    if (stored) {
      try { setItems(JSON.parse(stored)) } catch { /* ignore corrupt data */ }
    }
    setIsLoaded(true)
  }, [])

  // Persist to localStorage on change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(CART_KEY, JSON.stringify(items))
    }
  }, [items, isLoaded])

  const addItem = useCallback((item: Omit<CartItem, 'quantity'>) => {
    setItems(prev => {
      const existing = prev.find(i => i.productId === item.productId)
      if (existing) {
        return prev.map(i =>
          i.productId === item.productId
            ? { ...i, quantity: Math.min(i.quantity + 1, i.maxStock) }
            : i
        )
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }, [])

  // ... removeItem, updateQuantity, clearCart

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  if (!isLoaded) return null // Prevent hydration mismatch

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalAmount }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
```

**3. Data revalidation after admin changes**

```typescript
// app/api/products/[id]/route.ts — PUT handler
import { revalidatePath } from 'next/cache'

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  // ... validate and update product ...

  // Revalidate affected pages
  revalidatePath('/')                         // Home product grid
  revalidatePath(`/products/${params.id}`)    // Product detail page
  revalidatePath('/search')                   // Search results
  revalidatePath('/admin/products')           // Admin product list

  return NextResponse.json({ success: true })
}
```

```typescript
// For publish/unpublish — Server Action pattern
'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function togglePublish(productId: string, isPublished: boolean) {
  const supabase = await createClient()
  await supabase
    .from('products')
    .update({ is_published: isPublished })
    .eq('id', productId)

  revalidatePath('/')
  revalidatePath('/admin/products')
}
```

### Important Notes

- **Hydration mismatch prevention**: The `CartProvider` returns `null` until localStorage is loaded. This prevents the server-rendered HTML (which has no cart data) from conflicting with the client-rendered cart state.
- `revalidatePath` purges the full-route cache for that path. At this project's scale, this is fine. For more granular control, use `revalidateTag` with fetch cache tags.
- Use `searchParams` (not client-side state) for category filtering and search — this keeps URLs shareable and enables server-side data fetching with the filter applied.

---

## Topic 4: Supabase Row Level Security (RLS) Patterns

### Decision

Enable RLS on all tables. Define policies around three access patterns:

1. **Public read** — anyone can read published products and categories (no auth required)
2. **Admin write** — only users with `role = 'admin'` in `profiles` can insert/update/delete products, update orders, manage categories
3. **Customer read own** — authenticated users can read only their own orders and order items

Use the **`profiles` table** to determine role in RLS policies via a subquery or a helper function.

### Rationale

- RLS is enforced at the database level — even if application code has a bug or an API route is misconfigured, unauthorized data access is impossible.
- Using a `profiles` table (vs custom claims) for role checks in RLS is straightforward: `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')`. This query hits the `profiles` primary key index — effectively O(1).
- Supabase automatically applies RLS when queries are made with the `anon` or authenticated user's JWT. No extra application code needed beyond creating the policies.

### Alternatives Considered

| Alternative | Why Rejected |
|---|---|
| Custom claims in JWT (`app_metadata.role`) | Faster in RLS (no subquery), but requires service-role key to set, and changes don't take effect until JWT refresh (up to 1 hour). For a single-admin store, the profiles subquery is negligible and changes are immediate. |
| Application-level auth checks only (no RLS) | Dangerous. Any misconfigured API route or direct Supabase client access could leak data. Defense-in-depth requires DB-level enforcement. |
| Separate Supabase projects for admin/customer | Massive overhead. Single project with RLS policies is the standard approach. |

### Key Code Patterns

**1. Helper function for admin check (used in policies)**

```sql
-- Create a reusable function to avoid repeating the subquery
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;
```

**2. Products table — public read published, admin full access**

```sql
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous) can read published products
CREATE POLICY "Public can view published products"
  ON products FOR SELECT
  USING (is_published = true);

-- Admin can view ALL products (including unpublished)
CREATE POLICY "Admin can view all products"
  ON products FOR SELECT
  USING (is_admin());

-- Admin can insert products
CREATE POLICY "Admin can insert products"
  ON products FOR INSERT
  WITH CHECK (is_admin());

-- Admin can update products
CREATE POLICY "Admin can update products"
  ON products FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admin can delete products
CREATE POLICY "Admin can delete products"
  ON products FOR DELETE
  USING (is_admin());
```

**3. Orders table — customer reads own, admin reads all**

```sql
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Customers can view their own orders
CREATE POLICY "Customers can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = customer_id);

-- Admin can view all orders
CREATE POLICY "Admin can view all orders"
  ON orders FOR SELECT
  USING (is_admin());

-- Admin can update order status
CREATE POLICY "Admin can update orders"
  ON orders FOR UPDATE
  USING (is_admin());

-- Orders are created via RPC (SECURITY DEFINER), so no INSERT policy
-- needed for the orders table directly. If using direct inserts:
CREATE POLICY "Authenticated users can create orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = customer_id OR customer_id IS NULL);
```

**4. Order items — follows parent order access**

```sql
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Customers can view items of their own orders
CREATE POLICY "Customers can view own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.customer_id = auth.uid()
    )
  );

-- Admin can view all order items
CREATE POLICY "Admin can view all order items"
  ON order_items FOR SELECT
  USING (is_admin());
```

**5. Categories — public read, admin write**

```sql
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view categories"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "Admin can manage categories"
  ON categories FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());
```

**6. Profiles — users read own, admin reads all**

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admin can view all profiles"
  ON profiles FOR SELECT
  USING (is_admin());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = 'customer');
  -- Prevents customer from self-promoting to admin
```

### Performance Implications

- **`is_admin()` function**: Marked `STABLE` (result doesn't change within a transaction) and queries `profiles` by primary key (`id = auth.uid()`). Cost: single index lookup, ~0.01ms. PostgreSQL caches the result within the same query plan.
- **Order items subquery**: The `EXISTS (SELECT 1 FROM orders WHERE ...)` subquery uses the primary key index on `orders.id` and an index on `orders.customer_id`. Negligible cost.
- **Product SELECT policies**: Multiple `FOR SELECT` policies are combined with `OR`. The `is_published = true` check is a simple boolean filter — no performance concern.
- **At project scale** (hundreds of products, tens of users): RLS overhead is unmeasurable. Performance concerns only arise at thousands of concurrent queries with complex policy joins.
- **Recommendation**: Add an **index on `profiles(id, role)`** (composite) for the `is_admin()` function, though PK index on `id` alone is sufficient for this scale.

---

## Topic 5: Image Upload Strategy

### Decision

Use **Supabase Storage** for product images. Admin uploads images to a `product-images` bucket via the Supabase Storage API. Store the **storage path** (not full URL) in the `products.image_url` column. Generate public URLs at render time.

Use Next.js `<Image>` component with a **custom loader** for Supabase Storage URLs to leverage automatic optimization (resizing, WebP conversion, lazy loading).

### Rationale

- Supabase Storage is **included in the Supabase plan** — no additional service needed. Aligns with Constitution Principle I (Simplicity).
- Storing the path (e.g., `products/abc-123.webp`) rather than the full URL makes it easy to switch CDN/storage providers later and avoids broken URLs if the Supabase project URL changes.
- Next.js `<Image>` provides automatic responsive `srcSet`, lazy loading, and WebP conversion — critical for mobile-first LCP ≤ 2.5s (SC-002).
- The spec says: "Hình ảnh sản phẩm được upload từ máy admin hoặc dán URL" — so we also support **external URLs** as a fallback (admin pastes a URL instead of uploading).

### Alternatives Considered

| Alternative | Why Rejected |
|---|---|
| External URL only (no upload) | Relies on third-party image hosting. Images may disappear. No control over optimization. Admin UX is worse. |
| Cloudinary / Imgix | Excellent image optimization but adds an external dependency and cost. Supabase Storage + Next.js Image optimization is sufficient for this scale. |
| Store images as base64 in DB | Terrible for performance. Bloats DB, no CDN caching, slow page loads. |
| Supabase Storage with Supabase Image Transformation | Supabase has built-in image transforms (resize on the fly), but it's a paid add-on. Next.js Image optimization on Vercel is free and works with any image source. |

### Key Code Patterns

**1. Supabase Storage bucket setup (migration or admin console)**

```sql
-- Create the storage bucket (run via Supabase dashboard or SQL)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true);

-- RLS policy: public read, admin upload/delete
CREATE POLICY "Public can view product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Admin can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admin can update product images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'product-images'
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admin can delete product images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );
```

**2. Image upload from admin form**

```typescript
// components/admin/ProductForm.tsx (client component)
async function uploadImage(file: File): Promise<string> {
  const supabase = createClient()
  const fileExt = file.name.split('.').pop()
  const fileName = `${crypto.randomUUID()}.${fileExt}`
  const filePath = `products/${fileName}`

  const { error } = await supabase.storage
    .from('product-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) throw new Error(`Upload failed: ${error.message}`)
  return filePath // Store this path in the DB, not the full URL
}
```

**3. Generate public URL from storage path**

```typescript
// lib/utils/image.ts
export function getProductImageUrl(imagePath: string | null): string {
  if (!imagePath) return '/placeholder-product.png'

  // If it's already a full URL (admin pasted external URL), use as-is
  if (imagePath.startsWith('http')) return imagePath

  // Otherwise, construct Supabase Storage public URL
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${imagePath}`
}
```

**4. Next.js Image configuration (`next.config.ts`)**

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // Allow external URLs pasted by admin
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
}

export default nextConfig
```

**5. Using `<Image>` in product card**

```tsx
import Image from 'next/image'
import { getProductImageUrl } from '@/lib/utils/image'

function ProductCard({ product }: { product: Product }) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-lg">
      <Image
        src={getProductImageUrl(product.image_url)}
        alt={product.name}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        className="object-cover"
        loading="lazy"
        placeholder="blur"
        blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/+F9PQAI8wNPvd7POQAAAABJRU5ErkJggg=="
      />
    </div>
  )
}
```

### Important Notes

- **File size limit**: Set a reasonable max file size (e.g., 5MB) in the upload form. Validate both client-side (before upload) and via Supabase Storage bucket configuration.
- **Image formats**: Accept `.jpg`, `.jpeg`, `.png`, `.webp`. Next.js Image optimization will serve WebP to supported browsers automatically.
- **Cache-Control**: Set `cacheControl: '3600'` (1 hour) on upload. Supabase Storage respects this header. For production, increase to `86400` (24h) or more.
- **Delete old image**: When admin updates a product image, delete the old file from Storage to avoid orphaned files:

```typescript
if (oldImagePath && !oldImagePath.startsWith('http')) {
  await supabase.storage.from('product-images').remove([oldImagePath])
}
```

---

## Topic 6: Tailwind CSS Mobile-First Bottom Navigation

### Decision

Use a **fixed-positioned bottom bar** (`fixed bottom-0`) visible on mobile (< 1024px), hidden on desktop (`lg:hidden`). On desktop, replace with a sidebar/top nav (`hidden lg:block`).

Handle iOS safe area insets via the `env(safe-area-inset-bottom)` CSS function and `viewport-fit=cover` meta tag.

Cart badge uses a small absolutely positioned circular `<span>` on the cart icon.

### Rationale

- Tailwind's responsive utilities make the show/hide behavior trivial — no JavaScript needed for the breakpoint switch.
- Bottom navigation is the standard mobile pattern for 4–5 primary destinations (Material Design, Apple HIG). Maps perfectly to the 4-tab requirement for both customer and admin.
- iOS safe area handling is critical — without it, the bottom nav gets obscured by the home indicator on iPhone X+ and on newer iPads.

### Alternatives Considered

| Alternative | Why Rejected |
|---|---|
| JavaScript-based responsive (useMediaQuery) | Unnecessary complexity. CSS media queries via Tailwind utilities are simpler and more performant (no layout shift on mount). |
| Hamburger menu on mobile | Poor mobile UX for primary navigation. Bottom nav provides persistent, thumb-reachable access to all sections. |
| Third-party component library (Headless UI, Radix) | No bottom nav components available. Custom implementation with Tailwind is straightforward for this 4-tab bar. |
| CSS `position: sticky` | Doesn't work for bottom nav (sticky requires scroll context). `position: fixed` is correct for persistent bottom bar. |

### Key Code Patterns

**1. Bottom navigation component**

```tsx
// components/navigation/BottomNav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCart } from '@/hooks/useCart'
import { Home, Search, ShoppingCart, User } from 'lucide-react' // or any icon lib

const customerTabs = [
  { href: '/', label: 'Cửa hàng', icon: Home },
  { href: '/search', label: 'Tìm kiếm', icon: Search },
  { href: '/cart', label: 'Giỏ hàng', icon: ShoppingCart },
  { href: '/account', label: 'Tài khoản', icon: User },
]

export function BottomNav() {
  const pathname = usePathname()
  const { totalItems } = useCart()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex h-16 items-center justify-around">
        {customerTabs.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-w-[64px] flex-col items-center justify-center gap-1 px-3 py-2 text-xs
                ${isActive ? 'text-blue-600' : 'text-gray-500'}`}
            >
              <span className="relative">
                <Icon className="h-6 w-6" />
                {/* Cart badge */}
                {href === '/cart' && totalItems > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </span>
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

**2. Layout with bottom nav spacing**

```tsx
// app/(storefront)/layout.tsx
import { BottomNav } from '@/components/navigation/BottomNav'
import { Sidebar } from '@/components/navigation/Sidebar'
import { CartProvider } from '@/hooks/useCart'

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CartProvider>
      <div className="min-h-screen">
        {/* Desktop sidebar — hidden on mobile */}
        <Sidebar className="hidden lg:block" />

        {/* Main content — add bottom padding on mobile for bottom nav */}
        <main className="pb-20 lg:pb-0 lg:pl-64">
          {children}
        </main>

        {/* Mobile bottom nav — hidden on desktop */}
        <BottomNav />
      </div>
    </CartProvider>
  )
}
```

**3. iOS safe area — viewport meta tag**

```tsx
// app/layout.tsx (root layout)
export const metadata: Metadata = {
  // ...
  viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
}
// NOTE: In Next.js 14, use the `viewport` export:
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}
```

**4. Safe area utility class (Tailwind)**

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer utilities {
  .pb-safe {
    padding-bottom: env(safe-area-inset-bottom);
  }
  .mb-safe {
    margin-bottom: env(safe-area-inset-bottom);
  }
}
```

Then use in the nav: `className="fixed bottom-0 ... pb-safe lg:hidden"`

**5. Admin bottom navigation (same pattern, different tabs)**

```tsx
// components/navigation/AdminBottomNav.tsx
const adminTabs = [
  { href: '/admin', label: 'Tổng quan', icon: BarChart3 },
  { href: '/admin/products', label: 'Sản phẩm', icon: Package },
  { href: '/admin/orders', label: 'Đơn hàng', icon: ClipboardList },
  { href: '/admin/settings', label: 'Cài đặt', icon: Settings },
]
// Same component structure as BottomNav, using adminTabs
```

**6. Touch target sizing**

All nav items use `min-w-[64px]` and `py-2 px-3` ensuring the touch target is ≥ 44×44px (Apple HIG minimum). The `h-16` (64px) nav height provides comfortable thumb reach.

### Important Notes

- **`pb-20` on main content** is essential — without it, the last content on the page will be hidden behind the fixed bottom nav. `pb-20` = 80px, which covers the 64px nav height + safe area inset.
- **Active state detection**: Use `usePathname()` for exact match (`pathname === href`) for root paths. For nested routes (e.g., `/admin/products/new` should highlight "Sản phẩm"), use `pathname.startsWith(href)` with length-based priority to avoid "Tổng quan" (`/admin`) matching everything.
- **No horizontal scroll (FR-037)**: The bottom nav uses `flex justify-around` which distributes items evenly. With 4 items @ 64px min-width = 256px, this fits comfortably on 320px screens.
- **Animation**: Consider adding a subtle `transition-colors duration-150` on nav items for smoother active state transitions.

---

## Summary of Key Decisions

| Topic | Decision | Primary Package/Tool |
|---|---|---|
| Auth | `@supabase/ssr` + `profiles` table with `role` column | `@supabase/ssr` |
| Stock Operations | PostgreSQL RPC function with `SELECT ... FOR UPDATE` + CHECK constraint | `supabase.rpc()` |
| Component Model | Default Server Components; Client only for interactivity + localStorage | Next.js App Router |
| RLS | `is_admin()` helper function; public read on published, admin write, customer own orders | Supabase RLS policies |
| Image Upload | Supabase Storage bucket + Next.js `<Image>` with remote patterns | Supabase Storage |
| Bottom Nav | Fixed bottom bar with `lg:hidden`, safe area insets, cart badge | Tailwind CSS |

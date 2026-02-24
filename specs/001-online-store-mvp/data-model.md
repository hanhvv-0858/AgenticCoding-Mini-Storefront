# Data Model: Mini Storefront — Online Store MVP

**Branch**: `001-online-store-mvp` | **Date**: 2026-02-23  
**Source**: [spec.md](spec.md) Key Entities + [research.md](research.md) Topic 2 & 4

---

## Entity Relationship Diagram

```text
┌──────────────┐       ┌──────────────┐
│   Category   │ 1───* │   Product    │
└──────────────┘       └──────┬───────┘
                              │ (snapshot)
                              │
┌──────────────┐       ┌──────┴───────┐       ┌──────────────┐
│   Profile     │ 1──* │    Order     │ 1───* │  Order Item  │
│ (auth.users) │       └──────────────┘       └──────────────┘
└──────────────┘
       │
       │ role = 'admin' | 'customer'
       │
```

## Entities

### 1. Category (Danh mục)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | Unique identifier |
| `name` | `text` | NOT NULL, UNIQUE | Category display name |
| `slug` | `text` | NOT NULL, UNIQUE | URL-friendly identifier |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Creation timestamp |

**Validation Rules**:
- `name` must be non-empty, max 100 characters.
- `slug` must be lowercase, alphanumeric + hyphens, max 100 characters.

**RLS**: Public read. Admin-only write.

---

### 2. Product (Sản phẩm)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | Unique identifier |
| `name` | `text` | NOT NULL | Product display name |
| `description` | `text` | nullable | Product description |
| `price` | `bigint` | NOT NULL, CHECK (`price >= 0`) | Price in VND (đồng) |
| `stock` | `integer` | NOT NULL, CHECK (`stock >= 0`), default `0` | Available inventory count |
| `is_published` | `boolean` | NOT NULL, default `false` | Visibility on storefront |
| `category_id` | `uuid` | FK → `categories.id`, NOT NULL | Parent category |
| `image_path` | `text` | nullable | Path in Supabase Storage bucket |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Creation timestamp |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | Last modification timestamp |

**Validation Rules**:
- `name` must be non-empty, max 200 characters.
- `price` must be ≥ 0 (DB CHECK constraint).
- `stock` must be ≥ 0 (DB CHECK constraint — critical for race condition prevention).
- `category_id` must reference an existing category.
- `image_path` is optional. If provided, must be a valid Supabase Storage path.

**State Transitions**:
- `is_published`: `false` → `true` (publish) and `true` → `false` (unpublish). Both transitions update `updated_at`.
- Stock decrement: Only via atomic RPC function (see Order creation). Direct UPDATE must also respect CHECK.

**Indexes**:
- `idx_products_category` on `category_id` (FK lookup + category filter).
- `idx_products_published` on `is_published` WHERE `is_published = true` (partial index for storefront queries).
- `idx_products_name_trgm` using `gin(name gin_trgm_ops)` (text search on name — requires `pg_trgm` extension).

**RLS**:
- Public: `SELECT` WHERE `is_published = true`.
- Admin: Full CRUD (all rows).

---

### 3. Profile (Hồ sơ người dùng)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `uuid` | PK, FK → `auth.users.id` ON DELETE CASCADE | Links to Supabase Auth user |
| `email` | `text` | NOT NULL | Cached email from auth.users |
| `full_name` | `text` | nullable | Display name |
| `role` | `text` | NOT NULL, CHECK (`role IN ('customer', 'admin')`), default `'customer'` | User role |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Creation timestamp |

**Validation Rules**:
- `role` is an enum-like CHECK constraint: only `'customer'` or `'admin'`.
- Profile is auto-created via a PostgreSQL trigger on `auth.users` INSERT.
- `email` synced from `auth.users` via the same trigger.

**RLS**:
- Users can read their own profile.
- Admins can read all profiles.
- Only the trigger writes profiles (no direct INSERT/UPDATE from client).

---

### 4. Order (Đơn hàng)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | Unique identifier |
| `order_number` | `text` | NOT NULL, UNIQUE | Human-readable order code (e.g., `ORD-20260223-001`) |
| `customer_id` | `uuid` | FK → `profiles.id`, nullable | Registered customer (null for guest orders) |
| `customer_name` | `text` | NOT NULL | Shipping: recipient name |
| `customer_phone` | `text` | NOT NULL | Shipping: phone number (VN format) |
| `customer_address` | `text` | NOT NULL | Shipping: delivery address |
| `total_amount` | `bigint` | NOT NULL, CHECK (`total_amount >= 0`) | Total in VND (đồng) |
| `status` | `text` | NOT NULL, CHECK (`status IN ('pending', 'delivering', 'completed', 'cancelled')`), default `'pending'` | Order lifecycle state |
| `payment_method` | `text` | NOT NULL, default `'cod'` | Payment method |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Order creation timestamp |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | Last status change timestamp |

**Validation Rules**:
- `customer_name` must be non-empty, max 200 characters.
- `customer_phone` must match VN phone format: 10 digits, starts with 0 (regex: `^0\d{9}$`).
- `customer_address` must be non-empty, max 500 characters.
- `total_amount` is computed as SUM of (order_item.unit_price × order_item.quantity) and stored denormalized.
- `customer_id` is null for guest checkouts, set for logged-in customers.

**State Transitions**:
```text
           ┌──────────┐
     ┌────→│ cancelled │
     │     └──────────┘
     │
┌────┴───┐     ┌────────────┐     ┌───────────┐
│ pending │───→│ delivering │───→│ completed │
└────────┘     └────────────┘     └───────────┘
```
- `pending` → `delivering`: Admin confirms shipment.
- `delivering` → `completed`: Admin confirms delivery.
- `pending` → `cancelled`: Admin cancels (stock restored).
- No other transitions allowed (e.g., cannot go from `completed` back to `delivering`).
- On cancellation: stock for each order item is restored atomically.

**Indexes**:
- `idx_orders_customer` on `customer_id` (customer order history).
- `idx_orders_status` on `status` (admin filtering by status).
- `idx_orders_created` on `created_at DESC` (recent orders first).

**RLS**:
- Customer: `SELECT` own orders only (`customer_id = auth.uid()`).
- Admin: Full `SELECT`, `UPDATE` (status changes only).
- Orders created via RPC function (not direct INSERT).

---

### 5. Order Item (Chi tiết đơn hàng)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | Unique identifier |
| `order_id` | `uuid` | FK → `orders.id` ON DELETE CASCADE, NOT NULL | Parent order |
| `product_id` | `uuid` | FK → `products.id`, NOT NULL | Reference to product |
| `product_name` | `text` | NOT NULL | Snapshot: product name at time of order |
| `unit_price` | `bigint` | NOT NULL, CHECK (`unit_price >= 0`) | Snapshot: price per unit at time of order (VND) |
| `quantity` | `integer` | NOT NULL, CHECK (`quantity > 0`) | Quantity ordered |

**Validation Rules**:
- `product_name` and `unit_price` are snapshots — they do NOT update when the product is later modified.
- `quantity` must be ≥ 1.
- `unit_price` must be ≥ 0.
- `product_id` preserves the reference for admin reporting; product soft-delete does not cascade here.

**RLS**:
- Same as Orders — accessible via the parent order's access rules.
- Customer: `SELECT` items of own orders only.
- Admin: Full `SELECT`.

---

## Supabase Database Functions (RPC)

### `fn_create_order`

**Purpose**: Atomically create an order with stock validation + decrement.

**Input Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `p_customer_id` | `uuid` (nullable) | Authenticated customer ID (null for guest) |
| `p_customer_name` | `text` | Shipping name |
| `p_customer_phone` | `text` | Shipping phone |
| `p_customer_address` | `text` | Shipping address |
| `p_items` | `jsonb` | Array of `{product_id, quantity}` |

**Returns**: `jsonb` — `{order_id, order_number}`

**Logic**:
1. Begin transaction (implicit in PL/pgSQL function).
2. For each item in `p_items`:
   a. `SELECT id, name, price, stock FROM products WHERE id = item.product_id AND is_published = true FOR UPDATE` — row lock.
   b. If product not found or not published → `RAISE EXCEPTION 'Product not found or not available'`.
   c. If `stock < item.quantity` → `RAISE EXCEPTION 'Insufficient stock for product: %', product.name`.
   d. `UPDATE products SET stock = stock - item.quantity, updated_at = now() WHERE id = item.product_id`.
3. Generate `order_number` (format: `ORD-YYYYMMDD-NNN`).
4. `INSERT INTO orders(...)` with computed `total_amount`.
5. `INSERT INTO order_items(...)` for each item with snapshot data.
6. Return `{order_id, order_number}`.
7. Transaction commits. On any RAISE → automatic ROLLBACK.

### `fn_cancel_order`

**Purpose**: Cancel an order and restore stock atomically.

**Input Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `p_order_id` | `uuid` | Order to cancel |

**Returns**: `void`

**Logic**:
1. `SELECT status FROM orders WHERE id = p_order_id FOR UPDATE`.
2. If `status != 'pending'` → `RAISE EXCEPTION 'Only pending orders can be cancelled'`.
3. For each item in order → `UPDATE products SET stock = stock + quantity WHERE id = product_id`.
4. `UPDATE orders SET status = 'cancelled', updated_at = now() WHERE id = p_order_id`.

### `fn_get_revenue_stats`

**Purpose**: Return revenue summary for admin dashboard.

**Returns**: `jsonb` — `{total_revenue, completed_orders_count}`

**Logic**:
1. `SELECT COALESCE(SUM(total_amount), 0), COUNT(*) FROM orders WHERE status = 'completed'`.

---

## Trigger: Auto-create Profile

**Name**: `trg_create_profile_on_signup`  
**Event**: `AFTER INSERT ON auth.users`  
**Logic**: `INSERT INTO profiles(id, email, role) VALUES (NEW.id, NEW.email, 'customer')`.

---

## Storage Bucket

**Name**: `product-images`  
**Access**: Public read (for storefront image display). Admin-only upload/delete (RLS on storage objects).

---

## Type Definitions (TypeScript)

```typescript
// Enums (string unions)
type UserRole = 'customer' | 'admin'
type OrderStatus = 'pending' | 'delivering' | 'completed' | 'cancelled'
type PaymentMethod = 'cod'

// Cart (client-side only, localStorage)
interface CartItem {
  productId: string
  quantity: number
}
```

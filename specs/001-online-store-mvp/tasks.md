# Tasks: Mini Storefront — Online Store MVP

**Input**: Design documents from `/specs/001-online-store-mvp/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Not explicitly requested in spec — test tasks are omitted.

**Organization**: Tasks grouped by user story (P1–P7) for independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story (US1–US7). Setup/Foundational/Polish phases have no story label.
- All paths relative to repository root.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, tooling, and Supabase local environment

- [x] T001 Initialize Next.js 14 project with TypeScript in repository root (`npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir`)
- [x] T002 Install project dependencies: `@supabase/supabase-js`, `@supabase/ssr`, `zod`, `react-hook-form`, `@hookform/resolvers`, `lucide-react` in package.json
- [x] T003 [P] Configure Tailwind CSS with mobile-first breakpoints and safe-area utility classes (`pb-safe`, `mb-safe`) in tailwind.config.ts
- [x] T004 [P] Create .env.local.example with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- [x] T005 [P] Initialize Supabase local project (`supabase init`) — creates supabase/config.toml
- [x] T006 [P] Configure next.config.ts with image remote patterns for Supabase Storage (`*.supabase.co`) and external URLs per research.md Topic 5
- [x] T007 Create global CSS with Tailwind base + safe-area utility classes (`pb-safe`, `mb-safe` via `env(safe-area-inset-bottom)`) in src/app/globals.css

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, auth infrastructure, shared utilities, and UI primitives that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Database Migrations

- [ ] T008 Create migration 001_create_categories.sql — categories table with id (uuid PK), name (unique), slug (unique), created_at in supabase/migrations/001_create_categories.sql
- [ ] T009 Create migration 002_create_products.sql — products table with all fields, CHECK constraints (price >= 0, stock >= 0), indexes (category_id, is_published partial, name trgm) in supabase/migrations/002_create_products.sql
- [ ] T010 Create migration 003_create_profiles.sql — profiles table (id FK auth.users ON DELETE CASCADE), role CHECK ('customer','admin'), auto-create trigger `trg_create_profile_on_signup` in supabase/migrations/003_create_profiles.sql
- [ ] T011 Create migration 004_create_orders.sql — orders table with order_number (unique), status CHECK ('pending','delivering','completed','cancelled'), indexes on customer_id/status/created_at in supabase/migrations/004_create_orders.sql
- [ ] T012 Create migration 005_create_order_items.sql — order_items table with FK cascade to orders, product_name/unit_price snapshots, quantity CHECK > 0 in supabase/migrations/005_create_order_items.sql
- [ ] T013 Create migration 006_rls_policies.sql — `is_admin()` helper function + RLS policies for all 5 tables (public read published products, admin CRUD, customer own orders) per research.md Topic 4 in supabase/migrations/006_rls_policies.sql
- [ ] T014 Create migration 007_functions.sql — fn_create_order (SECURITY DEFINER, atomic checkout with SELECT FOR UPDATE), fn_cancel_order (stock restore), fn_get_revenue_stats per research.md Topic 2 in supabase/migrations/007_functions.sql
- [ ] T015 Create seed data with 3 categories, 10 sample products (mix published/unpublished), admin account (admin@store.local / admin123), 2 test customers in supabase/seed.sql
- [ ] T016 Generate TypeScript database types from Supabase schema into src/types/database.ts

### Supabase Client Infrastructure

- [ ] T017 [P] Create browser Supabase client factory using `createBrowserClient` per research.md Topic 1 in src/lib/supabase/client.ts
- [ ] T018 [P] Create server Supabase client factory using `createServerClient` with cookie adapter per research.md Topic 1 in src/lib/supabase/server.ts
- [ ] T019 [P] Create Supabase middleware client for auth session refresh per research.md Topic 1 in src/lib/supabase/middleware.ts

### Auth & Middleware

- [ ] T020 Implement Next.js middleware for admin route protection (getUser + profile role check, redirect to /account if no session, redirect to / if not admin) per contracts/auth.md in src/middleware.ts

### Shared Utilities

- [ ] T021 [P] Create Zod validation schemas for product (create/update: name 1-200 chars, price >= 0, stock >= 0, category_id uuid) in src/lib/validators/product.ts
- [ ] T022 [P] Create Zod validation schemas for order/checkout (customer_name 1-200, phone regex `^0\d{9}$`, address 1-500, items array) in src/lib/validators/order.ts
- [ ] T023 [P] Create Zod validation schemas for auth forms (email valid format, password min 6 chars, full_name 1-200) in src/lib/validators/auth.ts
- [ ] T024 [P] Create price formatting utility (VND with dot separator, e.g. 250000 → "250.000₫") in src/lib/utils/format.ts
- [ ] T025 [P] Create image URL utility (`getProductImageUrl` — handle null/storage path/external URL) per research.md Topic 5 in src/lib/utils/image.ts
- [ ] T026 [P] Create app-wide constants (order statuses, payment methods, pagination defaults, cart localStorage key) in src/lib/utils/constants.ts

### Hooks

- [ ] T027 Create useAuth hook wrapping Supabase auth (getUser, signIn, signUp, signOut, session state, profile with role) in src/hooks/useAuth.ts
- [ ] T028 Create useMediaQuery hook for responsive breakpoint detection (mobile < 1024px) in src/hooks/useMediaQuery.ts

### UI Primitives

- [x] T029 [P] Create Button component (variants: primary, secondary, danger, ghost; sizes: sm, md, lg; disabled + loading state; min 44px touch target) in src/components/ui/Button.tsx
- [x] T030 [P] Create Input component (label, error message, required indicator, integration with React Hook Form) in src/components/ui/Input.tsx
- [x] T031 [P] Create Badge component (count badge for cart icon, color variants for order status) in src/components/ui/Badge.tsx
- [x] T032 [P] Create Card component (product card wrapper with image area + content area) in src/components/ui/Card.tsx
- [x] T033 [P] Create Modal component (confirmation dialogs for delete actions, overlay + close on escape) in src/components/ui/Modal.tsx

### Root Layout

- [x] T034 Create root layout with viewport-fit=cover metadata, font loading, global providers in src/app/layout.tsx

**Checkpoint**: Foundation ready — database seeded, auth working, UI primitives available. User story implementation can begin.

---

## Phase 3: User Story 1 — Duyệt & Xem sản phẩm (Priority: P1) 🎯 MVP

**Goal**: Customers can browse the product catalog in a responsive grid, filter by category, search by name, and view product details.

**Independent Test**: Seed sample products, open storefront on mobile browser, browse grid, filter category, open detail page — all functional without cart or checkout.

### API Routes

- [x] T035 [US1] Implement GET /api/products route handler (list published products, category filter, search, pagination) per contracts/products.md in src/app/api/products/route.ts
- [x] T036 [US1] Implement GET /api/products/[id] route handler (single product detail, 404 for unpublished) per contracts/products.md in src/app/api/products/[id]/route.ts

### Components

- [x] T037 [P] [US1] Create ProductCard component (image via getProductImageUrl, name, price formatted VND, stock badge, link to detail) in src/components/storefront/ProductCard.tsx
- [x] T038 [P] [US1] Create ProductGrid component (responsive grid: 1-col 320px, 2-col sm, 3-col md, 4-col lg) in src/components/storefront/ProductGrid.tsx
- [x] T039 [P] [US1] Create CategoryFilter component (horizontal scrollable chip list, active state, uses searchParams for server-side filtering) in src/components/storefront/CategoryFilter.tsx
- [x] T040 [P] [US1] Create SearchBar component (text input with debounce, clear button, URL search param sync) in src/components/storefront/SearchBar.tsx

### Pages

- [x] T041 [US1] Create storefront home page (server component: fetch products with category filter from searchParams, render ProductGrid + CategoryFilter) per research.md Topic 3 in src/app/(storefront)/page.tsx
- [x] T042 [US1] Create search page (server shell + client SearchBar/CategoryFilter: fetch filtered products, render ProductGrid) in src/app/(storefront)/search/page.tsx
- [x] T043 [US1] Create product detail page (server component: fetch product by id, show Image/name/description/price formatted VND/stock status, "Add to cart" button disabled if stock=0) in src/app/(storefront)/products/[id]/page.tsx

### Layout

- [x] T044 [US1] Create storefront layout with CartProvider context and bottom nav placeholder in src/app/(storefront)/layout.tsx

**Checkpoint**: Storefront browsing fully functional — product grid, category filter, search, detail page. Testable independently with seed data.

---

## Phase 4: User Story 2 — Giỏ hàng (Priority: P2)

**Goal**: Customers can add products to cart, adjust quantities, remove items, see auto-calculated total. Cart persists in localStorage across page reloads.

**Independent Test**: Add products to cart, change quantities, remove items, verify total, reload page and confirm cart contents restored.

### Hook

- [x] T045 [US2] Create useCart hook with React Context + localStorage persistence (addItem, removeItem, updateQuantity, clearCart, totalItems, totalAmount, hydration-safe loading) per research.md Topic 3 in src/hooks/useCart.ts

### Components

- [x] T046 [P] [US2] Create CartItem component (product image, name, price formatted VND, quantity +/- controls, remove button, line total) in src/components/storefront/CartItem.tsx
- [x] T047 [P] [US2] Create CartSummary component (item count, subtotal formatted VND, "Thanh toán" button, empty cart message with back-to-shop link) in src/components/storefront/CartSummary.tsx

### Pages

- [x] T048 [US2] Create cart page (client component: list CartItems from useCart, CartSummary, quantity capped at maxStock with warning) in src/app/(storefront)/cart/page.tsx

### Integration

- [x] T049 [US2] Add "Thêm vào giỏ" button handler to product detail page — calls useCart.addItem with product data, shows confirmation in src/app/(storefront)/products/[id]/page.tsx
- [x] T050 [US2] Wire CartProvider into storefront layout and add cart badge (totalItems) to bottom nav placeholder in src/app/(storefront)/layout.tsx

**Checkpoint**: Cart fully functional — add, remove, update quantity, localStorage persistence, badge on nav. Testable independently with US1.

---

## Phase 5: User Story 3 — Checkout COD (Priority: P3)

**Goal**: Customers submit shipping info and place a COD order. Stock is atomically validated and decremented. Cart clears on success. Confirmation page shows order number.

**Independent Test**: With items in cart, fill checkout form, submit, verify order created in DB, stock decremented, confirmation page with order number.

### API Route

- [x] T051 [US3] Implement POST /api/orders route handler (validate with Zod, call fn_create_order RPC via supabase.rpc(), return order_id + order_number, handle INSUFFICIENT_STOCK 409) per contracts/orders.md in src/app/api/orders/route.ts

### Components

- [x] T052 [US3] Create CheckoutForm component (React Hook Form + Zod resolver: customer_name, customer_phone with VN regex, customer_address, order summary from useCart, submit button with loading state) in src/components/storefront/CheckoutForm.tsx

### Pages

- [x] T053 [US3] Create checkout page (client component: redirect to /cart if empty, render CheckoutForm, call POST /api/orders, clearCart on success, redirect to success page) in src/app/(storefront)/checkout/page.tsx
- [x] T054 [US3] Create checkout success page (server component: fetch order by id from searchParams, display order_number, total_amount formatted VND, "Tiếp tục mua sắm" link) in src/app/(storefront)/checkout/success/page.tsx

**Checkpoint**: Full purchase flow working — browse → cart → checkout → confirmation. Stock validated atomically. Testable end-to-end with US1+US2.

---

## Phase 6: User Story 4 — Tài khoản khách hàng (Priority: P4)

**Goal**: Customers can register (email+password), login, view personal order history. Guest checkout still works without account.

**Independent Test**: Register new account, login, place order via US3, view order history showing the placed order.

### API Routes

- [x] T055 [US4] Implement GET /api/orders route handler for customer (auth required, return own orders via RLS, pagination) per contracts/orders.md in src/app/api/orders/route.ts (extend from T051)
- [x] T056 [US4] Implement GET /api/orders/[id] route handler (auth required, return order detail with items, 403 if not own order via RLS) per contracts/orders.md in src/app/api/orders/[id]/route.ts

### Components

- [x] T057 [P] [US4] Create AuthForm component (tabbed Login/Register, email+password+full_name fields, Zod validation, Supabase auth calls, error display) as client component in src/components/storefront/AuthForm.tsx
- [x] T058 [P] [US4] Create OrderHistoryList component (list of orders: order_number, date, total formatted VND, OrderStatusBadge) in src/components/storefront/OrderHistoryList.tsx

### Pages

- [x] T059 [US4] Create account page (client component: if not logged in → show AuthForm with redirect param; if logged in → show profile info + sign out button + OrderHistoryList) in src/app/(storefront)/account/page.tsx

### Integration

- [x] T060 [US4] Update POST /api/orders to attach customer_id from session via getUser() if authenticated in src/app/api/orders/route.ts
- [x] T061 [US4] Update storefront layout to show user display name when logged in via useAuth hook in src/app/(storefront)/layout.tsx

**Checkpoint**: Customer accounts working — register, login, order history. Guest checkout unaffected. Testable with US1+US2+US3.

---

## Phase 7: User Story 5 — Admin quản lý sản phẩm (Priority: P5)

**Goal**: Admin can CRUD products, inline-edit stock/price, publish/unpublish, upload images. All changes reflected on storefront immediately via revalidatePath.

**Independent Test**: Login as admin, add product, edit price, unpublish (verify hidden from storefront), publish (verify shown), delete with confirmation.

### API Routes

- [x] T062 [US5] Implement POST /api/products route handler (admin auth via requireAdmin(), Zod validation, insert product) per contracts/products.md in src/app/api/products/route.ts (extend from T035)
- [x] T063 [US5] Implement PUT /api/products/[id] route handler (admin auth, partial update, revalidatePath for affected storefront pages) per contracts/products.md in src/app/api/products/[id]/route.ts (extend from T036)
- [x] T064 [US5] Implement DELETE /api/products/[id] route handler (admin auth, soft-delete via is_published=false, warn if product has active orders) per contracts/products.md in src/app/api/products/[id]/route.ts

### Components

- [x] T065 [P] [US5] Create ProductTable component (sortable table: name, category, price formatted VND, stock, published toggle, edit/delete action buttons) in src/components/admin/ProductTable.tsx
- [x] T066 [P] [US5] Create ProductForm component (React Hook Form + Zod: name, description, price, stock, category dropdown, image upload to Supabase Storage, is_published toggle) in src/components/admin/ProductForm.tsx
- [x] T067 [P] [US5] Create InlineEditCell component (click-to-edit for price and stock fields, validate on blur, PATCH to API) in src/components/admin/InlineEditCell.tsx

### Pages

- [x] T068 [US5] Create admin products list page (server component: fetch all products including unpublished via ?all=true, render ProductTable) in src/app/(admin)/admin/products/page.tsx
- [x] T069 [US5] Create admin add product page (client component: ProductForm in create mode, POST to API, redirect to list on success) in src/app/(admin)/admin/products/new/page.tsx
- [x] T070 [US5] Create admin edit product page (client component: fetch product by id, ProductForm pre-filled in edit mode, PUT to API, redirect to list) in src/app/(admin)/admin/products/[id]/page.tsx

### Storage

- [x] T071 [US5] Configure Supabase Storage bucket `product-images` (public read, admin-only upload/update/delete RLS policies) and integrate upload into ProductForm per research.md Topic 5

### Layout

- [x] T072 [US5] Create admin layout with admin bottom nav placeholder and main content area in src/app/(admin)/layout.tsx

**Checkpoint**: Admin product management fully functional — CRUD, inline edit, publish/unpublish, image upload. Storefront reflects changes immediately.

---

## Phase 8: User Story 6 — Admin quản lý đơn hàng (Priority: P6)

**Goal**: Admin can view all orders, update status (pending→delivering→completed, pending→cancelled with stock restore), view revenue report.

**Independent Test**: Create orders via checkout, login as admin, view order list, change statuses, verify stock restored on cancel, check revenue stats.

### API Routes

- [x] T073 [US6] Implement GET /api/orders route handler for admin (all orders via RLS, status filter, pagination, items_count) per contracts/orders.md in src/app/api/orders/route.ts (extend from T051/T055)
- [x] T074 [US6] Implement PATCH /api/orders/[id] route handler (admin auth, validate status transition state machine, call fn_cancel_order RPC if cancelling) per contracts/orders.md in src/app/api/orders/[id]/route.ts (extend from T056)
- [x] T075 [US6] Implement GET /api/admin/stats route handler (admin auth, query revenue/order counts/product stats) per contracts/admin.md in src/app/api/admin/stats/route.ts

### Components

- [x] T076 [P] [US6] Create OrderTable component (order list: order_number, customer_name, total formatted VND, status dropdown with valid transitions, date) in src/components/admin/OrderTable.tsx
- [x] T077 [P] [US6] Create OrderStatusBadge component (color-coded: pending=yellow, delivering=blue, completed=green, cancelled=red) in src/components/admin/OrderStatusBadge.tsx
- [x] T078 [P] [US6] Create RevenueCard component (total_revenue formatted VND, completed_orders_count, pending/delivering counts) in src/components/admin/RevenueCard.tsx

### Pages

- [x] T079 [US6] Create admin orders page (server component: fetch all orders, render OrderTable with status filter tabs) in src/app/(admin)/admin/orders/page.tsx
- [x] T080 [US6] Create admin dashboard overview page (server component: fetch stats from /api/admin/stats, render RevenueCard + summary cards) in src/app/(admin)/admin/page.tsx

**Checkpoint**: Admin order management complete — view, status transitions, cancel with stock restore, revenue dashboard. Full business cycle testable.

---

## Phase 9: User Story 7 — Điều hướng Bottom Navigation (Priority: P7)

**Goal**: Fixed bottom nav on mobile with role-based tabs (Customer: Cửa hàng/Tìm kiếm/Giỏ hàng/Tài khoản; Admin: Tổng quan/Sản phẩm/Đơn hàng/Cài đặt). Cart badge. Sidebar on desktop (≥1024px).

**Independent Test**: Open on mobile viewport → bottom nav with 4 customer tabs. Login as admin → 4 admin tabs. Cart badge updates. Desktop → sidebar replaces bottom nav.

### Components

- [x] T081 [P] [US7] Create NavItem component (lucide icon + label, active state via usePathname, badge slot, min 44px touch target) in src/components/navigation/NavItem.tsx
- [x] T082 [P] [US7] Create Sidebar component (desktop vertical navigation, hidden on mobile, visible ≥ 1024px via `hidden lg:block`) in src/components/navigation/Sidebar.tsx
- [x] T083 [US7] Create BottomNav component (fixed bottom-0, role-based tabs array, cart badge from useCart.totalItems, `pb-safe` for iOS, `lg:hidden`) per research.md Topic 6 in src/components/navigation/BottomNav.tsx

### Layout Integration

- [x] T084 [US7] Integrate BottomNav + Sidebar into storefront layout (replace placeholder from T044) with customer tabs (Home/Search/Cart/Account) in src/app/(storefront)/layout.tsx
- [x] T085 [US7] Integrate BottomNav + Sidebar into admin layout (replace placeholder from T072) with admin tabs (Overview/Products/Orders/Settings) in src/app/(admin)/layout.tsx
- [x] T086 [US7] Add main content padding (`pb-20 lg:pb-0 lg:pl-64`) for fixed bottom nav clearance on mobile and sidebar offset on desktop in both layouts

### Admin Settings Page

- [x] T087 [US7] Create admin settings page (placeholder: store name, contact info display) in src/app/(admin)/admin/settings/page.tsx

**Checkpoint**: Full navigation system working — bottom nav on mobile, sidebar on desktop, role-based tabs, cart badge, active state highlighting.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T088 [P] Add loading states (skeleton screens via loading.tsx Suspense boundaries) to product grid, product detail, admin products, admin orders pages
- [x] T089 [P] Add toast notification system for success/error feedback (add to cart, checkout, admin CRUD actions) in src/components/ui/Toast.tsx
- [x] T090 [P] Add error boundary and 404/error pages in src/app/not-found.tsx and src/app/error.tsx
- [x] T091 [P] Add SEO metadata (title, description, Open Graph) to storefront pages via Next.js generateMetadata
- [x] T092 Implement stale cart validation — on cart page load, fetch current product data, warn about unpublished/out-of-stock items, allow removal of invalid items
- [x] T093 Add session expiry handling — redirect to /account with message when admin token expires mid-operation via useAuth hook
- [x] T094 [P] Accessibility pass — ARIA labels on interactive elements, focus management, keyboard navigation for bottom nav/modals, WCAG 2.1 Level A
- [x] T095 [P] Performance optimization — verify LCP ≤ 2.5s on storefront via Lighthouse, ensure Next.js Image lazy loading + proper `sizes` attribute on product images
- [x] T096 Run quickstart.md smoke test checklist — verify all 10 manual test items pass end-to-end

### Phase 11 — Bugfixes & Enhancements

- [x] T097 Fix fn_create_order "cannot get array length of a scalar" error — remove JSON.stringify() from p_items in POST /api/orders (Supabase client auto-serializes) in src/app/api/orders/route.ts
- [x] T098 [US4] Create order detail page (client component: fetch GET /api/orders/[id], show order header + status badge, customer info, item list with prices, total + payment method) per FR-019b in src/app/(storefront)/account/orders/[id]/page.tsx
- [x] T099 Setup Vitest test framework (vitest.config.ts, pnpm test script) and create system test suite (37 tests) covering: products API (7), categories (1), auth (2), orders unauthenticated (2), guest checkout (3), authenticated checkout (3), admin products CRUD + RBAC (5), admin orders + status transitions (5), cancel order stock restore (1), admin stats + RBAC (3), storefront pages (5) in tests/system.test.ts

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — **BLOCKS all user stories**
- **User Stories (Phase 3–9)**: All depend on Phase 2 completion
  - US1 (Phase 3): Can start after Phase 2
  - US2 (Phase 4): Depends on US1 (needs product detail page for "Add to Cart")
  - US3 (Phase 5): Depends on US2 (needs cart with items)
  - US4 (Phase 6): Depends on US3 (needs orders to display in history)
  - US5 (Phase 7): Can start after Phase 2 (independent of customer stories)
  - US6 (Phase 8): Depends on US3 + US5 (needs orders + product management)
  - US7 (Phase 9): Depends on US1 + US5 (needs both layouts scaffolded)
- **Polish (Phase 10)**: Depends on all user stories being complete

### User Story Dependency Graph

```text
Phase 2 (Foundation)
    │
    ├──→ US1 (Browse) ──→ US2 (Cart) ──→ US3 (Checkout) ──→ US4 (Account)
    │                                         │
    ├──→ US5 (Admin Products) ────────────────┤
    │         │                               │
    │         └──→ US6 (Admin Orders) ←───────┘
    │
    └──→ US7 (Navigation) ← after US1 + US5 layouts exist
```

### Within Each User Story

- API routes before pages (data layer first)
- Components before pages (building blocks first)
- Components marked [P] can be built in parallel
- Pages integrate components + API routes
- Integration tasks last (cross-component wiring)

### Parallel Opportunities

**Phase 2 parallel batches**:
- Batch A: T008–T016 (sequential migrations, then seed + types)
- Batch B: T017, T018, T019 (3 Supabase clients — all [P])
- Batch C: T021–T026 (validators + utils — all [P])
- Batch D: T029–T033 (UI primitives — all [P])

**Phase 3 parallel batch**:
- T037, T038, T039, T040 (4 storefront components — all [P])

**Phase 7 parallel batch**:
- T065, T066, T067 (admin product components — all [P])

**Cross-story parallelism**:
- US5 (Admin Products) can be developed in parallel with US1→US2→US3→US4 (customer flow)
- US7 (Navigation) can start once US1 layout (T044) and US5 layout (T072) are scaffolded

---

## Implementation Strategy

### MVP Scope

**User Story 1 (P1)** alone delivers a functional product catalog — the minimal viable storefront.

### Incremental Delivery

| Increment | Stories | User Value |
|-----------|---------|------------|
| MVP | US1 | Browsable product catalog |
| +Cart | US1 + US2 | Customers can build a shopping cart |
| +Purchase | US1 + US2 + US3 | Full purchase flow (COD) |
| +Accounts | US1–US4 | Customer accounts with order history |
| +Admin | US1–US6 | Admin can manage store |
| Complete | US1–US7 + Polish | Full app with navigation & polish |

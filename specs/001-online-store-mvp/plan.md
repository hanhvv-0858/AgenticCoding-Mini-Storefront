# Implementation Plan: Mini Storefront — Online Store MVP

**Branch**: `001-online-store-mvp` | **Date**: 2026-02-23 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-online-store-mvp/spec.md`

## Summary

Build a mobile-first online storefront with two subsystems — a public customer-facing shop (browse, cart, COD checkout) and a protected admin dashboard (product CRUD, inventory management, order processing, revenue reporting). The application uses a single Next.js 14 (App Router) codebase for both frontend and backend (API routes), TypeScript for type safety across the stack, and Supabase as the hosted PostgreSQL database with built-in auth and storage. Cart state is persisted client-side in localStorage; all order and inventory mutations run through Supabase RPC functions to guarantee ACID stock validation.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20 LTS  
**Framework**: Next.js 14 (App Router, Server Components + Client Components)  
**Primary Dependencies**: `@supabase/supabase-js` (client SDK), `@supabase/ssr` (auth helpers for Next.js SSR), Tailwind CSS 3.x (styling), Zod (runtime validation), React Hook Form (form management)  
**Storage**: Supabase (hosted PostgreSQL 15) — relational DB with Row Level Security (RLS); Supabase Storage for product images  
**Authentication**: Supabase Auth (email + password). Customer and Admin roles distinguished by a `role` column in a `profiles` table. Supabase RLS policies enforce access control at the database level.  
**Testing**: Vitest (unit + integration), React Testing Library (component tests), Playwright (E2E)  
**Target Platform**: Web — mobile browsers (iOS Safari, Android Chrome) primary; desktop secondary. Deployed on Vercel (or any Node.js host).  
**Project Type**: Full-stack web application (Next.js monolith)  
**Performance Goals**: Storefront LCP ≤ 2.5 s on 4G (per constitution). Server responses < 500 ms p95 for API routes.  
**Constraints**: Stock must never go below 0 (DB-level CHECK constraint + RPC transaction). Price stored as integer (VND đồng). Single currency. Single tenant.  
**Scale/Scope**: Small store — hundreds of products, tens of concurrent users. ~12 pages/screens total (7 customer + 5 admin).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Simplicity First | ✅ PASS | Single Next.js project, no micro-services, no unnecessary abstractions. Supabase handles auth + DB + storage — one external dependency. Max 2 levels of component nesting enforced via structure conventions. |
| II | Responsive Mobile-First UI | ✅ PASS | Tailwind CSS mobile-first utilities. Bottom nav on mobile (< 1024 px), sidebar/top nav on desktop. Touch targets ≥ 44 px via Tailwind spacing. No horizontal scroll enforced. |
| III | Clear Separation of Storefront & Admin | ✅ PASS | Next.js App Router route groups: `(storefront)` and `(admin)`. Admin routes protected by Supabase Auth middleware + RLS. Storefront shows only `published = true` products (RLS policy). Changes reflect immediately via server revalidation. |
| IV | Data Integrity & Consistency | ✅ PASS | Stock validated via PostgreSQL CHECK constraint (`stock >= 0`) and atomic RPC function for checkout. Price stored as `bigint` (đồng). Publish state transitions logged with `updated_at` timestamp. |
| V | Testable by Default | ✅ PASS | Vitest for unit/integration, React Testing Library for components in isolation, Playwright for critical E2E paths. Supabase local dev via `supabase start` for reproducible test environment. |

**GATE RESULT: ALL PASS — proceed to Phase 0**

## Project Structure

### Documentation (this feature)

```text
specs/001-online-store-mvp/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API route contracts)
│   ├── products.md
│   ├── orders.md
│   ├── auth.md
│   └── admin.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (storefront)/              # Customer-facing route group
│   │   ├── page.tsx               # Home — product grid
│   │   ├── search/page.tsx        # Search & filter
│   │   ├── products/[id]/page.tsx # Product detail
│   │   ├── cart/page.tsx          # Cart page
│   │   ├── checkout/page.tsx      # Checkout form
│   │   ├── checkout/success/page.tsx  # Order confirmation
│   │   ├── account/page.tsx       # Login/Register + order history
│   │   ├── account/orders/[id]/page.tsx  # Order detail page
│   │   └── layout.tsx             # Storefront layout + bottom nav
│   ├── (admin)/                   # Admin route group
│   │   ├── admin/page.tsx         # Dashboard overview (revenue)
│   │   ├── admin/products/page.tsx     # Product list (CRUD)
│   │   ├── admin/products/new/page.tsx # Add product form
│   │   ├── admin/products/[id]/page.tsx # Edit product form
│   │   ├── admin/orders/page.tsx       # Order list + status mgmt
│   │   ├── admin/settings/page.tsx     # Store settings
│   │   └── layout.tsx             # Admin layout + bottom nav
│   ├── api/                       # API Routes (Next.js Route Handlers)
│   │   ├── products/route.ts      # GET (list), POST (create)
│   │   ├── products/[id]/route.ts # GET, PUT, DELETE
│   │   ├── orders/route.ts        # GET (list), POST (create/checkout)
│   │   ├── orders/[id]/route.ts   # GET, PATCH (status update)
│   │   └── admin/stats/route.ts   # GET (revenue report)
│   ├── layout.tsx                 # Root layout
│   └── globals.css                # Tailwind global styles
├── components/
│   ├── ui/                        # Reusable UI primitives
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   ├── Card.tsx
│   │   └── Modal.tsx
│   ├── storefront/                # Storefront-specific components
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── CategoryFilter.tsx
│   │   ├── SearchBar.tsx
│   │   ├── CartItem.tsx
│   │   ├── CartSummary.tsx
│   │   ├── CheckoutForm.tsx
│   │   └── OrderHistoryList.tsx
│   ├── admin/                     # Admin-specific components
│   │   ├── ProductTable.tsx
│   │   ├── ProductForm.tsx
│   │   ├── InlineEditCell.tsx
│   │   ├── OrderTable.tsx
│   │   ├── OrderStatusBadge.tsx
│   │   └── RevenueCard.tsx
│   └── navigation/
│       ├── BottomNav.tsx
│       ├── Sidebar.tsx
│       └── NavItem.tsx
├── hooks/
│   ├── useCart.ts                 # Cart state (localStorage + React context)
│   ├── useAuth.ts                 # Supabase auth wrapper
│   └── useMediaQuery.ts          # Responsive breakpoint hook
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser Supabase client
│   │   ├── server.ts             # Server-side Supabase client
│   │   └── middleware.ts         # Auth middleware for admin routes
│   ├── validators/
│   │   ├── product.ts            # Zod schemas for product
│   │   ├── order.ts              # Zod schemas for order/checkout
│   │   └── auth.ts               # Zod schemas for auth forms
│   └── utils/
│       ├── format.ts             # Price formatting (VND)
│       └── constants.ts          # App-wide constants
├── types/
│   └── database.ts               # Supabase generated types
└── middleware.ts                  # Next.js middleware (auth redirect)

supabase/
├── migrations/
│   ├── 001_create_categories.sql
│   ├── 002_create_products.sql
│   ├── 003_create_profiles.sql
│   ├── 004_create_orders.sql
│   ├── 005_create_order_items.sql
│   ├── 006_rls_policies.sql
│   └── 007_functions.sql         # checkout RPC, stock validation
├── seed.sql                       # Sample data + admin account
└── config.toml                    # Supabase local config

tests/
├── unit/
│   ├── validators/
│   └── utils/
├── component/
│   ├── storefront/
│   └── admin/
├── integration/
│   ├── api/
│   └── hooks/
└── e2e/
    ├── storefront.spec.ts
    └── admin.spec.ts

tailwind.config.ts
next.config.ts
tsconfig.json
package.json
.env.local.example
```

**Structure Decision**: Single Next.js monolith project. Frontend and backend coexist in one codebase via App Router route groups `(storefront)` and `(admin)` plus `app/api/` route handlers. This is the simplest viable architecture per Constitution Principle I, avoids separate backend deployment, and leverages Next.js server components for SEO and performance on storefront pages. Supabase migrations live in `supabase/` following Supabase CLI conventions.

## Complexity Tracking

> No constitution violations detected — this section is intentionally empty.

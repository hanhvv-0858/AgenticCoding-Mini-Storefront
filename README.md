# Mini Storefront

Ứng dụng cửa hàng trực tuyến mini — mobile-first, xây dựng bằng Next.js 14 + Supabase.

Hai hệ thống trong một codebase:
- **Storefront** (khách hàng): duyệt sản phẩm, giỏ hàng, checkout COD
- **Admin** (quản trị): quản lý sản phẩm, đơn hàng, thống kê doanh thu

## Demo Accounts

| Vai trò | Email | Mật khẩu |
|---------|-------|----------|
| Admin | `admin@store.local` | `Admin@123` |
| Khách hàng | `user@store.local` | `User@123` |

## Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5.x |
| Styling | Tailwind CSS 3.x |
| Database | Supabase (PostgreSQL 15) |
| Auth | Supabase Auth (email + password) |
| Storage | Supabase Storage (product images) |
| Validation | Zod + React Hook Form |
| Icons | Lucide React |

## Tính năng chính

- **Duyệt sản phẩm** — grid responsive, lọc danh mục, tìm kiếm theo tên
- **Chi tiết sản phẩm** — ảnh, mô tả, giá VND, trạng thái còn/hết hàng
- **Giỏ hàng** — localStorage, +/- số lượng, kiểm tra stock realtime
- **Checkout COD** — form giao hàng, validate SĐT, tạo đơn atomic (không cho stock < 0)
- **Tài khoản** — đăng ký/đăng nhập, lịch sử đơn hàng
- **Admin Dashboard** — thống kê doanh thu, số đơn theo trạng thái
- **Quản lý sản phẩm** — CRUD, inline edit giá/stock, publish/unpublish
- **Quản lý đơn hàng** — xem danh sách, chuyển trạng thái (pending → delivering → completed), hủy đơn hoàn stock
- **Navigation** — Bottom nav (mobile) + Sidebar (desktop ≥ 1024px)
- **SEO** — generateMetadata, Open Graph, skeleton loading states
- **Toast** — thông báo success/error/info
- **Error handling** — 404 page, error boundary, stale cart validation

## Cấu trúc dự án

```
src/
├── app/
│   ├── (storefront)/          # Trang khách hàng
│   │   ├── page.tsx           # Trang chủ — grid sản phẩm
│   │   ├── search/            # Tìm kiếm & lọc
│   │   ├── products/[id]/     # Chi tiết sản phẩm
│   │   ├── cart/              # Giỏ hàng
│   │   ├── checkout/          # Thanh toán + trang xác nhận
│   │   └── account/           # Đăng nhập + lịch sử đơn
│   ├── (admin)/               # Trang quản trị
│   │   └── admin/
│   │       ├── page.tsx       # Dashboard doanh thu
│   │       ├── products/      # CRUD sản phẩm
│   │       ├── orders/        # Quản lý đơn hàng
│   │       └── settings/      # Cài đặt cửa hàng
│   └── api/                   # API Route Handlers
│       ├── products/          # GET, POST, PUT, DELETE
│       ├── orders/            # GET, POST, PATCH
│       ├── categories/        # GET
│       └── admin/stats/       # GET thống kê
├── components/
│   ├── ui/                    # Button, Input, Badge, Card, Modal, Toast
│   ├── storefront/            # ProductCard, CartItem, CheckoutForm...
│   ├── admin/                 # ProductTable, OrderTable, RevenueCard...
│   └── navigation/            # BottomNav, Sidebar, NavItem
├── hooks/                     # useCart, useAuth, useMediaQuery
├── lib/
│   ├── supabase/              # Client, Server, Middleware, Admin helpers
│   ├── validators/            # Zod schemas (product, order, auth)
│   └── utils/                 # Format (VND), Image URL, Constants
└── types/                     # Database types

supabase/
├── migrations/                # 8 SQL migrations
│   ├── 001 — categories
│   ├── 002 — products
│   ├── 003 — profiles + trigger
│   ├── 004 — orders
│   ├── 005 — order_items
│   ├── 006 — RLS policies + is_admin()
│   ├── 007 — fn_create_order, fn_cancel_order, fn_get_revenue_stats
│   └── 008 — Storage bucket product-images
└── seed.sql
```

## Cài đặt & Chạy

### Yêu cầu

- Node.js ≥ 20
- pnpm (hoặc npm/yarn)
- Tài khoản [Supabase](https://supabase.com) (Cloud) hoặc Docker Desktop (Local)

### 1. Clone & cài dependencies

```bash
git clone <repo-url>
cd mini_storefront
pnpm install
```

### 2. Cấu hình Supabase

**Cách A — Supabase Cloud:**

1. Tạo project trên [supabase.com](https://supabase.com)
2. Copy `.env.local.example` → `.env.local` và điền thông tin từ **Settings → API**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

3. Link & push migrations:

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

**Cách B — Supabase Local (cần Docker Desktop):**

```bash
npx supabase start
# Copy URL + keys từ output vào .env.local
```

### 3. Seed dữ liệu mẫu

```bash
node scripts/seed.mjs
```

Tạo 5 danh mục, 20 sản phẩm (có ảnh), 1 admin, 1 khách hàng.

### 4. Chạy development server

```bash
pnpm dev
```

Mở [http://localhost:3000](http://localhost:3000) trên trình duyệt.

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/products` | Danh sách sản phẩm (filter, search, pagination) |
| GET | `/api/products?ids=a,b,c` | Bulk lookup (cart validation) |
| POST | `/api/products` | Tạo sản phẩm (admin) |
| GET | `/api/products/[id]` | Chi tiết sản phẩm |
| PUT | `/api/products/[id]` | Cập nhật sản phẩm (admin) |
| DELETE | `/api/products/[id]` | Soft-delete sản phẩm (admin) |
| GET | `/api/categories` | Danh sách danh mục |
| GET | `/api/orders` | Danh sách đơn hàng (phân quyền) |
| POST | `/api/orders` | Tạo đơn hàng (checkout) |
| GET | `/api/orders/[id]` | Chi tiết đơn hàng |
| PATCH | `/api/orders/[id]` | Cập nhật trạng thái (admin) |
| GET | `/api/admin/stats` | Thống kê doanh thu (admin) |

## Kiến trúc quan trọng

### Stock Validation

Checkout sử dụng PostgreSQL RPC function `fn_create_order` chạy trong transaction. Stock được kiểm tra và trừ atomic — đảm bảo không bao giờ âm.

### Authentication & Authorization

- Supabase Auth (email + password)
- `profiles` table với column `role` (`customer` | `admin`)
- Middleware Next.js chặn `/admin/*` nếu chưa đăng nhập
- API routes admin dùng `requireAdmin()` helper kiểm tra role
- RLS policies tại database level

### Cart

- Lưu trong `localStorage` qua React Context (`CartProvider`)
- Hydration-safe (tránh mismatch SSR/CSR)
- Stale cart validation khi mở trang giỏ hàng (kiểm tra stock/availability realtime)

### Order Status Flow

```
pending → delivering → completed
    ↓
cancelled (hoàn stock)
```

## Scripts

```bash
pnpm dev          # Development server
pnpm build        # Production build
pnpm start        # Production server
pnpm lint         # ESLint
node scripts/seed.mjs  # Seed database
```

## License

Private project.

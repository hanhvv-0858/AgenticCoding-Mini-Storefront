# Quickstart: Mini Storefront — Online Store MVP

**Branch**: `001-online-store-mvp` | **Date**: 2026-02-23

This guide gets the application running locally from scratch.

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20 LTS | [nodejs.org](https://nodejs.org/) |
| npm | 10+ | Bundled with Node.js |
| Supabase CLI | latest | `npm install -g supabase` |
| Docker | latest | [docker.com](https://www.docker.com/) (required for Supabase local) |
| Git | latest | [git-scm.com](https://git-scm.com/) |

---

## 1. Clone & Install

```bash
git clone <repo-url> mini_storefront
cd mini_storefront
git checkout 001-online-store-mvp
npm install
```

---

## 2. Start Supabase Local

```bash
supabase start
```

This starts local PostgreSQL, Auth, Storage, and API Gateway via Docker. On first run it pulls images (~2–5 minutes).

After startup, note the output:

```
API URL:      http://127.0.0.1:54321
anon key:     eyJ...
service_role: eyJ...
Studio URL:   http://127.0.0.1:54323
```

---

## 3. Configure Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from step 2>
SUPABASE_SERVICE_ROLE_KEY=<service_role key from step 2>
```

---

## 4. Run Migrations & Seed Data

```bash
supabase db reset
```

This runs all migrations in `supabase/migrations/` and then `supabase/seed.sql`.

**Seed data includes**:
- 3 categories (Thời trang, Điện tử, Gia dụng)
- 10 sample products (mix of published and unpublished)
- 1 admin account: `admin@store.local` / `admin123`
- 2 customer accounts for testing

---

## 5. Generate TypeScript Types

```bash
supabase gen types typescript --local > src/types/database.ts
```

---

## 6. Start Dev Server

```bash
npm run dev
```

Open:
- **Storefront**: [http://localhost:3000](http://localhost:3000)
- **Admin**: [http://localhost:3000/admin](http://localhost:3000/admin)
- **Supabase Studio**: [http://127.0.0.1:54323](http://127.0.0.1:54323) (DB browser)

---

## 7. Run Tests

```bash
# Unit + integration tests
npm run test

# E2E tests (requires dev server running)
npm run test:e2e
```

---

## Verify: Smoke Test Checklist

After starting the dev server, manually verify:

1. [ ] Storefront loads → product grid visible
2. [ ] Click a product → detail page with price and stock
3. [ ] Add to cart → badge updates on bottom nav
4. [ ] Open cart → correct items and total
5. [ ] Checkout → fill form, submit → confirmation page
6. [ ] Login as admin (`admin@store.local` / `admin123`)
7. [ ] Admin dashboard → revenue and order count visible
8. [ ] Admin products → list shows all products (including unpublished)
9. [ ] Toggle publish/unpublish → storefront reflects change
10. [ ] Admin orders → new order from step 5 visible

---

## Common Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint check |
| `npm run test` | Run Vitest |
| `npm run test:e2e` | Run Playwright E2E |
| `supabase start` | Start local Supabase |
| `supabase stop` | Stop local Supabase |
| `supabase db reset` | Reset DB + run migrations + seed |
| `supabase gen types typescript --local > src/types/database.ts` | Regenerate types |
| `supabase migration new <name>` | Create new migration file |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `supabase start` fails | Ensure Docker is running. Run `docker ps` to verify. |
| Auth errors on localhost | Check `.env.local` values match `supabase start` output. |
| Types out of date | Run `supabase gen types ...` after any migration change. |
| Port 3000 in use | `npm run dev -- -p 3001` |
| Port 54321 in use | Another Supabase instance. Run `supabase stop` then `supabase start`. |

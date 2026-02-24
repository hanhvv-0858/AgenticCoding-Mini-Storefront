# API Contract: Authentication

**Auth Provider**: Supabase Auth (email + password)  
**Client SDK**: `@supabase/ssr` — auth is primarily handled client-side via the Supabase client. These are NOT custom API routes — they document the Supabase Auth SDK methods used.

---

## Sign Up (Customer Registration)

**SDK Method**: `supabase.auth.signUp()`

### Input

```json
{
  "email": "customer@example.com",
  "password": "secureP@ss123",
  "options": {
    "data": {
      "full_name": "Nguyễn Văn A"
    }
  }
}
```

### Validation (Client-side Zod)

| Field | Rules |
|-------|-------|
| `email` | Required, valid email format |
| `password` | Required, min 6 chars |
| `full_name` | Required, 1–200 chars |

### Success Behavior

1. Supabase creates user in `auth.users`.
2. DB trigger `trg_create_profile_on_signup` creates a `profiles` row with `role = 'customer'`.
3. Session cookie is automatically set by `@supabase/ssr`.
4. Client redirects to storefront home.

### Error Cases

| Scenario | Supabase Error |
|----------|---------------|
| Email already registered | `User already registered` |
| Password too short | `Password should be at least 6 characters` |
| Invalid email | `Unable to validate email address: invalid format` |

---

## Sign In

**SDK Method**: `supabase.auth.signInWithPassword()`

### Input

```json
{
  "email": "customer@example.com",
  "password": "secureP@ss123"
}
```

### Success Behavior

1. Session established; cookie set.
2. Client fetches `profiles` to determine role.
3. If `role = 'admin'` → redirect to admin dashboard.
4. If `role = 'customer'` → redirect to storefront home (or previous page).

### Error Cases

| Scenario | Supabase Error |
|----------|---------------|
| Wrong credentials | `Invalid login credentials` |
| Email not confirmed (if enabled) | `Email not confirmed` |

---

## Sign Out

**SDK Method**: `supabase.auth.signOut()`

### Behavior

1. Session cookie cleared.
2. Client redirects to storefront home.
3. Cart persists in localStorage (independent of auth).

---

## Get Current Session

**SDK Method**: `supabase.auth.getUser()` (server-side) / `supabase.auth.getSession()` (client-side)

### Response (Profile)

After getting the auth user, fetch profile:

```json
{
  "id": "uuid",
  "email": "customer@example.com",
  "full_name": "Nguyễn Văn A",
  "role": "customer"
}
```

---

## Admin Route Protection

**Mechanism**: Next.js `middleware.ts` + Supabase session check.

### Flow

1. `middleware.ts` intercepts requests to `/admin/**`.
2. Creates Supabase server client, calls `getUser()`.
3. If no session → redirect to `/account?redirect=/admin`.
4. If session exists → fetch `profiles.role`.
5. If `role != 'admin'` → redirect to `/` with `403` toast.
6. If `role = 'admin'` → allow request through.

### Protected Routes

| Pattern | Auth Required | Role Required |
|---------|--------------|---------------|
| `/admin/**` | Yes | `admin` |
| `/account` (order history) | Yes | `customer` or `admin` |
| `/api/products` POST/PUT/DELETE | Yes | `admin` |
| `/api/orders` PATCH | Yes | `admin` |
| `/api/admin/**` | Yes | `admin` |
| All other routes | No | — |

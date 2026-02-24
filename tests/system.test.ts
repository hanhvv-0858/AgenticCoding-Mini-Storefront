/**
 * System Tests — Mini Storefront
 *
 * These tests run against the live dev server + Supabase Cloud.
 * Prerequisites:
 *   1. Dev server running (`pnpm dev`)
 *   2. Database seeded (`node scripts/seed.mjs`)
 *   3. .env.local configured with Supabase credentials
 *
 * Run: pnpm test
 */
import { describe, it, expect, beforeAll } from "vitest"
import { createClient } from "@supabase/supabase-js"

// ─── Config ──────────────────────────────────────────────────────────
const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3001"
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const CUSTOMER_EMAIL = "user@store.local"
const CUSTOMER_PASSWORD = "User@123"
const ADMIN_EMAIL = "admin@store.local"
const ADMIN_PASSWORD = "Admin@123"

// Helper: fetch with JSON
async function api(path: string, options?: RequestInit & { cookie?: string }) {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options?.headers as Record<string, string> || {}),
    }
    if (options?.cookie) {
        headers["Cookie"] = options.cookie
    }
    const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
    })
    const text = await res.text()
    let json: unknown = null
    try { json = JSON.parse(text) } catch { /* not json */ }
    return { status: res.status, json, headers: res.headers }
}

// Helper: sign in via Supabase Auth and get session cookies
async function getAuthCookies(email: string, password: string): Promise<string> {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(`Auth failed for ${email}: ${error.message}`)

    const accessToken = data.session.access_token
    const refreshToken = data.session.refresh_token

    // @supabase/ssr stores the session as chunked JSON cookies (raw, not base64)
    const projectRef = SUPABASE_URL.replace("https://", "").replace(".supabase.co", "")
    const cookieBase = `sb-${projectRef}-auth-token`

    const sessionPayload = JSON.stringify({
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: "bearer",
        expires_in: data.session.expires_in,
        expires_at: data.session.expires_at,
        user: data.session.user,
    })

    // Supabase SSR splits into ~3180-byte chunks of raw JSON
    const chunkSize = 3180
    const chunks: string[] = []
    for (let i = 0; i < sessionPayload.length; i += chunkSize) {
        chunks.push(sessionPayload.slice(i, i + chunkSize))
    }
    const cookies = chunks.map((chunk, i) =>
        `${cookieBase}.${i}=${encodeURIComponent(chunk)}`
    ).join("; ")

    return cookies
}

// ─── Tests ───────────────────────────────────────────────────────────

describe("System Tests — Mini Storefront", () => {
    let customerCookies: string
    let adminCookies: string
    let firstProductId: string
    let createdOrderId: string

    beforeAll(async () => {
        // Verify server is reachable
        try {
            const res = await fetch(BASE_URL)
            expect(res.status).toBeLessThan(500)
        } catch {
            throw new Error(`Dev server not reachable at ${BASE_URL}. Run 'pnpm dev' first.`)
        }
    })

    // ═══════════════════════════════════════════════════════════════
    // 1. PRODUCTS — Public API
    // ═══════════════════════════════════════════════════════════════

    describe("1. Products API (public)", () => {
        it("1.1 GET /api/products — returns product list with pagination", async () => {
            const { status, json } = await api("/api/products")
            expect(status).toBe(200)
            const body = json as { data: unknown[]; pagination: { page: number; total: number } }
            expect(body.data).toBeDefined()
            expect(Array.isArray(body.data)).toBe(true)
            expect(body.data.length).toBeGreaterThan(0)
            expect(body.pagination).toBeDefined()
            expect(body.pagination.page).toBe(1)
            expect(body.pagination.total).toBeGreaterThan(0)

            // Save first product ID for later tests
            firstProductId = (body.data[0] as { id: string }).id
        })

        it("1.2 GET /api/products — supports search by name", async () => {
            const { status, json } = await api("/api/products?search=Clean%20Code")
            expect(status).toBe(200)
            const body = json as { data: Array<{ name: string }> }
            expect(body.data.length).toBeGreaterThanOrEqual(1)
            expect(body.data[0].name).toContain("Clean Code")
        })

        it("1.3 GET /api/products — supports category filter", async () => {
            const { status, json } = await api("/api/products?category=thoi-trang")
            expect(status).toBe(200)
            const body = json as { data: Array<{ category: { slug: string } }> }
            for (const product of body.data) {
                expect(product.category.slug).toBe("thoi-trang")
            }
        })

        it("1.4 GET /api/products — supports pagination", async () => {
            const { status, json } = await api("/api/products?page=1&limit=3")
            expect(status).toBe(200)
            const body = json as { data: unknown[]; pagination: { page: number; limit: number } }
            expect(body.data.length).toBeLessThanOrEqual(3)
            expect(body.pagination.limit).toBe(3)
        })

        it("1.5 GET /api/products/[id] — returns product detail", async () => {
            const { status, json } = await api(`/api/products/${firstProductId}`)
            expect(status).toBe(200)
            const body = json as { id: string; name: string; price: number; stock: number; category: unknown }
            expect(body.id).toBe(firstProductId)
            expect(body.name).toBeTruthy()
            expect(typeof body.price).toBe("number")
            expect(typeof body.stock).toBe("number")
            expect(body.category).toBeDefined()
        })

        it("1.6 GET /api/products/[id] — returns 404 for non-existent product", async () => {
            const fakeId = "00000000-0000-0000-0000-000000000000"
            const { status, json } = await api(`/api/products/${fakeId}`)
            expect(status).toBe(404)
            const body = json as { error: { code: string } }
            expect(body.error.code).toBe("NOT_FOUND")
        })

        it("1.7 GET /api/products?ids=... — bulk lookup for cart validation", async () => {
            const { status, json } = await api(`/api/products?ids=${firstProductId}`)
            expect(status).toBe(200)
            const body = json as { data: Array<{ id: string; stock: number }> }
            expect(body.data.length).toBe(1)
            expect(body.data[0].id).toBe(firstProductId)
            expect(typeof body.data[0].stock).toBe("number")
        })
    })

    // ═══════════════════════════════════════════════════════════════
    // 2. CATEGORIES
    // ═══════════════════════════════════════════════════════════════

    describe("2. Categories API", () => {
        it("2.1 GET /api/categories — returns category list", async () => {
            const { status, json } = await api("/api/categories")
            expect(status).toBe(200)
            const body = json as Array<{ id: string; name: string; slug: string }>
            expect(Array.isArray(body)).toBe(true)
            expect(body.length).toBeGreaterThan(0)
            expect(body[0]).toHaveProperty("id")
            expect(body[0]).toHaveProperty("name")
            expect(body[0]).toHaveProperty("slug")
        })
    })

    // ═══════════════════════════════════════════════════════════════
    // 3. AUTH — Customer sign-in
    // ═══════════════════════════════════════════════════════════════

    describe("3. Authentication", () => {
        it("3.1 Customer can sign in and get valid session cookies", async () => {
            customerCookies = await getAuthCookies(CUSTOMER_EMAIL, CUSTOMER_PASSWORD)
            expect(customerCookies).toBeTruthy()
            expect(customerCookies.length).toBeGreaterThan(0)
        })

        it("3.2 Admin can sign in and get valid session cookies", async () => {
            adminCookies = await getAuthCookies(ADMIN_EMAIL, ADMIN_PASSWORD)
            expect(adminCookies).toBeTruthy()
            expect(adminCookies.length).toBeGreaterThan(0)
        })
    })

    // ═══════════════════════════════════════════════════════════════
    // 4. ORDERS — Unauthenticated
    // ═══════════════════════════════════════════════════════════════

    describe("4. Orders API — Unauthenticated", () => {
        it("4.1 GET /api/orders — returns 401 without auth", async () => {
            const { status, json } = await api("/api/orders")
            expect(status).toBe(401)
            const body = json as { error: { code: string } }
            expect(body.error.code).toBe("UNAUTHORIZED")
        })

        it("4.2 POST /api/orders — validation error for empty body", async () => {
            const { status, json } = await api("/api/orders", {
                method: "POST",
                body: JSON.stringify({}),
            })
            expect(status).toBe(400)
            const body = json as { error: { code: string } }
            expect(body.error.code).toBe("VALIDATION_ERROR")
        })
    })

    // ═══════════════════════════════════════════════════════════════
    // 5. CHECKOUT — Guest order (COD)
    // ═══════════════════════════════════════════════════════════════

    describe("5. Checkout — Guest Order (COD)", () => {
        it("5.1 POST /api/orders — creates order successfully (guest)", async () => {
            // First get a product with stock
            const { json: productList } = await api("/api/products?limit=1")
            const products = (productList as { data: Array<{ id: string; stock: number; price: number }> }).data
            expect(products.length).toBeGreaterThan(0)

            const product = products[0]
            expect(product.stock).toBeGreaterThan(0)

            const { status, json } = await api("/api/orders", {
                method: "POST",
                body: JSON.stringify({
                    customer_name: "Test Guest User",
                    customer_phone: "0901234567",
                    customer_address: "123 Test Street, HCM",
                    items: [{ product_id: product.id, quantity: 1 }],
                }),
            })

            expect(status).toBe(201)
            const body = json as { order_id: string; order_number: string; total_amount: number; status: string }
            expect(body.order_id).toBeTruthy()
            expect(body.order_number).toMatch(/^ORD-\d{8}-\d{3}$/)
            expect(body.total_amount).toBe(product.price)
            expect(body.status).toBe("pending")
        })

        it("5.2 POST /api/orders — rejects with invalid phone format", async () => {
            const { json: productList } = await api("/api/products?limit=1")
            const productId = ((productList as { data: Array<{ id: string }> }).data[0]).id

            const { status, json } = await api("/api/orders", {
                method: "POST",
                body: JSON.stringify({
                    customer_name: "Test",
                    customer_phone: "123",
                    customer_address: "Address",
                    items: [{ product_id: productId, quantity: 1 }],
                }),
            })

            expect(status).toBe(400)
            const body = json as { error: { code: string } }
            expect(body.error.code).toBe("VALIDATION_ERROR")
        })

        it("5.3 POST /api/orders — rejects with empty cart", async () => {
            const { status, json } = await api("/api/orders", {
                method: "POST",
                body: JSON.stringify({
                    customer_name: "Test",
                    customer_phone: "0901234567",
                    customer_address: "Address",
                    items: [],
                }),
            })

            expect(status).toBe(400)
            const body = json as { error: { code: string } }
            expect(body.error.code).toBe("VALIDATION_ERROR")
        })
    })

    // ═══════════════════════════════════════════════════════════════
    // 6. CHECKOUT — Authenticated customer order
    // ═══════════════════════════════════════════════════════════════

    describe("6. Checkout — Authenticated Customer", () => {
        it("6.1 POST /api/orders — creates order with customer_id linked", async () => {
            const { json: productList } = await api("/api/products?limit=1")
            const product = ((productList as { data: Array<{ id: string; price: number }> }).data[0])

            const { status, json } = await api("/api/orders", {
                method: "POST",
                body: JSON.stringify({
                    customer_name: "Customer User",
                    customer_phone: "0912345678",
                    customer_address: "456 Customer Ave, HCM",
                    items: [{ product_id: product.id, quantity: 1 }],
                }),
                cookie: customerCookies,
            })

            expect(status).toBe(201)
            const body = json as { order_id: string; order_number: string }
            expect(body.order_id).toBeTruthy()
            createdOrderId = body.order_id
        })

        it("6.2 GET /api/orders — customer sees own orders", async () => {
            const { status, json } = await api("/api/orders", {
                cookie: customerCookies,
            })
            expect(status).toBe(200)
            const body = json as { data: unknown[]; pagination: unknown }
            expect(body.data.length).toBeGreaterThan(0)
        })

        it("6.3 GET /api/orders/[id] — customer sees own order detail", async () => {
            const { status, json } = await api(`/api/orders/${createdOrderId}`, {
                cookie: customerCookies,
            })
            expect(status).toBe(200)
            const body = json as {
                id: string; order_number: string; customer_name: string
                items: Array<{ product_name: string; quantity: number }>
            }
            expect(body.id).toBe(createdOrderId)
            expect(body.customer_name).toBe("Customer User")
            expect(body.items.length).toBeGreaterThan(0)
            expect(body.items[0].product_name).toBeTruthy()
        })
    })

    // ═══════════════════════════════════════════════════════════════
    // 7. ADMIN — Products management
    // ═══════════════════════════════════════════════════════════════

    describe("7. Admin — Products", () => {
        let testProductId: string

        it("7.1 POST /api/products — admin can create product", async () => {
            // Get a category ID first
            const { json: cats } = await api("/api/categories")
            const categoryId = ((cats as Array<{ id: string }>)[0]).id

            const { status, json } = await api("/api/products", {
                method: "POST",
                body: JSON.stringify({
                    name: "__test_product_system_test__",
                    description: "Created by system test",
                    price: 99000,
                    stock: 10,
                    category_id: categoryId,
                    is_published: false,
                }),
                cookie: adminCookies,
            })

            expect(status).toBe(201)
            const body = json as { id: string; name: string }
            expect(body.id).toBeTruthy()
            expect(body.name).toBe("__test_product_system_test__")
            testProductId = body.id
        })

        it("7.2 PUT /api/products/[id] — admin can update product", async () => {
            const { status, json } = await api(`/api/products/${testProductId}`, {
                method: "PUT",
                body: JSON.stringify({
                    price: 149000,
                    stock: 25,
                }),
                cookie: adminCookies,
            })

            expect(status).toBe(200)
            const body = json as { id: string; price: number; stock: number }
            expect(body.price).toBe(149000)
            expect(body.stock).toBe(25)
        })

        it("7.3 DELETE /api/products/[id] — admin can soft-delete product", async () => {
            const { status, json } = await api(`/api/products/${testProductId}`, {
                method: "DELETE",
                cookie: adminCookies,
            })

            expect(status).toBe(200)
            const body = json as { message: string }
            expect(body.message).toBe("Product deleted")
        })

        it("7.4 POST /api/products — non-admin gets 403", async () => {
            const { json: cats } = await api("/api/categories")
            const categoryId = ((cats as Array<{ id: string }>)[0]).id

            const { status, json } = await api("/api/products", {
                method: "POST",
                body: JSON.stringify({
                    name: "Should Fail",
                    price: 1000,
                    stock: 1,
                    category_id: categoryId,
                }),
                cookie: customerCookies,
            })

            expect(status).toBe(403)
            const body = json as { error: { code: string } }
            expect(body.error.code).toBe("FORBIDDEN")
        })

        it("7.5 POST /api/products — unauthenticated gets 401", async () => {
            const { json: cats } = await api("/api/categories")
            const categoryId = ((cats as Array<{ id: string }>)[0]).id

            const { status, json } = await api("/api/products", {
                method: "POST",
                body: JSON.stringify({
                    name: "Should Fail",
                    price: 1000,
                    stock: 1,
                    category_id: categoryId,
                }),
            })

            expect(status).toBe(401)
            const body = json as { error: { code: string } }
            expect(body.error.code).toBe("UNAUTHORIZED")
        })
    })

    // ═══════════════════════════════════════════════════════════════
    // 8. ADMIN — Order management
    // ═══════════════════════════════════════════════════════════════

    describe("8. Admin — Orders", () => {
        it("8.1 GET /api/orders — admin sees all orders", async () => {
            const { status, json } = await api("/api/orders", {
                cookie: adminCookies,
            })
            expect(status).toBe(200)
            const body = json as { data: unknown[]; pagination: { total: number } }
            expect(body.data.length).toBeGreaterThan(0)
            // Admin should see orders from all users
            expect(body.pagination.total).toBeGreaterThanOrEqual(2)
        })

        it("8.2 PATCH /api/orders/[id] — admin can update order status to delivering", async () => {
            const { status, json } = await api(`/api/orders/${createdOrderId}`, {
                method: "PATCH",
                body: JSON.stringify({ status: "delivering" }),
                cookie: adminCookies,
            })

            expect(status).toBe(200)
            const body = json as { id: string; status: string }
            expect(body.status).toBe("delivering")
        })

        it("8.3 PATCH /api/orders/[id] — admin can complete order", async () => {
            const { status, json } = await api(`/api/orders/${createdOrderId}`, {
                method: "PATCH",
                body: JSON.stringify({ status: "completed" }),
                cookie: adminCookies,
            })

            expect(status).toBe(200)
            const body = json as { id: string; status: string }
            expect(body.status).toBe("completed")
        })

        it("8.4 PATCH /api/orders/[id] — invalid transition rejected", async () => {
            // Can't go from completed → delivering
            const { status, json } = await api(`/api/orders/${createdOrderId}`, {
                method: "PATCH",
                body: JSON.stringify({ status: "delivering" }),
                cookie: adminCookies,
            })

            expect(status).toBe(400)
            const body = json as { error: { code: string } }
            expect(body.error.code).toBe("INVALID_TRANSITION")
        })

        it("8.5 PATCH /api/orders/[id] — customer gets 403 for status update", async () => {
            // Create a new order to test cancellation separately
            const { json: productList } = await api("/api/products?limit=1")
            const productId = ((productList as { data: Array<{ id: string }> }).data[0]).id
            const { json: newOrder } = await api("/api/orders", {
                method: "POST",
                body: JSON.stringify({
                    customer_name: "Cancel Test",
                    customer_phone: "0901234567",
                    customer_address: "Test",
                    items: [{ product_id: productId, quantity: 1 }],
                }),
                cookie: customerCookies,
            })
            const newOrderId = (newOrder as { order_id: string }).order_id

            const { status, json } = await api(`/api/orders/${newOrderId}`, {
                method: "PATCH",
                body: JSON.stringify({ status: "delivering" }),
                cookie: customerCookies,
            })

            expect(status).toBe(403)
            const body = json as { error: { code: string } }
            expect(body.error.code).toBe("FORBIDDEN")
        })
    })

    // ═══════════════════════════════════════════════════════════════
    // 9. ADMIN — Cancel order & stock restore
    // ═══════════════════════════════════════════════════════════════

    describe("9. Cancel order & stock restore", () => {
        it("9.1 Cancel order restores stock", async () => {
            // Get a product and note its stock
            const { json: productList } = await api("/api/products?limit=1")
            const product = ((productList as { data: Array<{ id: string; stock: number }> }).data[0])
            const stockBefore = product.stock

            // Create order as customer
            const { json: orderRes } = await api("/api/orders", {
                method: "POST",
                body: JSON.stringify({
                    customer_name: "Stock Test",
                    customer_phone: "0901234567",
                    customer_address: "Test",
                    items: [{ product_id: product.id, quantity: 2 }],
                }),
                cookie: customerCookies,
            })
            const orderId = (orderRes as { order_id: string }).order_id

            // Verify stock decreased
            const { json: afterOrder } = await api(`/api/products/${product.id}`)
            const stockAfterOrder = (afterOrder as { stock: number }).stock
            expect(stockAfterOrder).toBe(stockBefore - 2)

            // Cancel order as admin
            const { status } = await api(`/api/orders/${orderId}`, {
                method: "PATCH",
                body: JSON.stringify({ status: "cancelled" }),
                cookie: adminCookies,
            })
            expect(status).toBe(200)

            // Verify stock restored
            const { json: afterCancel } = await api(`/api/products/${product.id}`)
            const stockAfterCancel = (afterCancel as { stock: number }).stock
            expect(stockAfterCancel).toBe(stockBefore)
        })
    })

    // ═══════════════════════════════════════════════════════════════
    // 10. ADMIN — Dashboard stats
    // ═══════════════════════════════════════════════════════════════

    describe("10. Admin Stats", () => {
        it("10.1 GET /api/admin/stats — returns revenue stats", async () => {
            const { status, json } = await api("/api/admin/stats", {
                cookie: adminCookies,
            })
            expect(status).toBe(200)
            const body = json as {
                total_revenue: number
                completed_orders_count: number
                pending_orders_count: number
                total_products: number
            }
            expect(typeof body.total_revenue).toBe("number")
            expect(typeof body.completed_orders_count).toBe("number")
            expect(body.completed_orders_count).toBeGreaterThanOrEqual(1) // We completed one order
            expect(typeof body.total_products).toBe("number")
            expect(body.total_products).toBeGreaterThan(0)
        })

        it("10.2 GET /api/admin/stats — unauthenticated gets 401", async () => {
            const { status } = await api("/api/admin/stats")
            expect(status).toBe(401)
        })

        it("10.3 GET /api/admin/stats — customer gets 403", async () => {
            const { status } = await api("/api/admin/stats", {
                cookie: customerCookies,
            })
            expect(status).toBe(403)
        })
    })

    // ═══════════════════════════════════════════════════════════════
    // 11. STOREFRONT PAGES — HTML responses
    // ═══════════════════════════════════════════════════════════════

    describe("11. Storefront Pages", () => {
        it("11.1 GET / — returns 200 (home page)", async () => {
            const res = await fetch(BASE_URL)
            expect(res.status).toBe(200)
            const html = await res.text()
            expect(html).toContain("</html>")
        })

        it("11.2 GET /search — returns 200", async () => {
            const res = await fetch(`${BASE_URL}/search`)
            expect(res.status).toBe(200)
        })

        it("11.3 GET /cart — returns 200", async () => {
            const res = await fetch(`${BASE_URL}/cart`)
            expect(res.status).toBe(200)
        })

        it("11.4 GET /account — returns 200", async () => {
            const res = await fetch(`${BASE_URL}/account`)
            expect(res.status).toBe(200)
        })

        it("11.5 GET /nonexistent — returns 404", async () => {
            const res = await fetch(`${BASE_URL}/this-page-does-not-exist-at-all`)
            expect(res.status).toBe(404)
        })
    })
})

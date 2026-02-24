import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkoutSchema } from "@/lib/validators/order"

export async function GET(request: NextRequest) {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // Auth required for listing orders
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json(
            { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
            { status: 401 }
        )
    }

    // Check if admin
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()
    const isAdmin = profile?.role === "admin"

    const status = searchParams.get("status")
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)))
    const offset = (page - 1) * limit

    // Build query — RLS handles access control
    let query = supabase
        .from("orders")
        .select("*, order_items(id)", { count: "exact" })

    // Non-admin: only own orders
    if (!isAdmin) {
        query = query.eq("customer_id", user.id)
    }

    if (status) {
        query = query.eq("status", status as "pending" | "delivering" | "completed" | "cancelled")
    }

    query = query
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1)

    const { data: orders, error, count } = await query

    if (error) {
        return NextResponse.json(
            { error: { code: "QUERY_ERROR", message: error.message } },
            { status: 400 }
        )
    }

    const total = count ?? 0

    const result = (orders ?? []).map((order) => ({
        id: order.id,
        order_number: order.order_number,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        total_amount: order.total_amount,
        status: order.status,
        payment_method: order.payment_method,
        created_at: order.created_at,
        items_count: order.order_items?.length ?? 0,
    }))

    return NextResponse.json({
        data: result,
        pagination: {
            page,
            limit,
            total,
            total_pages: Math.ceil(total / limit),
        },
    })
}

export async function POST(request: NextRequest) {
    const supabase = await createClient()

    // Parse and validate body
    let body: unknown
    try {
        body = await request.json()
    } catch {
        return NextResponse.json(
            { error: { code: "INVALID_JSON", message: "Invalid JSON body" } },
            { status: 400 }
        )
    }

    const result = checkoutSchema.safeParse(body)
    if (!result.success) {
        const details = result.error.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
        }))
        return NextResponse.json(
            { error: { code: "VALIDATION_ERROR", message: "Dữ liệu không hợp lệ", details } },
            { status: 400 }
        )
    }

    const { customer_name, customer_phone, customer_address, items } = result.data

    // Check if authenticated (optional — guest checkout allowed)
    let customerId: string | null = null
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
        customerId = user.id
    }

    // Call fn_create_order RPC
    const { data, error } = await supabase.rpc("fn_create_order", {
        p_customer_id: customerId,
        p_customer_name: customer_name,
        p_customer_phone: customer_phone,
        p_customer_address: customer_address,
        p_items: items,
    })

    if (error) {
        // Handle stock errors from the function
        if (error.message.includes("INSUFFICIENT_STOCK") || error.message.includes("không đủ")) {
            return NextResponse.json(
                {
                    error: {
                        code: "INSUFFICIENT_STOCK",
                        message: "Không đủ hàng tồn kho",
                        details: [],
                    },
                },
                { status: 409 }
            )
        }
        if (error.message.includes("not found") || error.message.includes("không tồn tại")) {
            return NextResponse.json(
                { error: { code: "NOT_FOUND", message: error.message } },
                { status: 404 }
            )
        }
        return NextResponse.json(
            { error: { code: "ORDER_ERROR", message: error.message } },
            { status: 400 }
        )
    }

    // Parse the response from fn_create_order (returns jsonb)
    const orderData = typeof data === "string" ? JSON.parse(data) : data

    return NextResponse.json(
        {
            order_id: orderData.order_id,
            order_number: orderData.order_number,
            total_amount: orderData.total_amount,
            status: "pending",
            created_at: orderData.created_at,
        },
        { status: 201 }
    )
}

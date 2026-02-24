import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/supabase/admin"
import { updateOrderStatusSchema } from "@/lib/validators/order"
import { ORDER_STATUS_TRANSITIONS } from "@/lib/utils/constants"

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const supabase = await createClient()

    // Auth required
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json(
            { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
            { status: 401 }
        )
    }

    // Fetch order with items
    const { data: order, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", id)
        .single()

    if (error || !order) {
        return NextResponse.json(
            { error: { code: "NOT_FOUND", message: "Order not found" } },
            { status: 404 }
        )
    }

    // Check ownership (non-admin can only see own orders)
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()
    const isAdmin = profile?.role === "admin"

    if (!isAdmin && order.customer_id !== user.id) {
        return NextResponse.json(
            { error: { code: "FORBIDDEN", message: "Access denied" } },
            { status: 403 }
        )
    }

    return NextResponse.json({
        id: order.id,
        order_number: order.order_number,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        customer_address: order.customer_address,
        total_amount: order.total_amount,
        status: order.status,
        payment_method: order.payment_method,
        created_at: order.created_at,
        updated_at: order.updated_at,
        items: order.order_items.map((item) => ({
            id: item.id,
            product_id: item.product_id,
            product_name: item.product_name,
            unit_price: item.unit_price,
            quantity: item.quantity,
        })),
    })
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const adminResult = await requireAdmin()
    if ("error" in adminResult) return adminResult.error
    const { supabase } = adminResult
    const { id } = await params

    let body: unknown
    try {
        body = await request.json()
    } catch {
        return NextResponse.json(
            { error: { code: "INVALID_JSON", message: "Invalid JSON body" } },
            { status: 400 }
        )
    }

    const validation = updateOrderStatusSchema.safeParse(body)
    if (!validation.success) {
        return NextResponse.json(
            { error: { code: "VALIDATION_ERROR", message: validation.error.issues[0].message } },
            { status: 400 }
        )
    }

    const newStatus = validation.data.status

    // Get current order
    const { data: order, error: fetchError } = await supabase
        .from("orders")
        .select("status")
        .eq("id", id)
        .single()

    if (fetchError || !order) {
        return NextResponse.json(
            { error: { code: "NOT_FOUND", message: "Order not found" } },
            { status: 404 }
        )
    }

    // Validate transition
    const validTransitions = ORDER_STATUS_TRANSITIONS[order.status] || []
    if (!validTransitions.includes(newStatus)) {
        return NextResponse.json(
            {
                error: {
                    code: "INVALID_TRANSITION",
                    message: `Cannot transition from '${order.status}' to '${newStatus}'`,
                },
            },
            { status: 400 }
        )
    }

    // If cancelling, use fn_cancel_order RPC to restore stock
    if (newStatus === "cancelled") {
        const { error: cancelError } = await supabase.rpc("fn_cancel_order", {
            p_order_id: id,
        })
        if (cancelError) {
            return NextResponse.json(
                { error: { code: "CANCEL_ERROR", message: cancelError.message } },
                { status: 400 }
            )
        }
    } else {
        // Normal status update
        const { error: updateError } = await supabase
            .from("orders")
            .update({ status: newStatus })
            .eq("id", id)

        if (updateError) {
            return NextResponse.json(
                { error: { code: "UPDATE_ERROR", message: updateError.message } },
                { status: 400 }
            )
        }
    }

    // Fetch updated order
    const { data: updated } = await supabase
        .from("orders")
        .select("id, order_number, status, updated_at")
        .eq("id", id)
        .single()

    return NextResponse.json(updated)
}

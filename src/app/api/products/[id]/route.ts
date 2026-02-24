import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/supabase/admin"
import { getProductImageUrl } from "@/lib/utils/image"
import { updateProductSchema } from "@/lib/validators/product"

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const supabase = await createClient()

    // Check if user is admin
    let isAdmin = false
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single()
        isAdmin = profile?.role === "admin"
    }

    const { data: product, error } = await supabase
        .from("products")
        .select("*, categories!inner(id, name, slug)")
        .eq("id", id)
        .single()

    if (error || !product) {
        return NextResponse.json(
            { error: { code: "NOT_FOUND", message: "Product not found" } },
            { status: 404 }
        )
    }

    // Non-admin cannot see unpublished products
    if (!product.is_published && !isAdmin) {
        return NextResponse.json(
            { error: { code: "NOT_FOUND", message: "Product not found" } },
            { status: 404 }
        )
    }

    return NextResponse.json({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        is_published: product.is_published,
        category: product.categories,
        image_url: getProductImageUrl(product.image_path),
        created_at: product.created_at,
        updated_at: product.updated_at,
    })
}

export async function PUT(
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

    const validation = updateProductSchema.safeParse(body)
    if (!validation.success) {
        const details = validation.error.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
        }))
        return NextResponse.json(
            { error: { code: "VALIDATION_ERROR", message: "Dữ liệu không hợp lệ", details } },
            { status: 400 }
        )
    }

    const { data: product, error } = await supabase
        .from("products")
        .update(validation.data)
        .eq("id", id)
        .select("*")
        .single()

    if (error || !product) {
        return NextResponse.json(
            { error: { code: "NOT_FOUND", message: "Product not found" } },
            { status: 404 }
        )
    }

    return NextResponse.json(product)
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const adminResult = await requireAdmin()
    if ("error" in adminResult) return adminResult.error
    const { supabase } = adminResult
    const { id } = await params

    // Check for active orders — first get active order IDs, then check order_items
    const { data: activeOrders } = await supabase
        .from("orders")
        .select("id")
        .in("status", ["pending", "delivering"])

    let activeOrderCount = 0
    if (activeOrders && activeOrders.length > 0) {
        const activeOrderIds = activeOrders.map((o) => o.id)
        const { count } = await supabase
            .from("order_items")
            .select("id", { count: "exact", head: true })
            .eq("product_id", id)
            .in("order_id", activeOrderIds)
        activeOrderCount = count ?? 0
    }

    // Soft-delete: set is_published = false
    const { error } = await supabase
        .from("products")
        .update({ is_published: false })
        .eq("id", id)

    if (error) {
        return NextResponse.json(
            { error: { code: "NOT_FOUND", message: "Product not found" } },
            { status: 404 }
        )
    }

    return NextResponse.json({
        message: "Product deleted",
        had_active_orders: activeOrderCount > 0,
    })
}

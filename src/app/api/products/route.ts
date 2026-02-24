import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/supabase/admin"
import { getProductImageUrl } from "@/lib/utils/image"
import { createProductSchema } from "@/lib/validators/product"

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)

    const category = searchParams.get("category")
    const search = searchParams.get("search")
    const ids = searchParams.get("ids")
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)))
    const showAll = searchParams.get("all") === "true"

    const offset = (page - 1) * limit

    const supabase = await createClient()

    // Check if user is admin (for showing unpublished)
    let isAdmin = false
    if (showAll) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const { data: profile } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .single()
            isAdmin = profile?.role === "admin"
        }
    }

    // Bulk ID lookup for cart validation
    if (ids) {
        const idList = ids.split(",").filter(Boolean)
        const { data } = await supabase
            .from("products")
            .select("id, name, stock, is_published")
            .in("id", idList)
        return NextResponse.json({ data: data ?? [] })
    }

    // Build query
    let query = supabase
        .from("products")
        .select("*, categories!inner(id, name, slug)", { count: "exact" })

    // Only show published unless admin requests all
    if (!showAll || !isAdmin) {
        query = query.eq("is_published", true)
    }

    // Category filter (by slug)
    if (category) {
        query = query.eq("categories.slug", category)
    }

    // Search by name (case-insensitive partial match)
    if (search) {
        query = query.ilike("name", `%${search}%`)
    }

    // Ordering and pagination
    query = query
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
        return NextResponse.json(
            { error: { code: "QUERY_ERROR", message: error.message } },
            { status: 400 }
        )
    }

    const total = count ?? 0
    const totalPages = Math.ceil(total / limit)

    // Transform response to match contract
    const products = (data ?? []).map((product) => ({
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
    }))

    return NextResponse.json({
        data: products,
        pagination: {
            page,
            limit,
            total,
            total_pages: totalPages,
        },
    })
}

export async function POST(request: NextRequest) {
    const result = await requireAdmin()
    if ("error" in result) return result.error
    const { supabase } = result

    let body: unknown
    try {
        body = await request.json()
    } catch {
        return NextResponse.json(
            { error: { code: "INVALID_JSON", message: "Invalid JSON body" } },
            { status: 400 }
        )
    }

    const validation = createProductSchema.safeParse(body)
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
        .insert(validation.data)
        .select("*")
        .single()

    if (error) {
        return NextResponse.json(
            { error: { code: "INSERT_ERROR", message: error.message } },
            { status: 400 }
        )
    }

    return NextResponse.json(product, { status: 201 })
}

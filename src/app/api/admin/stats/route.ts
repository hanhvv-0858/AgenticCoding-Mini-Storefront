import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/supabase/admin"

export async function GET() {
    const result = await requireAdmin()
    if ("error" in result) return result.error
    const { supabase } = result

    // Fetch order counts by status
    const { data: orders } = await supabase
        .from("orders")
        .select("status, total_amount")

    const stats = {
        total_revenue: 0,
        completed_orders_count: 0,
        pending_orders_count: 0,
        delivering_orders_count: 0,
        cancelled_orders_count: 0,
    }

    for (const order of orders ?? []) {
        switch (order.status) {
            case "completed":
                stats.completed_orders_count++
                stats.total_revenue += order.total_amount
                break
            case "pending":
                stats.pending_orders_count++
                break
            case "delivering":
                stats.delivering_orders_count++
                break
            case "cancelled":
                stats.cancelled_orders_count++
                break
        }
    }

    // Product stats
    const { count: totalProducts } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })

    const { count: publishedProducts } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("is_published", true)

    const { count: lowStockProducts } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .lte("stock", 5)
        .eq("is_published", true)

    return NextResponse.json({
        ...stats,
        total_products: totalProducts ?? 0,
        published_products: publishedProducts ?? 0,
        low_stock_products: lowStockProducts ?? 0,
    })
}

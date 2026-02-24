"use client"

import { useEffect, useState } from "react"
import { RevenueCard } from "@/components/admin/RevenueCard"

interface Stats {
    total_revenue: number
    completed_orders_count: number
    pending_orders_count: number
    delivering_orders_count: number
    cancelled_orders_count: number
    total_products: number
    published_products: number
    low_stock_products: number
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<Stats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch("/api/admin/stats")
                if (res.ok) {
                    setStats(await res.json())
                }
            } catch {
                // Silently fail
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-6xl px-4 py-6">
            <h1 className="mb-6 text-xl font-bold text-gray-900">Tổng quan</h1>

            {stats && <RevenueCard stats={stats} />}

            {/* Product summary */}
            {stats && (
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <p className="text-xs text-gray-500">Tổng sản phẩm</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {stats.total_products}
                        </p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <p className="text-xs text-gray-500">Đang hiển thị</p>
                        <p className="text-2xl font-bold text-green-600">
                            {stats.published_products}
                        </p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <p className="text-xs text-gray-500">Sắp hết hàng (≤5)</p>
                        <p className="text-2xl font-bold text-orange-600">
                            {stats.low_stock_products}
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}

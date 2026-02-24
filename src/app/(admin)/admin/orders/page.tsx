"use client"

import { useEffect, useState, useCallback } from "react"
import { OrderTable } from "@/components/admin/OrderTable"

interface OrderRow {
    id: string
    order_number: string
    customer_name: string
    total_amount: number
    status: string
    created_at: string
    items_count: number
}

const STATUS_TABS = [
    { label: "Tất cả", value: "" },
    { label: "Chờ xử lý", value: "pending" },
    { label: "Đang giao", value: "delivering" },
    { label: "Hoàn thành", value: "completed" },
    { label: "Đã hủy", value: "cancelled" },
]

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<OrderRow[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState("")

    const fetchOrders = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({ limit: "100" })
            if (statusFilter) params.set("status", statusFilter)
            const res = await fetch(`/api/orders?${params.toString()}`)
            if (res.ok) {
                const json = await res.json()
                setOrders(json.data || [])
            }
        } catch {
            // Silently fail
        } finally {
            setLoading(false)
        }
    }, [statusFilter])

    useEffect(() => {
        fetchOrders()
    }, [fetchOrders])

    async function handleStatusChange(orderId: string, newStatus: string) {
        await fetch(`/api/orders/${orderId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
        })
        fetchOrders()
    }

    return (
        <div className="mx-auto max-w-6xl px-4 py-6">
            <h1 className="mb-4 text-xl font-bold text-gray-900">Quản lý đơn hàng</h1>

            {/* Status filter tabs */}
            <div className="mb-4 flex gap-2 overflow-x-auto no-scrollbar">
                {STATUS_TABS.map((tab) => (
                    <button
                        key={tab.value}
                        onClick={() => setStatusFilter(tab.value)}
                        className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${statusFilter === tab.value
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                </div>
            ) : orders.length === 0 ? (
                <div className="py-16 text-center text-sm text-gray-500">
                    Không có đơn hàng nào
                </div>
            ) : (
                <OrderTable orders={orders} onStatusChange={handleStatusChange} />
            )}
        </div>
    )
}

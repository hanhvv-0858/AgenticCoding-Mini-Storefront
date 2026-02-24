"use client"

import Link from "next/link"
import { StatusBadge } from "@/components/ui/Badge"
import { formatPrice, formatDate } from "@/lib/utils/format"
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/utils/constants"

interface OrderSummary {
    id: string
    order_number: string
    total_amount: number
    status: string
    created_at: string
    items_count: number
}

interface OrderHistoryListProps {
    orders: OrderSummary[]
}

export function OrderHistoryList({ orders }: OrderHistoryListProps) {
    if (orders.length === 0) {
        return (
            <div className="py-8 text-center">
                <p className="text-sm text-gray-500">Bạn chưa có đơn hàng nào</p>
                <Link href="/" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
                    Bắt đầu mua sắm
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {orders.map((order) => (
                <Link
                    key={order.id}
                    href={`/account/orders/${order.id}`}
                    className="block rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">
                            {order.order_number}
                        </span>
                        <StatusBadge
                            label={ORDER_STATUS_LABELS[order.status] || order.status}
                            colorClass={ORDER_STATUS_COLORS[order.status] || "bg-gray-100 text-gray-800"}
                        />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
                        <span>{formatDate(order.created_at)}</span>
                        <span className="font-semibold text-gray-900">
                            {formatPrice(order.total_amount)}
                        </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">
                        {order.items_count} sản phẩm
                    </p>
                </Link>
            ))}
        </div>
    )
}

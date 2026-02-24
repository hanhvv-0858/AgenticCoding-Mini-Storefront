"use client"

import { StatusBadge } from "@/components/ui/Badge"
import { formatPrice, formatDate } from "@/lib/utils/format"
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, ORDER_STATUS_TRANSITIONS } from "@/lib/utils/constants"

interface OrderRow {
    id: string
    order_number: string
    customer_name: string
    total_amount: number
    status: string
    created_at: string
    items_count: number
}

interface OrderTableProps {
    orders: OrderRow[]
    onStatusChange: (orderId: string, newStatus: string) => void
}

export function OrderTable({ orders, onStatusChange }: OrderTableProps) {
    return (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                            Đơn hàng
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                            Khách hàng
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                            Tổng tiền
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500">
                            Trạng thái
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                            Ngày đặt
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                    {orders.map((order) => {
                        const transitions = ORDER_STATUS_TRANSITIONS[order.status] || []
                        return (
                            <tr key={order.id} className="hover:bg-gray-50">
                                <td className="whitespace-nowrap px-4 py-3">
                                    <p className="text-sm font-medium text-gray-900">
                                        {order.order_number}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {order.items_count} sản phẩm
                                    </p>
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                                    {order.customer_name}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-gray-900">
                                    {formatPrice(order.total_amount)}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-center">
                                    {transitions.length > 0 ? (
                                        <select
                                            value={order.status}
                                            onChange={(e) => onStatusChange(order.id, e.target.value)}
                                            className="rounded-full border-0 bg-transparent text-xs font-medium focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value={order.status}>
                                                {ORDER_STATUS_LABELS[order.status]}
                                            </option>
                                            {transitions.map((s) => (
                                                <option key={s} value={s}>
                                                    → {ORDER_STATUS_LABELS[s]}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <StatusBadge
                                            label={ORDER_STATUS_LABELS[order.status] || order.status}
                                            colorClass={ORDER_STATUS_COLORS[order.status] || "bg-gray-100 text-gray-800"}
                                        />
                                    )}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                                    {formatDate(order.created_at)}
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}

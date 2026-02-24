"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { StatusBadge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { formatPrice, formatDateTime } from "@/lib/utils/format"
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/utils/constants"
import { ArrowLeft, Package, MapPin, Phone, User } from "lucide-react"

interface OrderItem {
    id: string
    product_id: string
    product_name: string
    unit_price: number
    quantity: number
}

interface OrderDetail {
    id: string
    order_number: string
    customer_name: string
    customer_phone: string
    customer_address: string
    total_amount: number
    status: string
    payment_method: string
    created_at: string
    updated_at: string
    items: OrderItem[]
}

export default function OrderDetailPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const { user, loading: authLoading } = useAuth()
    const [order, setOrder] = useState<OrderDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        if (authLoading) return
        if (!user) {
            router.push("/account?redirect=/account/orders/" + id)
            return
        }

        async function fetchOrder() {
            setLoading(true)
            try {
                const res = await fetch(`/api/orders/${id}`)
                if (!res.ok) {
                    const json = await res.json()
                    setError(json.error?.message || "Không tìm thấy đơn hàng")
                    return
                }
                const data = await res.json()
                setOrder(data)
            } catch {
                setError("Lỗi khi tải đơn hàng")
            } finally {
                setLoading(false)
            }
        }

        fetchOrder()
    }, [id, user, authLoading, router])

    if (authLoading || loading) {
        return (
            <div className="mx-auto max-w-2xl px-4 py-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 w-48 rounded bg-gray-200" />
                    <div className="h-32 rounded-lg bg-gray-200" />
                    <div className="h-48 rounded-lg bg-gray-200" />
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="mx-auto max-w-2xl px-4 py-16 text-center">
                <p className="text-sm text-red-600">{error}</p>
                <Link href="/account" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
                    ← Quay lại tài khoản
                </Link>
            </div>
        )
    }

    if (!order) return null

    return (
        <div className="mx-auto max-w-2xl px-4 py-6">
            {/* Header */}
            <div className="mb-6 flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => router.push("/account")}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-lg font-bold text-gray-900">
                        {order.order_number}
                    </h1>
                    <p className="text-xs text-gray-500">
                        {formatDateTime(order.created_at)}
                    </p>
                </div>
                <StatusBadge
                    label={ORDER_STATUS_LABELS[order.status] || order.status}
                    colorClass={ORDER_STATUS_COLORS[order.status] || "bg-gray-100 text-gray-800"}
                />
            </div>

            {/* Customer info */}
            <div className="mb-4 rounded-lg border border-gray-200 p-4">
                <h2 className="mb-3 text-sm font-semibold text-gray-900">
                    Thông tin giao hàng
                </h2>
                <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>{order.customer_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{order.customer_phone}</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-4 w-4 text-gray-400" />
                        <span>{order.customer_address}</span>
                    </div>
                </div>
            </div>

            {/* Order items */}
            <div className="mb-4 rounded-lg border border-gray-200">
                <h2 className="border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900">
                    <Package className="mr-1.5 inline h-4 w-4" />
                    Sản phẩm ({order.items.length})
                </h2>
                <div className="divide-y divide-gray-100">
                    {order.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between px-4 py-3">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                    {item.product_name}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {formatPrice(item.unit_price)} × {item.quantity}
                                </p>
                            </div>
                            <p className="text-sm font-semibold text-gray-900">
                                {formatPrice(item.unit_price * item.quantity)}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Total */}
            <div className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Phương thức thanh toán</span>
                    <span className="text-sm font-medium text-gray-900">
                        {order.payment_method === "cod" ? "Thanh toán khi nhận hàng (COD)" : order.payment_method}
                    </span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3">
                    <span className="text-base font-semibold text-gray-900">Tổng cộng</span>
                    <span className="text-lg font-bold text-blue-600">
                        {formatPrice(order.total_amount)}
                    </span>
                </div>
            </div>
        </div>
    )
}

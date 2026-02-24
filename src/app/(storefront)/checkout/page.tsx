"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useCart } from "@/hooks/useCart"
import { CheckoutForm } from "@/components/storefront/CheckoutForm"
import type { CheckoutInput } from "@/lib/validators/order"

export default function CheckoutPage() {
    const router = useRouter()
    const { items, clearCart } = useCart()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Redirect to cart if empty
    useEffect(() => {
        if (items.length === 0) {
            router.replace("/cart")
        }
    }, [items.length, router])

    async function handleSubmit(data: CheckoutInput) {
        setLoading(true)
        setError(null)

        try {
            const res = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data,
                    items: items.map((i) => ({
                        product_id: i.product_id,
                        quantity: i.quantity,
                    })),
                }),
            })

            const json = await res.json()

            if (!res.ok) {
                setError(json.error?.message || "Đã xảy ra lỗi khi đặt hàng")
                return
            }

            clearCart()
            router.push(`/checkout/success?order_id=${json.order_id}`)
        } catch {
            setError("Đã xảy ra lỗi kết nối. Vui lòng thử lại.")
        } finally {
            setLoading(false)
        }
    }

    if (items.length === 0) return null

    return (
        <div className="mx-auto max-w-lg px-4 py-6">
            <h1 className="mb-6 text-xl font-bold text-gray-900">Thanh toán</h1>
            <CheckoutForm onSubmit={handleSubmit} loading={loading} error={error} />
        </div>
    )
}

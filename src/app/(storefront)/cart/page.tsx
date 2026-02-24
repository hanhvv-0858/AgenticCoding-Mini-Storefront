"use client"

import { useEffect, useState } from "react"
import { useCart } from "@/hooks/useCart"
import { CartItem } from "@/components/storefront/CartItem"
import { CartSummary } from "@/components/storefront/CartSummary"
import { AlertCircle } from "lucide-react"

interface StaleWarning {
    product_id: string
    name: string
    reason: "unpublished" | "out_of_stock" | "stock_reduced"
    available?: number
}

export default function CartPage() {
    const { items, removeItem, updateQuantity } = useCart()
    const [warnings, setWarnings] = useState<StaleWarning[]>([])

    // Validate cart against current product data
    useEffect(() => {
        if (items.length === 0) {
            setWarnings([])
            return
        }

        async function validate() {
            try {
                const ids = items.map((i) => i.product_id)
                const res = await fetch(`/api/products?ids=${ids.join(",")}`)
                if (!res.ok) {
                    return
                }
                const { data: products } = await res.json()
                const productMap = new Map<string, { stock: number; is_published: boolean; name: string }>(
                    (products || []).map((p: { id: string; stock: number; is_published: boolean; name: string }) => [p.id, p])
                )

                const newWarnings: StaleWarning[] = []
                for (const item of items) {
                    const product = productMap.get(item.product_id)
                    if (!product) {
                        newWarnings.push({ product_id: item.product_id, name: item.name, reason: "unpublished" })
                    } else if (product.stock <= 0) {
                        newWarnings.push({ product_id: item.product_id, name: item.name, reason: "out_of_stock" })
                    } else if (product.stock < item.quantity) {
                        newWarnings.push({
                            product_id: item.product_id,
                            name: item.name,
                            reason: "stock_reduced",
                            available: product.stock,
                        })
                    }
                }
                setWarnings(newWarnings)
            } catch {
                // Silently fail — don't block cart display
            }
        }

        validate()
    }, [items])

    function handleFixWarning(w: StaleWarning) {
        if (w.reason === "unpublished" || w.reason === "out_of_stock") {
            removeItem(w.product_id)
        } else if (w.reason === "stock_reduced" && w.available) {
            updateQuantity(w.product_id, w.available)
        }
        setWarnings((prev) => prev.filter((x) => x.product_id !== w.product_id))
    }

    return (
        <div className="mx-auto max-w-2xl px-4 py-6">
            <h1 className="mb-4 text-xl font-bold text-gray-900">Giỏ hàng</h1>

            {/* Stale cart warnings */}
            {warnings.length > 0 && (
                <div className="mb-4 space-y-2">
                    {warnings.map((w) => (
                        <div
                            key={w.product_id}
                            className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
                        >
                            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                            <div className="flex-1 text-sm text-amber-800">
                                <strong>{w.name}</strong>
                                {w.reason === "unpublished" && " — không còn bày bán."}
                                {w.reason === "out_of_stock" && " — đã hết hàng."}
                                {w.reason === "stock_reduced" && ` — chỉ còn ${w.available} sản phẩm.`}
                            </div>
                            <button
                                onClick={() => handleFixWarning(w)}
                                className="flex-shrink-0 text-xs font-medium text-amber-700 underline hover:text-amber-900"
                            >
                                {w.reason === "stock_reduced" ? "Cập nhật" : "Xóa"}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {items.length > 0 && (
                <div className="mb-6">
                    {items.map((item) => (
                        <CartItem key={item.product_id} item={item} />
                    ))}
                </div>
            )}

            <CartSummary />
        </div>
    )
}

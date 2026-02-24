"use client"

import Image from "next/image"
import { Minus, Plus, Trash2 } from "lucide-react"
import { useCart, type CartItem as CartItemType } from "@/hooks/useCart"
import { formatPrice } from "@/lib/utils/format"
import { getProductImageUrl } from "@/lib/utils/image"

interface CartItemProps {
    item: CartItemType
}

export function CartItem({ item }: CartItemProps) {
    const { updateQuantity, removeItem } = useCart()

    const imageUrl = getProductImageUrl(item.image_path)
    const lineTotal = item.price * item.quantity
    const atMaxStock = item.quantity >= item.max_stock

    return (
        <div className="flex gap-3 border-b border-gray-100 py-4">
            {/* Image */}
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                <Image
                    src={imageUrl}
                    alt={item.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                />
            </div>

            {/* Info */}
            <div className="flex flex-1 flex-col justify-between">
                <div>
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                        {item.name}
                    </h3>
                    <p className="mt-0.5 text-sm font-semibold text-blue-600">
                        {formatPrice(item.price)}
                    </p>
                </div>

                <div className="flex items-center justify-between">
                    {/* Quantity controls */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-40"
                            disabled={item.quantity <= 1}
                            aria-label="Giảm số lượng"
                        >
                            <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">
                            {item.quantity}
                        </span>
                        <button
                            onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-40"
                            disabled={atMaxStock}
                            aria-label="Tăng số lượng"
                        >
                            <Plus className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-900">
                            {formatPrice(lineTotal)}
                        </span>
                        <button
                            onClick={() => removeItem(item.product_id)}
                            className="text-gray-400 transition-colors hover:text-red-500"
                            aria-label="Xóa sản phẩm"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {atMaxStock && (
                    <p className="mt-1 text-xs text-orange-600">
                        Tối đa {item.max_stock} sản phẩm
                    </p>
                )}
            </div>
        </div>
    )
}

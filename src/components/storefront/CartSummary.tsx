"use client"

import Link from "next/link"
import { useCart } from "@/hooks/useCart"
import { formatPrice } from "@/lib/utils/format"
import { Button } from "@/components/ui/Button"

export function CartSummary() {
    const { items, totalItems, totalPrice } = useCart()

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-lg font-medium text-gray-600">
                    Giỏ hàng trống
                </p>
                <p className="mt-1 text-sm text-gray-400">
                    Hãy thêm sản phẩm vào giỏ hàng
                </p>
                <Link href="/" className="mt-4">
                    <Button variant="primary">Tiếp tục mua sắm</Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Số lượng sản phẩm</span>
                <span>{totalItems}</span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3">
                <span className="text-base font-semibold text-gray-900">Tạm tính</span>
                <span className="text-lg font-bold text-blue-600">
                    {formatPrice(totalPrice)}
                </span>
            </div>
            <Link href="/checkout" className="mt-4 block">
                <Button className="w-full" size="lg">
                    Thanh toán
                </Button>
            </Link>
        </div>
    )
}

"use client"

import { Button } from "@/components/ui/Button"
import { ShoppingCart } from "lucide-react"
import { useCart } from "@/hooks/useCart"

interface AddToCartButtonProps {
    product: {
        id: string
        name: string
        price: number
        stock: number
        image_path: string | null
    }
    disabled?: boolean
}

export function AddToCartButton({ product, disabled }: AddToCartButtonProps) {
    const { addItem } = useCart()

    function handleAdd() {
        addItem({
            product_id: product.id,
            name: product.name,
            price: product.price,
            image_path: product.image_path,
            quantity: 1,
            max_stock: product.stock,
        })
    }

    return (
        <Button
            onClick={handleAdd}
            disabled={disabled}
            size="lg"
            className="w-full"
        >
            <ShoppingCart className="mr-2 h-5 w-5" />
            {disabled ? "Hết hàng" : "Thêm vào giỏ"}
        </Button>
    )
}

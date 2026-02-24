import { ProductCard } from "./ProductCard"
import type { Product } from "@/types/database"

interface ProductGridProps {
    products: (Product & {
        categories?: { id: string; name: string; slug: string }
        image_url?: string
    })[]
}

export function ProductGrid({ products }: ProductGridProps) {
    if (products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-lg font-medium text-gray-600">
                    Không tìm thấy sản phẩm nào
                </p>
                <p className="mt-1 text-sm text-gray-400">
                    Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                </p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
                <ProductCard
                    key={product.id}
                    product={product}
                    imageUrl={product.image_url}
                />
            ))}
        </div>
    )
}

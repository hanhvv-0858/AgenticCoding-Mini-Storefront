import Image from "next/image"
import Link from "next/link"
import { Card, CardImage, CardContent } from "@/components/ui/Card"
import { formatPrice } from "@/lib/utils/format"
import { getProductImageUrl } from "@/lib/utils/image"
import type { Product } from "@/types/database"

interface ProductCardProps {
    product: Product & {
        categories?: { id: string; name: string; slug: string }
    }
    imageUrl?: string
}

export function ProductCard({ product, imageUrl }: ProductCardProps) {
    const imgSrc = imageUrl ?? getProductImageUrl(product.image_path)
    const outOfStock = product.stock <= 0

    return (
        <Link href={`/products/${product.id}`}>
            <Card className="h-full">
                <CardImage>
                    <Image
                        src={imgSrc}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover"
                    />
                    {outOfStock && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-gray-800">
                                Hết hàng
                            </span>
                        </div>
                    )}
                </CardImage>
                <CardContent>
                    {product.categories && (
                        <p className="mb-1 text-xs text-gray-500">
                            {product.categories.name}
                        </p>
                    )}
                    <h3 className="line-clamp-2 text-sm font-medium text-gray-900">
                        {product.name}
                    </h3>
                    <div className="mt-2 flex items-center justify-between">
                        <span className="text-base font-bold text-blue-600">
                            {formatPrice(product.price)}
                        </span>
                        {!outOfStock && product.stock <= 5 && (
                            <span className="text-xs text-orange-600">
                                Còn {product.stock}
                            </span>
                        )}
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}

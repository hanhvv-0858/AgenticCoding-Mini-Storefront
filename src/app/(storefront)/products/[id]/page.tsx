import type { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { formatPrice } from "@/lib/utils/format"
import { getProductImageUrl } from "@/lib/utils/image"
import { AddToCartButton } from "./AddToCartButton"

interface ProductDetailPageProps {
    params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
    const { id } = await params
    const supabase = await createClient()
    const { data: product } = await supabase
        .from("products")
        .select("name, description")
        .eq("id", id)
        .eq("is_published", true)
        .single()

    if (!product) return { title: "Sản phẩm không tồn tại" }

    return {
        title: product.name,
        description: product.description?.slice(0, 160) || `Mua ${product.name} tại Mini Storefront`,
        openGraph: {
            title: product.name,
            description: product.description?.slice(0, 160) || `Mua ${product.name} tại Mini Storefront`,
        },
    }
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
    const { id } = await params
    const supabase = await createClient()

    const { data: product } = await supabase
        .from("products")
        .select("*, categories!inner(id, name, slug)")
        .eq("id", id)
        .eq("is_published", true)
        .single()

    if (!product) {
        notFound()
    }

    const imageUrl = getProductImageUrl(product.image_path)
    const outOfStock = product.stock <= 0

    return (
        <div className="mx-auto max-w-7xl px-4 py-6">
            <div className="grid gap-6 md:grid-cols-2">
                {/* Product Image */}
                <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                    <Image
                        src={imageUrl}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover"
                        priority
                    />
                    {outOfStock && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <span className="rounded-full bg-white px-4 py-2 text-lg font-semibold text-gray-800">
                                Hết hàng
                            </span>
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="flex flex-col">
                    <p className="text-sm text-gray-500">{product.categories.name}</p>
                    <h1 className="mt-1 text-2xl font-bold text-gray-900">
                        {product.name}
                    </h1>
                    <p className="mt-4 text-3xl font-bold text-blue-600">
                        {formatPrice(product.price)}
                    </p>

                    {/* Stock status */}
                    <div className="mt-3">
                        {outOfStock ? (
                            <span className="text-sm font-medium text-red-600">
                                Hết hàng
                            </span>
                        ) : product.stock <= 5 ? (
                            <span className="text-sm font-medium text-orange-600">
                                Chỉ còn {product.stock} sản phẩm
                            </span>
                        ) : (
                            <span className="text-sm text-green-600">Còn hàng</span>
                        )}
                    </div>

                    {/* Description */}
                    {product.description && (
                        <div className="mt-6">
                            <h2 className="text-sm font-semibold text-gray-900">
                                Mô tả sản phẩm
                            </h2>
                            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-600">
                                {product.description}
                            </p>
                        </div>
                    )}

                    {/* Add to cart */}
                    <div className="mt-8">
                        <AddToCartButton
                            product={{
                                id: product.id,
                                name: product.name,
                                price: product.price,
                                stock: product.stock,
                                image_path: product.image_path,
                            }}
                            disabled={outOfStock}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

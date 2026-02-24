"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { ProductForm } from "@/components/admin/ProductForm"
import type { Product } from "@/types/database"
import type { z } from "zod"
import type { createProductSchema } from "@/lib/validators/product"

type ProductInput = z.infer<typeof createProductSchema>

export default function AdminEditProductPage() {
    const router = useRouter()
    const params = useParams<{ id: string }>()
    const [product, setProduct] = useState<Product | null>(null)
    const [pageLoading, setPageLoading] = useState(true)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchProduct() {
            try {
                const res = await fetch(`/api/products/${params.id}`)
                if (res.ok) {
                    const data = await res.json()
                    setProduct({
                        ...data,
                        category_id: data.category?.id || data.category_id,
                    })
                }
            } catch {
                // Silently fail
            } finally {
                setPageLoading(false)
            }
        }
        fetchProduct()
    }, [params.id])

    async function handleSubmit(data: ProductInput) {
        setLoading(true)
        setError(null)

        try {
            const res = await fetch(`/api/products/${params.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!res.ok) {
                const json = await res.json()
                setError(json.error?.message || "Đã xảy ra lỗi")
                return
            }

            router.push("/admin/products")
        } catch {
            setError("Đã xảy ra lỗi kết nối")
        } finally {
            setLoading(false)
        }
    }

    if (pageLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
        )
    }

    if (!product) {
        return (
            <div className="py-16 text-center text-sm text-gray-500">
                Không tìm thấy sản phẩm
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-lg px-4 py-6">
            <h1 className="mb-6 text-xl font-bold text-gray-900">Chỉnh sửa sản phẩm</h1>
            <ProductForm
                product={product}
                onSubmit={handleSubmit}
                loading={loading}
                error={error}
            />
        </div>
    )
}

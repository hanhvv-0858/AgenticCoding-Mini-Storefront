"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ProductForm } from "@/components/admin/ProductForm"
import type { z } from "zod"
import type { createProductSchema } from "@/lib/validators/product"

type ProductInput = z.infer<typeof createProductSchema>

export default function AdminNewProductPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(data: ProductInput) {
        setLoading(true)
        setError(null)

        try {
            const res = await fetch("/api/products", {
                method: "POST",
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

    return (
        <div className="mx-auto max-w-lg px-4 py-6">
            <h1 className="mb-6 text-xl font-bold text-gray-900">Thêm sản phẩm mới</h1>
            <ProductForm onSubmit={handleSubmit} loading={loading} error={error} />
        </div>
    )
}

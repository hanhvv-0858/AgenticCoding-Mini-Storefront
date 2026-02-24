"use client"

import { useEffect, useState, useCallback } from "react"
import { ProductTable } from "@/components/admin/ProductTable"
import { Button } from "@/components/ui/Button"
import { Plus } from "lucide-react"
import Link from "next/link"
import type { Product, Category } from "@/types/database"

interface ProductRow extends Product {
    categories?: Pick<Category, "id" | "name" | "slug">
}

export default function AdminProductsPage() {
    const [products, setProducts] = useState<ProductRow[]>([])
    const [loading, setLoading] = useState(true)

    const fetchProducts = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/products?all=true&limit=100")
            if (res.ok) {
                const json = await res.json()
                // Map API response to match component expectations
                setProducts(
                    (json.data || []).map((p: Record<string, unknown>) => ({
                        ...p,
                        categories: p.category,
                        category_id: (p.category as Record<string, string>)?.id || "",
                    }))
                )
            }
        } catch {
            // Silently fail
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchProducts()
    }, [fetchProducts])

    async function handleTogglePublish(id: string, published: boolean) {
        await fetch(`/api/products/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ is_published: published }),
        })
        fetchProducts()
    }

    async function handleDelete(id: string) {
        await fetch(`/api/products/${id}`, { method: "DELETE" })
        fetchProducts()
    }

    async function handleInlineUpdate(id: string, field: string, value: number) {
        await fetch(`/api/products/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ [field]: value }),
        })
        fetchProducts()
    }

    return (
        <div className="mx-auto max-w-6xl px-4 py-6">
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-xl font-bold text-gray-900">Quản lý sản phẩm</h1>
                <Link href="/admin/products/new">
                    <Button>
                        <Plus className="mr-1.5 h-4 w-4" />
                        Thêm sản phẩm
                    </Button>
                </Link>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                </div>
            ) : products.length === 0 ? (
                <div className="py-16 text-center text-sm text-gray-500">
                    Chưa có sản phẩm nào
                </div>
            ) : (
                <ProductTable
                    products={products}
                    onTogglePublish={handleTogglePublish}
                    onDelete={handleDelete}
                    onInlineUpdate={handleInlineUpdate}
                />
            )}
        </div>
    )
}

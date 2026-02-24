"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createProductSchema } from "@/lib/validators/product"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import type { z } from "zod"
import type { Category, Product } from "@/types/database"

type ProductInput = z.infer<typeof createProductSchema>

interface ProductFormProps {
    product?: Product | null
    onSubmit: (data: ProductInput) => Promise<void>
    loading: boolean
    error: string | null
}

export function ProductForm({ product, onSubmit, loading, error }: ProductFormProps) {
    const [categories, setCategories] = useState<Category[]>([])

    useEffect(() => {
        async function fetchCategories() {
            const res = await fetch("/api/categories")
            if (res.ok) {
                const json = await res.json()
                setCategories(json.data || json || [])
            }
        }
        fetchCategories()
    }, [])

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ProductInput>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(createProductSchema) as any,
        defaultValues: product
            ? {
                name: product.name,
                description: product.description || "",
                price: product.price,
                stock: product.stock,
                category_id: product.category_id,
                is_published: product.is_published,
                image_path: product.image_path || "",
            }
            : {
                name: "",
                description: "",
                price: 0,
                stock: 0,
                category_id: "",
                is_published: false,
                image_path: "",
            },
    })

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
                label="Tên sản phẩm"
                required
                {...register("name")}
                error={errors.name?.message}
            />

            <div className="w-full">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                    Mô tả
                </label>
                <textarea
                    {...register("description")}
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Input
                    label="Giá (VND)"
                    type="number"
                    required
                    {...register("price", { valueAsNumber: true })}
                    error={errors.price?.message}
                />
                <Input
                    label="Tồn kho"
                    type="number"
                    required
                    {...register("stock", { valueAsNumber: true })}
                    error={errors.stock?.message}
                />
            </div>

            <div className="w-full">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                    Danh mục <span className="text-red-500">*</span>
                </label>
                <select
                    {...register("category_id")}
                    className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${errors.category_id ? "border-red-500" : "border-gray-300"
                        }`}
                >
                    <option value="">Chọn danh mục</option>
                    {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                            {cat.name}
                        </option>
                    ))}
                </select>
                {errors.category_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.category_id.message}</p>
                )}
            </div>

            <Input
                label="Đường dẫn ảnh (URL hoặc Storage path)"
                {...register("image_path")}
                error={errors.image_path?.message}
            />

            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="is_published"
                    {...register("is_published")}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="is_published" className="text-sm text-gray-700">
                    Hiển thị trên cửa hàng
                </label>
            </div>

            {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <Button type="submit" className="w-full" loading={loading}>
                {product ? "Cập nhật sản phẩm" : "Thêm sản phẩm"}
            </Button>
        </form>
    )
}

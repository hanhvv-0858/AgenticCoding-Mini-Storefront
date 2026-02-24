"use client"

import { useState } from "react"
import { StatusBadge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import { InlineEditCell } from "./InlineEditCell"
import { formatPrice } from "@/lib/utils/format"
import { Pencil, Trash2 } from "lucide-react"
import Link from "next/link"
import type { Product, Category } from "@/types/database"

interface ProductRow extends Product {
    categories?: Pick<Category, "id" | "name" | "slug">
}

interface ProductTableProps {
    products: ProductRow[]
    onTogglePublish: (id: string, published: boolean) => void
    onDelete: (id: string) => void
    onInlineUpdate: (id: string, field: string, value: number) => void
}

export function ProductTable({
    products,
    onTogglePublish,
    onDelete,
    onInlineUpdate,
}: ProductTableProps) {
    const [deleteTarget, setDeleteTarget] = useState<ProductRow | null>(null)

    return (
        <>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                Sản phẩm
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                Danh mục
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                                Giá
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                                Tồn kho
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500">
                                Trạng thái
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                                Thao tác
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {products.map((product) => (
                            <tr key={product.id} className="hover:bg-gray-50">
                                <td className="whitespace-nowrap px-4 py-3">
                                    <p className="text-sm font-medium text-gray-900">
                                        {product.name}
                                    </p>
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                                    {product.categories?.name || "—"}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-right">
                                    <InlineEditCell
                                        value={product.price}
                                        onSave={(val) => onInlineUpdate(product.id, "price", val)}
                                        format={(v) => formatPrice(v)}
                                    />
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-right">
                                    <InlineEditCell
                                        value={product.stock}
                                        onSave={(val) => onInlineUpdate(product.id, "stock", val)}
                                        format={(v) => String(v)}
                                    />
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-center">
                                    <button
                                        onClick={() => onTogglePublish(product.id, !product.is_published)}
                                        className="inline-block"
                                    >
                                        <StatusBadge
                                            label={product.is_published ? "Hiển thị" : "Ẩn"}
                                            colorClass={
                                                product.is_published
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-gray-100 text-gray-600"
                                            }
                                        />
                                    </button>
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <Link href={`/admin/products/${product.id}`}>
                                            <Button variant="ghost" size="sm">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setDeleteTarget(product)}
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Delete confirmation modal */}
            <Modal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                title="Xác nhận xóa"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
                            Hủy
                        </Button>
                        <Button
                            variant="danger"
                            onClick={() => {
                                if (deleteTarget) {
                                    onDelete(deleteTarget.id)
                                    setDeleteTarget(null)
                                }
                            }}
                        >
                            Xóa
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-gray-600">
                    Bạn có chắc muốn xóa sản phẩm{" "}
                    <strong>{deleteTarget?.name}</strong>? Sản phẩm sẽ bị ẩn khỏi cửa
                    hàng.
                </p>
            </Modal>
        </>
    )
}

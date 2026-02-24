"use client"

import { useRouter, useSearchParams } from "next/navigation"
import type { Category } from "@/types/database"

interface CategoryFilterProps {
    categories: Category[]
    activeSlug?: string
}

export function CategoryFilter({ categories, activeSlug }: CategoryFilterProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    function handleClick(slug: string | null) {
        const params = new URLSearchParams(searchParams.toString())
        if (slug) {
            params.set("category", slug)
        } else {
            params.delete("category")
        }
        params.delete("page") // Reset pagination on filter change
        router.push(`?${params.toString()}`)
    }

    return (
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-2">
            <button
                onClick={() => handleClick(null)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${!activeSlug
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
            >
                Tất cả
            </button>
            {categories.map((cat) => (
                <button
                    key={cat.id}
                    onClick={() => handleClick(cat.slug)}
                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${activeSlug === cat.slug
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                >
                    {cat.name}
                </button>
            ))}
        </div>
    )
}

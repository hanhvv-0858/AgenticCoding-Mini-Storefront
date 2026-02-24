import type { Metadata } from "next"
import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { ProductGrid } from "@/components/storefront/ProductGrid"
import { CategoryFilter } from "@/components/storefront/CategoryFilter"
import { SearchBar } from "@/components/storefront/SearchBar"
import { getProductImageUrl } from "@/lib/utils/image"

export const metadata: Metadata = {
    title: "Tìm kiếm sản phẩm",
    description: "Tìm kiếm sản phẩm tại Mini Storefront",
}

interface SearchPageProps {
    searchParams: Promise<{ search?: string; category?: string; page?: string }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const { search, category, page } = await searchParams
    const currentPage = Math.max(1, parseInt(page || "1", 10))
    const limit = 20

    const supabase = await createClient()

    // Fetch categories for filter
    const { data: categories } = await supabase
        .from("categories")
        .select("*")
        .order("name")

    // Build products query
    let query = supabase
        .from("products")
        .select("*, categories!inner(id, name, slug)", { count: "exact" })
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .range((currentPage - 1) * limit, currentPage * limit - 1)

    if (category) {
        query = query.eq("categories.slug", category)
    }

    if (search) {
        query = query.ilike("name", `%${search}%`)
    }

    const { data: rawProducts, count } = await query

    const products = (rawProducts ?? []).map((p) => ({
        ...p,
        image_url: getProductImageUrl(p.image_path),
        categories: p.categories,
    }))

    const totalPages = Math.ceil((count ?? 0) / limit)

    return (
        <div className="mx-auto max-w-7xl px-4 py-6">
            <h1 className="mb-4 text-xl font-bold text-gray-900">Tìm kiếm</h1>

            <Suspense fallback={null}>
                <SearchBar />
            </Suspense>

            <div className="mt-4">
                <Suspense fallback={null}>
                    <CategoryFilter
                        categories={categories ?? []}
                        activeSlug={category}
                    />
                </Suspense>
            </div>

            {search && (
                <p className="mt-3 text-sm text-gray-500">
                    Kết quả cho &ldquo;{search}&rdquo; ({count ?? 0} sản phẩm)
                </p>
            )}

            <div className="mt-4">
                <ProductGrid products={products} />
            </div>

            {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <a
                            key={p}
                            href={`/search?${new URLSearchParams({
                                ...(search ? { search } : {}),
                                ...(category ? { category } : {}),
                                ...(p > 1 ? { page: String(p) } : {}),
                            }).toString()}`}
                            className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition-colors ${p === currentPage
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                        >
                            {p}
                        </a>
                    ))}
                </div>
            )}
        </div>
    )
}

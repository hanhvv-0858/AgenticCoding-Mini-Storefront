export default function StorefrontLoading() {
    return (
        <div className="px-4 py-6">
            {/* Category filter skeleton */}
            <div className="mb-4 flex gap-2 overflow-hidden">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div
                        key={i}
                        className="h-8 w-20 animate-pulse rounded-full bg-gray-200"
                    />
                ))}
            </div>

            {/* Product grid skeleton */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                        <div className="aspect-square w-full animate-pulse bg-gray-200" />
                        <div className="p-3 space-y-2">
                            <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                            <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
                            <div className="h-3 w-1/3 animate-pulse rounded bg-gray-100" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

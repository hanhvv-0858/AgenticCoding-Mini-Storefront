export default function AdminProductsLoading() {
    return (
        <div className="px-4 py-6">
            <div className="mb-6 flex items-center justify-between">
                <div className="h-8 w-40 animate-pulse rounded bg-gray-200" />
                <div className="h-10 w-32 animate-pulse rounded-xl bg-gray-200" />
            </div>

            {/* Table skeleton */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                {/* Header */}
                <div className="flex border-b border-gray-100 bg-gray-50 px-4 py-3">
                    <div className="h-4 w-1/4 animate-pulse rounded bg-gray-200" />
                </div>
                {/* Rows */}
                {Array.from({ length: 6 }).map((_, i) => (
                    <div
                        key={i}
                        className="flex items-center gap-4 border-b border-gray-50 px-4 py-3"
                    >
                        <div className="h-10 w-10 animate-pulse rounded bg-gray-200" />
                        <div className="flex-1 space-y-1">
                            <div className="h-4 w-1/3 animate-pulse rounded bg-gray-200" />
                            <div className="h-3 w-1/4 animate-pulse rounded bg-gray-100" />
                        </div>
                        <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                        <div className="h-4 w-12 animate-pulse rounded bg-gray-200" />
                    </div>
                ))}
            </div>
        </div>
    )
}

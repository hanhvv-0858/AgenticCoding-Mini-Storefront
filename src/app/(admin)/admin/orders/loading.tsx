export default function AdminOrdersLoading() {
    return (
        <div className="px-4 py-6">
            <div className="mb-6">
                <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
            </div>

            {/* Status filter tabs skeleton */}
            <div className="mb-4 flex gap-2 overflow-hidden">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div
                        key={i}
                        className="h-8 w-24 animate-pulse rounded-full bg-gray-200"
                    />
                ))}
            </div>

            {/* Order list skeleton */}
            <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div
                        key={i}
                        className="rounded-xl border border-gray-200 bg-white p-4"
                    >
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                                <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
                            </div>
                            <div className="space-y-2 text-right">
                                <div className="h-5 w-20 animate-pulse rounded-full bg-gray-200" />
                                <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

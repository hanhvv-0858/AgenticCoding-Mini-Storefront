export default function AdminDashboardLoading() {
    return (
        <div className="px-4 py-6">
            <div className="mb-6">
                <div className="h-8 w-36 animate-pulse rounded bg-gray-200" />
            </div>

            {/* Revenue cards skeleton */}
            <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div
                        key={i}
                        className="rounded-xl border border-gray-200 bg-white p-4"
                    >
                        <div className="h-3 w-16 animate-pulse rounded bg-gray-100" />
                        <div className="mt-2 h-7 w-24 animate-pulse rounded bg-gray-200" />
                    </div>
                ))}
            </div>

            {/* Stats skeleton */}
            <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 2 }).map((_, i) => (
                    <div
                        key={i}
                        className="rounded-xl border border-gray-200 bg-white p-4"
                    >
                        <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
                        <div className="mt-2 h-7 w-12 animate-pulse rounded bg-gray-200" />
                    </div>
                ))}
            </div>
        </div>
    )
}

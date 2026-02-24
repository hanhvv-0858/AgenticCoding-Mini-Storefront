export default function ProductDetailLoading() {
    return (
        <div className="mx-auto max-w-2xl px-4 py-6">
            {/* Image skeleton */}
            <div className="aspect-square w-full animate-pulse rounded-xl bg-gray-200" />

            <div className="mt-4 space-y-3">
                {/* Title */}
                <div className="h-7 w-3/4 animate-pulse rounded bg-gray-200" />
                {/* Price */}
                <div className="h-6 w-1/3 animate-pulse rounded bg-gray-200" />
                {/* Category */}
                <div className="h-4 w-1/4 animate-pulse rounded bg-gray-100" />
                {/* Description */}
                <div className="space-y-2 pt-2">
                    <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
                    <div className="h-4 w-5/6 animate-pulse rounded bg-gray-100" />
                    <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
                </div>
                {/* Button */}
                <div className="h-12 w-full animate-pulse rounded-xl bg-gray-200" />
            </div>
        </div>
    )
}

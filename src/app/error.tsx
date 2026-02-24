"use client"

import { useEffect } from "react"

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error("Unhandled error:", error)
    }, [error])

    return (
        <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
            <p className="text-5xl font-bold text-gray-200">Oops!</p>
            <h1 className="mt-4 text-xl font-semibold text-gray-900">
                Đã xảy ra lỗi
            </h1>
            <p className="mt-2 text-sm text-gray-500">
                Có điều gì đó không đúng. Vui lòng thử lại.
            </p>
            <button
                onClick={reset}
                className="mt-6 inline-flex h-11 items-center rounded-xl bg-black px-6 text-sm font-medium text-white hover:bg-gray-800"
            >
                Thử lại
            </button>
        </div>
    )
}

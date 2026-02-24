"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { Search, X } from "lucide-react"

interface SearchBarProps {
    placeholder?: string
}

export function SearchBar({ placeholder = "Tìm kiếm sản phẩm..." }: SearchBarProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [value, setValue] = useState(searchParams.get("search") || "")

    // Debounce: update URL after 400ms of no typing
    const updateSearch = useCallback(
        (term: string) => {
            const params = new URLSearchParams(searchParams.toString())
            if (term.trim()) {
                params.set("search", term.trim())
            } else {
                params.delete("search")
            }
            params.delete("page")
            router.push(`/search?${params.toString()}`)
        },
        [router, searchParams]
    )

    useEffect(() => {
        const timer = setTimeout(() => {
            updateSearch(value)
        }, 400)
        return () => clearTimeout(timer)
    }, [value, updateSearch])

    // Sync input with URL changes
    useEffect(() => {
        setValue(searchParams.get("search") || "")
    }, [searchParams])

    function handleClear() {
        setValue("")
        const params = new URLSearchParams(searchParams.toString())
        params.delete("search")
        params.delete("page")
        router.push(`/search?${params.toString()}`)
    }

    return (
        <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-10 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {value && (
                <button
                    onClick={handleClear}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="Xóa tìm kiếm"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    )
}

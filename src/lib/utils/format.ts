/**
 * Format a price in VND (đồng) with dot separators
 * Example: 250000 → "250.000₫"
 */
export function formatPrice(price: number): string {
    return price.toLocaleString("vi-VN") + "₫"
}

/**
 * Format a date string to Vietnamese locale
 * Example: "2026-02-23T10:00:00Z" → "23/02/2026"
 */
export function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    })
}

/**
 * Format a date string with time
 * Example: "2026-02-23T10:00:00Z" → "23/02/2026 10:00"
 */
export function formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    })
}

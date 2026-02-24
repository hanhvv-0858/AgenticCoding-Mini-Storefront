// Order status labels (Vietnamese)
export const ORDER_STATUS_LABELS: Record<string, string> = {
    pending: "Chờ xử lý",
    delivering: "Đang giao",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
}

// Order status colors for badges
export const ORDER_STATUS_COLORS: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    delivering: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
}

// Valid order status transitions
export const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
    pending: ["delivering", "cancelled"],
    delivering: ["completed"],
    completed: [],
    cancelled: [],
}

// Payment methods
export const PAYMENT_METHODS = {
    cod: "Tiền mặt khi nhận hàng (COD)",
}

// Pagination
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

// Cart
export const CART_STORAGE_KEY = "mini-storefront-cart"

// Image upload
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]

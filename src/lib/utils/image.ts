/**
 * Get the public URL for a product image.
 * Handles three cases:
 * 1. null/undefined → returns placeholder
 * 2. Full URL (http/https) → returns as-is (external URL pasted by admin)
 * 3. Storage path → constructs Supabase Storage public URL
 */
export function getProductImageUrl(imagePath: string | null): string {
    if (!imagePath) return "/placeholder-product.png"

    // If it's already a full URL (admin pasted external URL), use as-is
    if (imagePath.startsWith("http")) return imagePath

    // Construct Supabase Storage public URL
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${imagePath}`
}

import { CartProvider } from "@/hooks/useCart"
import { StorefrontNav } from "./StorefrontNav"

export default function StorefrontLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <CartProvider>
            <div className="flex min-h-screen flex-col lg:flex-row">
                <StorefrontNav />
                <main className="flex-1 pb-20 lg:pb-0 lg:pl-64">{children}</main>
            </div>
        </CartProvider>
    )
}

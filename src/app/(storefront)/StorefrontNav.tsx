"use client"

import { Home, Search, ShoppingCart, User } from "lucide-react"
import { BottomNav } from "@/components/navigation/BottomNav"
import { Sidebar } from "@/components/navigation/Sidebar"
import { useCart } from "@/hooks/useCart"

export function StorefrontNav() {
    const { totalItems } = useCart()

    const tabs = [
        { href: "/", icon: Home, label: "Cửa hàng" },
        { href: "/search", icon: Search, label: "Tìm kiếm" },
        { href: "/cart", icon: ShoppingCart, label: "Giỏ hàng", badge: totalItems },
        { href: "/account", icon: User, label: "Tài khoản" },
    ]

    return (
        <>
            <Sidebar tabs={tabs} />
            <BottomNav tabs={tabs} />
        </>
    )
}

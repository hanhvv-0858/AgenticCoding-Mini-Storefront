"use client"

import { LayoutDashboard, Package, ClipboardList, Settings } from "lucide-react"
import { BottomNav } from "@/components/navigation/BottomNav"
import { Sidebar } from "@/components/navigation/Sidebar"

export function AdminNav() {
    const tabs = [
        { href: "/admin", icon: LayoutDashboard, label: "Tổng quan" },
        { href: "/admin/products", icon: Package, label: "Sản phẩm" },
        { href: "/admin/orders", icon: ClipboardList, label: "Đơn hàng" },
        { href: "/admin/settings", icon: Settings, label: "Cài đặt" },
    ]

    return (
        <>
            <Sidebar tabs={tabs} />
            <BottomNav tabs={tabs} />
        </>
    )
}

"use client"

import { NavItem } from "./NavItem"
import type { LucideIcon } from "lucide-react"

interface SidebarTab {
    href: string
    icon: LucideIcon
    label: string
    badge?: number
}

interface SidebarProps {
    tabs: SidebarTab[]
}

export function Sidebar({ tabs }: SidebarProps) {
    return (
        <aside className="fixed left-0 top-0 hidden h-full w-64 border-r border-gray-200 bg-white lg:block">
            <div className="flex h-14 items-center border-b border-gray-200 px-6">
                <span className="text-lg font-bold text-gray-900">Mini Store</span>
            </div>
            <nav aria-label="Điều hướng chính" className="mt-4 space-y-1 px-3">
                {tabs.map((tab) => (
                    <div key={tab.href} className="rounded-lg hover:bg-gray-50">
                        <NavItem {...tab} />
                    </div>
                ))}
            </nav>
        </aside>
    )
}

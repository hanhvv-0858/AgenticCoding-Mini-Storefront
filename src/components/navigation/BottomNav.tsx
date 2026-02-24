"use client"

import { NavItem } from "./NavItem"
import type { LucideIcon } from "lucide-react"

interface BottomNavTab {
    href: string
    icon: LucideIcon
    label: string
    badge?: number
}

interface BottomNavProps {
    tabs: BottomNavTab[]
}

export function BottomNav({ tabs }: BottomNavProps) {
    return (
        <nav aria-label="Điều hướng chính" className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white pb-safe lg:hidden">
            <div className="mx-auto flex h-14 max-w-lg items-center justify-around">
                {tabs.map((tab) => (
                    <NavItem key={tab.href} {...tab} />
                ))}
            </div>
        </nav>
    )
}

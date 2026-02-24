"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { LucideIcon } from "lucide-react"
import { Badge } from "@/components/ui/Badge"

interface NavItemProps {
    href: string
    icon: LucideIcon
    label: string
    badge?: number
}

export function NavItem({ href, icon: Icon, label, badge }: NavItemProps) {
    const pathname = usePathname()
    const isActive = pathname === href || (href !== "/" && pathname.startsWith(href))

    return (
        <Link
            href={href}
            aria-current={isActive ? "page" : undefined}
            aria-label={label}
            className={`relative flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 text-xs transition-colors ${isActive
                ? "text-blue-600"
                : "text-gray-500 hover:text-gray-700"
                }`}
        >
            <div className="relative">
                <Icon className="h-5 w-5" />
                {badge !== undefined && badge > 0 && <Badge count={badge} />}
            </div>
            <span className="font-medium">{label}</span>
        </Link>
    )
}

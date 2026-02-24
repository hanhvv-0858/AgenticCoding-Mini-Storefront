interface BadgeProps {
    count: number
    className?: string
}

export function Badge({ count, className = "" }: BadgeProps) {
    if (count <= 0) return null

    return (
        <span
            className={`absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ${className}`}
        >
            {count > 99 ? "99+" : count}
        </span>
    )
}

// Status badge variant for orders
interface StatusBadgeProps {
    label: string
    colorClass: string
    className?: string
}

export function StatusBadge({
    label,
    colorClass,
    className = "",
}: StatusBadgeProps) {
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass} ${className}`}
        >
            {label}
        </span>
    )
}

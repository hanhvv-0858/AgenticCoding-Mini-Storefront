import { StatusBadge } from "@/components/ui/Badge"
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/utils/constants"

interface OrderStatusBadgeProps {
    status: string
    className?: string
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
    return (
        <StatusBadge
            label={ORDER_STATUS_LABELS[status] || status}
            colorClass={ORDER_STATUS_COLORS[status] || "bg-gray-100 text-gray-800"}
            className={className}
        />
    )
}

import { formatPrice } from "@/lib/utils/format"
import { DollarSign, Package, Clock, Truck } from "lucide-react"

interface RevenueCardProps {
    stats: {
        total_revenue: number
        completed_orders_count: number
        pending_orders_count: number
        delivering_orders_count: number
        total_products: number
        published_products: number
        low_stock_products: number
    }
}

export function RevenueCard({ stats }: RevenueCardProps) {
    const cards = [
        {
            label: "Doanh thu",
            value: formatPrice(stats.total_revenue),
            icon: DollarSign,
            color: "bg-green-100 text-green-600",
        },
        {
            label: "Đơn hoàn thành",
            value: String(stats.completed_orders_count),
            icon: Package,
            color: "bg-blue-100 text-blue-600",
        },
        {
            label: "Đang chờ xử lý",
            value: String(stats.pending_orders_count),
            icon: Clock,
            color: "bg-yellow-100 text-yellow-600",
        },
        {
            label: "Đang giao",
            value: String(stats.delivering_orders_count),
            icon: Truck,
            color: "bg-purple-100 text-purple-600",
        },
    ]

    return (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {cards.map((card) => (
                <div
                    key={card.label}
                    className="rounded-lg border border-gray-200 bg-white p-4"
                >
                    <div className="flex items-center gap-3">
                        <div
                            className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.color}`}
                        >
                            <card.icon className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">{card.label}</p>
                            <p className="text-lg font-bold text-gray-900">{card.value}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

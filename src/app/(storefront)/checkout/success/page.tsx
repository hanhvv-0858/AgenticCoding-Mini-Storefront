import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { formatPrice } from "@/lib/utils/format"
import { Button } from "@/components/ui/Button"
import { CheckCircle } from "lucide-react"

interface SuccessPageProps {
    searchParams: Promise<{ order_id?: string }>
}

export default async function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
    const { order_id } = await searchParams

    let orderNumber = ""
    let totalAmount = 0

    if (order_id) {
        const supabase = await createClient()
        const { data: order } = await supabase
            .from("orders")
            .select("order_number, total_amount")
            .eq("id", order_id)
            .single()

        if (order) {
            orderNumber = order.order_number
            totalAmount = order.total_amount
        }
    }

    return (
        <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
            </div>

            <h1 className="mt-4 text-2xl font-bold text-gray-900">
                Đặt hàng thành công!
            </h1>

            {orderNumber && (
                <p className="mt-2 text-sm text-gray-600">
                    Mã đơn hàng: <span className="font-semibold">{orderNumber}</span>
                </p>
            )}

            {totalAmount > 0 && (
                <p className="mt-1 text-sm text-gray-600">
                    Tổng thanh toán:{" "}
                    <span className="font-semibold text-blue-600">
                        {formatPrice(totalAmount)}
                    </span>
                </p>
            )}

            <p className="mt-4 text-sm text-gray-500">
                Cảm ơn bạn đã đặt hàng. Chúng tôi sẽ liên hệ để xác nhận đơn hàng sớm nhất.
            </p>

            <Link href="/" className="mt-8">
                <Button variant="primary">Tiếp tục mua sắm</Button>
            </Link>
        </div>
    )
}

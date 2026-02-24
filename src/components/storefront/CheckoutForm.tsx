"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { checkoutSchema, type CheckoutInput } from "@/lib/validators/order"
import { useCart } from "@/hooks/useCart"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { formatPrice } from "@/lib/utils/format"

interface CheckoutFormProps {
    onSubmit: (data: CheckoutInput) => Promise<void>
    loading: boolean
    error: string | null
}

export function CheckoutForm({ onSubmit, loading, error }: CheckoutFormProps) {
    const { items, totalPrice, totalItems } = useCart()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CheckoutInput>({
        resolver: zodResolver(checkoutSchema),
        defaultValues: {
            customer_name: "",
            customer_phone: "",
            customer_address: "",
            items: items.map((i) => ({
                product_id: i.product_id,
                quantity: i.quantity,
            })),
        },
    })

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Shipping info */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">
                    Thông tin giao hàng
                </h2>
                <Input
                    label="Họ và tên"
                    required
                    {...register("customer_name")}
                    error={errors.customer_name?.message}
                />
                <Input
                    label="Số điện thoại"
                    required
                    type="tel"
                    placeholder="0901234567"
                    {...register("customer_phone")}
                    error={errors.customer_phone?.message}
                />
                <div className="w-full">
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Địa chỉ giao hàng
                        <span className="ml-1 text-red-500">*</span>
                    </label>
                    <textarea
                        {...register("customer_address")}
                        rows={3}
                        className={`w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${errors.customer_address
                                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                                : "border-gray-300"
                            }`}
                    />
                    {errors.customer_address && (
                        <p className="mt-1 text-sm text-red-600">
                            {errors.customer_address.message}
                        </p>
                    )}
                </div>
            </div>

            {/* Order summary */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h2 className="text-lg font-semibold text-gray-900">
                    Tóm tắt đơn hàng
                </h2>
                <div className="mt-3 space-y-2">
                    {items.map((item) => (
                        <div
                            key={item.product_id}
                            className="flex items-center justify-between text-sm"
                        >
                            <span className="text-gray-600">
                                {item.name} × {item.quantity}
                            </span>
                            <span className="font-medium text-gray-900">
                                {formatPrice(item.price * item.quantity)}
                            </span>
                        </div>
                    ))}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3">
                    <span className="font-semibold">Tổng ({totalItems} sản phẩm)</span>
                    <span className="text-lg font-bold text-blue-600">
                        {formatPrice(totalPrice)}
                    </span>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                    Phương thức thanh toán: Tiền mặt khi nhận hàng (COD)
                </p>
            </div>

            {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <Button
                type="submit"
                size="lg"
                className="w-full"
                loading={loading}
                disabled={items.length === 0}
            >
                Đặt hàng
            </Button>
        </form>
    )
}

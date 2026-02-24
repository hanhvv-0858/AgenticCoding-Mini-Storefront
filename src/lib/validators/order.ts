import { z } from "zod"

const orderItemSchema = z.object({
    product_id: z.string().uuid("Product ID không hợp lệ"),
    quantity: z
        .number()
        .int("Số lượng phải là số nguyên")
        .min(1, "Số lượng phải ít nhất 1"),
})

export const checkoutSchema = z.object({
    customer_name: z
        .string()
        .min(1, "Họ tên không được để trống")
        .max(200, "Họ tên tối đa 200 ký tự"),
    customer_phone: z
        .string()
        .regex(/^0\d{9}$/, "Số điện thoại không hợp lệ (10 chữ số, bắt đầu bằng 0)"),
    customer_address: z
        .string()
        .min(1, "Địa chỉ không được để trống")
        .max(500, "Địa chỉ tối đa 500 ký tự"),
    items: z
        .array(orderItemSchema)
        .min(1, "Giỏ hàng không được trống"),
})

export const updateOrderStatusSchema = z.object({
    status: z.enum(["pending", "delivering", "completed", "cancelled"], {
        error: "Trạng thái không hợp lệ",
    }),
})

export type CheckoutInput = z.infer<typeof checkoutSchema>
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>

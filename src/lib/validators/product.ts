import { z } from "zod"

export const createProductSchema = z.object({
    name: z
        .string()
        .min(1, "Tên sản phẩm không được để trống")
        .max(200, "Tên sản phẩm tối đa 200 ký tự"),
    description: z
        .string()
        .max(2000, "Mô tả tối đa 2000 ký tự")
        .optional()
        .nullable(),
    price: z
        .number()
        .int("Giá phải là số nguyên")
        .min(0, "Giá không được âm"),
    stock: z
        .number()
        .int("Số lượng phải là số nguyên")
        .min(0, "Số lượng không được âm"),
    category_id: z.string().uuid("Category ID không hợp lệ"),
    is_published: z.boolean().default(false),
    image_path: z.string().optional().nullable(),
})

export const updateProductSchema = createProductSchema.partial().refine(
    (data) => Object.keys(data).length > 0,
    { message: "Cần cập nhật ít nhất một trường" }
)

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>

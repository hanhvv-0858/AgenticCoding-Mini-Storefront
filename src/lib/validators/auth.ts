import { z } from "zod"

export const signUpSchema = z.object({
    email: z
        .string()
        .email("Email không hợp lệ"),
    password: z
        .string()
        .min(6, "Mật khẩu tối thiểu 6 ký tự"),
    full_name: z
        .string()
        .min(1, "Họ tên không được để trống")
        .max(200, "Họ tên tối đa 200 ký tự"),
})

export const signInSchema = z.object({
    email: z
        .string()
        .email("Email không hợp lệ"),
    password: z
        .string()
        .min(1, "Mật khẩu không được để trống"),
})

export type SignUpInput = z.infer<typeof signUpSchema>
export type SignInInput = z.infer<typeof signInSchema>

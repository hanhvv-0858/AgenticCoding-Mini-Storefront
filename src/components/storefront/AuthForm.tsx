"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { signInSchema, signUpSchema } from "@/lib/validators/auth"
import { useAuth } from "@/hooks/useAuth"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import type { z } from "zod"

type SignInInput = z.infer<typeof signInSchema>
type SignUpInput = z.infer<typeof signUpSchema>

interface AuthFormProps {
    onSuccess?: () => void
}

export function AuthForm({ onSuccess }: AuthFormProps) {
    const [tab, setTab] = useState<"login" | "register">("login")
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const { signIn, signUp } = useAuth()

    const loginForm = useForm<SignInInput>({
        resolver: zodResolver(signInSchema),
    })

    const registerForm = useForm<SignUpInput>({
        resolver: zodResolver(signUpSchema),
    })

    async function handleLogin(data: SignInInput) {
        setLoading(true)
        setError(null)
        try {
            await signIn(data.email, data.password)
            onSuccess?.()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Đăng nhập thất bại")
        } finally {
            setLoading(false)
        }
    }

    async function handleRegister(data: SignUpInput) {
        setLoading(true)
        setError(null)
        try {
            await signUp(data.email, data.password, data.full_name)
            onSuccess?.()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Đăng ký thất bại")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-full">
            {/* Tabs */}
            <div className="mb-6 flex rounded-lg bg-gray-100 p-1">
                <button
                    onClick={() => { setTab("login"); setError(null) }}
                    className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${tab === "login"
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                >
                    Đăng nhập
                </button>
                <button
                    onClick={() => { setTab("register"); setError(null) }}
                    className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${tab === "register"
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                >
                    Đăng ký
                </button>
            </div>

            {error && (
                <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {tab === "login" ? (
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                    <Input
                        label="Email"
                        type="email"
                        required
                        {...loginForm.register("email")}
                        error={loginForm.formState.errors.email?.message}
                    />
                    <Input
                        label="Mật khẩu"
                        type="password"
                        required
                        {...loginForm.register("password")}
                        error={loginForm.formState.errors.password?.message}
                    />
                    <Button type="submit" className="w-full" loading={loading}>
                        Đăng nhập
                    </Button>
                </form>
            ) : (
                <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                    <Input
                        label="Họ và tên"
                        required
                        {...registerForm.register("full_name")}
                        error={registerForm.formState.errors.full_name?.message}
                    />
                    <Input
                        label="Email"
                        type="email"
                        required
                        {...registerForm.register("email")}
                        error={registerForm.formState.errors.email?.message}
                    />
                    <Input
                        label="Mật khẩu"
                        type="password"
                        required
                        {...registerForm.register("password")}
                        error={registerForm.formState.errors.password?.message}
                    />
                    <Button type="submit" className="w-full" loading={loading}>
                        Đăng ký
                    </Button>
                </form>
            )}
        </div>
    )
}

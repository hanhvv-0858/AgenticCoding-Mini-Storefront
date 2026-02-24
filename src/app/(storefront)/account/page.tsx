"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { AuthForm } from "@/components/storefront/AuthForm"
import { OrderHistoryList } from "@/components/storefront/OrderHistoryList"
import { Button } from "@/components/ui/Button"
import { LogOut, User } from "lucide-react"

interface OrderSummary {
    id: string
    order_number: string
    total_amount: number
    status: string
    created_at: string
    items_count: number
}

export default function AccountPage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center py-16">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                </div>
            }
        >
            <AccountContent />
        </Suspense>
    )
}

function AccountContent() {
    const { user, profile, loading, signOut } = useAuth()
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirect = searchParams.get("redirect")
    const [orders, setOrders] = useState<OrderSummary[]>([])
    const [ordersLoading, setOrdersLoading] = useState(false)

    // Fetch orders when logged in
    useEffect(() => {
        if (!user) return

        async function fetchOrders() {
            setOrdersLoading(true)
            try {
                const res = await fetch("/api/orders")
                if (res.ok) {
                    const json = await res.json()
                    setOrders(json.data || [])
                }
            } catch (err) {
                console.error('[AccountPage] Orders fetch error:', err)
            } finally {
                setOrdersLoading(false)
            }
        }

        fetchOrders()
    }, [user])

    function handleAuthSuccess() {
        if (redirect) {
            router.push(redirect)
        } else {
            router.refresh()
        }
    }

    async function handleSignOut() {
        await signOut()
        router.refresh()
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
        )
    }

    // Not logged in — show auth form
    if (!user) {
        return (
            <div className="mx-auto max-w-sm px-4 py-8">
                <h1 className="mb-6 text-center text-xl font-bold text-gray-900">
                    Tài khoản
                </h1>
                <AuthForm onSuccess={handleAuthSuccess} />
            </div>
        )
    }

    // Logged in — show profile + orders
    return (
        <div className="mx-auto max-w-2xl px-4 py-6">
            {/* Profile */}
            <div className="mb-6 flex items-center justify-between rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                        <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                        <p className="font-medium text-gray-900">
                            {profile?.full_name || user.email}
                        </p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                </div>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                    <LogOut className="mr-1.5 h-4 w-4" />
                    Đăng xuất
                </Button>
            </div>

            {/* Order history */}
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Lịch sử đơn hàng
            </h2>
            {ordersLoading ? (
                <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                </div>
            ) : (
                <OrderHistoryList orders={orders} />
            )}
        </div>
    )
}

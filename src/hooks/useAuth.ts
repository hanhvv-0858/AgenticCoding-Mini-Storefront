"use client"

import { useEffect, useState, useCallback } from "react"
import type { Profile } from "@/types/database"
import type { User } from "@supabase/supabase-js"

interface AuthState {
    user: User | null
    profile: Profile | null
    loading: boolean
}

export function useAuth() {
    const [state, setState] = useState<AuthState>({
        user: null,
        profile: null,
        loading: true,
    })

    // Fetch current auth status from server-side API route
    useEffect(() => {
        let cancelled = false

        async function checkAuth() {
            try {
                const res = await fetch("/api/auth/me")
                if (!res.ok) {
                    if (!cancelled) setState({ user: null, profile: null, loading: false })
                    return
                }
                const { user, profile } = await res.json()
                if (!cancelled) {
                    setState({
                        user: user ?? null,
                        profile: profile ?? null,
                        loading: false,
                    })
                }
            } catch {
                if (!cancelled) setState({ user: null, profile: null, loading: false })
            }
        }

        checkAuth()

        return () => {
            cancelled = true
        }
    }, [])

    const signIn = useCallback(async (email: string, password: string) => {
        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Đăng nhập thất bại")

        // Refresh auth state after login
        setState({ user: data.user, profile: null, loading: true })

        // Fetch profile
        try {
            const meRes = await fetch("/api/auth/me")
            if (meRes.ok) {
                const me = await meRes.json()
                setState({
                    user: me.user ?? data.user,
                    profile: me.profile ?? null,
                    loading: false,
                })
            } else {
                setState({ user: data.user, profile: null, loading: false })
            }
        } catch {
            setState({ user: data.user, profile: null, loading: false })
        }
    }, [])

    const signUp = useCallback(async (
        email: string,
        password: string,
        fullName: string
    ) => {
        const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, full_name: fullName }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Đăng ký thất bại")

        setState({
            user: data.user ?? null,
            profile: null,
            loading: false,
        })
    }, [])

    const signOut = useCallback(async () => {
        await fetch("/api/auth/logout", { method: "POST" })
        setState({ user: null, profile: null, loading: false })
    }, [])

    return {
        user: state.user,
        profile: state.profile,
        loading: state.loading,
        isAdmin: state.profile?.role === "admin",
        signIn,
        signUp,
        signOut,
    }
}

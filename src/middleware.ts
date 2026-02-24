import { type NextRequest, NextResponse } from "next/server"
import { createMiddlewareClient } from "@/lib/supabase/middleware"

export async function middleware(request: NextRequest) {
    const { supabase, response } = createMiddlewareClient(request)

    // Refresh session with a timeout to prevent hanging
    let user = null
    try {
        const result = await Promise.race([
            supabase.auth.getUser(),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
        ])
        if (result && typeof result === "object" && "data" in result) {
            user = result.data.user
        }
    } catch {
        // Auth check failed — continue as unauthenticated
    }

    // Protect /admin routes
    if (request.nextUrl.pathname.startsWith("/admin")) {
        if (!user) {
            const url = request.nextUrl.clone()
            url.pathname = "/account"
            url.searchParams.set("redirect", request.nextUrl.pathname)
            return NextResponse.redirect(url)
        }

        // Check admin role from profiles table
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single()

        if (profile?.role !== "admin") {
            return NextResponse.redirect(new URL("/", request.url))
        }
    }

    return response
}

export const config = {
    matcher: [
        // Match all routes except static files and _next
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
}

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Verify the request is from an authenticated admin user.
 * Returns the supabase client and user if admin, or a NextResponse error.
 */
export async function requireAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return {
            error: NextResponse.json(
                { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            ),
        }
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

    if (profile?.role !== "admin") {
        return {
            error: NextResponse.json(
                { error: { code: "FORBIDDEN", message: "Admin access required" } },
                { status: 403 }
            ),
        }
    }

    return { supabase, user }
}

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
    try {
        const { email, password, full_name } = await request.json()

        if (!email || !password || !full_name) {
            return NextResponse.json(
                { error: "Email, password and full name are required" },
                { status: 400 }
            )
        }

        const supabase = await createClient()
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name },
            },
        })

        if (error) {
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            )
        }

        return NextResponse.json({
            user: data.user,
            session: data.session,
        })
    } catch {
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

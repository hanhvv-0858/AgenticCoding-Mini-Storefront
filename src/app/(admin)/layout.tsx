import { AdminNav } from "./AdminNav"

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen">
            <AdminNav />
            <main className="flex-1 pb-20 lg:pb-0 lg:pl-64">{children}</main>
        </div>
    )
}

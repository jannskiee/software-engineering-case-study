import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { verifyToken } from "@/lib/auth"
import { Sidebar } from "@/components/layout/Sidebar"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get("session")

    if (!sessionCookie) {
        redirect("/login")
    }

    const payload = await verifyToken(sessionCookie.value)

    if (!payload || !payload.email || !payload.role) {
        redirect("/login")
    }

    const user = {
        email: payload.email as string,
        role: payload.role as string,
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar Navigation */}
            <Sidebar user={user} />

            {/* Main Content Area */}
            <main className="flex-1 ml-64 min-h-screen transition-all print:ml-0">
                <div className="container mx-auto p-8 max-w-7xl">
                    {children}
                </div>
            </main>
        </div>
    )
}

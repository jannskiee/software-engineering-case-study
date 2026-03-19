import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Sidebar } from "@/components/layout/Sidebar"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
        redirect("/login")
    }

    const user = {
        email: session.user.email as string,
        role: (session.user as any).role as string,
        name: session.user.name || undefined,
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 flex">
            {/* Sidebar Navigation */}
            <Sidebar user={user} />

            {/* Main Content Area */}
            <main className="flex-1 lg:ml-64 min-h-screen transition-all print:ml-0">
                <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl pt-16 lg:pt-8">
                    {children}
                </div>
            </main>
        </div>
    )
}

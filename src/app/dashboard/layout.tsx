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
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar user={user} />

            <main className="flex-1 min-h-screen transition-all lg:ml-64 print:ml-0">
                <div className="mx-auto max-w-7xl px-4 pb-6 pt-20 sm:px-6 sm:pb-8 lg:px-8 lg:pt-8">
                    {children}
                </div>
            </main>
        </div>
    )
}

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FileText, User, Users, LogOut, PackageSearch } from "lucide-react"

interface SidebarProps {
    user: {
        email: string
        role: string
    }
}

export function Sidebar({ user }: SidebarProps) {
    const pathname = usePathname()

    const menuItems = [
        {
            title: "Dashboard",
            href: "/dashboard",
            icon: LayoutDashboard,
            roles: ["STUDENT", "PROFESSOR", "ADMIN", "SUPERADMIN"],
        },
        {
            title: "Audit Logs",
            href: "/dashboard/logs",
            icon: FileText,
            roles: ["ADMIN", "SUPERADMIN"],
        },
        {
            title: "User Profile",
            href: "/dashboard/profile",
            icon: User,
            roles: ["STUDENT", "PROFESSOR", "ADMIN", "SUPERADMIN"],
        },
    ]

    const adminItems = [
        {
            title: "User Management",
            href: "/dashboard/users",
            icon: Users,
            roles: ["ADMIN", "SUPERADMIN"],
        },
    ]

    const filteredMenu = menuItems.filter((item) => item.roles.includes(user.role))
    const filteredAdmin = adminItems.filter((item) => item.roles.includes(user.role))

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-[#004f32] text-white shadow-xl flex flex-col transition-transform print:hidden">
            <div className="flex h-20 items-center justify-center border-b border-[#006341]/50 px-6">
                <Link href="/dashboard" className="flex items-center gap-3">
                    <img src="/dlsud-logo.png" alt="DLSU-D Logo" className="w-10 h-10 object-contain drop-shadow-md bg-white rounded-full p-1" />
                    <span className="font-bold text-lg tracking-tight">Inventory System</span>
                </Link>
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col">
                <div className="mb-8">
                    <div className="mb-4 px-2 text-xs font-semibold uppercase tracking-wider text-dlsud-gold/80">Menu</div>
                    <nav className="space-y-1">
                        {filteredMenu.map((item) => {
                            const Icon = item.icon
                            const isActive = pathname === item.href

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 rounded-lg px-3 py-3 transition-colors ${isActive
                                        ? "bg-dlsud-gold text-[#004f32] font-semibold shadow-sm"
                                        : "text-gray-100 hover:bg-[#006341] hover:text-white"
                                        }`}
                                >
                                    <Icon className={`h-5 w-5 ${isActive ? "text-[#004f32]" : "text-gray-300"}`} />
                                    <span>{item.title}</span>
                                </Link>
                            )
                        })}
                    </nav>
                </div>

                {filteredAdmin.length > 0 && (
                    <div className="mt-auto pt-6 pb-8 border-t border-[#006341]/30">
                        <div className="mb-4 px-2 text-xs font-semibold uppercase tracking-wider text-dlsud-gold/80">Administration</div>
                        <nav className="space-y-1">
                            {filteredAdmin.map((item) => {
                                const Icon = item.icon
                                const isActive = pathname === item.href

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center gap-3 rounded-lg px-3 py-3 transition-colors ${isActive
                                            ? "bg-dlsud-gold text-[#004f32] font-semibold shadow-sm"
                                            : "text-gray-100 hover:bg-[#006341] hover:text-white"
                                            }`}
                                    >
                                        <Icon className={`h-5 w-5 ${isActive ? "text-[#004f32]" : "text-gray-300"}`} />
                                        <span>{item.title}</span>
                                    </Link>
                                )
                            })}
                        </nav>
                    </div>
                )}
            </div>

            <div className="border-t border-[#006341]/50 p-4">
                <div className="mb-4 rounded-lg bg-[#003622] p-4 shadow-inner">
                    <p className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium text-white" title={user.email}>
                        {user.email}
                    </p>
                    <p className="mt-1 flex items-center gap-2 text-xs text-dlsud-gold font-semibold uppercase">
                        <span className="h-2 w-2 rounded-full bg-dlsud-gold"></span>
                        {user.role}
                    </p>
                </div>

                <form action="/api/auth/logout" method="POST">
                    <button
                        type="submit"
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600/10 px-4 py-2.5 text-sm font-medium text-red-100 transition-colors hover:bg-red-600/20 hover:text-white"
                    >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                    </button>
                </form>
            </div>
        </aside>
    )
}

"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { LayoutDashboard, FileText, User, Users, LogOut, PackageSearch, Menu, X, Activity, Boxes } from "lucide-react"
import { useEffect, useState } from "react"

interface SidebarProps {
    user: {
        email: string
        role: string
        name?: string
    }
}

export function Sidebar({ user }: SidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        setIsOpen(false)
    }, [pathname])

    const menuItems = [
        {
            title: "Dashboard",
            href: "/dashboard",
            icon: LayoutDashboard,
            roles: ["STUDENT", "PROFESSOR", "ADMIN", "SUPERADMIN"],
        },
        {
            title: "Equipment",
            href: "/dashboard/equipment",
            icon: Boxes,
            roles: ["STUDENT", "PROFESSOR"],
        },
        {
            title: "My Activity",
            href: "/dashboard/my-logs",
            icon: Activity,
            roles: ["STUDENT", "PROFESSOR", "ADMIN", "SUPERADMIN"],
        },
        {
            title: "System Logs",
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
        {
            title: "Inventory",
            href: "/dashboard/inventory",
            icon: PackageSearch,
            roles: ["ADMIN", "SUPERADMIN"],
        },
    ]

    const filteredMenu = menuItems.filter((item) => item.roles.includes(user.role))
    const filteredAdmin = adminItems.filter((item) => item.roles.includes(user.role))

    const roleColors: Record<string, string> = {
        STUDENT: "text-blue-300",
        PROFESSOR: "text-purple-300",
        ADMIN: "text-amber-300",
        SUPERADMIN: "text-red-300",
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="fixed left-4 top-4 z-50 inline-flex items-center gap-2 rounded-xl bg-[#004f32]/90 backdrop-blur-sm px-3 py-2 text-sm font-medium text-white shadow-lg lg:hidden border border-white/10"
            >
                <Menu className="h-4 w-4" />
                Menu
            </button>

            {isOpen && (
                <button
                    type="button"
                    aria-label="Close menu overlay"
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside
                className={`fixed left-0 top-0 z-50 h-screen w-64 bg-gradient-to-b from-[#004f32] to-[#003a25] text-white shadow-2xl flex flex-col transition-transform print:hidden lg:z-40 ${
                    isOpen ? "translate-x-0" : "-translate-x-full"
                } lg:translate-x-0`}
            >
                {/* Logo Header */}
                <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-3"
                        onClick={() => setIsOpen(false)}
                    >
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-md p-1">
                            <img
                                src="/dlsud-logo.png"
                                alt="DLSU-D Logo"
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <div>
                            <p className="font-bold text-sm text-white leading-tight">CEAT Dispensing</p>
                            <p className="text-[10px] text-white/40 leading-tight">Equipment System</p>
                        </div>
                    </Link>
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 lg:hidden"
                        aria-label="Close menu"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto py-5 px-3 flex flex-col">
                    <div className="mb-6">
                        <div className="mb-3 px-2 text-[10px] font-bold uppercase tracking-widest text-white/30">
                            Navigation
                        </div>
                        <nav className="space-y-1">
                            {filteredMenu.map((item) => {
                                const Icon = item.icon
                                const isActive = pathname === item.href

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        prefetch
                                        onMouseEnter={() => router.prefetch(item.href)}
                                        onTouchStart={() => router.prefetch(item.href)}
                                        className={`flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200 ${
                                            isActive
                                                ? "bg-[#c8a951]/20 border border-[#c8a951]/40 text-[#c8a951] font-semibold shadow-sm"
                                                : "text-white/70 hover:bg-white/8 hover:text-white"
                                        }`}
                                    >
                                        <Icon
                                            className={`h-4 w-4 shrink-0 ${
                                                isActive ? "text-[#c8a951]" : "text-white/50"
                                            }`}
                                        />
                                        <span className="text-sm">{item.title}</span>
                                    </Link>
                                )
                            })}
                        </nav>
                    </div>

                    {filteredAdmin.length > 0 && (
                        <div className="mt-auto pt-4 border-t border-white/10">
                            <div className="mb-3 px-2 text-[10px] font-bold uppercase tracking-widest text-white/30">
                                Administration
                            </div>
                            <nav className="space-y-1">
                                {filteredAdmin.map((item) => {
                                    const Icon = item.icon
                                    const isActive = pathname === item.href

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            prefetch
                                            onMouseEnter={() => router.prefetch(item.href)}
                                            onTouchStart={() => router.prefetch(item.href)}
                                            className={`flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200 ${
                                                isActive
                                                    ? "bg-[#c8a951]/20 border border-[#c8a951]/40 text-[#c8a951] font-semibold"
                                                    : "text-white/70 hover:bg-white/8 hover:text-white"
                                            }`}
                                        >
                                            <Icon
                                                className={`h-4 w-4 shrink-0 ${
                                                    isActive ? "text-[#c8a951]" : "text-white/50"
                                                }`}
                                            />
                                            <span className="text-sm">{item.title}</span>
                                        </Link>
                                    )
                                })}
                            </nav>
                        </div>
                    )}
                </div>

                {/* User Footer */}
                <div className="border-t border-white/10 p-4">
                    <div className="mb-3 rounded-xl bg-black/20 border border-white/8 px-4 py-3">
                        <p
                            className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium text-white"
                            title={user.email}
                        >
                            {user.name || user.email}
                        </p>
                        {user.name && (
                            <p className="text-xs text-white/40 truncate" title={user.email}>
                                {user.email}
                            </p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5">
                            <span className={`h-1.5 w-1.5 rounded-full bg-current ${roleColors[user.role] || "text-gray-300"}`} />
                            <p className={`text-xs font-bold uppercase tracking-wider ${roleColors[user.role] || "text-gray-300"}`}>
                                {user.role}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/10 border border-red-400/20 px-4 py-2.5 text-sm font-medium text-red-300 transition-all hover:bg-red-500/20 hover:text-red-200"
                    >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                    </button>
                </div>
            </aside>
        </>
    )
}

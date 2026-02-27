import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, GraduationCap, Briefcase, ShieldCheck, ShieldAlert } from "lucide-react"
import { db } from "@/lib/db"

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Map roles to specific configuration for modern UI mapping
const roleConfig: Record<string, { label: string, icon: any, color: string, bgColor: string, description: string }> = {
    STUDENT: {
        label: "Students",
        icon: GraduationCap,
        color: "text-blue-600",
        bgColor: "bg-blue-100",
        description: "Standard accounts with limited access."
    },
    PROFESSOR: {
        label: "Professors",
        icon: Briefcase,
        color: "text-emerald-600",
        bgColor: "bg-emerald-100",
        description: "Faculty accounts with elevated access."
    },
    ADMIN: {
        label: "Administrators",
        icon: ShieldCheck,
        color: "text-amber-600",
        bgColor: "bg-amber-100",
        description: "Management accounts with broad control."
    },
    SUPERADMIN: {
        label: "Super Admin",
        icon: ShieldAlert,
        color: "text-red-600",
        bgColor: "bg-red-100",
        description: "Root accounts with absolute authority."
    }
}

export default async function UserManagementPage() {
    // Group all users by their role and count them
    const userRoleCounts = await db.user.groupBy({
        by: ['role'],
        _count: {
            role: true,
        },
    })

    // Compute exactly how many users per role exist, defaulting to 0 if the query misses them
    const stats = {
        STUDENT: userRoleCounts.find(r => r.role === 'STUDENT')?._count.role || 0,
        PROFESSOR: userRoleCounts.find(r => r.role === 'PROFESSOR')?._count.role || 0,
        ADMIN: userRoleCounts.find(r => r.role === 'ADMIN')?._count.role || 0,
        SUPERADMIN: userRoleCounts.find(r => r.role === 'SUPERADMIN')?._count.role || 0,
    }

    const totalUsers = userRoleCounts.reduce((acc, curr) => acc + curr._count.role, 0)

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">User Management</h1>
                    <p className="text-gray-500 mt-2">Overview of registered accounts and authorization distribution.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border shadow-sm">
                    <Users className="w-5 h-5 text-dlsud-green" />
                    <span className="text-sm font-medium text-gray-600">Total Registered:</span>
                    <span className="text-lg font-bold text-gray-900">{totalUsers}</span>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                {Object.entries(roleConfig).map(([roleKey, config]) => {
                    const count = stats[roleKey as keyof typeof stats]
                    const Icon = config.icon

                    return (
                        <Card key={roleKey} className="shadow-sm border-none bg-white hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wider">{config.label}</CardTitle>
                                <div className={`p-2 rounded-lg ${config.bgColor}`}>
                                    <Icon className={`h-5 w-5 ${config.color}`} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-gray-900">{count}</div>
                                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                                    {config.description}
                                </p>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}

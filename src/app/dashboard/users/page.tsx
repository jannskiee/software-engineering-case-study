import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, GraduationCap, Briefcase, ShieldCheck, ShieldAlert } from "lucide-react"
import { db } from "@/lib/db"
import { format } from "date-fns"

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

    const usersList = await db.user.findMany({
        select: { id: true, name: true, email: true, role: true, schoolId: true, createdAt: true },
        orderBy: { createdAt: "desc" }
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
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">User Management</h1>
                    <p className="text-sm sm:text-base text-gray-500 mt-2">Overview of registered accounts and authorization distribution.</p>
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

            <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Identity & Access Management</h3>
                <div className="space-y-3 md:hidden">
                    {usersList.map((u: any) => (
                        <Card key={u.id} className="border-0 shadow-sm ring-1 ring-gray-200">
                            <CardContent className="p-4 space-y-2">
                                <div>
                                    <p className="font-medium text-gray-900 break-words">{u.name}</p>
                                    <p className="text-xs text-gray-500 break-all">{u.email}</p>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">School ID</span>
                                    <span className="text-gray-700">{u.schoolId || "-"}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Registered</span>
                                    <span className="text-gray-700">{format(new Date(u.createdAt), 'PP')}</span>
                                </div>
                                <div>
                                    <span className={`text-xs font-semibold px-2 py-1 rounded shadow-sm border
                                        ${u.role === 'SUPERADMIN' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                                        ${u.role === 'ADMIN' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                                        ${u.role === 'PROFESSOR' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                                        ${u.role === 'STUDENT' ? 'bg-gray-50 text-gray-700 border-gray-200' : ''}
                                    `}>
                                        {u.role}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <Card className="overflow-hidden border-0 shadow-sm ring-1 ring-gray-200">
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3">User</th>
                                    <th className="px-6 py-3">School ID</th>
                                    <th className="px-6 py-3">Registered</th>
                                    <th className="px-6 py-3">Privilege Access Schema</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usersList.map((u: any) => (
                                    <tr key={u.id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {u.name} <br/>
                                            <span className="text-xs text-gray-500 font-normal">{u.email}</span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">{u.schoolId || "-"}</td>
                                        <td className="px-6 py-4 text-gray-500">{format(new Date(u.createdAt), 'PP')}</td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs font-semibold px-2 py-1 rounded shadow-sm border
                                                ${u.role === 'SUPERADMIN' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                                                ${u.role === 'ADMIN' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                                                ${u.role === 'PROFESSOR' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                                                ${u.role === 'STUDENT' ? 'bg-gray-50 text-gray-700 border-gray-200' : ''}
                                            `}>
                                                {u.role}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    )
}

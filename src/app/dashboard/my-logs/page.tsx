import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { format } from "date-fns"
import { Activity, Package, CheckCircle2, XCircle, Clock } from "lucide-react"

function getActionBadge(action: string) {
    if (action.includes("APPROVED")) return { color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 }
    if (action.includes("DISPENSED")) return { color: "bg-blue-100 text-blue-700 border-blue-200", icon: Package }
    if (action.includes("RETURNED")) return { color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 }
    if (action.includes("REJECTED") || action.includes("EXPIRED")) return { color: "bg-red-100 text-red-700 border-red-200", icon: XCircle }
    if (action.includes("PENDING")) return { color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock }
    return { color: "bg-gray-100 text-gray-700 border-gray-200", icon: Activity }
}

export default async function MyLogsPage() {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) redirect("/login")

    const userId = (session.user as any).id as string
    const currentRole = (session.user as any).role as string

    // Fetch only logs where this user acted AS their current role
    // This enforces role-based data isolation even for same-email users
    const myLogs = await db.auditLog.findMany({
        where: {
            actorId: userId,
            actorRole: currentRole,
        },
        orderBy: { createdAt: "desc" },
        take: 100,
    })

    const roleColor = {
        STUDENT: "text-blue-600 bg-blue-50 border-blue-200",
        PROFESSOR: "text-purple-600 bg-purple-50 border-purple-200",
        ADMIN: "text-amber-600 bg-amber-50 border-amber-200",
        SUPERADMIN: "text-red-600 bg-red-50 border-red-200",
    }[currentRole] || "text-gray-600 bg-gray-50 border-gray-200"

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">My Activity</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Your personal activity log — filtered to your current role session.
                    </p>
                </div>
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full border w-fit ${roleColor}`}>
                    Viewing as: {currentRole}
                </span>
            </div>

            {myLogs.length === 0 ? (
                <div className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm text-center py-16 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                        <Activity className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-600">No Activity Yet</h3>
                    <p className="text-sm text-gray-400 mt-1 max-w-sm px-4">
                        Your actions as a <strong>{currentRole}</strong> will appear here once you start using the system.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {myLogs.map((log) => {
                        const badge = getActionBadge(log.action)
                        const Icon = badge.icon
                        return (
                            <div
                                key={log.id}
                                className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm p-4 sm:p-5 hover:shadow-md transition-shadow"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                                    <div className={`p-2 rounded-xl border self-start ${badge.color}`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border w-fit ${badge.color}`}>
                                                {log.action.replace(/_/g, " ")}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {format(new Date(log.createdAt), "MMM dd, yyyy — h:mm:ss a")}
                                            </span>
                                        </div>
                                        {log.details ? (
                                            <p className="text-sm text-gray-700 leading-relaxed">{log.details}</p>
                                        ) : (
                                            <p className="text-sm text-gray-400 italic">No additional details available.</p>
                                        )}
                                        {log.entityId && (
                                            <p className="text-xs text-gray-400 font-mono mt-1">
                                                Ref: {log.entityId.slice(0, 12)}...
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

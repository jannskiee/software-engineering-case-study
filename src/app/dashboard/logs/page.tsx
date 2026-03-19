import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExportPdfButton } from "@/components/ui/ExportPdfButton"
import { db } from "@/lib/db"
import { getAuditLogs } from "@/app/actions/admin"
import { format } from "date-fns"

function getStatusFromAction(action: string, fallback?: string | null) {
    if (action.includes("PENDING")) return "PENDING"
    if (action.includes("APPROVED")) return "APPROVED"
    if (action.includes("DISPENSED")) return "DISPENSED"
    if (action.includes("RETURNED")) return "RETURNED"
    if (action.includes("REJECTED")) return "REJECTED"
    if (action.includes("EXPIRED")) return "EXPIRED"
    return fallback || "INFO"
}

function getStatusBadgeVariant(status: string) {
    if (status === "APPROVED" || status === "RETURNED") return "default"
    if (status === "PENDING") return "secondary"
    if (status === "REJECTED" || status === "EXPIRED") return "destructive"
    return "outline"
}

const roleColor: Record<string, string> = {
    STUDENT: "bg-blue-50 text-blue-700 border-blue-200",
    PROFESSOR: "bg-purple-50 text-purple-700 border-purple-200",
    ADMIN: "bg-amber-50 text-amber-700 border-amber-200",
    SUPERADMIN: "bg-red-50 text-red-700 border-red-200",
    UNKNOWN: "bg-gray-50 text-gray-700 border-gray-200",
}

export default async function LogsPage() {
    const logs = await getAuditLogs(200)
    const requestIds = Array.from(
        new Set(logs.map((log) => log.entityId).filter((id): id is string => Boolean(id)))
    )

    const requestStatuses =
        requestIds.length > 0
            ? await db.borrowRequest.findMany({
                  where: { id: { in: requestIds } },
                  select: { id: true, status: true },
              })
            : []

    const requestStatusMap = new Map(requestStatuses.map((r) => [r.id, r.status]))

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">System Audit Logs</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Complete system activity — all roles, all events, with full detail.
                    </p>
                </div>
                <ExportPdfButton />
            </div>

            <Card className="shadow-sm border-gray-100 bg-white/80 backdrop-blur-sm overflow-hidden rounded-2xl">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Audit Trail</CardTitle>
                    <CardDescription>
                        {logs.length} events — Accessible only to ADMIN and SUPERADMIN.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {/* Mobile: Cards layout */}
                    <div className="sm:hidden divide-y divide-gray-100">
                        {logs.length === 0 ? (
                            <p className="p-6 text-center text-sm text-gray-400">No audit logs available.</p>
                        ) : (
                            logs.map((log) => {
                                const currentRequestStatus = log.entityId ? requestStatusMap.get(log.entityId) : null
                                const displayStatus = getStatusFromAction(log.action, currentRequestStatus)
                                const actorRoleClass = roleColor[log.actorRole as string] || roleColor.UNKNOWN
                                return (
                                    <div key={log.id} className="p-4 bg-white hover:bg-gray-50/50 space-y-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`text-xs border px-2 py-0.5 rounded-full font-bold ${actorRoleClass}`}>
                                                {log.actorRole}
                                            </span>
                                            <Badge variant={getStatusBadgeVariant(displayStatus)} className="text-xs">
                                                {displayStatus}
                                            </Badge>
                                        </div>
                                        <p className="text-sm font-semibold text-gray-800">
                                            {log.actor?.name || log.actor?.email || "Unknown"}
                                        </p>
                                        <p className="text-xs font-mono text-gray-500 bg-gray-50 px-2 py-1 rounded">
                                            {log.action}
                                        </p>
                                        {(log as any).details && (
                                            <p className="text-xs text-gray-600 leading-relaxed">{(log as any).details}</p>
                                        )}
                                        <p className="text-xs text-gray-400">
                                            {format(new Date(log.createdAt), "MMM dd, yyyy — h:mm:ss a")}
                                        </p>
                                    </div>
                                )
                            })
                        )}
                    </div>

                    {/* Desktop: Table layout */}
                    <div className="hidden sm:block relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm text-left">
                            <thead className="[&_tr]:border-b bg-gray-50/80">
                                <tr>
                                    <th className="h-12 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Time</th>
                                    <th className="h-12 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Actor</th>
                                    <th className="h-12 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                                    <th className="h-12 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                                    <th className="h-12 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Details</th>
                                    <th className="h-12 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-gray-400 text-sm">
                                            No audit logs available at this time.
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map((log) => {
                                        const currentRequestStatus = log.entityId
                                            ? requestStatusMap.get(log.entityId)
                                            : null
                                        const displayStatus = getStatusFromAction(log.action, currentRequestStatus)
                                        const actorRoleClass = roleColor[log.actorRole as string] || roleColor.UNKNOWN

                                        return (
                                            <tr
                                                key={log.id}
                                                className="border-b transition-colors bg-white hover:bg-gray-50/50"
                                            >
                                                <td className="p-4 text-xs text-gray-500 whitespace-nowrap">
                                                    {format(new Date(log.createdAt), "MMM dd HH:mm:ss")}
                                                </td>
                                                <td className="p-4">
                                                    <p className="text-sm font-semibold text-gray-800">
                                                        {log.actor?.name || "Unknown"}
                                                    </p>
                                                    <p className="text-xs text-gray-400">{log.actor?.email || ""}</p>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`text-xs border px-2 py-1 rounded-full font-bold ${actorRoleClass}`}>
                                                        {log.actorRole}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <code className="text-xs bg-gray-50 border border-gray-200 px-2 py-1 rounded font-mono text-gray-700">
                                                        {log.action}
                                                    </code>
                                                </td>
                                                <td className="p-4 max-w-xs">
                                                    <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                                                        {(log as any).details || (
                                                            <span className="text-gray-300 italic">No details</span>
                                                        )}
                                                    </p>
                                                </td>
                                                <td className="p-4">
                                                    <Badge variant={getStatusBadgeVariant(displayStatus)}>
                                                        {displayStatus}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

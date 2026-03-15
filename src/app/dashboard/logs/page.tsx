import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExportPdfButton } from "@/components/ui/ExportPdfButton"
import { db } from "@/lib/db"
import { getAuditLogs } from "@/app/actions/admin"

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

export default async function LogsPage() {
    const logs = await getAuditLogs(150)
    const requestIds = Array.from(new Set(logs.map((log) => log.entityId).filter((id): id is string => Boolean(id))))

    const requestStatuses = requestIds.length > 0
        ? await db.borrowRequest.findMany({
            where: { id: { in: requestIds } },
            select: { id: true, status: true },
        })
        : []

    const requestStatusMap = new Map(requestStatuses.map((request) => [request.id, request.status]))

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">System Audit Logs</h1>
                    <p className="text-sm sm:text-base text-gray-500 mt-2">Track user activity, inventory modifications, and security events.</p>
                </div>
                <ExportPdfButton />
            </div>

            <Card className="shadow-sm border-none bg-white">
                <CardHeader>
                    <CardTitle>Recent Logs</CardTitle>
                    <CardDescription>
                        Displaying the latest 50 security and system events. Accessible only to ADMIN and SUPERADMIN.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm text-left">
                            <thead className="[&_tr]:border-b bg-gray-50/50">
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th className="h-12 px-4 align-middle font-medium text-gray-500">Log ID</th>
                                    <th className="h-12 px-4 align-middle font-medium text-gray-500">Action</th>
                                    <th className="h-12 px-4 align-middle font-medium text-gray-500">User Executing</th>
                                    <th className="h-12 px-4 align-middle font-medium text-gray-500">Target Resource</th>
                                    <th className="h-12 px-4 align-middle font-medium text-gray-500">Status</th>
                                    <th className="h-12 px-4 align-middle font-medium text-gray-500">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {logs.length === 0 ? (
                                    <tr className="border-b transition-colors bg-white">
                                        <td colSpan={6} className="p-8 text-center align-middle text-gray-500 font-medium">
                                            No audit logs available at this time.
                                        </td>
                                    </tr>
                                ) : logs.map((log) => {
                                    const currentRequestStatus = log.entityId ? requestStatusMap.get(log.entityId) : null
                                    const displayStatus = getStatusFromAction(log.action, currentRequestStatus)

                                    return (
                                        <tr key={log.id} className="border-b transition-colors bg-white hover:bg-gray-50/50">
                                            <td className="p-4 text-xs text-gray-500 font-mono">{log.id.slice(0, 8)}...</td>
                                            <td className="p-4 text-sm text-gray-800">{log.action}</td>
                                            <td className="p-4 text-sm text-gray-700">
                                                {log.actor?.name || "Unknown User"}
                                                <div className="text-xs text-gray-500">{log.actor?.email || "No email"}</div>
                                            </td>
                                            <td className="p-4 text-xs text-gray-600 font-mono">{log.entityId || "N/A"}</td>
                                            <td className="p-4">
                                                <Badge variant={getStatusBadgeVariant(displayStatus)}>{displayStatus}</Badge>
                                            </td>
                                            <td className="p-4 text-xs text-gray-600">{new Date(log.createdAt).toLocaleString()}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

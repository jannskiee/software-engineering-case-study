import { Activity, ShieldAlert, Users as UsersIcon, Database } from "lucide-react"
import { getSuperAdminData } from "@/app/actions/superadmin"
import { Card, CardContent } from "@/components/ui/card"
import { format } from "date-fns"

export async function SuperAdminDashboard({ userId }: { userId: string }) {
    const data = await getSuperAdminData()

    return (
        <div className="space-y-6">
            <div className="mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <ShieldAlert className="w-6 h-6 text-red-600" /> Super Admin Root Control
                </h2>
                <p className="text-sm text-gray-500 mt-1">Master operational dashboard. Altering privilege schemas logs transactions permanently.</p>
            </div>

            {/* Top Level Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="shadow-sm border-gray-100">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><UsersIcon className="w-6 h-6" /></div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Total Registered Users</p>
                            <h3 className="text-2xl font-bold">{data.users.length}</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-gray-100">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><Activity className="w-6 h-6" /></div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Active Equipment Borrows</p>
                            <h3 className="text-2xl font-bold">{data.activeRequests}</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-gray-100">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 bg-gray-100 text-gray-600 rounded-lg"><Database className="w-6 h-6" /></div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Recent Audit Logs</p>
                            <h3 className="text-2xl font-bold">{data.auditLogs.length}</h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Audit Logs */}
            <div className="mt-8">
                <CardsHeader title="Master Audit Trail" />
                <Card className="overflow-hidden shadow-sm border-gray-100 mt-4">
                    <CardContent className="p-0">
                        <div className="divide-y divide-gray-100">
                            {data.auditLogs.map((log: any) => (
                                <div key={log.id} className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-start text-sm p-4 bg-white hover:bg-gray-50 transition-colors">
                                    <div className="space-y-1">
                                        <div className="flex gap-2 items-center">
                                            <span className="font-bold text-gray-900 break-words">{log.actor.name || log.actor.email}</span>
                                            <span className="bg-gray-100 text-gray-700 border border-gray-200 px-2 py-0.5 rounded text-[10px] font-mono tracking-wider">
                                                {log.action}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 font-mono">Entity Target: {log.entityId || "SYSTEM"}</p>
                                    </div>
                                    <div className="text-xs text-gray-400 font-medium shrink-0">
                                        {format(new Date(log.createdAt), "MMM dd HH:mm:ss")}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function CardsHeader({ title }: { title: string }) {
    return (
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    )
}

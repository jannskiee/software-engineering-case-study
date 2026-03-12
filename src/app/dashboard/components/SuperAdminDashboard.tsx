import { Activity, ShieldAlert, Users as UsersIcon, Database } from "lucide-react"
import { getSuperAdminData } from "@/app/actions/superadmin"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { RoleSelector } from "./RoleSelector"
import { format } from "date-fns"

export async function SuperAdminDashboard({ userId }: { userId: string }) {
    const data = await getSuperAdminData()

    return (
        <div className="space-y-6">
            <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
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

            <Tabs defaultValue="users" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-xl">
                    <TabsTrigger value="users" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-700">
                        Identity & Access Management
                    </TabsTrigger>
                    <TabsTrigger value="audit" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900">
                        Master Audit Trail
                    </TabsTrigger>
                </TabsList>
                
                <TabsContent value="users" className="mt-6">
                    <Card className="overflow-hidden border-0 shadow-sm ring-1 ring-gray-200">
                        <div className="overflow-x-auto">
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
                                    {data.users.map((u: any) => (
                                        <tr key={u.id} className="bg-white border-b hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {u.name} <br/>
                                                <span className="text-xs text-gray-500 font-normal">{u.email}</span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">{u.schoolId || "-"}</td>
                                            <td className="px-6 py-4 text-gray-500">{format(new Date(u.createdAt), 'PP')}</td>
                                            <td className="px-6 py-4">
                                                <RoleSelector userId={u.id} currentRole={u.role} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </TabsContent>
                
                <TabsContent value="audit" className="mt-6 border-t pt-4">
                    <div className="space-y-3">
                        {data.auditLogs.map((log: any) => (
                            <div key={log.id} className="flex justify-between items-start text-sm p-3 bg-gray-50 border border-gray-100 rounded-lg hover:bg-white transition-colors">
                                <div className="space-y-1">
                                    <div className="flex gap-2 items-center">
                                        <span className="font-bold text-gray-900">{log.actor.name || log.actor.email}</span>
                                        <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-[10px] font-mono tracking-wider">
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
                </TabsContent>
            </Tabs>
        </div>
    )
}

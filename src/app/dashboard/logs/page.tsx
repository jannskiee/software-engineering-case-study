import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExportPdfButton } from "@/components/ui/ExportPdfButton"

// Logs currently empty

export default function LogsPage() {
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
                                <tr className="border-b transition-colors bg-white">
                                    <td colSpan={6} className="p-8 text-center align-middle text-gray-500 font-medium">
                                        No audit logs available at this time.
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

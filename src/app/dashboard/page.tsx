import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, AlertTriangle, CheckCircle, Clock } from "lucide-react"
import { ExportPdfButton } from "@/components/ui/ExportPdfButton"

export default function DashboardPage() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Inventory Overview</h1>
                    <p className="text-gray-500 mt-2">Manage and monitor DLSU-D equipment and supplies.</p>
                </div>
                <ExportPdfButton />
            </div>

            <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-lg border border-dashed border-gray-200 mt-8">
                <Package className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No Inventory Data</h3>
                <p className="text-gray-500 mt-1 max-w-sm text-sm">
                    The inventory system is currently empty. Start by adding new equipment or supplies to see them reflected here.
                </p>
            </div>
        </div>
    )
}

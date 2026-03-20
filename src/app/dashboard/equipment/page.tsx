import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Package, AlertTriangle, CheckCircle2, Wrench, Archive } from "lucide-react"

function getStatusInfo(status: string, availableQty: number, totalQty: number) {
    if (status === "MAINTENANCE") return { label: "Under Maintenance", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Wrench }
    if (status === "RETIRED") return { label: "Retired", color: "bg-gray-100 text-gray-500 border-gray-200", icon: Archive }
    if (availableQty === 0) return { label: "Out of Stock", color: "bg-red-100 text-red-700 border-red-200", icon: AlertTriangle }
    if (availableQty <= Math.ceil(totalQty * 0.2)) return { label: "Low Stock", color: "bg-amber-100 text-amber-700 border-amber-200", icon: AlertTriangle }
    return { label: "Available", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 }
}

export default async function EquipmentPage() {
    const session = await getServerSession(authOptions)
    if (!session?.user) redirect("/login")

    const items = await db.inventoryItem.findMany({
        where: { status: "ACTIVE" },
        orderBy: [{ availableQty: "desc" }, { name: "asc" }],
    })

    const totalItems = items.length
    const totalStock = items.reduce((sum, item) => sum + item.totalQty, 0)
    const totalAvailable = items.reduce((sum, item) => sum + item.availableQty, 0)

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
                    Laboratory Equipment
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Browse available equipment and tools. Quantities update in real-time as items are borrowed and returned.
                </p>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl p-4 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Items</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{totalItems}</p>
                </div>
                <div className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl p-4 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Stock</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{totalStock}</p>
                </div>
                <div className="bg-white/80 backdrop-blur-sm border border-[#004f32]/15 rounded-2xl p-4 shadow-sm">
                    <p className="text-xs font-bold text-[#004f32] uppercase tracking-wider">Available</p>
                    <p className="text-2xl font-bold text-[#004f32] mt-1">{totalAvailable}</p>
                </div>
            </div>

            {/* Equipment Grid */}
            {items.length === 0 ? (
                <div className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm text-center py-16 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                        <Package className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-600">No Equipment Found</h3>
                    <p className="text-sm text-gray-400 mt-1">No active equipment is currently in the system.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((item) => {
                        const statusInfo = getStatusInfo(item.status, item.availableQty, item.totalQty)
                        const StatusIcon = statusInfo.icon
                        const percentage = item.totalQty > 0 ? Math.round((item.availableQty / item.totalQty) * 100) : 0

                        return (
                            <div
                                key={item.id}
                                className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group"
                            >
                                {/* Progress bar at the top */}
                                <div className="h-1.5 bg-gray-100">
                                    <div
                                        className={`h-full transition-all duration-500 rounded-r-full ${
                                            percentage > 50
                                                ? "bg-[#004f32]"
                                                : percentage > 20
                                                ? "bg-amber-500"
                                                : "bg-red-500"
                                        }`}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>

                                <div className="p-4">
                                    {/* Title and Status */}
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <div className="flex items-start gap-3 min-w-0">
                                            <div className="p-2 rounded-xl bg-[#004f32]/8 text-[#004f32] shrink-0">
                                                <Package className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-semibold text-gray-900 truncate text-sm">
                                                    {item.name}
                                                </h3>
                                                {item.description && (
                                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                                        {item.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quantity display */}
                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                                        <div className="flex items-center gap-1.5">
                                            <span className={`text-xs font-bold px-2 py-1 rounded-full border flex items-center gap-1 ${statusInfo.color}`}>
                                                <StatusIcon className="w-3 h-3" />
                                                {statusInfo.label}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-gray-900">
                                                {item.availableQty}
                                                <span className="text-xs text-gray-400 font-normal"> / {item.totalQty}</span>
                                            </p>
                                        </div>
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

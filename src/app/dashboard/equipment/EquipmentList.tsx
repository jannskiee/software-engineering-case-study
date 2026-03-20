"use client"

import { useDeferredValue, useState } from "react"
import { PackageSearch, PackageOpen } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

type EquipmentItem = {
    id: string
    name: string
    description: string | null
    totalQty: number
    availableQty: number
    status: string
}

export function EquipmentList({ items }: { items: EquipmentItem[] }) {
    const [search, setSearch] = useState("")
    const deferredSearch = useDeferredValue(search)
    const filtered = items.filter((i) =>
        i.name.toLowerCase().includes(deferredSearch.toLowerCase()) ||
        (i.description ?? "").toLowerCase().includes(deferredSearch.toLowerCase())
    )

    return (
        <div className="space-y-6">
            {/* Search bar — matches admin InventoryManager */}
            <div className="relative max-w-sm w-full">
                <PackageSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search equipment..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-dlsud-green"
                />
            </div>

            {filtered.length === 0 ? (
                <div className="w-full bg-white border border-gray-100 shadow-sm rounded-xl text-center py-16 flex flex-col items-center justify-center space-y-3">
                    <div className="bg-gray-50 rounded-full p-5">
                        <PackageOpen className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700">No Equipment Found</h3>
                    <p className="max-w-sm mx-auto text-sm text-gray-500">
                        {search ? "No equipment matched your search query." : "The laboratory equipment catalog is currently empty."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((item) => (
                        <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow border-gray-200">
                            {/* Header — name + status badge */}
                            <div className="px-4 py-3 bg-gray-50 border-b flex justify-between items-center">
                                <h4 className="font-semibold text-gray-900 truncate pr-2">{item.name}</h4>
                                <span
                                    className={`text-xs font-bold px-2 py-0.5 rounded shadow-sm border shrink-0 ${
                                        item.status === "ACTIVE"
                                            ? "bg-green-50 text-green-700 border-green-200"
                                            : item.status === "MAINTENANCE"
                                            ? "bg-amber-50 text-amber-700 border-amber-200"
                                            : "bg-gray-100 text-gray-600 border-gray-300"
                                    }`}
                                >
                                    {item.status}
                                </span>
                            </div>

                            <CardContent className="p-4 space-y-3">
                                {/* Description */}
                                <p className="text-sm text-gray-600 line-clamp-2 min-h-[40px]">
                                    {item.description || "No specific description available."}
                                </p>

                                {/* Stats */}
                                <div className="flex items-center gap-4 text-sm pt-2 border-t">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-semibold text-gray-500 uppercase">Available</span>
                                        <span
                                            className={`font-bold text-lg ${
                                                item.availableQty === 0
                                                    ? "text-red-600"
                                                    : item.availableQty <= Math.ceil(item.totalQty * 0.2)
                                                    ? "text-amber-600"
                                                    : "text-gray-900"
                                            }`}
                                        >
                                            {item.availableQty}
                                        </span>
                                    </div>
                                    <div className="flex flex-col pl-4 border-l">
                                        <span className="text-xs font-semibold text-gray-500 uppercase">Total Source</span>
                                        <span className="font-bold text-gray-400 text-lg">{item.totalQty}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}

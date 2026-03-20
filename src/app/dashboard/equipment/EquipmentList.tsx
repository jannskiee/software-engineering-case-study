"use client"

import { useState } from "react"
import { Search } from "lucide-react"

type EquipmentItem = {
    id: string
    name: string
    description: string | null
    totalQty: number
    availableQty: number
    status: string
}

export function EquipmentList({ items }: { items: EquipmentItem[] }) {
    const [query, setQuery] = useState("")

    const filtered = items.filter((item) =>
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        (item.description ?? "").toLowerCase().includes(query.toLowerCase())
    )

    return (
        <div className="space-y-5">
            {/* Search */}
            <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                    type="text"
                    placeholder="Search equipment..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#004f32]/20 focus:border-[#004f32]/40 transition"
                />
            </div>

            {/* Cards */}
            {filtered.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No equipment matches your search.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtered.map((item) => (
                        <div
                            key={item.id}
                            className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col"
                        >
                            {/* Name + Badge */}
                            <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-2">
                                <p className="font-bold text-gray-900 text-sm leading-snug">
                                    {item.name}
                                </p>
                                <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 tracking-wide ${
                                        item.status === "ACTIVE"
                                            ? "text-[#004f32] border-[#004f32]/30 bg-[#004f32]/5"
                                            : item.status === "MAINTENANCE"
                                            ? "text-amber-700 border-amber-300 bg-amber-50"
                                            : "text-gray-500 border-gray-300 bg-gray-50"
                                    }`}
                                >
                                    {item.status}
                                </span>
                            </div>

                            {/* Description */}
                            <p className="px-4 text-xs text-gray-500 pb-3 min-h-[2.5rem] leading-relaxed">
                                {item.description || "No specific description available."}
                            </p>

                            {/* Divider + Stats */}
                            <div className="border-t border-gray-100 mt-auto">
                                <div className="flex divide-x divide-gray-100">
                                    <div className="flex-1 px-4 py-3">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                                            Available
                                        </p>
                                        <p
                                            className={`text-lg font-bold ${
                                                item.availableQty === 0
                                                    ? "text-red-600"
                                                    : item.availableQty <= Math.ceil(item.totalQty * 0.2)
                                                    ? "text-amber-600"
                                                    : "text-gray-900"
                                            }`}
                                        >
                                            {item.availableQty}
                                        </p>
                                    </div>
                                    <div className="flex-1 px-4 py-3">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                                            Total Source
                                        </p>
                                        <p className="text-lg font-bold text-gray-400">
                                            {item.totalQty}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

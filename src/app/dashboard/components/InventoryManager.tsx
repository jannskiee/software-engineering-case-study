"use client"

import { useState } from "react"
import { PlusCircle, PackageSearch, PackageOpen, LayoutGrid, List } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function InventoryManager({ initialItems }: { initialItems: any[] }) {
    const [items, setItems] = useState(initialItems)
    const [search, setSearch] = useState("")
    const [isAdding, setIsAdding] = useState(false)
    const [form, setForm] = useState({ name: "", description: "", totalQty: 1 })
    const [isSaving, setIsSaving] = useState(false)

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const { addInventoryItem } = await import("@/app/actions/inventory")
            const res = await addInventoryItem({
                name: form.name,
                description: form.description,
                totalQty: Number(form.totalQty)
            });
            if (res.success) {
                setItems([...items, res.item].sort((a,b) => a.name.localeCompare(b.name)));
                setIsAdding(false);
                setForm({ name: "", description: "", totalQty: 1 });
            } else {
                alert(`Error: ${res.error}`)
            }
        } catch (e) {
            alert("Network error")
        } finally {
            setIsSaving(false);
        }
    }

    const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
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
                {!isAdding && (
                    <Button onClick={() => setIsAdding(true)} className="w-full sm:w-auto bg-dlsud-green hover:bg-[#003823] text-white flex items-center gap-2 shadow-md">
                        <PlusCircle className="w-4 h-4" /> Add Equipment
                    </Button>
                )}
            </div>

            {isAdding && (
                <Card className="border-dlsud-green/30 shadow-md animate-in slide-in-from-top-4 duration-300">
                    <CardContent className="p-4 sm:p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <PlusCircle className="w-5 h-5 text-dlsud-green" /> Register New Equipment
                        </h3>
                        <form onSubmit={handleAddSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700">Equipment Name *</label>
                                    <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm" placeholder="e.g. Oscilloscope Model X" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700">Total Quantity Initially Available *</label>
                                    <input required type="number" min="1" value={form.totalQty} onChange={e => setForm({...form, totalQty: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-md text-sm" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">Description (Optional)</label>
                                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm" placeholder="Any distinct warnings, specs, or calibration info." rows={2}></textarea>
                            </div>
                            <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-2">
                                <Button type="button" variant="outline" onClick={() => setIsAdding(false)} className="w-full sm:w-auto">Cancel</Button>
                                <Button type="submit" disabled={isSaving} className="w-full sm:w-auto bg-dlsud-green hover:bg-[#003823] text-white">
                                    {isSaving ? "Saving to Database..." : "Publish to Catalog"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {filtered.length === 0 ? (
                 <div className="w-full bg-white border border-gray-100 shadow-sm rounded-xl text-center py-16 flex flex-col items-center justify-center space-y-3">
                 <div className="bg-gray-50 rounded-full p-5">
                     <PackageOpen className="w-10 h-10 text-gray-400" />
                 </div>
                 <h3 className="text-lg font-semibold text-gray-700">No Inventory Found</h3>
                 <p className="max-w-sm mx-auto text-sm text-gray-500">
                     {search ? "No equipment matched your search query." : "The laboratory equipment catalog is currently empty."}
                 </p>
             </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((item: any) => (
                        <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow border-gray-200">
                            <div className="px-4 py-3 bg-gray-50 border-b flex justify-between items-center">
                                <h4 className="font-semibold text-gray-900 truncate pr-2">{item.name}</h4>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded shadow-sm border
                                    ${item.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                                    ${item.status === 'MAINTENANCE' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                                    ${item.status === 'RETIRED' ? 'bg-gray-100 text-gray-600 border-gray-300' : ''}
                                `}>
                                    {item.status}
                                </span>
                            </div>
                            <CardContent className="p-4 space-y-3">
                                <p className="text-sm text-gray-600 line-clamp-2 min-h-[40px]">
                                    {item.description || "No specific description available."}
                                </p>
                                <div className="flex items-center gap-4 text-sm pt-2 border-t">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-semibold text-gray-500 uppercase">Available</span>
                                        <span className="font-bold text-gray-900 text-lg">{item.availableQty}</span>
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

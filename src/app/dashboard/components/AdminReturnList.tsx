"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Package, RotateCcw, AlertTriangle, Loader2, UserCheck, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

function ReturnModal({
    req,
    onConfirm,
    onClose,
    loading,
}: {
    req: any
    onConfirm: (name: string, id: string) => void
    onClose: () => void
    loading: boolean
}) {
    const [name, setName] = useState(req.dispatchedToName || req.studentName || req.student?.name || "")
    const [schoolId, setSchoolId] = useState(req.dispatchedToId || req.studentSchoolId || req.student?.schoolId || "")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim() || !schoolId.trim()) return
        onConfirm(name.trim(), schoolId.trim())
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-amber-100 rounded-lg">
                            <UserCheck className="w-4 h-4 text-amber-700" />
                        </div>
                        <h3 className="font-semibold text-gray-900 text-sm">Confirm Return — Record Returner</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    <p className="text-xs text-gray-500 leading-relaxed bg-amber-50 border border-amber-100 rounded-xl p-3">
                        Enter the full name and school ID of the person physically returning the equipment. This will be permanently recorded in the system logs.
                    </p>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Juan Dela Cruz"
                            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            School ID Number <span className="text-red-500">*</span>
                        </label>
                        <input
                            required
                            value={schoolId}
                            onChange={(e) => setSchoolId(e.target.value)}
                            placeholder="e.g. 2021-80100"
                            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition"
                        />
                    </div>

                    <div className="flex gap-3 pt-1">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-xl" disabled={loading}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || !name.trim() || !schoolId.trim()}
                            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white rounded-xl"
                        >
                            {loading ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                            ) : (
                                "Confirm Return"
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export function AdminReturnList({ initialQueue }: { initialQueue: any[] }) {
    const [queue, setQueue] = useState(initialQueue)
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [returnModalFor, setReturnModalFor] = useState<any | null>(null)

    const handleReturnConfirm = async (name: string, schoolId: string) => {
        if (!returnModalFor) return
        const requestId = returnModalFor.id
        setReturnModalFor(null)
        setProcessingId(requestId)
        try {
            const { returnRequest } = await import("@/app/actions/admin")
            const res = await returnRequest(requestId, name, schoolId)
            if (res.success) {
                setQueue(queue.filter((q) => q.id !== requestId))
            } else {
                alert(`Return Failed: ${res.error}`)
            }
        } catch (error) {
            console.error(error)
            alert("Network error processing return.")
        } finally {
            setProcessingId(null)
        }
    }

    if (queue.length === 0) {
        return (
            <div className="w-full bg-white border border-gray-100 shadow-sm rounded-xl text-center py-12 flex flex-col items-center justify-center space-y-3">
                <div className="bg-gray-50 rounded-full p-4">
                    <RotateCcw className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700">No Pending Returns</h3>
                <p className="max-w-sm mx-auto text-sm text-gray-500">All dispensed equipment has been returned to the lab.</p>
            </div>
        )
    }

    return (
        <>
            {returnModalFor && (
                <ReturnModal
                    req={returnModalFor}
                    onConfirm={handleReturnConfirm}
                    onClose={() => setReturnModalFor(null)}
                    loading={processingId === returnModalFor?.id}
                />
            )}

            <div className="space-y-4">
                {queue.map((req: any) => (
                    <Card key={req.id} className="overflow-hidden shadow-sm border-amber-200 bg-amber-50/30 animate-in fade-in duration-300">
                        <div className="px-4 py-3 border-b flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center bg-white/50">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-bold text-xs shrink-0">
                                    {(req.dispatchedToName || req.studentName || req.student?.name || "?").charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-sm font-semibold text-gray-900 truncate">
                                        {req.dispatchedToName || req.studentName || req.student?.name || "Unknown"}
                                    </h4>
                                    <p className="text-xs text-amber-700 font-medium tracking-wide border border-amber-200 bg-amber-100 rounded px-1.5 py-0.5 w-fit mt-1">
                                        DISPENSED OUT
                                    </p>
                                </div>
                            </div>
                            <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded shadow-sm border w-fit">
                                {format(new Date(req.createdAt), "MMM dd, h:mm a")}
                            </span>
                        </div>

                        <CardContent className="p-4 flex flex-col md:flex-row gap-6">
                            <div className="flex-1 space-y-4">
                                <div>
                                    <h5 className="text-xs font-semibold text-gray-400 tracking-wider uppercase mb-2">Equipment to Return</h5>
                                    <ul className="space-y-1">
                                        {req.items.map((i: any, idx: number) => (
                                            <li key={idx} className="flex justify-between items-center gap-2 text-sm py-1 border-b border-gray-100/50 last:border-0">
                                                <span className="text-gray-700 flex items-center gap-2">
                                                    <Package className="w-4 h-4 text-amber-500 shrink-0" />
                                                    {i.item.name}
                                                </span>
                                                <span className="font-bold text-gray-900 bg-white shadow-sm border px-2 py-0.5 rounded shrink-0">x{i.quantity}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                {req.isGroup && req.groupMembers && req.groupMembers.length > 0 && (
                                    <div className="text-xs text-amber-800 flex items-center gap-2 bg-amber-100/50 w-full p-2 rounded">
                                        <AlertTriangle className="w-4 h-4 shrink-0" />
                                        Group Accountability Active (All {req.groupMembers.length + 1} members are liable)
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-3 justify-center w-full md:w-auto md:min-w-[200px] border-t md:border-t-0 md:border-l border-amber-200/50 pt-4 md:pt-0 md:pl-6">
                                <Button
                                    className="w-full bg-amber-500 hover:bg-amber-600 text-white flex gap-2 shadow-md"
                                    onClick={() => setReturnModalFor(req)}
                                    disabled={processingId !== null}
                                >
                                    {processingId === req.id ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                                    ) : (
                                        <><RotateCcw className="w-4 h-4" /> Process Return</>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </>
    )
}

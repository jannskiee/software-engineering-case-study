"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Package, XCircle, CheckCircle2, Loader2, UserCheck, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

function DispenseModal({
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
    const [name, setName] = useState(req.studentName || req.student?.name || "")
    const [schoolId, setSchoolId] = useState(req.studentSchoolId || req.student?.schoolId || "")

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
                        <div className="p-1.5 bg-[#004f32]/10 rounded-lg">
                            <UserCheck className="w-4 h-4 text-[#004f32]" />
                        </div>
                        <h3 className="font-semibold text-gray-900 text-sm">Confirm Dispense Recipient</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    <p className="text-xs text-gray-500 leading-relaxed bg-gray-50 border border-gray-100 rounded-xl p-3">
                        Enter the full name and school ID of the person physically receiving the equipment. This will be permanently recorded in the system logs.
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
                            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004f32]/20 focus:border-[#004f32]/40 transition"
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
                            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004f32]/20 focus:border-[#004f32]/40 transition"
                        />
                    </div>

                    <div className="flex gap-3 pt-1">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-xl" disabled={loading}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || !name.trim() || !schoolId.trim()}
                            className="flex-1 bg-[#004f32] hover:bg-[#003823] text-white rounded-xl"
                        >
                            {loading ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Dispensing...</>
                            ) : (
                                "Confirm & Dispense"
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export function AdminDispensingList({ initialQueue }: { initialQueue: any[] }) {
    const [queue, setQueue] = useState(initialQueue)
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [processingAction, setProcessingAction] = useState<"dispense" | "reject" | null>(null)
    const [dispenseModalFor, setDispenseModalFor] = useState<any | null>(null)

    const handleDispenseConfirm = async (name: string, schoolId: string) => {
        if (!dispenseModalFor) return
        const requestId = dispenseModalFor.id
        setDispenseModalFor(null)
        setProcessingId(requestId)
        setProcessingAction("dispense")
        try {
            const { dispenseRequest } = await import("@/app/actions/admin")
            const res = await dispenseRequest(requestId, name, schoolId)
            if (res.success) {
                setQueue(queue.filter((q) => q.id !== requestId))
            } else {
                alert(`Dispense Failed: ${res.error}`)
            }
        } catch (error) {
            console.error(error)
            alert("Network error processing dispense.")
        } finally {
            setProcessingId(null)
            setProcessingAction(null)
        }
    }

    const handleReject = async (requestId: string) => {
        if (!confirm("Are you sure you want to reject this approved request?")) return
        setProcessingId(requestId)
        setProcessingAction("reject")
        try {
            const { rejectRequest } = await import("@/app/actions/admin")
            const res = await rejectRequest(requestId, "Admin manual override.")
            if (res.success) {
                setQueue(queue.filter((q) => q.id !== requestId))
            } else {
                alert(`Reject Failed: ${res.error}`)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setProcessingId(null)
            setProcessingAction(null)
        }
    }

    if (queue.length === 0) {
        return (
            <div className="w-full bg-white border border-gray-100 shadow-sm rounded-xl text-center py-12 flex flex-col items-center justify-center space-y-3">
                <div className="bg-green-50 rounded-full p-4">
                    <CheckCircle2 className="w-8 h-8 text-[#004f32]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700">All Caught Up!</h3>
                <p className="max-w-sm mx-auto text-sm text-gray-500">The queue is completely empty. Great job!</p>
            </div>
        )
    }

    return (
        <>
            {dispenseModalFor && (
                <DispenseModal
                    req={dispenseModalFor}
                    onConfirm={handleDispenseConfirm}
                    onClose={() => setDispenseModalFor(null)}
                    loading={processingId === dispenseModalFor?.id && processingAction === "dispense"}
                />
            )}

            <div className="space-y-4">
                {queue.map((req: any) => (
                    <Card key={req.id} className="overflow-hidden shadow-sm border-gray-200 animate-in fade-in duration-300">
                        <div className="px-4 py-3 bg-gray-50 border-b flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
                                    {(req.studentName || req.student?.name || "?").charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-sm font-semibold text-gray-900 truncate">
                                        {req.studentName || req.student?.name || "Unknown"}
                                    </h4>
                                    <p className="text-xs text-gray-500 truncate">
                                        ID: {req.studentSchoolId || req.student?.schoolId || "N/A"}
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
                                    <h5 className="text-xs font-semibold text-gray-400 tracking-wider uppercase mb-1">Destination Room</h5>
                                    <p className="text-sm font-medium text-gray-800">{req.roomNumber}</p>
                                </div>
                                <div>
                                    <h5 className="text-xs font-semibold text-gray-400 tracking-wider uppercase mb-2">Requested Equipment</h5>
                                    <ul className="space-y-1">
                                        {req.items.map((i: any, idx: number) => (
                                            <li key={idx} className="flex justify-between items-center gap-2 text-sm py-1 border-b border-gray-50 last:border-0">
                                                <span className="text-gray-600 flex items-center gap-2">
                                                    <Package className="w-4 h-4 text-gray-400 shrink-0" />
                                                    {i.item.name}
                                                </span>
                                                <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded shrink-0">x{i.quantity}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                {req.professor && (
                                    <div className="text-xs flex items-center gap-1 bg-green-50 text-[#004f32] w-fit px-2 py-1 rounded">
                                        <CheckCircle2 className="w-3 h-3" /> Approved by {req.professor.name}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-3 justify-center w-full md:w-auto md:min-w-[200px] border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                                <Button
                                    className="w-full bg-[#004f32] hover:bg-[#003823] text-white flex gap-2"
                                    onClick={() => setDispenseModalFor(req)}
                                    disabled={processingId !== null}
                                >
                                    {processingId === req.id && processingAction === "dispense" ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Dispensing...</>
                                    ) : (
                                        "Mark as Dispensed"
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                    onClick={() => handleReject(req.id)}
                                    disabled={processingId !== null}
                                >
                                    {processingId === req.id && processingAction === "reject" ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Rejecting...</>
                                    ) : (
                                        <><XCircle className="w-4 h-4 mr-2" /> Reject</>
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

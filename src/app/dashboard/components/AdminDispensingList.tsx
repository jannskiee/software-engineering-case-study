"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Package, XCircle, CheckCircle2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function AdminDispensingList({ initialQueue }: { initialQueue: any[] }) {
    const [queue, setQueue] = useState(initialQueue)
    const [processingId, setProcessingId] = useState<string | null>(null)

    const handleDispense = async (requestId: string) => {
        setProcessingId(requestId)
        try {
            const { dispenseRequest } = await import("@/app/actions/admin")
            const res = await dispenseRequest(requestId)

            if (res.success) {
                setQueue(queue.filter(q => q.id !== requestId))
            } else {
                alert(`Dispense Failed: ${res.error}`)
            }
        } catch (error) {
            console.error(error)
            alert("Network error processing dispense.")
        } finally {
            setProcessingId(null)
        }
    }

    const handleReject = async (requestId: string) => {
        if (!confirm("Are you sure you want to reject this approved request? The student will be notified.")) return

        setProcessingId(requestId)
        try {
            const { rejectRequest } = await import("@/app/actions/admin")
            const res = await rejectRequest(requestId, "Admin manual override.")

            if (res.success) {
                setQueue(queue.filter(q => q.id !== requestId))
            } else {
                alert(`Reject Failed: ${res.error}`)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setProcessingId(null)
        }
    }

    if (queue.length === 0) {
        return (
            <div className="w-full bg-white border border-gray-100 shadow-sm rounded-xl text-center py-12 flex flex-col items-center justify-center space-y-3">
                <div className="bg-green-50 rounded-full p-4">
                    <CheckCircle2 className="w-8 h-8 text-dlsud-green" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700">All Caught Up!</h3>
                <p className="max-w-sm mx-auto text-sm text-gray-500">
                    The queue is completely empty. Great job!
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {queue.map((req: any) => (
                <Card key={req.id} className="overflow-hidden shadow-sm border-gray-200 animate-in fade-in duration-300">
                    <div className="px-4 py-3 bg-gray-50 border-b flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
                                {req.student.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-sm font-semibold text-gray-900 truncate">{req.student.name}</h4>
                                <p className="text-xs text-gray-500 truncate">ID: {req.student.schoolId}</p>
                            </div>
                        </div>
                        <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded shadow-sm border w-fit">
                            {format(new Date(req.createdAt), 'MMM dd, h:mm a')}
                        </span>
                    </div>

                    <CardContent className="p-4 flex flex-col md:flex-row gap-6">
                        <div className="flex-1 space-y-4">
                            <div>
                                <h5 className="text-xs font-semibold text-gray-400 tracking-wider uppercase mb-1">Destination Room</h5>
                                <p className="text-sm font-medium text-gray-800 break-words">{req.roomNumber}</p>
                            </div>

                            <div>
                                <h5 className="text-xs font-semibold text-gray-400 tracking-wider uppercase mb-2">Requested Equipment</h5>
                                <ul className="space-y-1">
                                    {req.items.map((i: any, idx: number) => (
                                        <li key={idx} className="flex justify-between items-center gap-2 text-sm py-1 border-b border-gray-50 last:border-0">
                                            <span className="text-gray-600 flex items-center gap-2 break-words">
                                                <Package className="w-4 h-4 text-gray-400 shrink-0" />
                                                {i.item.name}
                                            </span>
                                            <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded shrink-0">x{i.quantity}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {req.professor && (
                                <div className="text-xs text-gray-500 flex items-center gap-1 bg-green-50 text-dlsud-green w-fit px-2 py-1 rounded">
                                    <CheckCircle2 className="w-3 h-3" /> Approved by {req.professor.name}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-3 justify-center w-full md:w-auto md:min-w-[200px] border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                            <Button
                                className="w-full bg-dlsud-green hover:bg-[#003823] text-white flex gap-2"
                                onClick={() => handleDispense(req.id)}
                                disabled={processingId !== null}
                            >
                                {processingId === req.id ? "Dispensing..." : "Mark as Dispensed"}
                            </Button>

                            <Button
                                variant="outline"
                                className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                onClick={() => handleReject(req.id)}
                                disabled={processingId !== null}
                            >
                                <XCircle className="w-4 h-4 mr-2" /> Reject
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

"use client"

import { useEffect, useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { format } from "date-fns"
import { CheckCircle2, Package, QrCode, Maximize2, X, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cancelBorrowRequest, getActiveRequests } from "@/app/actions/requests"
import { Button } from "@/components/ui/button"
import { createBorrowApprovalQrPayload } from "@/lib/qr-payload"

type RequestItem = {
    quantity: number
    item: { name: string }
}

type BorrowRequest = {
    id: string
    status: string
    createdAt: Date | string
    roomNumber: string
    items: RequestItem[]
}

export function StudentActiveRequestsList({ initialRequests }: { initialRequests: BorrowRequest[] }) {
    const [requests, setRequests] = useState<BorrowRequest[]>(initialRequests)
    const [expandedQr, setExpandedQr] = useState<{ requestId: string; payload: string } | null>(null)
    const [cancellingId, setCancellingId] = useState<string | null>(null)

    // Ultra-short polling to simulate NextJS Realtime Pub/Sub
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const updatedRequests = await getActiveRequests()
                setRequests(updatedRequests as BorrowRequest[])
            } catch (error) {
                console.error("Failed to poll active requests", error)
            }
        }, 3000)

        return () => clearInterval(interval)
    }, [])

    const handleCancelRequest = async (requestId: string) => {
        const confirmed = window.confirm("Cancel this pending borrow request?")
        if (!confirmed) return

        setCancellingId(requestId)
        try {
            const result = await cancelBorrowRequest(requestId)
            if (!result.success) {
                alert(result.error || "Failed to cancel request.")
                return
            }

            setRequests((prev) => prev.filter((request) => request.id !== requestId))
        } catch (error) {
            console.error("Failed to cancel request", error)
            alert("Failed to cancel request.")
        } finally {
            setCancellingId(null)
        }
    }

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {requests.map((req: BorrowRequest) => {
                    const qrPayload = createBorrowApprovalQrPayload(req.id)

                return (
                    <Card key={req.id} className="overflow-hidden shadow-sm border-gray-200">
                        {/* Header Banner */}
                        <div className={`px-4 py-3 text-sm font-medium flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-center text-white ${req.status === 'PENDING' ? 'bg-amber-500' : 'bg-dlsud-green'}`}>
                            <span className="flex items-center gap-2">
                                {req.status === 'PENDING' ? <QrCode className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                                {req.status === 'PENDING' ? 'Awaiting Professor Approval' : 'Approved! Ready for Pickup'}
                            </span>
                            <span className="text-xs opacity-90">{format(new Date(req.createdAt), 'MMM dd, h:mm a')}</span>
                        </div>
                        
                        <CardContent className="p-0 flex flex-col sm:flex-row">
                            {/* Details Pane */}
                            <div className="p-4 flex-1 border-b sm:border-b-0 sm:border-r border-gray-100">
                                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Location</h4>
                                <p className="font-medium text-gray-800 text-sm mb-4 break-words">{req.roomNumber}</p>

                                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Items Requesting</h4>
                                <ul className="space-y-1">
                                    {req.items.map((i, idx) => (
                                        <li key={idx} className="flex justify-between gap-2 text-sm py-1 border-b border-gray-50 last:border-0">
                                            <span className="text-gray-600 break-words">{i.item.name}</span>
                                            <span className="font-bold text-gray-900 shrink-0">x{i.quantity}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* QR / Action Pane */}
                            <div className="p-4 bg-gray-50 flex flex-col items-center justify-center w-full sm:w-auto sm:min-w-[180px] gap-2">
                                {req.status === 'PENDING' ? (
                                    <div className="text-center">
                                        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 inline-block mb-2">
                                            <QRCodeSVG 
                                                value={qrPayload} 
                                                size={120} 
                                                level="H"
                                            />
                                        </div>
                                        <p className="text-[10px] text-gray-500 uppercase font-semibold">Scan to Approve</p>
                                        <div className="mt-3 flex gap-2 justify-center">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8"
                                                onClick={() => setExpandedQr({ requestId: req.id, payload: qrPayload })}
                                            >
                                                <Maximize2 className="w-3.5 h-3.5 mr-1" /> Enlarge
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                                onClick={() => handleCancelRequest(req.id)}
                                                disabled={cancellingId === req.id}
                                            >
                                                {cancellingId === req.id ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : null}
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center opacity-80 flex flex-col items-center">
                                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                                            <Package className="w-8 h-8 text-dlsud-green" />
                                        </div>
                                        <p className="text-xs font-medium text-gray-600">Please claim this</p>
                                        <p className="text-xs font-medium text-gray-600">from the Dispensing Admin</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )
                })}
            </div>

            {expandedQr && (
                <div className="fixed inset-0 z-[70] bg-black/70 p-4 flex items-center justify-center">
                    <div className="w-full max-w-sm bg-white rounded-2xl p-5 text-center relative">
                        <button
                            type="button"
                            onClick={() => setExpandedQr(null)}
                            className="absolute right-3 top-3 p-1 rounded hover:bg-gray-100"
                            aria-label="Close enlarged QR"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <h4 className="text-base font-semibold text-gray-900 mb-1">Request QR</h4>
                        <p className="text-xs text-gray-500 mb-4">Valid for 30 minutes from request creation.</p>
                        <div className="inline-flex p-4 bg-white border rounded-xl shadow-sm">
                            <QRCodeSVG value={expandedQr.payload} size={280} level="H" />
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

"use client"

import { useEffect, useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { format } from "date-fns"
import { CheckCircle2, Package, QrCode } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { getActiveRequests } from "@/app/actions/requests"

type RequestItem = {
    quantity: number;
    item: { name: string };
}

type BorrowRequest = {
    id: string;
    status: string;
    createdAt: Date;
    roomNumber: string;
    items: RequestItem[];
}

export function StudentActiveRequestsList({ initialRequests }: { initialRequests: any[] }) {
    const [requests, setRequests] = useState<BorrowRequest[]>(initialRequests)

    // Ultra-short polling to simulate NextJS Realtime Pub/Sub
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const updatedRequests = await getActiveRequests()
                setRequests(updatedRequests as any)
            } catch (error) {
                console.error("Failed to poll active requests", error)
            }
        }, 3000)

        return () => clearInterval(interval)
    }, [])

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {requests.map((req: BorrowRequest) => {
                
                // Construct the secure payload
                const qrPayload = JSON.stringify({
                    requestId: req.id,
                    timestamp: Date.now()
                });

                return (
                    <Card key={req.id} className="overflow-hidden shadow-sm border-gray-200">
                        {/* Header Banner */}
                        <div className={`px-4 py-3 text-sm font-medium flex justify-between items-center text-white ${req.status === 'PENDING' ? 'bg-amber-500' : 'bg-dlsud-green'}`}>
                            <span className="flex items-center gap-2">
                                {req.status === 'PENDING' ? <QrCode className="w-4 h-4"/> : <CheckCircle2 className="w-4 h-4"/>}
                                {req.status === 'PENDING' ? 'Awaiting Professor Approval' : 'Approved! Ready for Pickup'}
                            </span>
                            <span className="text-xs opacity-90">{format(new Date(req.createdAt), 'MMM dd, h:mm a')}</span>
                        </div>
                        
                        <CardContent className="p-0 flex flex-col sm:flex-row">
                            {/* Details Pane */}
                            <div className="p-4 flex-1 border-b sm:border-b-0 sm:border-r border-gray-100">
                                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Location</h4>
                                <p className="font-medium text-gray-800 text-sm mb-4">{req.roomNumber}</p>

                                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Items Requesting</h4>
                                <ul className="space-y-1">
                                    {req.items.map((i, idx) => (
                                        <li key={idx} className="flex justify-between text-sm py-1 border-b border-gray-50 last:border-0">
                                            <span className="text-gray-600">{i.item.name}</span>
                                            <span className="font-bold text-gray-900">x{i.quantity}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* QR / Action Pane */}
                            <div className="p-4 bg-gray-50 flex flex-col items-center justify-center min-w-[180px]">
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
    )
}

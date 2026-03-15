"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Plus, QrCode, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProfessorQrScanner } from "./ProfessorQrScanner"
import Link from "next/link"
import { getProfessorRequestHistory } from "@/app/actions/requests"
import { format } from "date-fns"

type ProfessorHistoryRequest = {
    id: string
    status: string
    roomNumber: string
    createdAt: Date | string
    studentId: string
    professorId: string | null
    student: { name: string | null; schoolId: string | null }
    items: Array<{ quantity: number; item: { name: string } }>
}

export function ProfessorDashboard({ userId: _userId }: { userId: string }) {
    const [showScanner, setShowScanner] = useState(false)
    const [history, setHistory] = useState<ProfessorHistoryRequest[]>([])

    useEffect(() => {
        const loadHistory = async () => {
            try {
                const data = await getProfessorRequestHistory()
                setHistory(data as ProfessorHistoryRequest[])
            } catch (error) {
                console.error("Failed to load professor history", error)
            }
        }

        void loadHistory()
        const interval = setInterval(() => {
            void loadHistory()
        }, 5000)

        return () => clearInterval(interval)
    }, [])

    const historyBadgeClass = (status: string) => {
        if (status === "PENDING") return "bg-amber-100 text-amber-700 border-amber-200"
        if (status === "APPROVED") return "bg-green-100 text-green-700 border-green-200"
        if (status === "DISPENSED") return "bg-blue-100 text-blue-700 border-blue-200"
        if (status === "RETURNED") return "bg-emerald-100 text-emerald-700 border-emerald-200"
        if (status === "REJECTED") return "bg-red-100 text-red-700 border-red-200"
        return "bg-gray-100 text-gray-700 border-gray-200"
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Professor Desk</h2>
                <div className="flex w-full sm:w-auto gap-2">
                    <Link href="/dashboard/borrow" className="w-full sm:w-auto">
                        <Button className="w-full sm:w-auto bg-dlsud-green hover:bg-dlsud-green/90 text-white flex items-center justify-center gap-2">
                            <Plus className="w-4 h-4" /> New Request
                        </Button>
                    </Link>
                    <Button
                        onClick={() => setShowScanner(!showScanner)}
                        className="w-full sm:w-auto bg-dlsud-green hover:bg-dlsud-green/90 text-white flex items-center justify-center gap-2"
                    >
                        {showScanner ? <X className="w-4 h-4" /> : <QrCode className="w-4 h-4" />}
                        {showScanner ? "Close Scanner" : "Scan QR"}
                    </Button>
                </div>
            </div>

            {showScanner ? (
                <div className="animate-in fade-in zoom-in duration-300">
                    <ProfessorQrScanner />
                </div>
            ) : (
                <Card className="w-full bg-white border border-gray-100 shadow-sm text-center py-12">
                    <CardContent className="flex flex-col items-center justify-center space-y-3 px-4">
                        <div className="bg-gray-50 rounded-full p-4">
                            <QrCode className="w-8 h-8 text-gray-400" />
                        </div>
                        <CardTitle className="text-gray-700">Scanner Ready</CardTitle>
                        <CardDescription className="max-w-sm mx-auto">
                            Toggle the QR Scanner to approve student equipment requests instantly.
                        </CardDescription>
                    </CardContent>
                </Card>
            )}

            <Card className="w-full bg-white border border-gray-100 shadow-sm">
                <CardContent className="p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">My Request / Approval History</h3>

                    {history.length === 0 ? (
                        <p className="text-sm text-gray-500">No request history yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {history.map((req) => {
                                const isMyRequest = req.studentId === _userId
                                const isMyApproval = req.professorId === _userId

                                return (
                                    <div key={req.id} className="rounded-lg border border-gray-200 p-3 sm:p-4">
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="text-sm text-gray-700">
                                                <span className="font-semibold">{isMyRequest ? "Request" : "Approval"}</span>
                                                <span className="text-gray-500"> - Room {req.roomNumber}</span>
                                            </div>
                                            <span className={`text-xs border px-2 py-1 rounded-full font-semibold w-fit ${historyBadgeClass(req.status)}`}>
                                                {req.status}
                                            </span>
                                        </div>

                                        <p className="text-xs text-gray-500 mt-1">
                                            {format(new Date(req.createdAt), "MMM dd, h:mm a")} · Student: {req.student?.name || "Unknown"} ({req.student?.schoolId || "N/A"})
                                        </p>

                                        <div className="mt-2 text-sm text-gray-700">
                                            {req.items.map((i, idx) => (
                                                <div key={`${req.id}-${idx}`} className="flex items-center justify-between border-b border-gray-100 py-1 last:border-0">
                                                    <span>{i.item.name}</span>
                                                    <span className="font-semibold">x{i.quantity}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <p className="text-xs text-gray-500 mt-2">
                                            {isMyRequest && isMyApproval
                                                ? "Created and approved by you"
                                                : isMyRequest
                                                    ? "Created by you"
                                                    : "Approved by you"}
                                        </p>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

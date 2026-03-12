"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { QrCode, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProfessorQrScanner } from "./ProfessorQrScanner"

export function ProfessorDashboard({ userId }: { userId: string }) {
    const [showScanner, setShowScanner] = useState(false)

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Pending Approvals</h2>
                <Button 
                    onClick={() => setShowScanner(!showScanner)}
                    className="bg-dlsud-green hover:bg-dlsud-green/90 text-white flex items-center gap-2"
                >
                    {showScanner ? <X className="w-4 h-4" /> : <QrCode className="w-4 h-4" />}
                    {showScanner ? "Close Scanner" : "Scan QR"}
                </Button>
            </div>

            {showScanner ? (
                <div className="animate-in fade-in zoom-in duration-300">
                    <ProfessorQrScanner />
                </div>
            ) : (
                <Card className="w-full bg-white border border-gray-100 shadow-sm text-center py-12">
                    <CardContent className="flex flex-col items-center justify-center space-y-3">
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
        </div>
    )
}

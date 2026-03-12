"use client"

import { useEffect, useState } from "react"
import { Html5QrcodeScanner } from "html5-qrcode"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, ShieldAlert, XCircle } from "lucide-react"

export function ProfessorQrScanner() {
    const [scanResult, setScanResult] = useState<string | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMsg, setSuccessMsg] = useState<string | null>(null)

    useEffect(() => {
        // Only initialize scanner if we haven't successfully processed one yet to prevent rapid-fire loops
        if (scanResult) return;

        const scanner = new Html5QrcodeScanner(
            "reader", 
            { fps: 10, qrbox: { width: 250, height: 250 }, rememberLastUsedCamera: true }, 
            false
        );

        scanner.render(onScanSuccess, onScanFailure);

        async function onScanSuccess(decodedText: string) {
            scanner.clear();
            setScanResult(decodedText);
            setIsProcessing(true);
            setError(null);

            try {
                const { approveBorrowRequest } = await import("@/app/actions/approve");
                const res = await approveBorrowRequest(decodedText);
                
                if (res.success) {
                    setSuccessMsg(`Successfully Approved Student Request!`);
                } else {
                    setError(res.error);
                }
            } catch (err: any) {
                setError("Hardware / Server disruption while validating QR.");
            } finally {
                setIsProcessing(false);
            }
        }

        function onScanFailure(error: any) {
            // html5-qrcode spam logs scan failures every frame, we ignore them
        }

        return () => {
            scanner.clear().catch(e => console.error("Failed to clear scanner on unmount.", e));
        }
    }, [scanResult])

    const resetScanner = () => {
        setScanResult(null)
        setError(null)
        setSuccessMsg(null)
    }

    return (
        <Card className="w-full max-w-md mx-auto overflow-hidden bg-white mt-6">
            <CardContent className="p-0">
                {!scanResult ? (
                    <div className="flex flex-col">
                        <div id="reader" className="w-full bg-black min-h-[300px]"></div>
                        <div className="p-4 text-center text-sm text-gray-500">
                            Point camera at the Student's PENDING QR curve.
                        </div>
                    </div>
                ) : (
                    <div className="p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
                        {isProcessing ? (
                            <div className="animate-pulse flex flex-col items-center">
                                <ShieldAlert className="w-12 h-12 text-dlsud-gold mb-3" />
                                <h3 className="text-lg font-semibold">Validating Payload TTL...</h3>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center">
                                <XCircle className="w-16 h-16 text-red-500 mb-3" />
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Scan Rejected</h3>
                                <p className="text-red-600 mb-6">{error}</p>
                                <button onClick={resetScanner} className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800">Scan Another</button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <CheckCircle2 className="w-16 h-16 text-dlsud-green mb-3" />
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Authorized!</h3>
                                <p className="text-gray-600 mb-6">{successMsg}</p>
                                <button onClick={resetScanner} className="px-6 py-2 bg-dlsud-green text-white rounded-lg hover:bg-[#003823]">Scan Next Student</button>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

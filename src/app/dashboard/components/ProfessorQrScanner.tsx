"use client"

import { useEffect, useRef, useState } from "react"
import { Html5Qrcode, Html5QrcodeCameraScanConfig } from "html5-qrcode"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, CheckCircle2, ShieldAlert, XCircle } from "lucide-react"

const SCANNER_REGION_ID = "reader"

export function ProfessorQrScanner() {
    const scannerRef = useRef<Html5Qrcode | null>(null)
    const processingRef = useRef(false)
    const unmountedRef = useRef(false)

    const [scanResult, setScanResult] = useState<string | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMsg, setSuccessMsg] = useState<string | null>(null)

    const stopScanner = async () => {
        const scanner = scannerRef.current
        if (!scanner) return

        const stopPromise = (async () => {
            try {
                if (scanner.isScanning) {
                    await scanner.stop()
                }
                await scanner.clear()
            } catch (e) {
                console.error("Failed to stop/clear QR scanner.", e)
            } finally {
                scannerRef.current = null
            }
        })()

        // Some devices can hang on stop/clear; do not block approval flow forever.
        await Promise.race([
            stopPromise,
            new Promise<void>((resolve) => setTimeout(resolve, 2500)),
        ])
    }

    useEffect(() => {
        return () => {
            unmountedRef.current = true
        }
    }, [])

    useEffect(() => {
        if (scanResult) return

        const startScanner = async () => {
            setError(null)

            const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
            if (!window.isSecureContext && !isLocalhost) {
                setError("Camera access requires HTTPS. Open this page over a secure connection.")
                return
            }

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setError("This browser does not support camera access.")
                return
            }

            await stopScanner()

            try {
                const cameras = await Html5Qrcode.getCameras()
                if (!cameras || cameras.length === 0) {
                    setError("No camera detected on this device.")
                    return
                }

                const scanner = new Html5Qrcode(SCANNER_REGION_ID)
                scannerRef.current = scanner

                const rearCamera = cameras.find((camera) => /back|rear|environment/i.test(camera.label))
                const cameraConfig = rearCamera
                    ? { deviceId: { exact: rearCamera.id } }
                    : { facingMode: { ideal: "environment" } }

                const qrConfig: Html5QrcodeCameraScanConfig = {
                    fps: 10,
                    aspectRatio: 1,
                    qrbox: (viewfinderWidth, viewfinderHeight) => {
                        const edge = Math.min(viewfinderWidth, viewfinderHeight, 280)
                        return { width: edge, height: edge }
                    },
                }

                const handleScanSuccess = async (decodedText: string) => {
                    if (processingRef.current) return
                    processingRef.current = true

                    setScanResult(decodedText)
                    setIsProcessing(true)
                    setError(null)

                    try {
                        await stopScanner()

                        const { approveBorrowRequest } = await import("@/app/actions/approve")
                        const timeoutResult = await Promise.race([
                            approveBorrowRequest(decodedText),
                            new Promise<{ success: false; error: string }>((resolve) => {
                                setTimeout(() => {
                                    resolve({
                                        success: false,
                                        error: "Validation timed out. Please check connection and try again.",
                                    })
                                }, 15000)
                            }),
                        ])

                        const res = timeoutResult

                        if (res.success) {
                            setSuccessMsg("Successfully Approved Student Request!")
                        } else {
                            setError(res.error || "Approval failed.")
                        }
                    } catch (err: unknown) {
                        const message = err instanceof Error ? err.message : "Hardware / Server disruption while validating QR."
                        setError(message)
                    } finally {
                        if (!unmountedRef.current) {
                            setIsProcessing(false)
                        }
                    }
                }

                const handleScanFailure = () => {
                    // Ignore per-frame decode misses.
                }

                try {
                    await scanner.start(cameraConfig, qrConfig, handleScanSuccess, handleScanFailure)
                } catch {
                    // Fallback to first detected camera if preferred rear camera cannot start.
                    await scanner.start(cameras[0].id, qrConfig, handleScanSuccess, handleScanFailure)
                }
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : String(e || "Unknown scanner error")
                if (/permission|denied|notallowed/i.test(msg)) {
                    setError("Camera permission was denied. Allow camera access in browser settings and try again.")
                    return
                }
                setError("Unable to initialize camera. Close other apps using the camera and retry.")
            }
        }

        startScanner()

        return () => {
            processingRef.current = false
            void stopScanner()
        }
    }, [scanResult])

    const resetScanner = () => {
        processingRef.current = false
        setScanResult(null)
        setIsProcessing(false)
        setError(null)
        setSuccessMsg(null)
    }

    return (
        <Card className="w-full max-w-md mx-auto overflow-hidden bg-white mt-6">
            <CardContent className="p-0">
                {!scanResult ? (
                    <div className="flex flex-col">
                        <div id={SCANNER_REGION_ID} className="w-full bg-black min-h-[300px]" />
                        {error ? (
                            <div className="p-4 text-center text-sm text-red-600 flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                                <span>{error}</span>
                            </div>
                        ) : (
                            <div className="p-4 text-center text-sm text-gray-500">
                                Point camera at the Student&apos;s pending QR code.
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-6 sm:p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
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

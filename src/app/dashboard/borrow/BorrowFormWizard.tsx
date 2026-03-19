"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { QRCodeSVG } from "qrcode.react"
import { Users, ArrowLeft, ArrowRight, CheckCircle2, Trash2, Clock, Maximize2, X, Loader2, Plus } from "lucide-react"
import { createBorrowApprovalQrPayload } from "@/lib/qr-payload"

type ItemOption = {
    id: string
    name: string
    availableQty: number
}

type GroupMember = {
    name: string
    schoolId: string
}

export function BorrowFormWizard({
    availableItems,
    userRole,
    userName,
    userSchoolId,
}: {
    availableItems: ItemOption[]
    userRole: string
    userName?: string
    userSchoolId?: string
}) {
    const [step, setStep] = useState(1)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [generatedQr, setGeneratedQr] = useState<string | null>(null)
    const [requestStatus, setRequestStatus] = useState<string | null>(null)
    const [showLargeQr, setShowLargeQr] = useState(false)

    // Form State
    const [selectedItems, setSelectedItems] = useState<{ itemId: string; qty: number }[]>([])
    const [roomNumber, setRoomNumber] = useState("")
    const [isGroup, setIsGroup] = useState(false)
    const [groupMembers, setGroupMembers] = useState<GroupMember[]>([{ name: "", schoolId: "" }])

    // Individual identity (student only)
    const [studentName, setStudentName] = useState(userName || "")
    const [studentSchoolId, setStudentSchoolId] = useState(userSchoolId || "")

    const isProfessor = userRole === "PROFESSOR"

    const handleAddItem = (itemId: string) => {
        if (!itemId) return
        if (!selectedItems.find((i) => i.itemId === itemId)) {
            setSelectedItems([...selectedItems, { itemId, qty: 1 }])
        }
    }

    const handleUpdateQty = (itemId: string, qty: number) => {
        const itemObj = availableItems.find((i) => i.id === itemId)
        if (!itemObj) return
        const validQty = Math.max(1, Math.min(qty, itemObj.availableQty))
        setSelectedItems(selectedItems.map((i) => (i.itemId === itemId ? { ...i, qty: validQty } : i)))
    }

    const handleRemoveItem = (itemId: string) => {
        setSelectedItems(selectedItems.filter((i) => i.itemId !== itemId))
    }

    const handleAddMember = () => {
        setGroupMembers([...groupMembers, { name: "", schoolId: "" }])
    }

    const handleRemoveMember = (index: number) => {
        if (groupMembers.length <= 1) return
        setGroupMembers(groupMembers.filter((_, i) => i !== index))
    }

    const handleUpdateMember = (index: number, field: "name" | "schoolId", value: string) => {
        const newMembers = [...groupMembers]
        newMembers[index][field] = value
        setGroupMembers(newMembers)
    }

    // Validation for step 2
    const isStep2Valid = () => {
        if (!roomNumber.trim()) return false
        if (isProfessor) return true
        if (!isGroup) {
            return studentName.trim() !== "" && studentSchoolId.trim() !== ""
        }
        // Group: all members must have name + schoolId
        return groupMembers.every((m) => m.name.trim() !== "" && m.schoolId.trim() !== "")
    }

    const handleSubmit = async () => {
        setIsSubmitting(true)
        try {
            const { submitBorrowRequest } = await import("@/app/actions/borrow")
            const res = await submitBorrowRequest({
                selectedItems,
                roomNumber,
                isGroup,
                groupMembers: isGroup ? groupMembers : [],
                studentName: !isProfessor && !isGroup ? studentName : undefined,
                studentSchoolId: !isProfessor && !isGroup ? studentSchoolId : undefined,
            })

            if (!res.success) {
                alert("Error: " + res.error)
                return
            }

            if (!res.requestId) {
                alert("Error: Request ID was not returned.")
                return
            }

            setRequestStatus(res.status || null)

            if (res.status === "APPROVED" && isProfessor) {
                setGeneratedQr(null)
                setStep(4)
                return
            }

            setGeneratedQr(createBorrowApprovalQrPayload(res.requestId))
            setStep(4)
        } catch (error) {
            console.error("Submission failed", error)
            alert("An unexpected error occurred.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Card className="w-full bg-white/80 backdrop-blur-sm shadow-xl border border-white/60 rounded-2xl overflow-hidden">
            {/* Step Indicators */}
            {step < 4 && (
                <div className="bg-gradient-to-r from-[#004f32]/5 to-[#c8a951]/5 border-b border-gray-100 px-4 sm:px-6 py-4 flex items-center gap-2 sm:gap-6 text-xs sm:text-sm font-medium">
                    {["Equipment", "Details", "Review"].map((label, i) => (
                        <div key={label} className="flex items-center gap-2">
                            <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                    step > i + 1
                                        ? "bg-[#004f32] text-white"
                                        : step === i + 1
                                        ? "bg-[#c8a951] text-white shadow-sm"
                                        : "bg-gray-100 text-gray-400"
                                }`}
                            >
                                {step > i + 1 ? "✓" : i + 1}
                            </div>
                            <span className={step >= i + 1 ? "text-gray-800 font-semibold" : "text-gray-400"}>
                                {label}
                            </span>
                            {i < 2 && <span className="text-gray-300 hidden sm:block">→</span>}
                        </div>
                    ))}
                </div>
            )}

            <CardContent className="p-4 sm:p-6">
                {/* STEP 1: Select Items */}
                {step === 1 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <div className="space-y-3">
                            <Label className="text-sm font-semibold text-gray-700">Add Equipment / Tools</Label>
                            <Select onValueChange={handleAddItem}>
                                <SelectTrigger className="bg-white/70 border-gray-200 focus:border-[#004f32] focus:ring-[#004f32]/20">
                                    <SelectValue placeholder="Select an item to borrow..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableItems.map((item) => (
                                        <SelectItem key={item.id} value={item.id} disabled={item.availableQty <= 0}>
                                            {item.name}{" "}
                                            <span className={item.availableQty <= 0 ? "text-red-400" : "text-gray-400"}>
                                                ({item.availableQty} available)
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedItems.length > 0 && (
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-gray-700">Selected Items</Label>
                                <div className="space-y-2">
                                    {selectedItems.map((selected, idx) => {
                                        const itemDetails = availableItems.find((i) => i.id === selected.itemId)
                                        if (!itemDetails) return null
                                        return (
                                            <div
                                                key={idx}
                                                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-[#004f32]/5 rounded-xl border border-[#004f32]/10"
                                            >
                                                <span className="font-medium text-sm text-gray-800">
                                                    {itemDetails.name}
                                                </span>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-gray-500 font-medium">Qty:</span>
                                                        <Input
                                                            type="number"
                                                            min={1}
                                                            max={itemDetails.availableQty}
                                                            value={selected.qty}
                                                            onChange={(e) =>
                                                                handleUpdateQty(
                                                                    selected.itemId,
                                                                    parseInt(e.target.value) || 1
                                                                )
                                                            }
                                                            className="w-16 h-8 text-center bg-white border-gray-200"
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveItem(selected.itemId)}
                                                        className="text-red-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {availableItems.length === 0 && (
                            <div className="text-center py-8 text-gray-400 text-sm">
                                No items currently available in inventory.
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 2: Details */}
                {step === 2 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-700">
                                Destination Room / Laboratory <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                placeholder="e.g. CL202, Engineering Bldg Room 101"
                                value={roomNumber}
                                onChange={(e) => setRoomNumber(e.target.value)}
                                className="bg-white/70 border-gray-200 focus:border-[#004f32] focus:ring-[#004f32]/20"
                            />
                        </div>

                        {/* Individual identity fields — shown only for non-professor students */}
                        {!isProfessor && !isGroup && (
                            <div className="space-y-4 p-4 bg-[#004f32]/5 rounded-xl border border-[#004f32]/10">
                                <h4 className="text-sm font-semibold text-gray-700">
                                    Your Identity{" "}
                                    <span className="text-xs text-gray-500 font-normal">(required for individual request)</span>
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-600">
                                            Full Name <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            placeholder="Juan Dela Cruz"
                                            value={studentName}
                                            onChange={(e) => setStudentName(e.target.value)}
                                            className="bg-white border-gray-200"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-600">
                                            School ID Number <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            placeholder="202080360"
                                            value={studentSchoolId}
                                            onChange={(e) => setStudentSchoolId(e.target.value)}
                                            className="bg-white border-gray-200"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Group toggle */}
                        {!isProfessor && (
                            <div className="space-y-4 pt-2 border-t border-gray-100">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div>
                                        <Label className="text-sm font-semibold text-gray-700">Group Request?</Label>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Will other students share this equipment?
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant={isGroup ? "default" : "outline"}
                                        className={
                                            isGroup
                                                ? "bg-[#004f32] text-white hover:bg-[#003a25]"
                                                : "border-[#004f32]/30 text-gray-700"
                                        }
                                        onClick={() => setIsGroup(!isGroup)}
                                    >
                                        {isGroup ? "✓ Group Borrow" : "Individual"}
                                    </Button>
                                </div>

                                {isGroup && (
                                    <div className="space-y-3 pt-2">
                                        <Label className="text-sm font-semibold text-gray-700">
                                            Group Members{" "}
                                            <span className="text-xs text-gray-500 font-normal">(all required)</span>
                                        </Label>
                                        {groupMembers.map((member, idx) => (
                                            <div
                                                key={idx}
                                                className="flex flex-col sm:flex-row gap-2 p-3 bg-[#004f32]/5 rounded-xl border border-[#004f32]/10"
                                            >
                                                <div className="flex-1 space-y-1.5">
                                                    <Input
                                                        placeholder={`Member ${idx + 1} Full Name *`}
                                                        value={member.name}
                                                        onChange={(e) => handleUpdateMember(idx, "name", e.target.value)}
                                                        className="bg-white border-gray-200 text-sm"
                                                    />
                                                </div>
                                                <div className="sm:w-1/3 space-y-1.5">
                                                    <Input
                                                        placeholder="School ID *"
                                                        value={member.schoolId}
                                                        onChange={(e) =>
                                                            handleUpdateMember(idx, "schoolId", e.target.value)
                                                        }
                                                        className="bg-white border-gray-200 text-sm"
                                                    />
                                                </div>
                                                {groupMembers.length > 1 && (
                                                    <button
                                                        onClick={() => handleRemoveMember(idx)}
                                                        className="text-red-400 hover:text-red-600 self-center sm:px-2"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleAddMember}
                                            className="w-full border-dashed border-[#004f32]/40 text-[#004f32] hover:bg-[#004f32]/5"
                                        >
                                            <Plus className="w-4 h-4 mr-2" /> Add Group Member
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 3: Review */}
                {step === 3 && (
                    <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                        <div className="bg-gradient-to-r from-[#004f32]/10 to-[#c8a951]/10 text-[#004f32] p-4 rounded-xl border border-[#004f32]/15 text-sm">
                            <p className="font-medium">
                                {isProfessor
                                    ? "Your request will be auto-approved and forwarded to the dispensing desk immediately."
                                    : "Submitting will generate a secure QR code. Your Professor must scan it within 10 minutes to approve."}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-gray-50/80 rounded-xl p-4 space-y-3">
                                <div>
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                        Destination Room
                                    </span>
                                    <p className="font-semibold text-gray-800 mt-1">{roomNumber}</p>
                                </div>

                                {!isProfessor && !isGroup && (
                                    <div className="pt-2 border-t border-gray-200">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                            Requester
                                        </span>
                                        <p className="font-semibold text-gray-800 mt-1">
                                            {studentName}{" "}
                                            <span className="text-gray-500 font-normal text-sm">
                                                ({studentSchoolId})
                                            </span>
                                        </p>
                                    </div>
                                )}

                                <div className="pt-2 border-t border-gray-200">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                        Equipment
                                    </span>
                                    <ul className="space-y-1 mt-1">
                                        {selectedItems.map((selected, idx) => {
                                            const item = availableItems.find((i) => i.id === selected.itemId)
                                            return (
                                                <li
                                                    key={idx}
                                                    className="flex justify-between text-sm py-1 border-b border-gray-100 last:border-0"
                                                >
                                                    <span className="text-gray-700">{item?.name}</span>
                                                    <span className="font-bold text-[#004f32]">×{selected.qty}</span>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                </div>

                                {isGroup && groupMembers.length > 0 && (
                                    <div className="pt-2 border-t border-gray-200">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                            Group Members
                                        </span>
                                        <ul className="text-sm space-y-1 mt-1">
                                            {groupMembers.map((m, i) => (
                                                <li key={i} className="text-gray-700">
                                                    • {m.name}{" "}
                                                    <span className="text-gray-400 font-mono text-xs">({m.schoolId})</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 4: Professor Auto-Approved */}
                {step === 4 && isProfessor && requestStatus === "APPROVED" && (
                    <div className="text-center py-8 animate-in zoom-in duration-500 flex flex-col items-center">
                        <div className="w-20 h-20 rounded-full bg-[#004f32]/10 flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-10 h-10 text-[#004f32]" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Request Auto-Approved</h3>
                        <p className="text-gray-500 mb-6 max-w-sm text-sm">
                            Your request is approved and forwarded to the Admin dispensing desk.
                        </p>
                        <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 px-4 py-2 rounded-full text-sm font-medium">
                            <Clock className="w-4 h-4" /> Proceed to Admin Dispensing Desk
                        </div>
                    </div>
                )}

                {/* STEP 4: Student QR Code */}
                {step === 4 && generatedQr && !isProfessor && (
                    <div className="text-center py-6 animate-in zoom-in duration-500 flex flex-col items-center">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">Request Pending</h3>
                        <p className="text-gray-500 mb-6 max-w-sm text-sm">
                            Show this QR code to your Professor. They must scan it{" "}
                            <span className="font-semibold text-red-500">within 10 minutes</span>.
                        </p>

                        <div className="bg-white p-5 rounded-2xl shadow-lg border-2 border-[#004f32]/20 mb-4 relative">
                            <QRCodeSVG value={generatedQr} size={200} level="H" includeMargin fgColor="#004f32" />
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            className="mb-4 border-[#004f32]/30 text-[#004f32]"
                            onClick={() => setShowLargeQr(true)}
                        >
                            <Maximize2 className="w-4 h-4 mr-2" /> Enlarge QR Code
                        </Button>

                        <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 px-4 py-2 rounded-full text-sm font-medium animate-pulse">
                            <Clock className="w-4 h-4" /> Waiting for Professor to scan...
                        </div>
                    </div>
                )}
            </CardContent>

            {/* Enlarged QR Modal */}
            {showLargeQr && generatedQr && (
                <div className="fixed inset-0 z-[70] bg-black/70 p-4 flex items-center justify-center">
                    <div className="w-full max-w-sm bg-white rounded-2xl p-6 text-center relative shadow-2xl">
                        <button
                            type="button"
                            onClick={() => setShowLargeQr(false)}
                            className="absolute right-3 top-3 p-1.5 rounded-lg hover:bg-gray-100"
                            aria-label="Close enlarged QR"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                        <h4 className="text-base font-bold text-gray-900 mb-1">Approval QR Code</h4>
                        <p className="text-xs text-red-500 font-medium mb-4">⏰ Valid for 10 minutes only</p>
                        <div className="inline-flex p-4 bg-white border-2 border-[#004f32]/20 rounded-2xl shadow-sm">
                            <QRCodeSVG value={generatedQr} size={280} level="H" fgColor="#004f32" />
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation Footer */}
            {step < 4 && (
                <CardFooter className="bg-gray-50/80 px-4 sm:px-6 py-4 flex flex-col-reverse sm:flex-row gap-3 sm:justify-between border-t border-gray-100">
                    <Button
                        variant="ghost"
                        onClick={() => setStep(step - 1)}
                        disabled={step === 1 || isSubmitting}
                        className="w-full sm:w-auto text-gray-500 hover:text-gray-800"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>

                    {step < 3 ? (
                        <Button
                            onClick={() => setStep(step + 1)}
                            disabled={step === 1 ? selectedItems.length === 0 : !isStep2Valid()}
                            className="w-full sm:w-auto bg-[#004f32] hover:bg-[#003a25] text-white"
                        >
                            Next Step <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    ) : (
                        <Button
                            className="w-full sm:w-auto bg-[#c8a951] hover:bg-[#b8993f] text-gray-900 font-semibold shadow-md"
                            onClick={handleSubmit}
                            disabled={isSubmitting || !roomNumber}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    {isProfessor ? "Submitting..." : "Generating QR..."}
                                </>
                            ) : isProfessor ? (
                                "Submit Auto-Approved Request"
                            ) : (
                                "Generate Approval QR"
                            )}
                        </Button>
                    )}
                </CardFooter>
            )}
        </Card>
    )
}

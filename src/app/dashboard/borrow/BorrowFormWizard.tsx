"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { QRCodeSVG } from "qrcode.react"
import { Package, Users, QrCode, ArrowLeft, ArrowRight, CheckCircle2, Trash2, Clock } from "lucide-react"

type ItemOption = {
    id: string;
    name: string;
    availableQty: number;
}

export function BorrowFormWizard({ availableItems, userId, userRole }: { availableItems: ItemOption[], userId: string, userRole: string }) {
    const [step, setStep] = useState(1)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [generatedQr, setGeneratedQr] = useState<string | null>(null)

    // Form State
    const [selectedItems, setSelectedItems] = useState<{itemId: string, qty: number}[]>([])
    const [roomNumber, setRoomNumber] = useState("")
    const [isGroup, setIsGroup] = useState(false)
    const [groupMembers, setGroupMembers] = useState<{name: string, schoolId: string}[]>([])

    const handleAddItem = (itemId: string) => {
        if (!itemId) return;
        if (!selectedItems.find(i => i.itemId === itemId)) {
            setSelectedItems([...selectedItems, { itemId, qty: 1 }])
        }
    }

    const handleUpdateQty = (itemId: string, qty: number) => {
        const itemObj = availableItems.find(i => i.id === itemId);
        if (!itemObj) return;
        
        // Prevent exceeding available stock
        const validQty = Math.max(1, Math.min(qty, itemObj.availableQty));
        setSelectedItems(selectedItems.map(i => i.itemId === itemId ? { ...i, qty: validQty } : i))
    }

    const handleRemoveItem = (itemId: string) => {
        setSelectedItems(selectedItems.filter(i => i.itemId !== itemId))
    }

    const handleAddMember = () => {
        setGroupMembers([...groupMembers, { name: "", schoolId: "" }])
    }

    const handleUpdateMember = (index: number, field: 'name' | 'schoolId', value: string) => {
        const newMembers = [...groupMembers]
        newMembers[index][field] = value
        setGroupMembers(newMembers)
    }

    const handleSubmit = async () => {
        setIsSubmitting(true)
        try {
            const { submitBorrowRequest } = await import("@/app/actions/borrow")
            const res = await submitBorrowRequest({
                selectedItems,
                roomNumber,
                isGroup,
                groupMembers: isGroup ? groupMembers : []
            })
            
            if (!res.success) {
                alert("Error: " + res.error)
                return
            }

            const payload = {
                requestId: res.requestId,
                timestamp: Date.now()
            };
            
            setGeneratedQr(JSON.stringify(payload));
            setStep(4);
        } catch (error) {
            console.error("Submission failed", error)
            alert("An unexpected error occurred.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Card className="w-full bg-white shadow-md border-0">
            {/* Step Indicators */}
            {step < 4 && (
                <div className="bg-gray-50 border-b px-4 sm:px-6 py-4 flex flex-wrap items-center gap-2 sm:justify-between text-xs sm:text-sm font-medium text-gray-400">
                    <span className={step >= 1 ? "text-dlsud-green" : ""}>1. Equipment</span>
                    <span className={step >= 2 ? "text-dlsud-green" : ""}>2. Details</span>
                    <span className={step >= 3 ? "text-dlsud-green" : ""}>3. Review</span>
                </div>
            )}

            <CardContent className="p-4 sm:p-6">
                {/* STEP 1: Select Items */}
                {step === 1 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <div className="space-y-4">
                            <Label>Add Equipment</Label>
                            <Select onValueChange={handleAddItem}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select an item to borrow..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableItems.map(item => (
                                        <SelectItem key={item.id} value={item.id} disabled={item.availableQty <= 0}>
                                            {item.name} ({item.availableQty} available)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedItems.length > 0 && (
                            <div className="space-y-3 mt-6">
                                <Label>Selected Items</Label>
                                {selectedItems.map((selected, idx) => {
                                    const itemDetails = availableItems.find(i => i.id === selected.itemId);
                                    if (!itemDetails) return null;

                                    return (
                                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-gray-50 rounded-lg border">
                                            <span className="font-medium text-sm text-gray-800 break-words">{itemDetails.name}</span>
                                            <div className="flex items-center gap-3 sm:gap-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-500">Qty:</span>
                                                    <Input 
                                                        type="number" 
                                                        min={1} 
                                                        max={itemDetails.availableQty} 
                                                        value={selected.qty}
                                                        onChange={(e) => handleUpdateQty(selected.itemId, parseInt(e.target.value) || 1)}
                                                        className="w-16 h-8 text-center"
                                                    />
                                                </div>
                                                <button onClick={() => handleRemoveItem(selected.itemId)} className="text-red-400 hover:text-red-600 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 2: Details & Room */}
                {step === 2 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <div className="space-y-2">
                            <Label>Destination Room / Laboratory</Label>
                            <Input 
                                placeholder="e.g. CL202, Eng Bld Room 101" 
                                value={roomNumber}
                                onChange={(e) => setRoomNumber(e.target.value)}
                            />
                        </div>

                        <div className="space-y-4 pt-4 border-t">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div>
                                    <Label className="text-base">Group Project?</Label>
                                    <p className="text-sm text-gray-500">Will other students be using this equipment?</p>
                                </div>
                                <Button 
                                    type="button" 
                                    variant={isGroup ? "default" : "outline"}
                                    className={isGroup ? "bg-dlsud-green text-white" : ""}
                                    onClick={() => setIsGroup(!isGroup)}
                                >
                                    {isGroup ? "Yes, Group Borrow" : "No, Individual"}
                                </Button>
                            </div>

                            {isGroup && (
                                <div className="space-y-4 pt-4">
                                    <Label>Group Members</Label>
                                    {groupMembers.map((member, idx) => (
                                        <div key={idx} className="flex flex-col sm:flex-row gap-3">
                                            <Input 
                                                placeholder="Full Name" 
                                                value={member.name}
                                                onChange={(e) => handleUpdateMember(idx, 'name', e.target.value)}
                                                className="flex-1"
                                            />
                                            <Input 
                                                placeholder="School ID" 
                                                value={member.schoolId}
                                                onChange={(e) => handleUpdateMember(idx, 'schoolId', e.target.value)}
                                                className="w-full sm:w-1/3"
                                            />
                                        </div>
                                    ))}
                                    <Button type="button" variant="outline" onClick={handleAddMember} className="w-full border-dashed">
                                        <Users className="w-4 h-4 mr-2" /> Add Group Member
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* STEP 3: Review */}
                {step === 3 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <div className="bg-green-50 text-dlsud-green p-4 rounded-lg flex gap-3 text-sm border border-green-100">
                            <CheckCircle2 className="w-5 h-5 shrink-0" />
                            <p>Please review your request. Submitting this will generate a secure QR code that your Professor must scan to authorize the borrowing of these items.</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Location</h4>
                                <p className="font-medium text-gray-800">{roomNumber || "Not specified"}</p>
                            </div>
                            
                            <div>
                                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Equipment</h4>
                                <ul className="space-y-2">
                                    {selectedItems.map((selected, idx) => {
                                        const item = availableItems.find(i => i.id === selected.itemId);
                                        return (
                                            <li key={idx} className="flex justify-between text-sm py-1 border-b">
                                                <span>{item?.name}</span>
                                                <span className="font-bold">x{selected.qty}</span>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </div>

                            {isGroup && groupMembers.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Accountable Members</h4>
                                    <ul className="text-sm space-y-1">
                                        {groupMembers.map((m, i) => (
                                            <li key={i} className="text-gray-600">• {m.name} ({m.schoolId})</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* STEP 4: Success / QR Display */}
                {step === 4 && generatedQr && (
                    <div className="text-center py-6 animate-in zoom-in duration-500 flex flex-col items-center">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Request Pending</h3>
                        <p className="text-gray-500 mb-8 max-w-sm">
                            Present this QR code to your Professor. Their scanner will digitally sign and approve this request.
                        </p>
                        
                        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border-2 border-dlsud-gold/20 mb-6 relative">
                            <QRCodeSVG 
                                value={generatedQr} 
                                size={180} 
                                level="H"
                                includeMargin={true}
                                fgColor="#004f32" 
                            />
                            {/* Scanning overlay UX */}
                            <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-dlsud-gold border-l-dlsud-gold rounded-2xl opacity-50 
                                            after:content-[''] after:absolute after:bottom-0 after:right-0 after:w-full after:h-full after:border-4 after:border-transparent after:border-b-dlsud-gold after:border-r-dlsud-gold after:rounded-2xl" 
                                 style={{ clipPath: 'polygon(0 0, 20% 0, 20% 100%, 0 100%, 0 0, 100% 0%, 100% 20%, 0 20%, 0 100%, 100% 100%, 100% 80%, 0 80%)' }}>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-full text-sm font-medium animate-pulse">
                            <Clock className="w-4 h-4" /> Wait for Professor to scan...
                        </div>
                    </div>
                )}
            </CardContent>

            {/* Navigation Footer */}
            {step < 4 && (
                <CardFooter className="bg-gray-50 px-4 sm:px-6 py-4 flex flex-col-reverse sm:flex-row gap-3 sm:justify-between rounded-b-xl border-t">
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
                            disabled={selectedItems.length === 0}
                            className="w-full sm:w-auto bg-[#004f32] hover:bg-[#006341] text-white"
                        >
                            Next Step <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    ) : (
                        <Button 
                            className="w-full sm:w-auto bg-dlsud-gold hover:bg-yellow-500 text-gray-900 font-semibold shadow-md"
                            onClick={handleSubmit}
                            disabled={isSubmitting || !roomNumber}
                        >
                            {isSubmitting ? "Generating Secure Payload..." : "Generate Approval QR"}
                        </Button>
                    )}
                </CardFooter>
            )}
        </Card>
    )
}

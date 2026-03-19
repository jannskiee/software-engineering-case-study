"use server"

import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { extractBorrowApprovalRequestId, QR_APPROVAL_TTL_MS } from "@/lib/qr-payload"

export async function approveBorrowRequest(payloadStr: string) {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
        return { success: false, error: "Session expired. Please log in again." }
    }

    const user = session.user as { id?: string; role?: string; name?: string; email?: string }
    const professorId = user.id
    const role = user.role
    const professorName = user.name || user.email || "Unknown Professor"

    if (!professorId || !role) {
        return { success: false, error: "Invalid session. Please sign in again." }
    }

    if (role !== "PROFESSOR" && role !== "SUPERADMIN") {
        return { success: false, error: "Only Professors can approve student requests." }
    }

    const requestId = extractBorrowApprovalRequestId(payloadStr)
    if (!requestId) {
        return { success: false, error: "Invalid QR Code payload. Please ask the student to generate a new request." }
    }

    try {
        const result = await db.$transaction(async (tx) => {
            const request = await tx.borrowRequest.findUnique({
                where: { id: requestId },
                include: {
                    items: { include: { item: true } },
                    student: { select: { name: true, email: true } },
                    groupMembers: true,
                },
            })

            if (!request) throw new Error("Request not found. QR code may be outdated.")
            if (request.status !== "PENDING")
                throw new Error(`Request is already ${request.status}. No action needed.`)

            const ageMs = Date.now() - new Date(request.createdAt).getTime()
            if (ageMs > QR_APPROVAL_TTL_MS) {
                await tx.borrowRequest.update({
                    where: { id: requestId },
                    data: { status: "EXPIRED" },
                })
                await tx.auditLog.create({
                    data: {
                        actorId: professorId,
                        actorRole: role,
                        action: "REQUEST_STATUS_EXPIRED",
                        entityId: requestId,
                        details: `Professor ${professorName} scanned QR for request ID ${requestId.slice(0, 8)} but it had already expired (>10 minutes). Request has been marked EXPIRED.`,
                    },
                })
                throw new Error("QR code has expired (10 minutes limit). Ask the student to submit a new request.")
            }

            // Check stock
            for (const reqItem of request.items) {
                if (!reqItem.item || reqItem.item.availableQty < reqItem.quantity) {
                    throw new Error(`Insufficient stock for ${reqItem.item?.name || "an item"}.`)
                }
            }

            // Deduct stock
            for (const reqItem of request.items) {
                await tx.inventoryItem.update({
                    where: { id: reqItem.itemId },
                    data: { availableQty: { decrement: reqItem.quantity } },
                })
            }

            // Approve
            const updated = await tx.borrowRequest.update({
                where: { id: requestId },
                data: { status: "APPROVED", professorId },
            })

            // Build rich audit details
            const itemsSummary = request.items.map((i) => `${i.item?.name} x${i.quantity}`).join(", ")
            const requesterName = request.studentName || request.student?.name || "Unknown Student"
            const requesterSchoolId = request.studentSchoolId || "N/A"
            let memberInfo = ""
            if (request.isGroup && request.groupMembers.length > 0) {
                memberInfo = ` | Group members: ${request.groupMembers.map((m) => `${m.studentName} (${m.schoolIdNumber})`).join(", ")}`
            }

            await tx.auditLog.create({
                data: {
                    actorId: professorId,
                    actorRole: role,
                    action: "REQUEST_STATUS_APPROVED",
                    entityId: requestId,
                    details: `Professor ${professorName} approved QR request from ${requesterName} (ID: ${requesterSchoolId}). Items: ${itemsSummary}. Room: ${request.roomNumber}${memberInfo}`,
                },
            })

            return updated
        })

        revalidatePath("/dashboard")
        return { success: true, request: result }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Approval failed"
        console.error("Approval Execution Failed:", error)
        return { success: false, error: message }
    }
}

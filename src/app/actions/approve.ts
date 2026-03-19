"use server"

import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { extractBorrowApprovalRequestId, QR_APPROVAL_TTL_MS } from "@/lib/qr-payload"

export async function approveBorrowRequest(payloadStr: string): Promise<{ success: boolean; error?: string }> {
    try {
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
            return { success: false, error: "Invalid QR Code. Please ask the student to generate a new request." }
        }

        // Check if request exists and validate before starting the transaction
        const existing = await db.borrowRequest.findUnique({
            where: { id: requestId },
            include: {
                items: { include: { item: true } },
                groupMembers: true,
            },
        })

        if (!existing) {
            return { success: false, error: "Request not found. The QR code may be outdated." }
        }

        if (existing.status !== "PENDING") {
            return { success: false, error: `Request cannot be approved — it is already ${existing.status}.` }
        }

        // TTL check outside transaction for clarity
        const ageMs = Date.now() - new Date(existing.createdAt).getTime()
        if (ageMs > QR_APPROVAL_TTL_MS) {
            // Mark expired in DB
            await db.borrowRequest.update({
                where: { id: requestId },
                data: { status: "EXPIRED" },
            })
            await db.auditLog.create({
                data: {
                    actorId: professorId,
                    actorRole: role,
                    action: "REQUEST_STATUS_EXPIRED",
                    entityId: requestId,
                    details: `Professor ${professorName} scanned QR for request ${requestId.slice(0, 8)} but it had already expired (>10 min). Marked EXPIRED.`,
                },
            })
            return { success: false, error: "QR code has expired (10-minute limit). Ask the student to submit a new request." }
        }

        // Stock check
        for (const reqItem of existing.items) {
            if (!reqItem.item || reqItem.item.availableQty < reqItem.quantity) {
                return { success: false, error: `Insufficient stock for ${reqItem.item?.name || "an item"}.` }
            }
        }

        // Run the approval transaction
        await db.$transaction(async (tx) => {
            // Deduct stock
            for (const reqItem of existing.items) {
                await tx.inventoryItem.update({
                    where: { id: reqItem.itemId },
                    data: { availableQty: { decrement: reqItem.quantity } },
                })
            }

            // Approve
            await tx.borrowRequest.update({
                where: { id: requestId },
                data: { status: "APPROVED", professorId },
            })

            // Rich audit log
            const itemsSummary = existing.items.map((i) => `${i.item?.name} x${i.quantity}`).join(", ")
            const requesterName = existing.studentName || "Unknown Student"
            const requesterSchoolId = existing.studentSchoolId || "N/A"
            let memberInfo = ""
            if (existing.isGroup && existing.groupMembers.length > 0) {
                memberInfo = ` | Group: ${existing.groupMembers.map((m) => `${m.studentName} (${m.schoolIdNumber})`).join(", ")}`
            }

            await tx.auditLog.create({
                data: {
                    actorId: professorId,
                    actorRole: role,
                    action: "REQUEST_STATUS_APPROVED",
                    entityId: requestId,
                    details: `Professor ${professorName} approved request from ${requesterName} (${requesterSchoolId}). Items: ${itemsSummary}. Room: ${existing.roomNumber}${memberInfo}`,
                },
            })
        })

        revalidatePath("/dashboard")

        // Return ONLY plain serializable data — never return Prisma model objects
        return { success: true }

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Approval failed due to a server error."
        console.error("[approveBorrowRequest] Error:", error)
        return { success: false, error: message }
    }
}

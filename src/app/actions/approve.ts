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

    const user = session.user as { id?: string; role?: string }
    const professorId = user.id
    const role = user.role

    if (!professorId || !role) {
        return { success: false, error: "Invalid session. Please sign in again." }
    }

    if (role !== "PROFESSOR" && role !== "SUPERADMIN") {
        return { success: false, error: "Only Professors can approve requests." }
    }

    const requestId = extractBorrowApprovalRequestId(payloadStr)
    if (!requestId) {
        return { success: false, error: "Invalid QR Code payload." }
    }

    try {
        const result = await db.$transaction(async (tx) => {
            const request = await tx.borrowRequest.findUnique({
                where: { id: requestId },
            })

            if (!request) throw new Error("Request not found.")
            if (request.status !== "PENDING") throw new Error(`Request is already ${request.status}.`)

            const ageMs = Date.now() - new Date(request.createdAt).getTime()
            if (ageMs > QR_APPROVAL_TTL_MS) {
                await tx.borrowRequest.update({
                    where: { id: requestId },
                    data: { status: "EXPIRED" },
                })

                await tx.auditLog.create({
                    data: {
                        actorId: professorId,
                        action: "REQUEST_EXPIRED_ON_QR_SCAN",
                        entityId: requestId,
                    },
                })

                throw new Error("QR code expired (30 minutes). Ask the student to submit a new request.")
            }

            const updated = await tx.borrowRequest.update({
                where: { id: requestId },
                data: {
                    status: "APPROVED",
                    professorId,
                },
            })

            await tx.auditLog.create({
                data: {
                    actorId: professorId,
                    action: "APPROVED_STUDENT_REQUEST",
                    entityId: requestId,
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

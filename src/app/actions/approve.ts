"use server"

import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function approveBorrowRequest(payloadStr: string) {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
        throw new Error("Unauthorized")
    }

    const professorId = (session.user as any).id as string;
    const role = (session.user as any).role as string;

    if (role !== "PROFESSOR" && role !== "SUPERADMIN") {
        throw new Error("Only Professors can approve requests")
    }

    try {
        // Parse the strict JSON payload from the QR code
        const payload = JSON.parse(payloadStr);
        const { requestId, timestamp } = payload;
        
        if (!requestId) {
            throw new Error("Invalid QR Code payload")
        }

        // 60-second TTL Validation to prevent remote screenshot spoofing
        const now = Date.now();
        const ttl = 60 * 1000; // 60 seconds
        if (now - timestamp > ttl) {
            throw new Error("QR Code Expired. Please ask the student to generate a new tight-TTL code.")
        }

        // Execute Approval Transaction
        const result = await db.$transaction(async (tx) => {
            const request = await tx.borrowRequest.findUnique({
                where: { id: requestId }
            })

            if (!request) throw new Error("Request not found.")
            if (request.status !== "PENDING") throw new Error(`Request is already ${request.status}`)

            // Mark as Approved
            const updated = await tx.borrowRequest.update({
                where: { id: requestId },
                data: {
                    status: "APPROVED",
                    professorId: professorId,
                }
            })

            // Generate Audit Log
            await tx.auditLog.create({
                data: {
                    actorId: professorId,
                    action: "APPROVED_STUDENT_REQUEST",
                    entityId: requestId
                }
            })

            return updated
        })

        // Force UI refreshes globally
        revalidatePath("/dashboard")

        return { success: true, request: result }
    } catch (error: any) {
        console.error("Approval Execution Failed:", error);
        return { success: false, error: error.message || "Approval Failed" }
    }
}

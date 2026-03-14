"use server"

import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function getActiveRequests() {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
        throw new Error("Unauthorized")
    }

    const user = session.user as { id?: string }
    const userId = user.id

    if (!userId) {
        throw new Error("Invalid session payload")
    }

    return db.borrowRequest.findMany({
        where: {
            studentId: userId,
            status: { in: ["PENDING", "APPROVED"] }
        },
        include: {
            items: {
                include: { item: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    })
}

export async function cancelBorrowRequest(requestId: string) {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
        throw new Error("Unauthorized")
    }

    const user = session.user as { id?: string }
    const userId = user.id

    if (!userId) {
        throw new Error("Invalid session payload")
    }

    try {
        await db.$transaction(async (tx) => {
            const request = await tx.borrowRequest.findUnique({
                where: { id: requestId },
                select: { id: true, studentId: true, status: true },
            })

            if (!request) {
                throw new Error("Request not found.")
            }

            if (request.studentId !== userId) {
                throw new Error("You can only cancel your own request.")
            }

            if (request.status !== "PENDING") {
                throw new Error("Only pending requests can be cancelled.")
            }

            await tx.borrowRequest.update({
                where: { id: requestId },
                data: { status: "REJECTED" },
            })

            await tx.auditLog.create({
                data: {
                    actorId: userId,
                    action: "STUDENT_CANCELLED_REQUEST",
                    entityId: requestId,
                },
            })
        })

        revalidatePath("/dashboard")
        return { success: true }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to cancel request."
        return { success: false, error: message }
    }
}


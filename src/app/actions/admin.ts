"use server"

import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function getDispensingQueue() {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) throw new Error("Unauthorized")
    
    const role = (session.user as any).role as string;
    if (role !== "ADMIN" && role !== "SUPERADMIN") throw new Error("Unauthorized role")

    return await db.borrowRequest.findMany({
        where: { status: "APPROVED" },
        include: {
            student: { select: { name: true, schoolId: true } },
            professor: { select: { name: true } },
            items: { include: { item: true } },
            groupMembers: true
        },
        orderBy: { updatedAt: "asc" }
    });
}

export async function getReturnQueue() {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) throw new Error("Unauthorized")
    
    const role = (session.user as any).role as string;
    if (role !== "ADMIN" && role !== "SUPERADMIN") throw new Error("Unauthorized role")

    return await db.borrowRequest.findMany({
        where: { status: "DISPENSED" },
        include: {
            student: { select: { name: true, schoolId: true } },
            professor: { select: { name: true } },
            items: { include: { item: true } },
            groupMembers: true
        },
        orderBy: { updatedAt: "asc" }
    });
}

export async function dispenseRequest(requestId: string) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) throw new Error("Unauthorized")
    
    const adminId = (session.user as any).id as string;
    const role = (session.user as any).role as string;
    if (role !== "ADMIN" && role !== "SUPERADMIN") throw new Error("Unauthorized role")

    try {
        const result = await db.$transaction(async (tx) => {
            const request = await tx.borrowRequest.findUnique({
                where: { id: requestId },
                include: { items: true }
            });

            if (!request) throw new Error("Request not found");
            if (request.status !== "APPROVED") throw new Error(`Cannot dispense. Status is ${request.status}`);

            // The ULTRATHINK "Hoarding Concurrency" Edge Case Fix:
            // We ONLY deduct inventory at physical dispensing time. We MUST verify stock right here.
            for (const reqItem of request.items) {
                const stockItem = await tx.inventoryItem.findUnique({ where: { id: reqItem.itemId } })
                if (!stockItem || stockItem.availableQty < reqItem.quantity) {
                    throw new Error(`CRITICAL: Out of Stock for ${stockItem?.name || 'Unknown Item'}. Cannot Dispense.`);
                }
            }

            // Deduct Inventory
            for (const reqItem of request.items) {
                await tx.inventoryItem.update({
                    where: { id: reqItem.itemId },
                    data: { availableQty: { decrement: reqItem.quantity } }
                })
            }

            // Mark as Dispensed
            const updated = await tx.borrowRequest.update({
                where: { id: requestId },
                data: { status: "DISPENSED" }
            });

            // Audit
            await tx.auditLog.create({
                data: {
                    actorId: adminId,
                    action: "DISPENSED_EQUIPMENT",
                    entityId: requestId
                }
            });

            return updated;
        })

        revalidatePath("/dashboard")
        return { success: true, result }
    } catch (error: any) {
        console.error("Dispense Transaction Failed:", error);
        return { success: false, error: error.message || "Dispense Failed" }
    }
}

export async function rejectRequest(requestId: string, reason: string) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) throw new Error("Unauthorized")
    
    const adminId = (session.user as any).id as string;
    const role = (session.user as any).role as string;
    if (role !== "ADMIN" && role !== "SUPERADMIN") throw new Error("Unauthorized")

    try {
        const result = await db.$transaction(async (tx) => {
            const req = await tx.borrowRequest.update({
                where: { id: requestId },
                data: { status: "REJECTED" }
            })
            await tx.auditLog.create({
                data: { actorId: adminId, action: `REJECTED_REQUEST: ${reason}`, entityId: requestId }
            })
            return req
        })
        revalidatePath("/dashboard")
        return { success: true, result }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function returnRequest(requestId: string) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) throw new Error("Unauthorized")
    
    const adminId = (session.user as any).id as string;
    const role = (session.user as any).role as string;
    if (role !== "ADMIN" && role !== "SUPERADMIN") throw new Error("Unauthorized")

    try {
        const result = await db.$transaction(async (tx) => {
            const request = await tx.borrowRequest.findUnique({
                where: { id: requestId }, include: { items: true }
            })
            if (!request || request.status !== "DISPENSED") throw new Error("Invalid request status")

            // Restore Inventory
            for (const reqItem of request.items) {
                await tx.inventoryItem.update({
                    where: { id: reqItem.itemId },
                    data: { availableQty: { increment: reqItem.quantity } }
                })
            }

            const updated = await tx.borrowRequest.update({
                where: { id: requestId }, data: { status: "RETURNED" }
            })

            await tx.auditLog.create({
                data: { actorId: adminId, action: "PROCESSED_RETURN", entityId: requestId }
            })
            return updated
        })
        revalidatePath("/dashboard")
        return { success: true, result }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

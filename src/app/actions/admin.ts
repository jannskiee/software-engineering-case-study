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

            // Mark as Dispensed
            const updated = await tx.borrowRequest.update({
                where: { id: requestId },
                data: { status: "DISPENSED" }
            });

            // Audit
            await tx.auditLog.create({
                data: {
                    actorId: adminId,
                    action: "REQUEST_STATUS_DISPENSED",
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
            const existing = await tx.borrowRequest.findUnique({
                where: { id: requestId },
                include: { items: true },
            })

            if (!existing) {
                throw new Error("Request not found")
            }

            if (!["PENDING", "APPROVED"].includes(existing.status)) {
                throw new Error(`Cannot reject request in ${existing.status} status`)
            }

            if (existing.status === "APPROVED") {
                // Approved requests already reserve stock; releasing on rejection prevents inventory drift.
                for (const reqItem of existing.items) {
                    await tx.inventoryItem.update({
                        where: { id: reqItem.itemId },
                        data: { availableQty: { increment: reqItem.quantity } },
                    })
                }
            }

            const req = await tx.borrowRequest.update({
                where: { id: requestId },
                data: { status: "REJECTED" }
            })
            await tx.auditLog.create({
                data: { actorId: adminId, action: `REQUEST_STATUS_REJECTED: ${reason}`, entityId: requestId }
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
                data: { actorId: adminId, action: "REQUEST_STATUS_RETURNED", entityId: requestId }
            })
            return updated
        })
        revalidatePath("/dashboard")
        return { success: true, result }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function getAuditLogs(limit = 100) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) throw new Error("Unauthorized")

    const role = (session.user as any).role as string
    if (role !== "ADMIN" && role !== "SUPERADMIN") throw new Error("Unauthorized role")

    return db.auditLog.findMany({
        take: Math.min(Math.max(limit, 1), 300),
        include: {
            actor: {
                select: { name: true, email: true, role: true },
            },
        },
        orderBy: { createdAt: "desc" },
    })
}


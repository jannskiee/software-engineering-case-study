"use server"

import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function getInventoryItems() {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) throw new Error("Unauthorized")

    return await db.inventoryItem.findMany({
        orderBy: { name: "asc" }
    })
}

export async function addInventoryItem(data: { name: string, description: string, totalQty: number }) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) throw new Error("Unauthorized")
    
    const role = (session.user as any).role as string;
    if (role !== "ADMIN" && role !== "SUPERADMIN") throw new Error("Unauthorized role")

    try {
        const item = await db.$transaction(async (tx) => {
            const newItem = await tx.inventoryItem.create({
                data: {
                    name: data.name,
                    description: data.description,
                    totalQty: data.totalQty,
                    availableQty: data.totalQty, // newly added items are fully available
                    status: "ACTIVE"
                }
            })

            await tx.auditLog.create({
                data: {
                    actorId: (session.user as any).id,
                    action: `ADDED_INVENTORY_ITEM: ${data.name} (Qty: ${data.totalQty})`,
                    entityId: newItem.id
                }
            })

            return newItem;
        })

        revalidatePath("/dashboard")
        return { success: true, item }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function updateInventoryItem(data: { id: string, name: string, description: string, totalQty: number, availableQty: number, status: any }) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) throw new Error("Unauthorized")
    
    const role = (session.user as any).role as string;
    if (role !== "ADMIN" && role !== "SUPERADMIN") throw new Error("Unauthorized role")

    try {
        const updated = await db.$transaction(async (tx) => {
            const item = await tx.inventoryItem.update({
                where: { id: data.id },
                data: {
                    name: data.name,
                    description: data.description,
                    totalQty: data.totalQty,
                    availableQty: data.availableQty,
                    status: data.status
                }
            })

            await tx.auditLog.create({
                data: {
                    actorId: (session.user as any).id,
                    action: `UPDATED_INVENTORY_ITEM: ${data.name}`,
                    entityId: item.id
                }
            })

            return item;
        })

        revalidatePath("/dashboard")
        return { success: true, item: updated }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

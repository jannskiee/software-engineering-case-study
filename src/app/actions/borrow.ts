"use server"

import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"

type BorrowInput = {
    selectedItems: { itemId: string, qty: number }[];
    roomNumber: string;
    isGroup: boolean;
    groupMembers: { name: string, schoolId: string }[];
}

export async function submitBorrowRequest(data: BorrowInput) {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
        throw new Error("Unauthorized")
    }

    const userId = (session.user as any).id as string;
    const role = (session.user as any).role as string;

    if (role !== "STUDENT" && role !== "PROFESSOR") {
        throw new Error("Unauthorized role for borrowing")
    }

    // Input validation
    if (!data.roomNumber || data.selectedItems.length === 0) {
        throw new Error("Missing required fields")
    }

    if (data.isGroup && data.groupMembers.length === 0) {
        throw new Error("Group borrows require at least one member")
    }

    // -----------------------------------------------------------------------------------
    // ULTRATHINK: Group Accountability Auto-Account Freezing
    // Any student (Primary or Group Member) who currently possesses unreturned equipment
    // (has a DISPENSED record) is frozen from initiating or joining any new request.
    // -----------------------------------------------------------------------------------
    const userProfile = await db.user.findUnique({ where: { id: userId } });
    const userSchoolId = (userProfile as any)?.schoolId;

    const allInvolvedSchoolIds = [userSchoolId, ...data.groupMembers.map(m => m.schoolId)].filter(Boolean) as string[];

    const activeLiabilities = await db.borrowRequest.findMany({
        where: {
            status: "DISPENSED",
            OR: [
                { studentId: userId },
                { student: { schoolId: { in: allInvolvedSchoolIds } } },
                { groupMembers: { some: { schoolIdNumber: { in: allInvolvedSchoolIds } } } }
            ]
        },
        include: { student: true, groupMembers: true }
    });

    if (activeLiabilities.length > 0) {
        throw new Error("ACCOUNT LIABILITY FREEZE: You or a group member currently possess unreturned laboratory equipment. Your privilege to request new items is temporarily frozen until all prior physical liabilities are returned to the Admin desk.");
    }

    try {
        // Execute as a Prisma transaction to ensure all relations are created atomically
        const result = await db.$transaction(async (tx) => {
            // 1. Verify all items have enough stock (double-check server side)
            for (const item of data.selectedItems) {
                const dbItem = await tx.inventoryItem.findUnique({
                    where: { id: item.itemId }
                })

                if (!dbItem || dbItem.availableQty < item.qty) {
                    throw new Error(`Item ${dbItem?.name || item.itemId} does not have enough stock.`)
                }
            }

            // 2. Create the unified Borrow Request
            const borrowRequest = await tx.borrowRequest.create({
                data: {
                    studentId: userId,
                    roomNumber: data.roomNumber,
                    status: "PENDING",
                    isGroup: data.isGroup,
                    
                    // Conditionally auto-approve if the initiator is a PROFESSOR
                    ...(role === "PROFESSOR" ? { status: "APPROVED", professorId: userId } : {}),

                    // Relational Creates
                    items: {
                        create: data.selectedItems.map(item => ({
                            itemId: item.itemId,
                            quantity: item.qty
                        }))
                    },
                    groupMembers: data.isGroup ? {
                        create: data.groupMembers.map(member => ({
                            studentName: member.name,
                            schoolIdNumber: member.schoolId
                        }))
                    } : undefined
                }
            })

            if (borrowRequest.status === "APPROVED") {
                // Professor-created requests are auto-approved, so reserve stock immediately.
                for (const selectedItem of data.selectedItems) {
                    await tx.inventoryItem.update({
                        where: { id: selectedItem.itemId },
                        data: { availableQty: { decrement: selectedItem.qty } }
                    })
                }
            }

            // 3. Generate an Audit Log
            await tx.auditLog.create({
                data: {
                    actorId: userId,
                    action: role === "PROFESSOR" ? "REQUEST_CREATED_AUTO_APPROVED" : "REQUEST_CREATED_PENDING",
                    entityId: borrowRequest.id
                }
            })

            return borrowRequest;
        })

        // Force a UI refresh on dashboards
        revalidatePath("/dashboard")

        return { success: true, requestId: result.id, status: result.status }

    } catch (error: any) {
        console.error("Borrow Request Transaction Failed:", error)
        return { success: false, error: error.message || "Failed to submit request." }
    }
}

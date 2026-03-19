"use server"

import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"

type BorrowInput = {
    selectedItems: { itemId: string; qty: number }[]
    roomNumber: string
    isGroup: boolean
    groupMembers: { name: string; schoolId: string }[]
    studentName?: string      // Provided by individual student on the form
    studentSchoolId?: string  // Provided by individual student on the form
}

export async function submitBorrowRequest(data: BorrowInput) {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
        throw new Error("Unauthorized")
    }

    const userId = (session.user as any).id as string
    const role = (session.user as any).role as string
    const userName = (session.user as any).name || session.user.email || "Unknown"

    if (role !== "STUDENT" && role !== "PROFESSOR") {
        throw new Error("Unauthorized role for borrowing")
    }

    if (!data.roomNumber || data.selectedItems.length === 0) {
        throw new Error("Missing required fields")
    }

    if (data.isGroup && data.groupMembers.length === 0) {
        throw new Error("Group borrows require at least one member")
    }

    // Validate individual request identity fields for students
    if (role === "STUDENT" && !data.isGroup) {
        if (!data.studentName || !data.studentSchoolId) {
            throw new Error("Name and School ID are required for individual requests")
        }
    }

    // Validate group member fields are complete
    if (data.isGroup) {
        for (const member of data.groupMembers) {
            if (!member.name.trim() || !member.schoolId.trim()) {
                throw new Error("All group members must have a name and school ID")
            }
        }
    }

    // Account Freeze: Block if user or any group member has unreturned equipment
    const userProfile = await db.user.findUnique({ where: { id: userId } })
    const userSchoolId = data.studentSchoolId || (userProfile as any)?.schoolId

    const allInvolvedSchoolIds = [
        userSchoolId,
        ...data.groupMembers.map((m) => m.schoolId),
    ].filter(Boolean) as string[]

    const activeLiabilities = await db.borrowRequest.findMany({
        where: {
            status: "DISPENSED",
            OR: [
                { studentId: userId },
                { student: { schoolId: { in: allInvolvedSchoolIds } } },
                { groupMembers: { some: { schoolIdNumber: { in: allInvolvedSchoolIds } } } },
            ],
        },
        include: { student: true, groupMembers: true },
    })

    if (activeLiabilities.length > 0) {
        throw new Error(
            "ACCOUNT LIABILITY FREEZE: You or a group member currently possess unreturned laboratory equipment. Your privilege to request new items is temporarily frozen until all prior physical liabilities are returned to the Admin desk."
        )
    }

    try {
        const result = await db.$transaction(async (tx) => {
            // 1. Verify stock availability
            const itemDetails: { name: string; qty: number }[] = []
            for (const item of data.selectedItems) {
                const dbItem = await tx.inventoryItem.findUnique({ where: { id: item.itemId } })
                if (!dbItem || dbItem.availableQty < item.qty) {
                    throw new Error(`Item ${dbItem?.name || item.itemId} does not have enough stock.`)
                }
                itemDetails.push({ name: dbItem.name, qty: item.qty })
            }

            // 2. Create the Borrow Request
            const borrowRequest = await tx.borrowRequest.create({
                data: {
                    studentId: userId,
                    roomNumber: data.roomNumber,
                    status: "PENDING",
                    isGroup: data.isGroup,
                    studentName: role === "PROFESSOR" ? userName : (data.studentName || userName),
                    studentSchoolId: role === "PROFESSOR" ? null : (data.studentSchoolId || null),

                    ...(role === "PROFESSOR" ? { status: "APPROVED", professorId: userId } : {}),

                    items: {
                        create: data.selectedItems.map((item) => ({
                            itemId: item.itemId,
                            quantity: item.qty,
                        })),
                    },
                    groupMembers: data.isGroup
                        ? {
                              create: data.groupMembers.map((member) => ({
                                  studentName: member.name,
                                  schoolIdNumber: member.schoolId,
                              })),
                          }
                        : undefined,
                },
            })

            // 3. Reserve stock for professor auto-approved requests
            if (borrowRequest.status === "APPROVED") {
                for (const selectedItem of data.selectedItems) {
                    await tx.inventoryItem.update({
                        where: { id: selectedItem.itemId },
                        data: { availableQty: { decrement: selectedItem.qty } },
                    })
                }
            }

            // 4. Build rich audit details
            const itemsSummary = itemDetails.map((i) => `${i.name} x${i.qty}`).join(", ")
            let details: string
            if (role === "PROFESSOR") {
                details = `Professor ${userName} submitted a self-request for: ${itemsSummary}. Destination: Room ${data.roomNumber}. Auto-approved.`
            } else if (data.isGroup) {
                const memberNames = data.groupMembers.map((m) => `${m.name} (${m.schoolId})`).join(", ")
                details = `Student ${data.studentName || userName} (${data.studentSchoolId || "N/A"}) submitted a GROUP request for: ${itemsSummary}. Destination: Room ${data.roomNumber}. Group members: ${memberNames}`
            } else {
                details = `Student ${data.studentName || userName} (${data.studentSchoolId || "N/A"}) submitted an INDIVIDUAL request for: ${itemsSummary}. Destination: Room ${data.roomNumber}.`
            }

            // 5. Create audit log
            await tx.auditLog.create({
                data: {
                    actorId: userId,
                    actorRole: role,
                    action: role === "PROFESSOR" ? "REQUEST_CREATED_AUTO_APPROVED" : "REQUEST_CREATED_PENDING",
                    entityId: borrowRequest.id,
                    details,
                },
            })

            return borrowRequest
        })

        revalidatePath("/dashboard")
        return { success: true, requestId: result.id, status: result.status }
    } catch (error: any) {
        console.error("Borrow Request Transaction Failed:", error)
        return { success: false, error: error.message || "Failed to submit request." }
    }
}

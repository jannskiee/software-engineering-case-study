"use server"

import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function getSuperAdminData() {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) throw new Error("Unauthorized")
    
    const role = (session.user as any).role as string;
    if (role !== "SUPERADMIN") throw new Error("Unauthorized: SuperAdmin access strictly required.")

    const [users, auditLogs, activeRequests] = await Promise.all([
        db.user.findMany({
            select: { id: true, name: true, email: true, role: true, schoolId: true, createdAt: true },
            orderBy: { createdAt: "desc" }
        }),
        db.auditLog.findMany({
            take: 100,
            include: { actor: { select: { name: true, email: true } } },
            orderBy: { createdAt: "desc" }
        }),
        db.borrowRequest.count({
            where: { status: { in: ["PENDING", "APPROVED", "DISPENSED"] } }
        })
    ]);

    return { users, auditLogs, activeRequests }
}

export async function updateUserRole(targetUserId: string, newRole: string) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) throw new Error("Unauthorized")
    
    const superAdminId = (session.user as any).id as string;
    const currentRole = (session.user as any).role as string;
    
    if (currentRole !== "SUPERADMIN") {
        throw new Error("Only SuperAdmins can mutate user privilege schemas.")
    }

    try {
        const result = await db.$transaction(async (tx) => {
            const updated = await tx.user.update({
                where: { id: targetUserId },
                data: { role: newRole }
            });

            await tx.auditLog.create({
                data: {
                    actorId: superAdminId,
                    action: `CHANGED_USER_ROLE_TO_${newRole}`,
                    entityId: targetUserId
                }
            })
            
            return updated;
        })

        revalidatePath("/dashboard")
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

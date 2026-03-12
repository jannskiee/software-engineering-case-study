"use server"

import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function getActiveRequests() {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
        throw new Error("Unauthorized")
    }

    const userId = (session.user as any).id as string;

    const activeRequests = await db.borrowRequest.findMany({
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
    });

    return activeRequests;
}

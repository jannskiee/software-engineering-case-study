import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET() {
    // Note: In a real Vercel production deployment, you would secure this endpoint 
    // using the CRON_SECRET header to ensure only Vercel can trigger it.
    try {
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)

        // Find abandoned requests that were never picked up by Admin or approved
        const expiredRequests = await db.borrowRequest.updateMany({
            where: {
                status: {
                    in: ["PENDING", "APPROVED"]
                },
                createdAt: {
                    lt: thirtyMinutesAgo
                }
            },
            data: {
                status: "EXPIRED"
            }
        });

        return NextResponse.json({
            success: true,
            message: `Cron executed successfully. Swept ${expiredRequests.count} expired requests.`
        })
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Cron sweep failed"
        console.error("Cron Sweep Failed:", error)
        return NextResponse.json({ success: false, error: message }, { status: 500 })
    }
}

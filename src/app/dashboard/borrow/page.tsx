import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { BorrowFormWizard } from "./BorrowFormWizard"

export default async function BorrowPage() {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
        redirect("/login")
    }

    const role = (session.user as any).role as string;
    
    if (role !== "STUDENT" && role !== "PROFESSOR") {
        redirect("/dashboard")
    }

    // Fetch only items that are ACTIVE and have quantity available
    const availableItems = await db.inventoryItem.findMany({
        where: {
            status: "ACTIVE",
            availableQty: { gt: 0 }
        },
        select: {
            id: true,
            name: true,
            availableQty: true
        }
    })

    return (
        <div className="animate-in fade-in duration-500 w-full max-w-3xl mx-auto mt-4">
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-dlsud-green">New Borrow Request</h1>
                <p className="text-gray-500 mt-1 text-sm">Fill out the form to generate your digital approval QR code.</p>
            </div>

            <BorrowFormWizard availableItems={availableItems} userId={(session.user as any).id} userRole={role} />
        </div>
    )
}

import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { InventoryManager } from "../components/InventoryManager"

export const dynamic = 'force-dynamic'

export default async function InventoryPage() {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
        redirect("/login")
    }

    const role = (session.user as any).role as string;
    if (role !== "ADMIN" && role !== "SUPERADMIN") {
        redirect("/dashboard")
    }

    const items = await db.inventoryItem.findMany({
        orderBy: { name: "asc" }
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Laboratory Inventory</h1>
                <p className="text-sm sm:text-base text-gray-500 mt-2">Manage tools, equipment, and components available for student dispensing.</p>
            </div>
            
            <InventoryManager initialItems={items} />
        </div>
    )
}

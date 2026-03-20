import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { EquipmentList } from "./EquipmentList"

export default async function EquipmentPage() {
    const session = await getServerSession(authOptions)
    if (!session?.user) redirect("/login")

    const items = await db.inventoryItem.findMany({
        where: { status: { not: "RETIRED" } },
        orderBy: [{ availableQty: "desc" }, { name: "asc" }],
        select: {
            id: true,
            name: true,
            description: true,
            totalQty: true,
            availableQty: true,
            status: true,
        },
    })

    return (
        <div className="space-y-2 animate-in fade-in duration-500">
            <div className="mb-5">
                <h1 className="text-2xl font-bold text-gray-900">Laboratory Inventory</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                    Manage tools, equipment, and components available for student dispensing.
                </p>
            </div>

            <EquipmentList items={items} />
        </div>
    )
}

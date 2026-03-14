import { db } from "@/lib/db"
import { Package, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { StudentActiveRequestsList } from "./StudentActiveRequestsList"

export async function StudentDashboard({ userId }: { userId: string }) {
    // Fetch user's active requests straight from DB
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

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800">My Active Requests</h2>
                <Link href="/dashboard/borrow" className="w-full sm:w-auto">
                    <Button className="w-full bg-dlsud-green hover:bg-dlsud-green/90 text-white flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        New Request
                    </Button>
                </Link>
            </div>

            {activeRequests.length === 0 ? (
                <div className="w-full bg-white border border-gray-100 shadow-sm rounded-xl text-center py-12 flex flex-col items-center justify-center space-y-3">
                    <div className="bg-gray-50 rounded-full p-4">
                        <Package className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700">No Active Borrows</h3>
                    <p className="max-w-sm mx-auto text-gray-500 text-sm px-4 sm:px-0">
                        You currently don&apos;t have any pending or active equipment requests. Click the button above to start a new borrow form.
                    </p>
                </div>
            ) : (
                <StudentActiveRequestsList initialRequests={activeRequests} />
            )}
        </div>
    )
}

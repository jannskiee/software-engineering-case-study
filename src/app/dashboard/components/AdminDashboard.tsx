import { Inbox } from "lucide-react"
import { getDispensingQueue, getReturnQueue } from "@/app/actions/admin"
import { AdminDispensingList } from "./AdminDispensingList"
import { AdminReturnList } from "./AdminReturnList"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export async function AdminDashboard({ userId }: { userId: string }) {
    const dispensingQueue = await getDispensingQueue()
    const returnQueue = await getReturnQueue()

    return (
        <div className="space-y-6">
            <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Admin Operations Desk</h2>
                <p className="text-sm text-gray-500 mt-1">Manage physical equipment hand-offs and returns.</p>
            </div>

            <Tabs defaultValue="dispense" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-xl">
                    <TabsTrigger value="dispense" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-dlsud-green">
                        Dispensing Queue ({dispensingQueue.length})
                    </TabsTrigger>
                    <TabsTrigger value="return" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-amber-600">
                        Pending Returns ({returnQueue.length})
                    </TabsTrigger>
                </TabsList>
                
                <TabsContent value="dispense" className="mt-6">
                    <AdminDispensingList initialQueue={dispensingQueue} />
                </TabsContent>
                
                <TabsContent value="return" className="mt-6">
                    <AdminReturnList initialQueue={returnQueue} />
                </TabsContent>
            </Tabs>
        </div>
    )
}

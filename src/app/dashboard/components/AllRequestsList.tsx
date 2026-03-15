import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

type RequestRow = {
    id: string
    status: string
    roomNumber: string
    isGroup: boolean
    createdAt: Date | string
    updatedAt: Date | string
    student: { name: string | null; schoolId: string | null }
    professor: { name: string | null } | null
    items: Array<{ quantity: number; item: { name: string } }>
    groupMembers: Array<{ id: string }>
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
    if (status === "APPROVED" || status === "RETURNED") return "default"
    if (status === "PENDING" || status === "DISPENSED") return "secondary"
    if (status === "REJECTED" || status === "EXPIRED") return "destructive"
    return "outline"
}

export function AllRequestsList({ requests }: { requests: RequestRow[] }) {
    if (requests.length === 0) {
        return (
            <Card className="shadow-sm border-gray-100">
                <CardContent className="p-8 text-center text-sm text-gray-500">
                    No requests found.
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-3">
            {requests.map((req) => (
                <Card key={req.id} className="shadow-sm border-gray-200">
                    <CardContent className="p-4 sm:p-5 space-y-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-sm text-gray-700">
                                <span className="font-semibold">Room {req.roomNumber}</span>
                                <span className="text-gray-500"> · Request #{req.id.slice(0, 8)}</span>
                            </div>
                            <Badge variant={getStatusVariant(req.status)}>{req.status}</Badge>
                        </div>

                        <div className="text-xs text-gray-500 grid grid-cols-1 sm:grid-cols-2 gap-1">
                            <p>
                                Student: {req.student?.name || "Unknown"} ({req.student?.schoolId || "N/A"})
                            </p>
                            <p>
                                Professor: {req.professor?.name || "Unassigned"}
                            </p>
                            <p>Created: {format(new Date(req.createdAt), "MMM dd, h:mm a")}</p>
                            <p>Updated: {format(new Date(req.updatedAt), "MMM dd, h:mm a")}</p>
                        </div>

                        <div className="text-sm text-gray-700 border rounded-lg overflow-hidden">
                            {req.items.map((item, index) => (
                                <div
                                    key={`${req.id}-${item.item.name}-${index}`}
                                    className="flex items-center justify-between px-3 py-2 border-b last:border-b-0"
                                >
                                    <span>{item.item.name}</span>
                                    <span className="font-semibold">x{item.quantity}</span>
                                </div>
                            ))}
                        </div>

                        {req.isGroup ? (
                            <p className="text-xs text-amber-700">Group request with {req.groupMembers.length + 1} accountable members.</p>
                        ) : null}
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}


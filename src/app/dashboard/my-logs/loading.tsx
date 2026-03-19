import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function MyLogsLoading() {
    return (
        <div className="space-y-4 animate-pulse">
            <div className="h-8 bg-gray-100 rounded-xl w-48" />
            <div className="h-4 bg-gray-100 rounded w-64" />
            {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-2xl" />
            ))}
        </div>
    )
}

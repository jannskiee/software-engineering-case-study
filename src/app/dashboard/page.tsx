import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

import { StudentDashboard } from "./components/StudentDashboard"
import { ProfessorDashboard } from "./components/ProfessorDashboard"
import { AdminDashboard } from "./components/AdminDashboard"
import { SuperAdminDashboard } from "./components/SuperAdminDashboard"

export default async function DashboardPage() {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
        redirect("/login")
    }

    const role = (session.user as any).role as string

    return (
        <div className="animate-in fade-in duration-500 w-full max-w-7xl mx-auto">
            <div className="mb-5 sm:mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-dlsud-green">CEAT Dispensing</h1>
                <p className="text-sm sm:text-base text-gray-500 mt-2">Laboratory Equipment and Tool Management System</p>
            </div>

            {role === "STUDENT" && <StudentDashboard userId={(session.user as any).id} />}
            {role === "PROFESSOR" && <ProfessorDashboard userId={(session.user as any).id} />}
            {role === "ADMIN" && <AdminDashboard userId={(session.user as any).id} />}
            {role === "SUPERADMIN" && <SuperAdminDashboard userId={(session.user as any).id} />}
        </div>
    )
}

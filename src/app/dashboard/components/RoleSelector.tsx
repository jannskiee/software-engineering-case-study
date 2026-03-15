"use client"

import { useState } from "react"
import { ShieldAlert, ShieldCheck, Loader2 } from "lucide-react"

export function RoleSelector({ userId, currentRole }: { userId: string, currentRole: string }) {
    const [role, setRole] = useState(currentRole)
    const [isUpdating, setIsUpdating] = useState(false)

    const ROLES = ["STUDENT", "PROFESSOR", "ADMIN", "SUPERADMIN"]

    const handleChange = async (newRole: string) => {
        if (!confirm(`Are you sure you want to escalate this user to ${newRole}?`)) return;
        
        setIsUpdating(true)
        try {
            const { updateUserRole } = await import("@/app/actions/superadmin")
            const res = await updateUserRole(userId, newRole)
            if (res.success) {
                setRole(newRole)
            } else {
                alert(`Role update failed: ${res.error}`)
            }
        } catch (error) {
            alert("Network Error")
        } finally {
            setIsUpdating(false)
        }
    }

    return (
        <div className="flex items-center gap-2">
            {role === 'SUPERADMIN' && <ShieldAlert className="w-4 h-4 text-red-600 hidden md:block" />}
            {role === 'ADMIN' && <ShieldCheck className="w-4 h-4 text-blue-600 hidden md:block" />}
            
            <select 
                value={role}
                onChange={(e) => handleChange(e.target.value)}
                disabled={isUpdating}
                className={`text-xs font-semibold px-2 py-1 rounded border shadow-sm outline-none cursor-pointer transition-colors
                    ${role === 'SUPERADMIN' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                    ${role === 'ADMIN' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                    ${role === 'PROFESSOR' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                    ${role === 'STUDENT' ? 'bg-gray-50 text-gray-700 border-gray-200' : ''}
                `}
            >
                {ROLES.map(r => (
                    <option key={r} value={r}>{r}</option>
                ))}
            </select>
            {isUpdating && <Loader2 className="w-4 h-4 text-gray-500 animate-spin" aria-hidden="true" />}
        </div>
    )
}

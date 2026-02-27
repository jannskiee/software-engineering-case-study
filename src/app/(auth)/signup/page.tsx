"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from 'next/link'
import { User, BookOpen, Shield } from "lucide-react"

type Role = "STUDENT" | "PROFESSOR" | "ADMIN"

export default function SignupPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [role, setRole] = useState<Role>("STUDENT")
    const [emailPrefix, setEmailPrefix] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        if (password !== confirmPassword) {
            setError("Passwords do not match.")
            setLoading(false)
            return
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters long.")
            setLoading(false)
            return
        }

        const fullEmail = `${emailPrefix}@dlsud.edu.ph`

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: fullEmail, password, role })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || "Failed to register account")
            }

            // Immediately redirect to login after successful registration
            router.push("/login?registered=true")
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50/50 relative overflow-hidden py-12">
            <div className="absolute inset-0 z-0 bg-dlsud-green opacity-[0.03] pointer-events-none" />

            <Card className="w-full max-w-lg z-10 shadow-2xl border-none">
                <CardHeader className="text-center space-y-2 pb-6">
                    <img
                        src="/dlsud-logo.png"
                        alt="DLSU-D Logo"
                        className="w-16 h-16 mx-auto mb-2 drop-shadow-md object-contain"
                    />
                    <CardTitle className="text-2xl font-bold tracking-tight text-dlsud-green">Create Account</CardTitle>
                    <CardDescription className="text-gray-500">Register your university credentials</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">{error}</div>}

                        <div className="space-y-3">
                            <Label className="text-gray-700 font-medium">I am a...</Label>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { id: "STUDENT", icon: User, label: "Student" },
                                    { id: "PROFESSOR", icon: BookOpen, label: "Professor" },
                                    { id: "ADMIN", icon: Shield, label: "Admin" }
                                ].map((r) => (
                                    <button
                                        key={r.id}
                                        type="button"
                                        onClick={() => setRole(r.id as Role)}
                                        className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all ${role === r.id
                                            ? "border-dlsud-green bg-green-50/50 text-dlsud-green shadow-sm ring-1 ring-dlsud-green"
                                            : "border-gray-200 hover:border-dlsud-green/50 text-gray-500"
                                            }`}
                                    >
                                        <r.icon className="w-6 h-6 mb-2" />
                                        <span className="text-sm font-semibold">{r.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4 pt-2">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-gray-700 font-medium">University Email</Label>
                                <div className="flex rounded-md shadow-sm">
                                    <Input
                                        id="email"
                                        type="text"
                                        placeholder="username"
                                        value={emailPrefix}
                                        onChange={e => setEmailPrefix(e.target.value.replace("@dlsud.edu.ph", ""))}
                                        required
                                        className="rounded-r-none focus-visible:ring-dlsud-green focus-visible:z-10 bg-white"
                                    />
                                    <span className="inline-flex items-center px-4 rounded-r-md border border-l-0 border-gray-200 bg-gray-50 text-gray-500 sm:text-sm whitespace-nowrap">
                                        @dlsud.edu.ph
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    className="focus-visible:ring-dlsud-green bg-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    required
                                    className="focus-visible:ring-dlsud-green bg-white"
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full bg-dlsud-green hover:bg-[#004f32] text-white transition-colors h-11" disabled={loading}>
                            {loading ? "Registering..." : "Create Account"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center border-t py-6 bg-gray-50/50 rounded-b-xl">
                    <p className="text-sm text-gray-600">
                        Already have an account? <Link href="/login" className="text-dlsud-gold hover:underline font-semibold leading-none">Log in</Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}

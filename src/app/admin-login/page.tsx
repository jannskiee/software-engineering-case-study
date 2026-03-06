"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock } from "lucide-react"

export default function AdminPortalPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [form, setForm] = useState({ username: "", password: "" })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            const res = await signIn("credentials", {
                username: form.username,
                password: form.password,
                redirect: false,
            })

            if (res?.error) {
                setError("Invalid administrator credentials.")
            } else {
                router.push("/dashboard")
                router.refresh()
            }
        } catch (err) {
            setError("A system error occurred.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50/50 relative overflow-hidden">
            {/* DLSU-D subtle background */}
            <div className="absolute inset-0 z-0 bg-dlsud-green opacity-[0.03] pointer-events-none" />

            <Card className="w-full max-w-md z-10 shadow-2xl border-none">
                <CardHeader className="text-center space-y-2 pb-6">
                    <img
                        src="/dlsud-logo.png"
                        alt="DLSU-D Logo"
                        className="w-16 h-16 mx-auto mb-2 drop-shadow-md object-contain"
                    />
                    <CardTitle className="text-2xl font-bold tracking-tight text-dlsud-green">
                        Admin Portal
                    </CardTitle>
                    <CardDescription className="text-gray-500 font-medium">
                        Restricted Access. Authorized personnel only.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200 text-center font-medium">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4 pt-2">
                            <Label htmlFor="username" className="text-gray-700 font-medium">
                                Administrator Username
                            </Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="Username"
                                value={form.username}
                                onChange={e => setForm({ ...form, username: e.target.value })}
                                required
                                className="focus-visible:ring-dlsud-green bg-white"
                            />

                            <Label htmlFor="password" className="text-gray-700 font-medium block mt-4">
                                Administrator Password
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={form.password}
                                onChange={e => setForm({ ...form, password: e.target.value })}
                                required
                                className="focus-visible:ring-dlsud-green bg-white"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-dlsud-green hover:bg-[#004f32] text-white transition-colors h-11 shadow-md flex items-center gap-2"
                            disabled={loading}
                        >
                            <Lock className="w-4 h-4" />
                            {loading ? "Authenticating..." : "Secure Sign In"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

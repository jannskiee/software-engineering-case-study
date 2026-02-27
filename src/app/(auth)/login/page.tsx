"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from 'next/link'

function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const registered = searchParams.get('registered')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [form, setForm] = useState({ email: "", password: "" })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || "Invalid credentials")
            }

            // Redirect directly to the unified dashboard
            router.push("/dashboard")
            router.refresh()
        } catch (err: any) {
            setError(err.message)
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
                    <CardTitle className="text-2xl font-bold tracking-tight text-dlsud-green">Welcome Back</CardTitle>
                    <CardDescription className="text-gray-500">Sign in to your university account</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">{error}</div>}
                        {registered && <div className="p-3 text-sm text-green-700 bg-green-50 rounded-md border border-green-200 font-medium">Account created successfully! Please log in.</div>}

                        <div className="space-y-4 pt-2">
                            <Label htmlFor="email" className="text-gray-700 font-medium">DLSU-D Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="username@dlsud.edu.ph"
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                                required
                                className="focus-visible:ring-dlsud-green bg-white"
                            />

                            <Label htmlFor="password" className="text-gray-700 font-medium block mt-4">Password</Label>
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

                        <Button type="submit" className="w-full bg-dlsud-green hover:bg-[#004f32] text-white transition-colors h-11" disabled={loading}>
                            {loading ? "Signing in..." : "Sign In"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center border-t py-6 bg-gray-50/50 rounded-b-xl">
                    <p className="text-sm text-gray-600">
                        Don't have an account? <Link href="/signup" className="text-dlsud-gold hover:underline font-semibold leading-none">Register here</Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <LoginForm />
        </Suspense>
    )
}

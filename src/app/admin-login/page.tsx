"use client"

import { useState, useEffect } from "react"
import { signIn, useSession } from "next-auth/react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock, Shield, CheckCircle2 } from "lucide-react"

export default function AdminPortalPage() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [form, setForm] = useState({ username: "", password: "" })
    const [captchaChecked, setCaptchaChecked] = useState(false)
    const [captchaAnimating, setCaptchaAnimating] = useState(false)
    const { data: session, status } = useSession()

    useEffect(() => {
        if (status === "authenticated" && session) {
            window.location.href = "/dashboard"
        }
    }, [status, session])

    const handleCaptcha = () => {
        if (captchaChecked) return
        setCaptchaAnimating(true)
        setTimeout(() => {
            setCaptchaChecked(true)
            setCaptchaAnimating(false)
        }, 600)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!captchaChecked) {
            setError("Please complete the verification before signing in.")
            return
        }
        setLoading(true)
        setError("")

        try {
            const res = await signIn("credentials", {
                username: form.username,
                password: form.password,
                redirect: false,
            })

            if (res?.error) {
                setError("Invalid administrator credentials. Please check your username and password.")
                setLoading(false)
            } else if (res?.ok) {
                window.location.href = "/dashboard"
            } else {
                setError("Sign-in failed. Please try again.")
                setLoading(false)
            }
        } catch {
            setError("A system error occurred. Please try again.")
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] relative overflow-hidden px-4">
            {/* Decorative blobs */}
            <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-red-600/10 blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-5%] w-[350px] h-[350px] rounded-full bg-[#004f32]/20 blur-[80px] pointer-events-none" />

            <div className="w-full max-w-md z-10">
                {/* Glass Card */}
                <div className="bg-white/8 backdrop-blur-xl border border-white/15 rounded-3xl shadow-2xl p-8 sm:p-10">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 mx-auto mb-4 bg-white/10 border border-white/20 rounded-2xl shadow-lg flex items-center justify-center">
                            <Lock className="w-8 h-8 text-red-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Admin Portal</h1>
                        <p className="text-white/50 text-sm mt-1">Restricted Access — Authorized Personnel Only</p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-6 p-3 text-sm text-red-200 bg-red-500/20 backdrop-blur-sm rounded-xl border border-red-400/30 text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <Label htmlFor="username" className="text-white/70 text-xs font-semibold uppercase tracking-wider">
                                Administrator Username
                            </Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="superadmin"
                                value={form.username}
                                onChange={(e) => setForm({ ...form, username: e.target.value })}
                                required
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-red-400/60 focus:ring-red-400/20 focus-visible:ring-offset-0"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="password" className="text-white/70 text-xs font-semibold uppercase tracking-wider">
                                Administrator Password
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••••"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                required
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-red-400/60 focus:ring-red-400/20 focus-visible:ring-offset-0"
                            />
                        </div>

                        {/* CAPTCHA */}
                        <button
                            type="button"
                            onClick={handleCaptcha}
                            className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-300 ${
                                captchaChecked
                                    ? "bg-green-500/20 border-green-400/40 cursor-default"
                                    : "bg-white/5 border-white/15 hover:bg-white/10 cursor-pointer"
                            }`}
                        >
                            <div
                                className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${
                                    captchaChecked
                                        ? "bg-green-500 border-green-500"
                                        : captchaAnimating
                                        ? "border-red-400 bg-red-400/20"
                                        : "border-white/30 bg-white/5"
                                }`}
                            >
                                {captchaChecked && <CheckCircle2 className="w-4 h-4 text-white" />}
                                {captchaAnimating && (
                                    <div className="w-3 h-3 rounded-full border-2 border-red-400 border-t-transparent animate-spin" />
                                )}
                            </div>
                            <span className="text-sm text-white/70 font-medium">
                                {captchaChecked ? "Verified — I'm not a robot" : "I'm not a robot"}
                            </span>
                            <Shield className="w-4 h-4 text-white/30 ml-auto shrink-0" />
                        </button>

                        <button
                            type="submit"
                            disabled={loading || !captchaChecked}
                            className={`w-full h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300 ${
                                captchaChecked && !loading
                                    ? "bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl hover:scale-[1.01]"
                                    : "bg-white/10 text-white/30 cursor-not-allowed"
                            }`}
                        >
                            <Lock className="w-4 h-4" />
                            {loading ? "Authenticating..." : "Secure Sign In"}
                        </button>
                    </form>

                    <p className="text-center text-white/25 text-xs mt-6">
                        CEAT Laboratory Equipment Dispensing — Admin Portal
                        <br />
                        De La Salle University Dasmariñas
                    </p>
                </div>
            </div>
        </div>
    )
}

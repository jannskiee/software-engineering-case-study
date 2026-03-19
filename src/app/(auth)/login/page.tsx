"use client"

import { useState, useEffect, Suspense } from "react"
import { signIn, useSession } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { Shield, CheckCircle2 } from "lucide-react"

const errorMessages: Record<string, string> = {
    Configuration: "Google sign-in is not configured correctly. Please contact support.",
    OAuthAccountNotLinked: "Please try again — select your role and continue.",
    OAuthCreateAccount: "Unable to create your account. Please try again or contact admin.",
    OAuthSignin: "An error occurred while signing in with Google. Please try again.",
    OAuthCallback: "An error occurred during Google sign-in. Please try again.",
    Callback: "Authentication callback failed. Please verify your Google OAuth redirect URI.",
    AccessDenied: "Access denied. Your account may not be authorized.",
    Verification: "The verification link has expired.",
    Default: "An unexpected error occurred. Please try again.",
}

function LoginForm() {
    const [role, setRole] = useState("STUDENT")
    const [loading, setLoading] = useState(false)
    const [captchaChecked, setCaptchaChecked] = useState(false)
    const [captchaAnimating, setCaptchaAnimating] = useState(false)
    const searchParams = useSearchParams()
    const { data: session, status } = useSession()
    const errorParam = searchParams.get("error")
    const errorMessage = errorParam ? (errorMessages[errorParam] ?? errorMessages.Default) : null

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

    const handleGoogleSignIn = async () => {
        if (!captchaChecked) return
        setLoading(true)
        document.cookie = `pending_role=${role}; path=/; max-age=300;`
        await signIn("google", { callbackUrl: "/dashboard" })
    }

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#004f32] to-[#003a25]">
                <div className="text-white/70 animate-pulse text-sm">Loading...</div>
            </div>
        )
    }

    if (status === "authenticated") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#004f32] to-[#003a25]">
                <div className="text-white/70 animate-pulse text-sm">Redirecting to dashboard...</div>
            </div>
        )
    }

    const roles = [
        { value: "STUDENT", label: "Student", desc: "Borrow equipment for laboratory use" },
        { value: "PROFESSOR", label: "Professor", desc: "Approve requests & manage tools" },
        { value: "ADMIN", label: "Administrator", desc: "Manage dispensing & returns" },
    ]

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#004f32] via-[#005c3a] to-[#003a25] relative overflow-hidden px-4">
            {/* Decorative blobs */}
            <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#c8a951]/10 blur-[80px] pointer-events-none" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-white/5 blur-[80px] pointer-events-none" />

            <div className="w-full max-w-md z-10">
                {/* Glass Card */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8 sm:p-10">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-2xl shadow-lg flex items-center justify-center p-1.5">
                            <img
                                src="/dlsud-logo.png"
                                alt="DLSU-D Logo"
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">CEAT Dispensing</h1>
                        <p className="text-white/60 text-sm mt-1">Laboratory Equipment Management</p>
                    </div>

                    {/* Error Message */}
                    {errorMessage && (
                        <div className="mb-6 p-3 text-sm text-red-200 bg-red-500/20 backdrop-blur-sm rounded-xl border border-red-400/30 text-center">
                            {errorMessage}
                        </div>
                    )}

                    {/* Role Selection */}
                    <div className="mb-6">
                        <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-3">
                            Select Your Role
                        </p>
                        <div className="space-y-2">
                            {roles.map((r) => (
                                <button
                                    key={r.value}
                                    type="button"
                                    onClick={() => setRole(r.value)}
                                    className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 ${
                                        role === r.value
                                            ? "bg-white/20 border-[#c8a951]/80 shadow-sm"
                                            : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p
                                                className={`text-sm font-semibold ${
                                                    role === r.value ? "text-white" : "text-white/80"
                                                }`}
                                            >
                                                {r.label}
                                            </p>
                                            <p className="text-xs text-white/50 mt-0.5">{r.desc}</p>
                                        </div>
                                        {role === r.value && (
                                            <div className="w-4 h-4 rounded-full bg-[#c8a951] flex items-center justify-center shrink-0">
                                                <div className="w-2 h-2 rounded-full bg-white" />
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* CAPTCHA */}
                    <div className="mb-5">
                        <button
                            type="button"
                            onClick={handleCaptcha}
                            className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-300 ${
                                captchaChecked
                                    ? "bg-green-500/20 border-green-400/40 cursor-default"
                                    : "bg-white/5 border-white/20 hover:bg-white/10 cursor-pointer"
                            }`}
                        >
                            <div
                                className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${
                                    captchaChecked
                                        ? "bg-green-500 border-green-500"
                                        : captchaAnimating
                                        ? "border-[#c8a951] bg-[#c8a951]/20"
                                        : "border-white/40 bg-white/5"
                                }`}
                            >
                                {captchaChecked && <CheckCircle2 className="w-4 h-4 text-white" />}
                                {captchaAnimating && (
                                    <div className="w-3 h-3 rounded-full border-2 border-[#c8a951] border-t-transparent animate-spin" />
                                )}
                            </div>
                            <span className="text-sm text-white/80 font-medium">
                                {captchaChecked ? "Verified — I'm not a robot" : "I'm not a robot"}
                            </span>
                            <Shield className="w-4 h-4 text-white/40 ml-auto shrink-0" />
                        </button>
                    </div>

                    {/* Google Sign In */}
                    <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={loading || !captchaChecked}
                        className={`w-full flex items-center justify-center gap-3 h-12 rounded-xl font-semibold text-sm transition-all duration-300 ${
                            captchaChecked && !loading
                                ? "bg-white text-gray-800 hover:bg-gray-50 shadow-lg hover:shadow-xl hover:scale-[1.01]"
                                : "bg-white/20 text-white/40 cursor-not-allowed"
                        }`}
                    >
                        {!loading ? (
                            <>
                                <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                                    <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                                        <path
                                            fill="#4285F4"
                                            d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"
                                        />
                                        <path
                                            fill="#34A853"
                                            d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"
                                        />
                                        <path
                                            fill="#FBBC05"
                                            d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"
                                        />
                                        <path
                                            fill="#EA4335"
                                            d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"
                                        />
                                    </g>
                                </svg>
                                <span>Continue with Google</span>
                            </>
                        ) : (
                            <span className="animate-pulse">Connecting to Google...</span>
                        )}
                    </button>

                    <p className="text-center text-white/30 text-xs mt-6">
                        CEAT Laboratory Equipment Dispensing System
                        <br />
                        De La Salle University — Dasmariñas
                    </p>
                </div>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#004f32] to-[#003a25]">
                    <div className="text-white/70 animate-pulse text-sm">Loading...</div>
                </div>
            }
        >
            <LoginForm />
        </Suspense>
    )
}

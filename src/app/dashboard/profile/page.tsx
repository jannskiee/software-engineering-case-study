import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User, Mail, ShieldAlert, KeyRound } from "lucide-react"

export default async function ProfilePage() {
    const session = await getServerSession(authOptions)

    const user = {
        name: session?.user?.name || session?.user?.email?.split('@')[0] || "Unknown User",
        email: session?.user?.email || "Unknown",
        role: (session?.user as any)?.role || "Unknown",
        createdAt: "2026-02-26" // Mock joining date
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">User Profile</h1>
                <p className="text-sm sm:text-base text-gray-500 mt-2">Manage your DLSU-D identity and security settings.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-1 shadow-sm border-none bg-white flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-24 h-24 rounded-full bg-dlsud-green/10 flex items-center justify-center mb-4 ring-4 ring-gray-50">
                        <User className="h-12 w-12 text-dlsud-green" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 border-b pb-2 w-full truncate px-2" title={user.name}>
                        {user.name}
                    </h2>
                    <div className="mt-4 flex items-center justify-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-dlsud-gold animate-pulse"></span>
                        <span className="text-sm font-semibold tracking-wider text-gray-500 uppercase">{user.role}</span>
                    </div>
                </Card>

                <div className="md:col-span-2 space-y-6">
                    <Card className="shadow-sm border-none bg-white">
                        <CardHeader>
                            <CardTitle>Account Details</CardTitle>
                            <CardDescription>
                                Information tied to your university Single Sign-On.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center p-3 rounded-lg border border-gray-100 bg-gray-50/50">
                                <div className="flex items-center gap-3">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">University Email</p>
                                        <p className="text-sm text-gray-500">{user.email}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center p-3 rounded-lg border border-gray-100 bg-gray-50/50">
                                <div className="flex items-center gap-3">
                                    <ShieldAlert className="h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Authorization Level</p>
                                        <p className="text-sm text-gray-500">{user.role} Access</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-none bg-white border-red-100">
                        <CardHeader>
                            <CardTitle className="text-red-600">Security Area</CardTitle>
                            <CardDescription>
                                Sensitive settings tied to authentication.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 rounded-lg bg-red-50/50 border border-red-100">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Account Password</p>
                                    <p className="text-xs text-gray-500">Update your current encrypted password.</p>
                                </div>
                                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 bg-white">
                                    <KeyRound className="h-4 w-4 mr-2" />
                                    Change Password
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

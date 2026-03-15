import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(db),
    // CRITICAL: Must use "jwt" strategy when using CredentialsProvider with PrismaAdapter.
    // The database strategy does NOT create sessions for the credentials provider,
    // causing an infinite redirect loop back to /login.
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) return null;
                const user = await db.user.findUnique({
                    where: { email: credentials.username },
                });
                if (!user || !user.password) return null;
                const isValid = await bcrypt.compare(credentials.password, user.password);
                if (!isValid) return null;
                // Return the user object for the JWT token
                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                };
            },
        }),
        ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
            ? [
                  GoogleProvider({
                      clientId: process.env.GOOGLE_CLIENT_ID,
                      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                      allowDangerousEmailAccountLinking: true,
                  }),
              ]
            : []),
    ],
    callbacks: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async signIn() {
            // Let NextAuth + PrismaAdapter own account creation/linking flow.
            return true;
        },

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async jwt({ token, user, account }: { token: any; user: any; account: any }) {
            try {
                // On initial sign-in (user object is present)
                if (user) {
                    token.id = user.id;
                    token.email = user.email;
                    token.name = user.name || null;

                    // Read the pending_role cookie (set by the login/signup page)
                    let pendingRole: string | undefined;
                    try {
                        const cookieStore = cookies();
                        pendingRole = cookieStore.get("pending_role")?.value;
                    } catch {
                        // cookies() may not be available in all contexts
                    }

                    // Look up the user in the database
                    let dbUser = await db.user.findUnique({ where: { email: user.email as string } });

                    if (pendingRole && ["STUDENT", "PROFESSOR", "ADMIN"].includes(pendingRole)) {
                        if (dbUser) {
                            // Never override SUPERADMIN role
                            if (dbUser.role !== "SUPERADMIN") {
                                await db.user.update({
                                    where: { id: dbUser.id },
                                    data: { role: pendingRole },
                                });
                                token.role = pendingRole;
                            } else {
                                token.role = dbUser.role;
                            }
                        } else {
                            token.role = pendingRole;
                        }
                    } else {
                        // Use the role from the user object (credentials) or the database
                        token.role = (user as any).role || dbUser?.role || "STUDENT";
                    }
                }
            } catch (err) {
                console.error("Auth JWT Error:", err);
            }
            return token;
        },

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async session({ session, token }: { session: any; token: any }) {
            try {
                if (token && session.user) {
                    session.user.id = token.id;
                    session.user.role = token.role || "STUDENT";
                    if (token.name) session.user.name = token.name;
                    if (token.email) session.user.email = token.email;

                    // Sync the latest role from the database on every session access
                    try {
                        const dbUser = await db.user.findUnique({
                            where: { email: token.email as string },
                            select: { id: true, role: true, name: true },
                        });
                        if (dbUser) {
                            session.user.id = dbUser.id;
                            session.user.role = dbUser.role;
                            if (dbUser.name) session.user.name = dbUser.name;
                        }
                    } catch {
                        // Silently fail — use token values as fallback
                    }
                }
            } catch (err) {
                console.error("Auth Session Error:", err);
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET,
};

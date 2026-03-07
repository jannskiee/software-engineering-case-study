import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(db) as any,
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) return null;
                const user = await db.user.findUnique({ where: { email: credentials.username } });
                if (!user || !user.password) return null;
                const isValid = await bcrypt.compare(credentials.password, user.password);
                if (!isValid) return null;
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { password: _pw, ...userWithoutPassword } = user;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return userWithoutPassword as any;
            }
        }),
        ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
            ? [GoogleProvider({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET })]
            : []),
    ],
    secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_development_only",
    session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider === "google" && user.email === "superadmin") return false;
            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.name = user.name || token.name || null;
                const cookieStore = cookies();
                const pendingRole = cookieStore.get("pending_role")?.value;
                let dbUser = await db.user.findUnique({ where: { id: user.id } });
                if (!dbUser && user.email) {
                    dbUser = await db.user.findUnique({ where: { email: user.email } });
                }
                if (pendingRole && ["STUDENT", "PROFESSOR", "ADMIN"].includes(pendingRole)) {
                    if (dbUser) {
                        if (dbUser.role !== pendingRole && dbUser.role !== "SUPERADMIN") {
                            if (dbUser.password === null) {
                                await db.user.update({ where: { id: dbUser.id }, data: { role: pendingRole } });
                                token.role = pendingRole;
                            } else {
                                token.role = dbUser.role;
                            }
                        } else {
                            token.role = dbUser.role;
                        }
                    } else {
                        token.role = pendingRole;
                    }
                } else {
                    token.role = dbUser?.role || "STUDENT";
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (session.user as any).id = token.id;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (session.user as any).role = token.role || "STUDENT";
                if (token.name) session.user.name = token.name as string;
                if (token.email) session.user.email = token.email as string;
                if (token.email) {
                    try {
                        const dbUser = await db.user.findUnique({
                            where: { email: token.email as string },
                            select: { id: true, role: true, name: true }
                        });
                        if (dbUser) {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            (session.user as any).id = dbUser.id;
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            (session.user as any).role = dbUser.role;
                            if (dbUser.name) session.user.name = dbUser.name;
                        }
                    } catch { /* DB lookup failed - session still works from token */ }
                }
            }
            return session;
        }
    },
    pages: { signIn: "/login" }
};

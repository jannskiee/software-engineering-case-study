import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

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

                const user = await db.user.findUnique({
                    where: { email: credentials.username }
                });

                if (!user || !user.password) return null;

                const isValid = await bcrypt.compare(credentials.password, user.password);

                if (!isValid) return null;

                // Strip the strictly confidential password before assigning session context
                const { password, ...userWithoutPassword } = user;
                return userWithoutPassword as any;
            }
        }),
        ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
            ? [
                GoogleProvider({
                    clientId: process.env.GOOGLE_CLIENT_ID,
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                }),
            ]
            : []),
    ],
    secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_development_only",
    session: {
        strategy: "jwt",
        maxAge: 7 * 24 * 60 * 60, // 7 days
    },
    callbacks: {
        async signIn({ user, account }) {
            // FIREWALL: Prevent Google accounts from accidentally auto-linking to the `superadmin` profile
            // if the user tests Google Auth without logging out of the Admin portal first.
            if (account?.provider === "google") {
                if (user.email === "superadmin") {
                    return false;
                }
            }
            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.name = user.name || token.name || null; // Capture Google payload name

                const cookieStore = cookies();
                const pendingRole = cookieStore.get("pending_role")?.value;

                const dbUser = await db.user.findUnique({ where: { id: user.id } });

                if (pendingRole && ["STUDENT", "PROFESSOR", "ADMIN"].includes(pendingRole)) {
                    if (dbUser) {
                        if (dbUser.role !== pendingRole && dbUser.role !== "SUPERADMIN") {
                            if (dbUser.password === null) {
                                await db.user.update({
                                    where: { id: user.id },
                                    data: { role: pendingRole }
                                });
                                token.role = pendingRole;
                            } else {
                                token.role = dbUser.role;
                            }
                        } else {
                            token.role = dbUser.role;
                        }
                    } else {
                        // Optimistic role mapping, Prisma Adapter hasn't committed row yet
                        token.role = pendingRole;
                    }
                } else {
                    token.role = dbUser?.role || (user as any).role || "STUDENT";
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user && session.user.email) {
                const dbUser = await db.user.findUnique({
                    where: { email: session.user.email }
                });

                if (dbUser) {
                    (session.user as any).id = dbUser.id;
                    (session.user as any).role = dbUser.role;
                    if ((dbUser as any).name) {
                        session.user.name = (dbUser as any).name;
                    }
                } else {
                    return {} as any; // Critical Cache Buster
                }
            }
            return session;
        }
    },
    pages: {
        signIn: '/login',
    }
};

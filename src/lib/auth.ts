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
            ? [GoogleProvider({
                clientId: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                allowDangerousEmailAccountLinking: true,
            })]
            : []),
    ],
    callbacks: {
        async signIn({ user, account }: { user: any, account: any }) {
            try {
                if (account?.provider === "google" && user?.email) {
                    const existingUser = await db.user.findUnique({
                        where: { email: user.email }
                    });

                    if (existingUser) {
                        const existingAccount = await db.account.findFirst({
                            where: {
                                provider: "google",
                                providerAccountId: account.providerAccountId
                            }
                        });

                        if (!existingAccount) {
                            await db.account.create({
                                data: {
                                    userId: existingUser.id,
                                    type: account.type,
                                    provider: account.provider,
                                    providerAccountId: account.providerAccountId,
                                    access_token: account.access_token,
                                    expires_at: account.expires_at,
                                    id_token: account.id_token,
                                    scope: account.scope,
                                    token_type: account.token_type,
                                }
                            });
                        }
                    }
                }
            } catch (err) {
                console.error("Auth SignIn Error:", err);
            }
            return true;
        },
        async jwt({ token, user }: { token: any, user: any }) {
            try {
                if (user) {
                    token.id = user.id;
                    token.email = user.email;
                    token.name = user.name || token.name || null;
                    
                    let pendingRole = undefined;
                    try {
                        const cookieStore = cookies();
                        pendingRole = cookieStore.get("pending_role")?.value;
                    } catch (e) {
                         console.warn("Cookies access failed in JWT:", e);
                    }

                    let dbUser = await db.user.findUnique({ where: { id: user.id } });
                    if (!dbUser && user.email) {
                        dbUser = await db.user.findUnique({ where: { email: user.email } });
                    }
                    
                    if (pendingRole && ["STUDENT", "PROFESSOR", "ADMIN"].includes(pendingRole)) {
                        if (dbUser) {
                            if (dbUser.role !== "SUPERADMIN") {
                                await db.user.update({ where: { id: dbUser.id }, data: { role: pendingRole } });
                                token.role = pendingRole;
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
            } catch (err) {
                console.error("Auth JWT Error:", err);
            }
            return token;
        },
        async session({ session, token }: { session: any, token: any }) {
            try {
                if (token && session.user) {
                    (session.user as any).id = token.id;
                    (session.user as any).role = token.role || "STUDENT";
                    if (token.name) session.user.name = token.name as string;
                    if (token.email) session.user.email = token.email as string;
                    
                    try {
                        const dbUser = await db.user.findUnique({
                            where: { email: token.email as string },
                            select: { id: true, role: true, name: true }
                        });
                        if (dbUser) {
                            (session.user as any).id = dbUser.id;
                            (session.user as any).role = dbUser.role;
                            if (dbUser.name) session.user.name = dbUser.name;
                        }
                    } catch (e) {
                        console.error("Session DB Sync failed:", e);
                    }
                }
            } catch (err) {
                console.error("Auth Session Error:", err);
            }
            return session;
        }
    },
    pages: { signIn: "/login", error: "/login" }
};

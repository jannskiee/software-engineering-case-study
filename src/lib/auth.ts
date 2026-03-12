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
            // Disabled all linking constraints for testing.
            // If the user logs in with Google and their email already exists (e.g., from credentials),
            // manually link the Google Account to the existing User to completely bypass the OAuthAccountNotLinked error.
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
            return true;
        },
        async jwt({ token, user }: { token: any, user: any }) {
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
                
                // Dynamically forcefully change the role no matter what if one is pending during login.
                if (pendingRole && ["STUDENT", "PROFESSOR", "ADMIN"].includes(pendingRole)) {
                    if (dbUser) {
                        // Protect superadmin from being casually overwritten, but allow all others to swap freely.
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
            return token;
        },
        async session({ session, token }: { session: any, token: any }) {
            if (token && session.user) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (session.user as any).id = token.id;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (session.user as any).role = token.role || "STUDENT";
                if (token.name) session.user.name = token.name as string;
                if (token.email) session.user.email = token.email as string;
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
                } catch {
                    // DB sync failed - session still works from JWT token
                }
            }
            return session;
        }
    },
    pages: { signIn: "/login", error: "/login" }
};

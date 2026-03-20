import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

const SUPERADMIN_USERNAME = "superadmin";
const SUPERADMIN_PASSWORD = "superadmin";
const SUPERADMIN_EMAIL    = "superadmin@ceat.system";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(db),
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60,
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

                // ── Hard-coded SuperAdmin check ──
                if (
                    credentials.username === SUPERADMIN_USERNAME &&
                    credentials.password === SUPERADMIN_PASSWORD
                ) {
                    // Find or create the system-level superadmin user
                    let superadmin = await db.user.findUnique({
                        where: { email: SUPERADMIN_EMAIL },
                    });

                    if (!superadmin) {
                        const hashed = await bcrypt.hash(SUPERADMIN_PASSWORD, 12);
                        superadmin = await db.user.create({
                            data: {
                                email: SUPERADMIN_EMAIL,
                                name: "Super Admin",
                                password: hashed,
                                role: "SUPERADMIN",
                            },
                        });
                    } else if (superadmin.role !== "SUPERADMIN") {
                        // Ensure the role is always SUPERADMIN
                        await db.user.update({
                            where: { id: superadmin.id },
                            data: { role: "SUPERADMIN" },
                        });
                    }

                    return {
                        id: superadmin.id,
                        email: superadmin.email,
                        name: superadmin.name,
                        role: "SUPERADMIN",
                    };
                }

                // ── Normal DB credential check (email-based) ──
                const user = await db.user.findUnique({
                    where: { email: credentials.username },
                });
                if (!user || !user.password) return null;
                const isValid = await bcrypt.compare(credentials.password, user.password);
                if (!isValid) return null;
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
            return true;
        },

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async jwt({ token, user, account }: { token: any; user: any; account: any }) {
            try {
                if (user) {
                    token.id = user.id;
                    token.email = user.email;
                    token.name = user.name || null;

                    // Read the pending_role cookie (set by the login page)
                    let pendingRole: string | undefined;
                    try {
                        const cookieStore = cookies();
                        pendingRole = cookieStore.get("pending_role")?.value;
                    } catch {
                        // cookies() may not be available in all contexts
                    }

                    // Look up the user in the database
                    const dbUser = await db.user.findUnique({ where: { email: user.email as string } });

                    if (pendingRole && ["STUDENT", "PROFESSOR", "ADMIN"].includes(pendingRole)) {
                        if (dbUser) {
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
                    session.user.email = token.email;
                    session.user.name = token.name || null;

                    // ── CRITICAL FIX ──
                    // NEVER sync the role from the DB here.
                    // The JWT token.role was set at login time (via cookie or authorize()).
                    // Syncing from DB would overwrite the professor's role with "STUDENT"
                    // if the same email logged in as student from another device/session,
                    // breaking QR approval and all role-gated server actions.
                    session.user.role = token.role || "STUDENT";

                    // Only sync the user id and name from DB (never role)
                    try {
                        const dbUser = await db.user.findUnique({
                            where: { email: token.email as string },
                            select: { id: true, name: true },
                        });
                        if (dbUser) {
                            session.user.id = dbUser.id;
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

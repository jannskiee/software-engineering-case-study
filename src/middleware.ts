import { withAuth } from "next-auth/middleware";

export default withAuth({
    pages: {
        signIn: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_development_only",
});

export const config = {
    // Only protect /dashboard routes
    matcher: ["/dashboard/:path*"],
};

import { withAuth } from "next-auth/middleware";

export default withAuth({
    pages: {
        signIn: "/login",
    },
});

export const config = {
    // Only protect /dashboard routes
    matcher: ["/dashboard/:path*"],
};

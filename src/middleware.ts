import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('session')?.value;
    const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard');
    const isAuthRoute =
        request.nextUrl.pathname === '/login' ||
        request.nextUrl.pathname === '/signup' ||
        request.nextUrl.pathname === '/verify' ||
        request.nextUrl.pathname === '/set-password';

    if (isDashboardRoute) {
        if (!token) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        const payload = await verifyToken(token);
        if (!payload) {
            const response = NextResponse.redirect(new URL('/login', request.url));
            response.cookies.delete('session');
            return response;
        }

        // Pass payload role to headers if needed, or we just let it through
    }

    if (isAuthRoute && token) {
        const payload = await verifyToken(token);
        if (payload && payload.role) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/login', '/signup', '/verify', '/set-password'],
};

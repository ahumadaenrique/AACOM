import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
    // Clear demoMode cookie when accessing the login page to avoid getting stuck
    if (req.nextUrl.pathname === '/login') {
        const response = NextResponse.next();
        response.cookies.delete('demoMode');
        return response;
    }

    const hostname = req.headers.get("host") || "";

    // Parse the slug from the hostname
    // Example: aacom.aacomsoft.com -> 'aacom'
    let slug = "aacom"; // Default fallback
    
    if (hostname) {
        if (hostname.endsWith('.vercel.app')) {
             slug = "aacom"; // Default agency for Vercel preview environments
        } else {
             const parts = hostname.split('.');
             // Check if it's a subdomain (e.g. not localhost:3000, not www.aacomsoft.com, etc)
             if (parts.length > 2 && parts[0] !== 'www' && !hostname.startsWith('localhost:')) {
                  slug = parts[0];
             }
        }
    }

    const isLoggedIn = !!req.auth;
    const isPublicRoute = 
        req.nextUrl.pathname === '/' ||
        req.nextUrl.pathname.startsWith('/inicio') || 
        req.nextUrl.pathname.startsWith('/privacidad') || 
        req.nextUrl.pathname.startsWith('/terminos') || 
        req.nextUrl.pathname.startsWith('/login') || 
        req.nextUrl.pathname.startsWith('/forgot-password') || 
        req.nextUrl.pathname.startsWith('/reset-password') || 
        req.nextUrl.pathname.startsWith('/presentacion') || 
        req.nextUrl.pathname.startsWith('/print') || 
        req.nextUrl.pathname.startsWith('/registro');

    // If user is not logged in and tries to access a private route, kick them to login
    if (!isLoggedIn && !isPublicRoute) {
        return NextResponse.redirect(new URL('/login', req.nextUrl));
    }

    // If user is not logged in and accesses root "/", redirect to the landing page "/inicio"
    if (!isLoggedIn && req.nextUrl.pathname === '/') {
        return NextResponse.redirect(new URL('/inicio', req.nextUrl));
    }

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-agency-slug', slug);
    requestHeaders.set('x-pathname', req.nextUrl.pathname);

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
});

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};

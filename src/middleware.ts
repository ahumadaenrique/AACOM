import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
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
             if (parts.length >= 2 && parts[0] !== 'www' && !hostname.startsWith('localhost:')) {
                  slug = parts[0];
             }
        }
    }

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-agency-slug', slug);

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
});

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};

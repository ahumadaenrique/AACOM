
import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isLoginPage = nextUrl.pathname === '/login';

            if (!isLoggedIn) {
                if (isLoginPage) return true;
                return false; // Redirige a /login automáticamente
            }

            if (isLoginPage) {
                // Redirige al inicio si ya tiene sesión activa
                return Response.redirect(new URL('/', nextUrl));
            }

            return true;
        },
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
            }
            return session;
        },
        async jwt({ token }) {
            return token;
        }
    },
    providers: [], // Configured in auth.ts
    // Fallback to a hardcoded string if env is missing (DEBUG ONLY)
    secret: process.env.AUTH_SECRET || "fallback-secret-key-123",
} satisfies NextAuthConfig

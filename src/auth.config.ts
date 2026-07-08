
import type { NextAuthConfig } from "next-auth"
import { cookies } from "next/headers"

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
        async session({ session, token }: any) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
                session.user.agencyId = token.agencyId;
                session.user.role = token.role;

                // --- MODO DEMO ---
                // Si el usuario tiene la cookie demoMode activa y es un vendedor/admin,
                // reescribimos su sesión en tiempo real para que Next.js y Prisma
                // crean que es el Promotor Demo de la Agencia Demo.
                const cookieStore = cookies();
                const demoValue = cookieStore.get('demoMode')?.value;
                if (demoValue && (session.user.role === 'SELLER' || session.user.role === 'SUPER_ADMIN' || session.user.role === 'ADMIN')) {
                    if (demoValue === 'agent') {
                        session.user.id = 'demo-agent-user-id';
                        session.user.agencyId = 'demo-agency-id';
                        session.user.role = 'AGENTE';
                        session.user.name = 'Carlos Agente Estrella (Modo Lectura)';
                        session.user.email = 'agente.demo@aacommx.com';
                    } else {
                        session.user.id = 'demo-user-id';
                        session.user.agencyId = 'demo-agency-id';
                        session.user.role = 'ADMIN';
                        session.user.name = 'Promotor Demo (Modo Lectura)';
                        session.user.email = 'demo@aacommx.com';
                    }
                }
            }
            return session;
        },
        async jwt({ token, user }: any) {
            if (user) {
                token.agencyId = user.agencyId;
                token.role = user.role;
            }
            return token;
        }
    },
    providers: [], // Configured in auth.ts
    // Fallback to a hardcoded string if env is missing (DEBUG ONLY)
    secret: process.env.AUTH_SECRET || "fallback-secret-key-123",
} satisfies NextAuthConfig

import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authConfig } from "./auth.config"

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    try {
                        const { email, password } = parsedCredentials.data;
                        console.log("\n[AUTH] Attempting login for:", email);

                        const user = await prisma.user.findUnique({ where: { email } });
                        console.log("[AUTH] User found:", !!user);

                        if (!user) return null;

                        const passwordsMatch = password === user.password;
                        console.log("[AUTH] Password match:", passwordsMatch);

                        if (passwordsMatch) return user;
                    } catch (error) {
                        console.error("[AUTH] Error in authorize:", error);
                        return null;
                    }
                }

                return null;
            },
        }),
    ],
    // Fallback to a hardcoded string if env is missing (DEBUG ONLY)
    secret: process.env.AUTH_SECRET || "fallback-secret-key-123",
})

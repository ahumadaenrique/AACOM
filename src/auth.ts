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

                        // Check if the account is suspended
                        if (user.active === false) {
                            console.log("[AUTH] User suspended:", email);
                            return null;
                        }

                        // Check if the user's agency is suspended or deleted
                        if (!user.agencyId) {
                            if (user.role !== 'SUPER_ADMIN' && user.role !== 'SELLER' && user.email !== 'enrique.ahumada@aacommx.com') {
                                console.log("[AUTH] Orphaned user without agency:", email);
                                return null;
                            }
                        } else {
                            const agency = await prisma.agency.findUnique({ where: { id: user.agencyId } });
                            if (!agency || agency.active === false) {
                                console.log("[AUTH] Agency deleted or suspended for user:", email);
                                return null;
                            }
                        }

                        const passwordsMatch = password === user.password;
                        console.log("[AUTH] Password match:", passwordsMatch);

                        if (passwordsMatch) {
                            // Prevent NextAuth cookie overflow by stripping massive Base64 images
                            if (user.image && user.image.startsWith('data:image')) {
                                user.image = null;
                            }

                            // Always guarantee Super Admin role for the main owner
                            if (user.email === 'enrique.ahumada@aacommx.com' && user.role !== 'SUPER_ADMIN') {
                                await prisma.user.update({
                                    where: { email: user.email },
                                    data: { role: 'SUPER_ADMIN' }
                                });
                                user.role = 'SUPER_ADMIN';
                                console.log("[AUTH] Restored SUPER_ADMIN privileges for", user.email);
                            }

                            return user;
                        }
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

import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authConfig } from "./auth.config"
import bcrypt from "bcryptjs"

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
                            if (user.role !== 'SUPER_ADMIN' && user.role !== 'SELLER' && !(process.env.SUPER_ADMIN_EMAILS || "enrique.ahumada@aacommx.com").includes(user.email || "")) {
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

                        let passwordsMatch = false;

                        if (user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$'))) {
                            passwordsMatch = await bcrypt.compare(password, user.password);
                        } else {
                            passwordsMatch = password === user.password;
                            
                            // Hash-on-login: Upgrade plain text password securely to bcrypt
                            if (passwordsMatch && user.password) {
                                const hashedPassword = await bcrypt.hash(password, 10);
                                await prisma.user.update({
                                    where: { id: user.id },
                                    data: { password: hashedPassword }
                                });
                                console.log("[AUTH] Upgraded user password to hash:", email);
                            }
                        }

                        console.log("[AUTH] Password match:", passwordsMatch);

                        if (passwordsMatch) {
                            // Prevent NextAuth cookie overflow by stripping massive Base64 images
                            if (user.image && user.image.startsWith('data:image')) {
                                user.image = null;
                            }

                             // Always guarantee Super Admin role and AACOM agency for the main owner
                             if ((process.env.SUPER_ADMIN_EMAILS || "enrique.ahumada@aacommx.com").includes(user.email || "")) {
                                 let needsUpdate = false;
                                 const updateData: any = {};
                                 if (user.role !== 'SUPER_ADMIN') {
                                     updateData.role = 'SUPER_ADMIN';
                                     user.role = 'SUPER_ADMIN';
                                     needsUpdate = true;
                                 }
                                 if (!user.agencyId) {
                                     const aacomAgency = await prisma.agency.findFirst({
                                         where: { slug: process.env.NEXT_PUBLIC_DEFAULT_AGENCY_SLUG || 'aacom' }
                                     });
                                     if (aacomAgency) {
                                         updateData.agencyId = aacomAgency.id;
                                         user.agencyId = aacomAgency.id;
                                         needsUpdate = true;
                                     }
                                 }
                                 if (needsUpdate) {
                                     await prisma.user.update({
                                         where: { email: user.email },
                                         data: updateData
                                     });
                                     console.log("[AUTH] Restored SUPER_ADMIN and agency privileges for", user.email);
                                 }
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

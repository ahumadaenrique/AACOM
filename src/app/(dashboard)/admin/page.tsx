import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import AdminClient from "./AdminClient"

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
    try {
        console.log("[ADMIN GUARD] Initiating server-side role check");
        const session = await auth()
        console.log("[ADMIN GUARD] Session found:", !!session);

        if (!session?.user?.email) {
            console.log("[ADMIN GUARD] No session email, redirecting to /login");
            redirect("/login")
        }

        console.log("[ADMIN GUARD] Querying Prisma for email:", session.user.email);
        const dbUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        })
        console.log("[ADMIN GUARD] DB User found:", !!dbUser, "Role:", dbUser?.role);

        if (!dbUser || dbUser.role !== 'ADMIN') {
            console.log("[ADMIN GUARD] Unauthorized access, redirecting to /");
            redirect("/")
        }

        console.log("[ADMIN GUARD] Authorization successful! Rendering AdminClient");
        return <AdminClient />
    } catch (error: any) {
        // Next.js redirect and dynamic bail-out use error throwing mechanisms under the hood.
        // We must re-throw them so Next.js handles them properly!
        if (
            error.message === "NEXT_REDIRECT" || 
            error.digest?.startsWith("NEXT_REDIRECT") ||
            error.digest === "DYNAMIC_SERVER_USAGE" ||
            error.message?.includes("dynamic-server-error")
        ) {
            throw error;
        }

        console.error("[ADMIN GUARD] Server Error:", error);
        return (
            <div className="flex min-h-[60vh] items-center justify-center p-6">
                <div className="w-full max-w-md bg-rose-50 border border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/50 rounded-2xl p-6 shadow-md text-rose-800 dark:text-rose-400">
                    <h2 className="text-sm font-black uppercase tracking-wider mb-2">Error de Servidor (Admin Guard)</h2>
                    <p className="text-xs font-semibold leading-relaxed mb-4">
                        Ocurrió un error al procesar las credenciales de administrador en el servidor.
                    </p>
                    <div className="bg-white/50 dark:bg-black/30 p-3 rounded-lg text-[10px] font-mono break-all leading-normal">
                        {error.message || String(error)}
                    </div>
                </div>
            </div>
        )
    }
}

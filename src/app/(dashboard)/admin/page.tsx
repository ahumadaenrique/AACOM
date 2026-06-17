import React from "react"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import AdminClient from "./AdminClient"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function AdminPage() {
    const session = await auth()
    
    if (!session?.user?.email) {
        redirect("/login")
    }

    const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email }
    })

    if (!dbUser || (dbUser.role !== 'ADMIN' && dbUser.role !== 'SUPER_ADMIN')) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center p-4">
                <div className="w-full max-w-md border-t-4 border-t-red-600 bg-white dark:bg-zinc-950 p-6 rounded-2xl shadow-xl border border-slate-200 dark:border-zinc-800 text-center space-y-4">
                    <div className="h-12 w-12 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-black text-slate-800 dark:text-zinc-100">Acceso Restringido</h1>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Tu cuenta (<strong className="text-slate-700 dark:text-zinc-300">{session.user.email}</strong>) no tiene asignado el rol de Administrador. Si crees que esto es un error, por favor contacta al soporte técnico de AACOM.
                    </p>
                </div>
            </div>
        )
    }

    return <AdminClient />
}

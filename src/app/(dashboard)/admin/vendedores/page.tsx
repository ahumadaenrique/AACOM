import React from "react"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getSellers } from "@/app/sellerActions"
import VendedoresClient from "./VendedoresClient"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function VendedoresPage() {
    const session = await auth()
    
    if (!session?.user?.email) {
        redirect("/login")
    }

    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
        return (
            <div className="flex min-h-[70vh] items-center justify-center p-4">
                <div className="w-full max-w-md bg-white dark:bg-zinc-950 p-6 rounded-2xl shadow-xl text-center space-y-4">
                    <h1 className="text-xl font-black text-slate-800 dark:text-zinc-100">Acceso Restringido</h1>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        No tienes permisos para ver esta página.
                    </p>
                </div>
            </div>
        )
    }

    const sellers = await getSellers()

    return <VendedoresClient initialSellers={sellers} />
}

import React from "react"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getSellerDashboard } from "@/app/sellerActions"
import VendedorClient from "./VendedorClient"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function VendedorPage() {
    const session = await auth()
    
    if (!session?.user?.email) {
        redirect("/login")
    }

    if (session.user.role !== 'SELLER') {
        redirect("/")
    }

    const sellerData = await getSellerDashboard()

    return <VendedorClient sellerData={sellerData} />
}

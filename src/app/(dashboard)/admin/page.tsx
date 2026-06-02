import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import AdminClient from "./AdminClient"

export default async function AdminPage() {
    const session = await auth()
    if (!session?.user?.email) {
        redirect("/login")
    }

    const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email }
    })

    if (!dbUser || dbUser.role !== 'ADMIN') {
        redirect("/")
    }

    return <AdminClient />
}

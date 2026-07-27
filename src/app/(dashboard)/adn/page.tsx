import React from "react"
import AdnClient from "./AdnClient"
import PremiumGuard from "@/components/PremiumGuard"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export default async function AdnPage() {
  const session = await auth()
  let userRole = null

  if (session?.user?.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })
    if (dbUser) {
      userRole = dbUser.role
    }
  }

  return (
    <PremiumGuard userRole={userRole} moduleName="Análisis de Necesidades (ADN)">
      <AdnClient />
    </PremiumGuard>
  )
}

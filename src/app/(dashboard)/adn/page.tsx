import React from "react"
import AdnClient from "./AdnClient"
import PremiumGuard from "@/components/PremiumGuard"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { resolveImageUrl } from "@/lib/utils"

export default async function AdnPage() {
  const session = await auth()
  let userRole = null
  let agencyName = "aacomsoft"
  let agencyLogo = "/logo.png"

  if (session?.user?.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, agencyId: true }
    })
    if (dbUser) {
      userRole = dbUser.role
    }

    const effectiveAgencyId = ((session.user as any)?.agencyId || dbUser?.agencyId) as string | undefined
    if (effectiveAgencyId) {
      const agency = await prisma.agency.findUnique({
        where: { id: effectiveAgencyId },
        select: { name: true, logoUrl: true }
      })
      if (agency) {
        agencyName = agency.name || "aacomsoft"
        agencyLogo = agency.logoUrl ? resolveImageUrl(agency.logoUrl) : "/logo.png"
      }
    }
  }

  return (
    <PremiumGuard userRole={userRole} moduleName="Análisis de Necesidades (ADN)">
      <AdnClient agencyName={agencyName} agencyLogo={agencyLogo} />
    </PremiumGuard>
  )
}

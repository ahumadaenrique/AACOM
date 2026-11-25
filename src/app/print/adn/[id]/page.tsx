import React from "react"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import AdnClient from "@/app/(dashboard)/adn/AdnClient"
import { resolveImageUrl } from "@/lib/utils"

function safeParseJson<T>(raw: unknown, fallback: T): T {
  if (!raw) return fallback
  if (typeof raw !== "string") return raw as T
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export default async function PrintAdnPage({ params }: { params: { id: string } }) {
  // Removing auth check because PDFShift server needs to access this URL directly
  // and it won't have the user's session cookie. UUID is unguessable enough for print.

  // Fetch the ADN from the database
  const adn = await prisma.adnDiagnostic.findUnique({
    where: { id: params.id },
    include: {
      agency: true,
      user: true
    }
  })

  if (!adn) {
    notFound()
  }

  // The database fields match the printData needed in the AdnPage component.
  // `gastosData` comes as stringified JSON.
  const printData = {
    ...adn,
    hijosData: safeParseJson(adn.hijosData, []),
    gastosData: safeParseJson(adn.gastosData, null),
  }

  const agencyName = adn.agency?.name || "aacomsoft"
  const agencyLogo = adn.agency?.logoUrl ? resolveImageUrl(adn.agency.logoUrl) : "/logo.png"

  return (
    <div className="bg-white min-h-screen">
      <AdnClient
        printMode={true}
        printData={printData}
        agencyName={agencyName}
        agencyLogo={agencyLogo}
      />
    </div>
  )
}

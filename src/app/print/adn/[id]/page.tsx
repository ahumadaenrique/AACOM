import React from "react"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import AdnClient from "@/app/(dashboard)/adn/AdnClient"

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
    hijosData: adn.hijosData ? JSON.parse(adn.hijosData as string) : [],
    gastosData: adn.gastosData ? JSON.parse(adn.gastosData as string) : null,
  }

  return (
    <div className="bg-white min-h-screen">
      <AdnClient printMode={true} printData={printData} />
    </div>
  )
}

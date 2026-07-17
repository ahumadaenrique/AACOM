import React from "react"
import { notFound } from "next/navigation"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import CotizadorPage from "@/app/(dashboard)/cotizador/CotizadorClient"

export default async function PrintCotizacionPage({ params }: { params: { id: string } }) {
  // Validate that the user is logged in
  const session = await auth()
  if (!session?.user?.id) {
    return (
      <div className="flex h-screen w-full items-center justify-center p-8 text-center text-rose-500 font-bold bg-white">
        ACCESO DENEGADO - Inicia sesión para descargar la cotización.
      </div>
    )
  }

  // Fetch the quote from the database
  const cotizacion = await prisma.cotizacion.findUnique({
    where: { id: params.id },
    include: {
      agency: true,
      user: true
    }
  })

  if (!cotizacion) {
    notFound()
  }

  // Reconstruct printData from the database record exactly as CotizadorClient expects it.
  const parsedData = cotizacion.projectionData ? JSON.parse(cotizacion.projectionData) : []
  
  const ahorroAt65Pesos = cotizacion.ahorro
  const ahorroAt65Udis = parsedData[parsedData.length - 1]?.ahorroUdis || 0
  const rendimientoAt65 = cotizacion.rendimiento
  const accumulatedPremiumPesos = cotizacion.totalPrima
  const annualPremium = cotizacion.primaAnual
  const isr = cotizacion.isr || 35
  const isPPR = cotizacion.producto === "VPL PPR"

  const summaryMetrics = {
    totalPrimasPesos: accumulatedPremiumPesos,
    totalAhorroPesos: ahorroAt65Pesos,
    totalAhorroUdis: ahorroAt65Udis,
    beneficioFiscalAnual: isPPR ? annualPremium * (isr / 100) : 0,
    beneficioFiscalTotal: isPPR ? accumulatedPremiumPesos * (isr / 100) : 0,
    rendimientoFinal65: rendimientoAt65
  }

  const saProgression = {
    y1: parsedData[0]?.saPesos || 0,
    y10: (parsedData.find((r:any) => r.anio === 10) || parsedData[parsedData.length - 1])?.saPesos || 0,
    y20: (parsedData.find((r:any) => r.anio === 20) || parsedData[parsedData.length - 1])?.saPesos || 0,
    y30: (parsedData.find((r:any) => r.anio === 30) || parsedData[parsedData.length - 1])?.saPesos || 0,
  }

  const printData = {
    formData: {
      cliente: cotizacion.cliente,
      agente: cotizacion.agente,
      telefono: cotizacion.telefono,
      edadCliente: 35,
      producto: cotizacion.producto,
      duracion: cotizacion.duracion || "15",
      formaDePagoCotizada: cotizacion.producto === "Insignia Life Universal" ? "Anual" : "Meses sin intereses",
      valorUdi: cotizacion.valorUdi || 8.25,
      inflacionUdi: cotizacion.inflacionUdi || 5.0,
      coberturas: cotizacion.coberturas ? JSON.parse(cotizacion.coberturas) : { itp: false, epp: false, ma: false, mapo: false },
      isr: isr
    },
    calculatedData: parsedData,
    summaryMetrics,
    saProgression
  }

  return (
    <div className="bg-white min-h-screen text-black">
      {/* 
        This is a headless page meant specifically for the PDF API.
        It renders the existing CotizadorClient in 'printMode' so all navigations/buttons are hidden.
      */}
      <CotizadorPage 
        agencyName={cotizacion.agency?.name || "AACOMSOFT"}
        agencyLogo={cotizacion.agency?.logoUrl || "/logo.png"}
        currentUserName={cotizacion.user?.name || ""}
        printMode={true}
        printData={printData}
      />
    </div>
  )
}

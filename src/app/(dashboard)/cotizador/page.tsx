"use client"

import React, { useState, useRef, useEffect } from "react"
import * as XLSX from "xlsx"
import { saveCotizacion, getCotizaciones, getUdiSetting, getAgents } from "@/app/actions"
import { 
  FileSpreadsheet, 
  Upload, 
  MapPin, 
  ArrowRight, 
  ArrowLeft, 
  Printer, 
  FileText, 
  Check, 
  TrendingUp, 
  Percent, 
  ShieldAlert,
  HelpCircle,
  PiggyBank,
  CheckSquare,
  Sparkles,
  Download,
  RefreshCw
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Recharts imports inside client component
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine
} from "recharts"

// Form Interface
interface FormData {
  cliente: string
  agente: string
  telefono: string
  edadCliente: number
  producto: string
  duracion: string
  formaDePagoCotizada: string
  valorUdi: number
  inflacionUdi: number
  coberturas: {
    itp: boolean
    epp: boolean
    ma: boolean
    mapo: boolean
  }
  isr: number
}

// Columns Map Interface
interface ColumnMapping {
  anios: number
  edad: number
  prima: number
  sa: number
  valores: number
  fondoDisponible: number
  recuperacion: number
  primaProteccion: number
  primaAhorro: number
}

export default function CotizadorPage() {
  // Navigation Mode
  const [viewMode, setViewMode] = useState<'MENU' | 'HISTORY' | 'EDITOR'>('MENU')
  const [historyList, setHistoryList] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Step navigation state
  const [step, setStep] = useState<number>(1)
  
  // Step 1: Form Data - default ISR to 35%
  // Coberturas: MAA & MAB deleted (Correction 6)
  const [formData, setFormData] = useState<FormData>({
    cliente: "",
    agente: "",
    telefono: "",
    edadCliente: 35,
    producto: "VPL",
    duracion: "15",
    formaDePagoCotizada: "Anual",
    valorUdi: 8.25, // default
    inflacionUdi: 5.0,
    coberturas: {
      itp: false,
      epp: false,
      ma: false,
      mapo: false
    },
    isr: 35 // Recommended 35% ISR
  })

  // Load default UDI rate set by Admin from DB on mount (Correction 5) and agents list
  const [agents, setAgents] = useState<string[]>([
    "Miguel Angel Cruz",
    "Alejandra Ahumada",
    "Jorge Antonio Araoz",
    "Raul Alberto Coka",
    "Dalia Sandoval",
    "Samantha Ramos",
    "Viridiana Habana",
    "Claudia Quijada",
    "Areli Arce"
  ])

  useEffect(() => {
    const fetchDefaultUdi = async () => {
      try {
        const res = await getUdiSetting()
        if (res.success && res.value) {
          setFormData(prev => ({
            ...prev,
            valorUdi: res.value
          }))
        }
      } catch (err) {
        console.error("Error fetching UDI default rate:", err)
      }
    }
    
    const fetchAgents = async () => {
      try {
        const res = await getAgents()
        if (res.success && res.agents && res.agents.length > 0) {
          setAgents(res.agents.map((a: any) => a.name))
        }
      } catch (err) {
        console.error("Error fetching agents:", err)
      }
    }

    fetchDefaultUdi()
    fetchAgents()
  }, [])

  // Step 2: Upload Data
  const [file, setFile] = useState<File | null>(null)
  const [fileHeaders, setFileHeaders] = useState<string[]>([])
  const [fileRows, setFileRows] = useState<any[][]>([])
  const [dragActive, setDragActive] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Step 3: Column Mapping
  const [mapping, setMapping] = useState<ColumnMapping>({
    anios: -1,
    edad: -1,
    prima: -1,
    sa: -1,
    valores: -1,
    fondoDisponible: -1,
    recuperacion: -1,
    primaProteccion: -1,
    primaAhorro: -1
  })

  // Step 4: Results
  const [calculatedData, setCalculatedData] = useState<any[]>([])
  const [summaryMetrics, setSummaryMetrics] = useState({
    totalPrimasPesos: 0,
    totalAhorroPesos: 0,
    totalAhorroUdis: 0,
    beneficioFiscalAnual: 0,
    beneficioFiscalTotal: 0,
    rendimientoFinal65: 0
  })
  
  // Suma Asegurada Progression states (Correction 8)
  const [saProgression, setSaProgression] = useState<{
    y1: number;
    y10: number;
    y20: number;
    y30: number;
  }>({ y1: 0, y10: 0, y20: 0, y30: 0 })

  const [hasCalculated, setHasCalculated] = useState(false)

  // Handle forms input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === "valorUdi" || name === "inflacionUdi" || name === "isr" 
        ? parseFloat(value) || 0 
        : value
    }))
  }

  // Handle coverages checkbox changes
  const handleCheckboxChange = (coverageKey: keyof FormData["coberturas"]) => {
    setFormData(prev => ({
      ...prev,
      coberturas: {
        ...prev.coberturas,
        [coverageKey]: !prev.coberturas[coverageKey]
      }
    }))
  }

  // File drag & drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0])
    }
  }

  // Read File and Parse with SheetJS
  const handleFileSelected = (selectedFile: File) => {
    setFile(selectedFile)
    const reader = new FileReader()
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: "array" })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      
      // Convert sheet to 2D array
      const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
      
      if (rawRows.length > 0) {
        // Assume first row is header, clean empty elements
        const headers = rawRows[0].map((h: any, i: number) => h ? String(h).trim() : `Columna ${i + 1}`)
        setFileHeaders(headers)
        setFileRows(rawRows.slice(1)) // Rows without header

        // Apply visual heuristic to auto-map columns
        const newMapping = { anios: -1, edad: -1, prima: -1, sa: -1, valores: -1, fondoDisponible: -1, recuperacion: -1, primaProteccion: -1, primaAhorro: -1 }
        
        headers.forEach((header, index) => {
          const lower = header.toLowerCase()
          // Correction 7: added support for "anos" without ñ
          if (lower.includes("año") || lower.includes("anos") || lower.includes("periodo") || lower.includes("ann") || lower.includes("año póliza")) {
            if (newMapping.anios === -1) newMapping.anios = index
          } else if (lower.includes("edad")) {
            if (newMapping.edad === -1) newMapping.edad = index
          } else if (lower.includes("prima de protección") || lower.includes("prima de proteccion")) {
            if (newMapping.primaProteccion === -1) newMapping.primaProteccion = index
          } else if (lower.includes("prima de ahorro")) {
            if (newMapping.primaAhorro === -1) newMapping.primaAhorro = index
          } else if (lower.includes("prima total") || lower.includes("prima") || lower.includes("aport") || lower.includes("anual")) {
            if (newMapping.prima === -1) newMapping.prima = index
          } else if (lower.includes("proteccion") || lower.includes("protección") || lower.includes("suma") || lower.includes("aseg") || lower.includes("sa") || lower.includes("fallecimiento")) {
            if (newMapping.sa === -1) newMapping.sa = index
          } else if (lower.includes("fondo") || lower.includes("disponible")) {
            if (newMapping.fondoDisponible === -1) newMapping.fondoDisponible = index
          } else if (lower.includes("recuperacion") || lower.includes("recuperación") || lower.includes("sobre fondo")) {
            if (newMapping.recuperacion === -1) newMapping.recuperacion = index
          } else if (lower.includes("valor") || lower.includes("garant") || lower.includes("rescate") || lower.includes("efect") || lower.includes("ahorro")) {
            if (newMapping.valores === -1) newMapping.valores = index
          }
        })
        
        setMapping(newMapping)
      }
    }
    reader.readAsArrayBuffer(selectedFile)
  }

  // Handle Mapping Selector Changes
  const handleMappingChange = (conceptKey: keyof ColumnMapping, columnIndex: number) => {
    setMapping(prev => ({
      ...prev,
      [conceptKey]: columnIndex
    }))
  }

  // Proceed to Step 2 with phone number validation (Correction 1)
  const handleProceedToStep2 = () => {
    if (!formData.cliente.trim()) {
      alert("Por favor, ingresa el nombre del cliente.")
      return
    }
    if (!formData.agente || formData.agente === "" || formData.agente === "Nombre de Agente") {
      alert("Por favor, selecciona un agente válido de la lista.")
      return
    }
    
    // Validate 10 numeric digits strictly
    const cleanedPhone = formData.telefono.replace(/\D/g, "")
    if (cleanedPhone.length !== 10) {
      alert("El número de teléfono del cliente debe tener exactamente 10 dígitos numéricos.")
      return
    }
    
    setStep(2)
  }

  // Perform Cotizador Calculations
  const calculateResults = async () => {
    if (fileRows.length === 0) return

    // Clean data from rows based on mappings
    const results: any[] = []
    let currentUdi = formData.valorUdi
    let accumulatedPremiumPesos = 0

    // Helper to parse currency/numeric values cleanly from Excel cells (resolves NaN and $ issues)
    const parseNumericValue = (val: any): number => {
      if (val === undefined || val === null) return 0
      if (typeof val === 'number') return val
      const str = String(val).trim()
      if (!str) return 0
      const cleaned = str.replace(/[$\s,]/g, "")
      const parsed = parseFloat(cleaned)
      return isNaN(parsed) ? 0 : parsed
    }

    // Filter rows that have a valid year
    const validRows = fileRows.filter(row => {
      const yearVal = row[mapping.anios]
      return yearVal !== undefined && yearVal !== null && String(yearVal).trim() !== "" && !isNaN(Number(yearVal))
    })

    validRows.forEach((row, idx) => {
      // ANOS column = policy year, Edad column = client age
      const anio = parseInt(row[mapping.anios]) || idx + 1
      let edad = parseInt(row[mapping.edad])
      if (isNaN(edad)) {
        edad = formData.edadCliente + anio - 1
      }
      const primaPesos = parseNumericValue(row[mapping.prima])
      const saPesos = parseNumericValue(row[mapping.sa])
      const valoresPesos = parseNumericValue(row[mapping.valores])
      const fondoDisponiblePesos = mapping.fondoDisponible !== -1 ? parseNumericValue(row[mapping.fondoDisponible]) : 0
      const recuperacionSobreFondo = mapping.recuperacion !== -1 ? parseNumericValue(row[mapping.recuperacion]) : 0
      const primaProteccionPesos = mapping.primaProteccion !== -1 ? parseNumericValue(row[mapping.primaProteccion]) : 0
      const primaAhorroPesos = mapping.primaAhorro !== -1 ? parseNumericValue(row[mapping.primaAhorro]) : 0

      // UDI value projection (starts at valorUdi, increases compounded by inflation)
      const udiValue = idx === 0 ? currentUdi : currentUdi * (1 + formData.inflacionUdi / 100)
      currentUdi = udiValue // Update for next year

      // Conversions to UDI
      const primaUdis = udiValue > 0 ? primaPesos / udiValue : 0
      const saUdis = udiValue > 0 ? saPesos / udiValue : 0
      const ahorroUdis = udiValue > 0 ? valoresPesos / udiValue : 0

      // Rendimiento: Ahorro Pesos / Primas acumuladas
      accumulatedPremiumPesos += primaPesos
      const rendimiento = accumulatedPremiumPesos > 0 ? valoresPesos / accumulatedPremiumPesos : 0

      results.push({
        anio,
        edad,
        udiValue,
        primaPesos,
        primaUdis,
        saPesos,
        saUdis,
        valoresPesos,
        ahorroUdis,
        accumulatedPremiumPesos,
        rendimiento,
        fondoDisponiblePesos,
        recuperacionSobreFondo,
        primaProteccionPesos,
        primaAhorroPesos
      })
    })

    // UDI calculation at 65
    let rowAt65 = results.find(r => r.edad === 65)
    if (!rowAt65 && results.length > 0) {
      rowAt65 = results[results.length - 1] // Fallback to last row
    }

    const ahorroAt65Pesos = rowAt65 ? rowAt65.valoresPesos : 0
    const ahorroAt65Udis = rowAt65 ? rowAt65.ahorroUdis : 0
    const rendimientoAt65 = rowAt65 ? rowAt65.rendimiento * 100 : 0

    // Correction 8: Suma Asegurada (SA) progression every 10 years
    const saY1 = results[0]?.saPesos || 0
    
    const rowY10 = results.find(r => r.anio === 10) || results[results.length - 1]
    const saY10 = rowY10 ? rowY10.saPesos : 0

    const rowY20 = results.find(r => r.anio === 20) || results[results.length - 1]
    const saY20 = rowY20 ? rowY20.saPesos : 0

    const rowY30 = results.find(r => r.anio === 30) || results[results.length - 1]
    const saY30 = rowY30 ? rowY30.saPesos : 0

    setSaProgression({
      y1: saY1,
      y10: saY10,
      y20: saY20,
      y30: saY30
    })

    // Beneficio fiscal is calculated on accumulated total
    const annualPremium = results[0]?.primaPesos || 0
    const benefitFiscalAnual = (formData.producto === "VPL PPR")
      ? annualPremium * (formData.isr / 100)
      : 0
    const benefitFiscalTotal = (formData.producto === "VPL PPR")
      ? accumulatedPremiumPesos * (formData.isr / 100)
      : 0

    setCalculatedData(results)
    
    const metrics = {
      totalPrimasPesos: accumulatedPremiumPesos,
      totalAhorroPesos: ahorroAt65Pesos,
      totalAhorroUdis: ahorroAt65Udis,
      beneficioFiscalAnual: benefitFiscalAnual,
      beneficioFiscalTotal: benefitFiscalTotal,
      rendimientoFinal65: rendimientoAt65
    }
    
    setSummaryMetrics(metrics)
    setHasCalculated(true)
    setStep(4)

    try {
      await saveCotizacion({
        cliente: formData.cliente || "Cliente Sin Nombre",
        telefono: formData.telefono || "Sin Teléfono",
        agente: formData.agente || "Agente Sin Nombre",
        producto: formData.producto,
        primaAnual: annualPremium,
        totalPrima: accumulatedPremiumPesos,
        ahorro: ahorroAt65Pesos,
        rendimiento: rendimientoAt65,
        valorUdi: formData.valorUdi,
        inflacionUdi: formData.inflacionUdi,
        duracion: formData.duracion,
        isr: formData.isr,
        coberturas: JSON.stringify(formData.coberturas),
        projectionData: JSON.stringify(results)
      })
    } catch (err) {
      console.error("Silent DB save failed:", err)
    }
  }

  // Load sample data helper for quick visual testing
  const loadTestData = () => {
    const testRows = []
    let startAge = 35
    for (let year = 1; year <= 30; year++) {
      // Annual premium is 60,000 pesos for 10 years, then 0
      const premium = year <= 10 ? 60000 : 0
      
      // Sum assured increases compoundingly/grows over time (Correction 8)
      const sa = 1500000 + (year - 1) * 35000
      
      let valorGarantizado = 0
      
      if (year === 1) valorGarantizado = 0
      else if (year < 5) valorGarantizado = year * 18000
      else if (year < 10) valorGarantizado = year * 45000
      else if (year < 30) valorGarantizado = 500000 + (year - 10) * 58000
      else valorGarantizado = 1680000 // Ahorro robusto al final/65

      testRows.push([
        year, // Año
        startAge + year - 1, // Edad
        premium, // Prima Pesos
        sa, // SA Pesos
        valorGarantizado // Valores garantizados Pesos
      ])
    }
    
    // Add Year 31 (Age 65) specifically
    testRows.push([
      31,
      65, // Edad 65
      0,
      1500000 + 30 * 35000,
      1750000 // Ahorro proyectado a los 65
    ])

    // Correction 7: Column Year mapped as "ANOS" (without ñ) to simulate user uploads
    setFileHeaders(["ANOS", "Edad", "Prima Anual ($)", "Suma Asegurada ($)", "Rescate/Valores ($)"])
    setFileRows(testRows)
    setMapping({
      anios: 0,
      edad: 1,
      prima: 2,
      sa: 3,
      valores: 4
    })
    setFormData(prev => ({
      ...prev,
      cliente: "Eduardo Mendoza Garza",
      agente: "Miguel Angel Cruz",
      telefono: "8119098765", // 10-digit number
      producto: "VPL PPR",
      duracion: "10",
      valorUdi: 8.25,
      inflacionUdi: 4.5,
      isr: 35, // Recommended ISR
      coberturas: {
        itp: true,
        epp: true,
        ma: true,
        mapo: true
      }
    }))
    setStep(3)
  }

  const handleInflationBlur = () => {
    let val = formData.inflacionUdi
    if (val < 4.0) val = 4.0
    if (val > 5.0) val = 5.0
    setFormData(prev => ({ ...prev, inflacionUdi: val }))
  }

  // Printable action
  const handlePrint = () => {
    window.print()
  }

  // Reset cotizador to step 1 and clean up state fields
  const handleResetAndNewQuote = () => {
    setFormData({
      cliente: "",
      agente: "", // Reset back to placeholder
      telefono: "",
      edadCliente: 35,
      producto: "VPL",
      duracion: "15",
      formaDePagoCotizada: "Anual",
      valorUdi: formData.valorUdi, // Keep initial default UDI value
      inflacionUdi: 5.0, // Default 5%
      coberturas: {
        itp: false,
        epp: false,
        ma: false,
        mapo: false
      },
      isr: 35
    })
    setFile(null)
    setFileHeaders([])
    setFileRows([])
    setMapping({
      anios: -1,
      edad: -1,
      prima: -1,
      sa: -1,
      valores: -1,
      fondoDisponible: -1,
      recuperacion: -1,
      primaProteccion: -1,
      primaAhorro: -1
    })
    setCalculatedData([])
    setSummaryMetrics({
      totalPrimasPesos: 0,
      totalAhorroPesos: 0,
      totalAhorroUdis: 0,
      beneficioFiscalAnual: 0,
      beneficioFiscalTotal: 0,
      rendimientoFinal65: 0
    })
    setSaProgression({ y1: 0, y10: 0, y20: 0, y30: 0 })
    setHasCalculated(false)
    setStep(1)
  }

  // Observation 1: Direct PDF download using html2pdf.js dynamically
  const handleDownloadPdf = async () => {
    const html2pdf = (await import("html2pdf.js")).default
    const element = document.getElementById("printable-report")
    if (!element) return

    // Force desktop width temporarily to prevent mobile cut-off
    const originalWidth = element.style.width
    const originalMaxWidth = element.style.maxWidth
    element.style.width = '1200px'
    element.style.maxWidth = '1200px'

    // Remove overflow restrictions that hide table content in html2canvas
    const overflowElements = element.querySelectorAll('.overflow-x-auto')
    overflowElements.forEach(el => {
      (el as HTMLElement).style.overflow = 'visible'
    })

    const sanitizedClientName = (formData.cliente || "Cotizacion").replace(/[^a-zA-Z0-9]/g, "_")
    
    const opt = {
      margin:       8, // 8mm margin on all sides
      filename:     `Cotizacion_${sanitizedClientName}_${new Date().toISOString().slice(0,10)}.pdf`,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { 
        scale: 2.5, 
        useCORS: true, 
        letterRendering: true,
        windowWidth: 1200 // Force desktop width for PDF generation to prevent mobile cut-off
      },
      jsPDF:        { unit: 'mm' as const, format: 'letter' as const, orientation: 'portrait' as const }
    }

    // Direct download and restore styles
    html2pdf().from(element).set(opt).save().then(() => {
      element.style.width = originalWidth
      element.style.maxWidth = originalMaxWidth
      overflowElements.forEach(el => {
        (el as HTMLElement).style.overflow = ''
      })
    })
  }

  // Calculations for Observation 2 (PPR): Ahorro real efectivo and Rentabilidad Real
  const pprAhorroRealEfectivo = summaryMetrics.totalPrimasPesos - summaryMetrics.beneficioFiscalTotal
  const pprRentabilidadReal = pprAhorroRealEfectivo > 0 
    ? (summaryMetrics.totalAhorroPesos / pprAhorroRealEfectivo) * 100 
    : 0

  // Find the exact age when the payments stop (indicator marker)
  const paymentDurationNum = parseInt(formData.duracion)
  const endPaymentRow = calculatedData.find(r => 
    !isNaN(paymentDurationNum) ? r.anio === paymentDurationNum : r.edad === 65
  )
  const endPaymentAge = endPaymentRow ? endPaymentRow.edad : null
  const startAge = calculatedData[0]?.edad || null

  const fetchHistory = async () => {
    setLoadingHistory(true)
    const res = await getCotizaciones()
    if (res.success) {
      setHistoryList(res.cotizaciones || [])
    }
    setLoadingHistory(false)
  }

  const loadHistoryRecord = (record: any) => {
    setFormData({
      cliente: record.cliente,
      agente: record.agente,
      telefono: record.telefono,
      producto: record.producto,
      duracion: record.duracion || "15",
      valorUdi: record.valorUdi || 8.25,
      inflacionUdi: record.inflacionUdi || 5.0,
      isr: record.isr || 35,
      coberturas: record.coberturas ? JSON.parse(record.coberturas) : { itp: false, epp: false, ma: false, mapo: false }
    })
    
    if (record.projectionData) {
      const parsedData = JSON.parse(record.projectionData)
      setCalculatedData(parsedData)
      
      const ahorroAt65Pesos = record.ahorro
      const ahorroAt65Udis = parsedData[parsedData.length - 1]?.ahorroUdis || 0
      const rendimientoAt65 = record.rendimiento
      const accumulatedPremiumPesos = record.totalPrima
      const annualPremium = record.primaAnual
      
      setSummaryMetrics({
        totalPrimasPesos: accumulatedPremiumPesos,
        totalAhorroPesos: ahorroAt65Pesos,
        totalAhorroUdis: ahorroAt65Udis,
        beneficioFiscalAnual: record.producto === "VPL PPR" ? annualPremium * ((record.isr||35) / 100) : 0,
        beneficioFiscalTotal: record.producto === "VPL PPR" ? accumulatedPremiumPesos * ((record.isr||35) / 100) : 0,
        rendimientoFinal65: rendimientoAt65
      })
      
      setSaProgression({
        y1: parsedData[0]?.saPesos || 0,
        y10: (parsedData.find((r:any) => r.anio === 10) || parsedData[parsedData.length - 1])?.saPesos || 0,
        y20: (parsedData.find((r:any) => r.anio === 20) || parsedData[parsedData.length - 1])?.saPesos || 0,
        y30: (parsedData.find((r:any) => r.anio === 30) || parsedData[parsedData.length - 1])?.saPesos || 0
      })
      
      setHasCalculated(true)
      setStep(4)
      setViewMode('EDITOR')
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
      {viewMode === 'MENU' && (
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8 animate-in fade-in zoom-in duration-300">
          <div className="text-center space-y-3">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-800 dark:text-slate-100">
              AACOM Cotizador
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Genera nuevas proyecciones o revisa tu historial de cotizaciones pasadas.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
            <Card 
              className="group cursor-pointer hover:border-teal-500 hover:shadow-xl hover:shadow-teal-500/10 transition-all duration-500 border-2"
              onClick={() => { handleResetAndNewQuote(); setViewMode('EDITOR') }}
            >
              <CardContent className="p-8 flex flex-col items-center text-center gap-4">
                <div className="h-20 w-20 bg-teal-50 dark:bg-zinc-800 text-teal-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                  <FileSpreadsheet className="h-10 w-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Nueva Cotización</h3>
                  <p className="text-slate-500 dark:text-slate-400">Calcula y genera una nueva proyección matemática desde cero.</p>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="group cursor-pointer hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-500 border-2"
              onClick={() => { setViewMode('HISTORY'); fetchHistory() }}
            >
              <CardContent className="p-8 flex flex-col items-center text-center gap-4">
                <div className="h-20 w-20 bg-indigo-50 dark:bg-zinc-800 text-indigo-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                  <RefreshCw className="h-10 w-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Mis Cotizaciones</h3>
                  <p className="text-slate-500 dark:text-slate-400">Visualiza y recupera el historial de cotizaciones que has guardado.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {viewMode === 'HISTORY' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100">Historial de Cotizaciones</h2>
              <p className="text-muted-foreground">Revisa tus proyecciones generadas recientemente.</p>
            </div>
            <Button variant="outline" onClick={() => setViewMode('MENU')} className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Regresar
            </Button>
          </div>

          <Card className="shadow-lg border-0 ring-1 ring-slate-200 dark:ring-zinc-800">
            <div className="overflow-x-auto w-full">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-zinc-800/50">
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Prima Anual</TableHead>
                    <TableHead className="text-right">Ahorro 65 (Pesos)</TableHead>
                    <TableHead className="text-center">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingHistory ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-500">Cargando historial...</TableCell>
                    </TableRow>
                  ) : historyList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-500">No tienes cotizaciones guardadas aún.</TableCell>
                    </TableRow>
                  ) : (
                    historyList.map((cot, idx) => (
                      <TableRow key={idx} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <TableCell className="font-medium">{new Date(cot.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{cot.cliente}</TableCell>
                        <TableCell>
                          <span className="bg-teal-100 text-teal-800 px-2 py-1 rounded text-xs font-bold">{cot.producto}</span>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          ${(cot.primaAnual || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right text-indigo-600 dark:text-indigo-400 font-bold">
                          ${(cot.ahorro || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button variant="default" size="sm" onClick={() => loadHistoryRecord(cot)} className="bg-indigo-600 hover:bg-indigo-700">
                            Ver Reporte
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      )}

      {viewMode === 'EDITOR' && (
        <>
          {/* Header and Step Indicator - Hidden in printing */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden animate-in fade-in duration-200">
        <div className="flex items-center gap-3">
          {/* Logo in header */}
          <img src="/logo.png" alt="AACOM Seguros" className="h-10 w-auto object-contain" />
          <div className="h-8 w-px bg-slate-300 dark:bg-zinc-700 hidden sm:block"></div>
          <div className="flex flex-col gap-0.5">
            <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">
              AACOM cotizador - Tablas de Proyección
            </h1>
            <p className="text-xs text-muted-foreground">
              Convierte archivos de aseguradoras en cotizaciones web premium e imprimibles para tus clientes.
            </p>
          </div>
        </div>

      </div>

      {/* Step Wizard Buttons - Hidden in printing */}
      <div className="flex justify-between items-center w-full bg-slate-100 dark:bg-zinc-800 p-2 rounded-xl border print:hidden">
        <div className="flex items-center gap-1 md:gap-4 w-full">
          {[
            { nr: 1, label: "Datos Generales" },
            { nr: 2, label: "Cargar Archivo" },
            { nr: 3, label: "Mapeo" },
            { nr: 4, label: "Resultados" }
          ].map((s) => (
            <div key={s.nr} className="flex-1 flex items-center">
              <button
                disabled={s.nr > 1 && fileRows.length === 0 && !hasCalculated}
                onClick={() => setStep(s.nr)}
                className={`flex items-center gap-2 p-2 rounded-lg text-xs md:text-sm font-semibold transition-all duration-300 w-full justify-center md:justify-start ${
                  step === s.nr
                    ? "bg-teal-600 text-white shadow-md"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-200 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed"
                }`}
              >
                <span className={`h-6 w-6 flex items-center justify-center rounded-full text-xs font-bold ${
                  step === s.nr ? "bg-white text-teal-600" : "bg-slate-300 dark:bg-zinc-600 text-slate-700 dark:text-slate-300"
                }`}>
                  {s.nr}
                </span>
                <span className="hidden md:inline">{s.label}</span>
              </button>
              {s.nr < 4 && <ArrowRight className="h-4 w-4 text-slate-400 mx-2 hidden md:block" />}
            </div>
          ))}
        </div>
      </div>

      {/* STAGE CONTENT */}
      
      {/* STEP 1: GENERAL DATA */}
      {step === 1 && (
        <Card className="border-t-4 border-t-teal-500 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-teal-700">
              <FileText className="h-5 w-5" /> Paso 1: Información General de la Cotización
            </CardTitle>
            <CardDescription>
              Completa los datos del cliente, producto e hipótesis financieras iniciales.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Nombre del Cliente</label>
                <Input 
                  name="cliente" 
                  value={formData.cliente} 
                  onChange={handleInputChange} 
                  placeholder="Ej. Eduardo Mendoza Garza" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Nombre del Agente</label>
                <select
                  name="agente"
                  value={formData.agente}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Nombre de Agente</option>
                  {agents.map((agentName) => (
                    <option key={agentName} value={agentName}>
                      {agentName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Teléfono del Cliente</span>
                  <span className="text-[10px] text-teal-600 bg-teal-50 px-1 py-0.5 rounded font-normal border">10 dígitos</span>
                </label>
                <Input 
                  name="telefono" 
                  value={formData.telefono} 
                  onChange={handleInputChange} 
                  placeholder="Ej. 8119098765" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 font-sans">Edad del Cliente</label>
                <Input 
                  type="number"
                  name="edadCliente" 
                  value={formData.edadCliente} 
                  onChange={handleInputChange} 
                  placeholder="Ej. 35" 
                  min="0"
                  max="99"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 font-sans">Producto</label>
                <select
                  name="producto"
                  value={formData.producto}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="VPL">VPL (Vida Pagos Limitados)</option>
                  <option value="VPL PPR">VPL PPR (Plan Personal de Retiro)</option>
                  <option value="Insignia Life Universal">Insignia Life Universal</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Forma de Pago Cotizada</label>
                <select
                  name="formaDePagoCotizada"
                  value={formData.formaDePagoCotizada}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {formData.producto === "Insignia Life Universal" ? (
                    <>
                      <option value="Anual">Anual</option>
                      <option value="Semestral">Semestral</option>
                      <option value="Trimestral">Trimestral</option>
                      <option value="Mensual">Mensual</option>
                    </>
                  ) : (
                    <>
                      <option value="Meses sin intereses">Meses sin intereses</option>
                      <option value="Anual">Anual</option>
                    </>
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Plazo / Edad de Retiro</label>
                <select
                  name="duracion"
                  value={formData.duracion}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {formData.producto === "Insignia Life Universal" ? (
                    <>
                      <option value="20">20 Años</option>
                      <option value="EA65">Edad Alcanzada 65</option>
                    </>
                  ) : (
                    <>
                      <option value="5">5 Años</option>
                      <option value="10">10 Años</option>
                      <option value="15">15 Años</option>
                      <option value="20">20 Años</option>
                      <option value="25">25 Años</option>
                      <option value="EA65">Edad Alcanzada 65 (Jubilación)</option>
                    </>
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Valor Inicial UDI</label>
                <Input 
                  type="number" 
                  step="0.0001" 
                  name="valorUdi" 
                  value={formData.valorUdi} 
                  onChange={handleInputChange} 
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    Inflación UDI Anual (%) 
                    <span className="text-[10px] text-teal-600 bg-teal-50 dark:bg-zinc-800 dark:text-teal-400 px-1.5 py-0.5 rounded font-normal border border-teal-200">Rango: 4% - 5%</span>
                  </label>
                </div>
                <Input 
                  type="number" 
                  step="0.1" 
                  min="4.0" 
                  max="5.0" 
                  name="inflacionUdi" 
                  value={formData.inflacionUdi} 
                  onChange={handleInputChange}
                  onBlur={handleInflationBlur}
                />
              </div>

              {formData.producto === "VPL PPR" && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    Tasa de Impuestos / ISR (%)
                    <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-normal border border-amber-200">Default 35%</span>
                  </label>
                  <select
                    name="isr"
                    value={formData.isr}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="10">10%</option>
                    <option value="15">15%</option>
                    <option value="20">20%</option>
                    <option value="25">25%</option>
                    <option value="30">30%</option>
                    <option value="35">35% (Recomendado)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Checkboxes for Coverages */}
            <div className="space-y-3 pt-4 border-t">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Coberturas Adicionales</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { key: "itp", label: "Invalidez Total y Permanente (ITP)", code: "ITP" },
                  { key: "epp", label: formData.producto === "Insignia Life Universal" ? "Beneficio de Exención de cobro de seguro (BECS)" : "Exención de Pago Primas por ITP (EPP)", code: formData.producto === "Insignia Life Universal" ? "BECS" : "EPP" },
                  { key: "ma", label: "Muerte Accidental (MA)", code: "MA" },
                  { key: "mapo", label: "Muerte Accidental con Pérdidas Orgánicas (MAPO)", code: "MAPO" }
                ].map((cov) => (
                  <div
                    key={cov.key}
                    onClick={() => handleCheckboxChange(cov.key as keyof FormData["coberturas"])}
                    className={`flex flex-col justify-between p-3 rounded-xl border-2 cursor-pointer transition-all duration-300 select-none ${
                      formData.coberturas[cov.key as keyof FormData["coberturas"]]
                        ? "border-teal-500 bg-teal-50/50 dark:bg-teal-950/20"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-bold text-teal-600 bg-teal-50 dark:bg-zinc-800 dark:text-teal-400 px-2 py-0.5 rounded border border-teal-200">
                        {cov.code}
                      </span>
                      <input
                        type="checkbox"
                        checked={formData.coberturas[cov.key as keyof FormData["coberturas"]]}
                        readOnly
                        className="rounded text-teal-600 focus:ring-teal-500 h-4 w-4 pointer-events-none"
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-3 leading-tight">
                      {cov.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleProceedToStep2} className="bg-teal-600 hover:bg-teal-700 text-white w-full md:w-auto px-8">
                Continuar a Carga <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: LOAD SHEET FILE */}
      {step === 2 && (
        <Card className="border-t-4 border-t-teal-500 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-teal-700">
              <Upload className="h-5 w-5" /> Paso 2: Cargar Archivo de Proyección
            </CardTitle>
            <CardDescription>
              Sube el archivo Excel o CSV descargado del cotizador oficial de tu aseguradora.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ${
                dragActive 
                  ? "border-teal-500 bg-teal-50 dark:bg-zinc-800/40" 
                  : file 
                    ? "border-emerald-400 bg-emerald-50/20 dark:bg-emerald-950/10" 
                    : "border-slate-300 hover:border-teal-400 hover:bg-slate-50 dark:hover:bg-zinc-800/20"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInput}
                className="hidden"
                accept=".xlsx, .xlsm, .xls, .csv"
              />
              
              {file ? (
                <div className="space-y-3">
                  <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <FileSpreadsheet className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{file.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-200 font-semibold mx-auto">
                    <Check className="h-3.5 w-3.5" /> Archivo cargado correctamente
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="h-16 w-16 bg-teal-50 dark:bg-zinc-800 text-teal-600 dark:text-teal-400 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <Upload className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Arrastra y suelta tu archivo aquí</p>
                    <p className="text-xs text-muted-foreground mt-1">o haz clic para explorar en tu ordenador</p>
                  </div>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Formatos soportados: Excel (.xlsx, .xlsm, .xls) o texto delimitado por comas (.csv)
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)} className="px-6">
                <ArrowLeft className="mr-2 h-4 w-4" /> Atrás
              </Button>
              
              <Button 
                disabled={!file} 
                onClick={() => setStep(3)} 
                className="bg-teal-600 hover:bg-teal-700 text-white px-8 disabled:opacity-50"
              >
                Continuar a Mapeo <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: MAPPING COLUMNS */}
      {step === 3 && (
        <Card className="border-t-4 border-t-teal-500 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-teal-700">
              <MapPin className="h-5 w-5" /> Paso 3: Mapeo de Columnas de Datos
            </CardTitle>
            <CardDescription>
              Asigna qué columna de tu archivo cargado corresponde a cada dato clave de proyección.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Mapping Selectors grid */}
            <div className="bg-slate-50 dark:bg-zinc-800/30 p-5 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {[
                { key: "anios", label: "Años Póliza", desc: "Progreso anual", icon: TrendingUp },
                { key: "edad", label: "Edad", desc: "Edad del cliente", icon: HelpCircle },
                { key: "prima", label: formData.producto === "Insignia Life Universal" ? "Prima Total ($)" : "Prima Anual ($)", desc: "Aportación anual", icon: PiggyBank },
                { key: "sa", label: formData.producto === "Insignia Life Universal" ? "Protección ($)" : "Suma Asegurada ($)", desc: "Cobertura", icon: Percent },
                { key: "valores", label: formData.producto === "Insignia Life Universal" ? "Aportación Acumulada" : "Valores Garantizados", desc: "Rescate / Ahorro", icon: Check },
                ...(formData.producto === "Insignia Life Universal" ? [
                  { key: "primaProteccion", label: "Prima Protec.", desc: "Costo protección", icon: CheckSquare },
                  { key: "primaAhorro", label: "Prima Ahorro", desc: "Destinado a ahorro", icon: CheckSquare },
                  { key: "fondoDisponible", label: "Fondo Disponible", desc: "Fondo proyectado", icon: CheckSquare },
                  { key: "recuperacion", label: "Recuperación %", desc: "Recuperación sobre fondo", icon: Percent }
                ] : [])
              ].map((field) => {
                const isMapped = mapping[field.key as keyof ColumnMapping] !== -1
                
                return (
                  <div key={field.key} className="space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <field.icon className="h-4 w-4 text-teal-600" />
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-100">{field.label}</label>
                      </div>
                      <span className="text-[10px] text-muted-foreground block mb-2 leading-tight">
                        {field.desc}
                      </span>
                    </div>

                    <select
                      value={mapping[field.key as keyof ColumnMapping]}
                      onChange={(e) => handleMappingChange(field.key as keyof ColumnMapping, parseInt(e.target.value))}
                      className={`flex h-10 w-full rounded-md border bg-background px-2 py-1.5 text-xs font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                        isMapped 
                          ? "border-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/20" 
                          : "border-orange-300 dark:border-orange-800"
                      }`}
                    >
                      <option value="-1">-- Seleccionar Columna --</option>
                      {fileHeaders.map((header, idx) => (
                        <option key={idx} value={idx}>
                          {header}
                        </option>
                      ))}
                    </select>
                    
                    {!isMapped && (
                      <span className="text-[9px] text-orange-500 font-semibold flex items-center gap-0.5">
                        <ShieldAlert className="h-3 w-3" /> Requiere mapeo
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Excel Preview (First 5 Rows) */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Previsualización de los datos cargados:
              </h3>
              <div className="border rounded-xl overflow-hidden shadow-sm max-h-60 overflow-y-auto">
                <Table>
                  <TableHeader className="bg-slate-100 dark:bg-zinc-800 sticky top-0">
                    <TableRow>
                      {fileHeaders.map((header, idx) => {
                        // Highlight mapped headers
                        let isMapped = false
                        let mapName = ""
                        Object.entries(mapping).forEach(([key, val]) => {
                          if (val === idx) {
                            isMapped = true
                            if (key === "anios") mapName = "Años"
                            else if (key === "edad") mapName = "Edad"
                            else if (key === "prima") mapName = "Prima"
                            else if (key === "sa") mapName = "SA"
                            else if (key === "valores") mapName = "Valores"
                            else if (key === "fondoDisponible") mapName = "Fondo"
                            else if (key === "recuperacion") mapName = "Recuperación"
                            else if (key === "primaProteccion") mapName = "Pr.Prot"
                            else if (key === "primaAhorro") mapName = "Pr.Ahor"
                          }
                        })
                        
                        return (
                          <TableHead key={idx} className={`text-xs py-2 px-3 font-semibold ${isMapped ? "bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-200 border-x border-teal-200 dark:border-teal-900" : ""}`}>
                            <div className="flex flex-col">
                              <span>{header}</span>
                              {isMapped && (
                                <span className="text-[8px] bg-teal-600 text-white font-bold px-1.5 py-0.5 rounded mt-0.5 self-start uppercase tracking-wider">
                                  {mapName}
                                </span>
                              )}
                            </div>
                          </TableHead>
                        )
                      })}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fileRows.slice(0, 5).map((row, rowIdx) => (
                      <TableRow key={rowIdx}>
                        {fileHeaders.map((_, colIdx) => (
                          <TableCell key={colIdx} className="text-xs py-2 px-3">
                            {row[colIdx] !== undefined ? String(row[colIdx]) : ""}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-[10px] text-muted-foreground italic">
                Mostrando únicamente las primeras 5 filas del archivo para fines de mapeo.
              </p>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(2)} className="px-6">
                <ArrowLeft className="mr-2 h-4 w-4" /> Atrás
              </Button>
              
              <Button 
                disabled={
                  formData.producto === "Insignia Life Universal"
                    ? (mapping.anios === -1 || mapping.prima === -1 || mapping.sa === -1 || mapping.valores === -1 || mapping.fondoDisponible === -1 || mapping.recuperacion === -1 || mapping.primaProteccion === -1 || mapping.primaAhorro === -1)
                    : (mapping.anios === -1 || mapping.prima === -1 || mapping.sa === -1 || mapping.valores === -1)
                } 
                onClick={calculateResults} 
                className="bg-teal-600 hover:bg-teal-700 text-white px-8 disabled:opacity-50"
              >
                Generar Tablas <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 4: CALCULATION RESULTS & PDF (High impact styled!) */}
      {step === 4 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Quick Toolbar - Hidden in Printing - Correction 10: Separated buttons */}
          <div className="flex justify-between items-center w-full bg-slate-100 dark:bg-zinc-800 p-3 rounded-xl border print:hidden">
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => setStep(3)} className="px-5">
                <ArrowLeft className="mr-2 h-4 w-4" /> Reajustar Mapeo
              </Button>
              
              <Button 
                variant="secondary" 
                onClick={handleResetAndNewQuote} 
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-zinc-700 dark:text-slate-200 px-5 font-bold flex items-center gap-1.5 border border-slate-300"
              >
                <RefreshCw className="h-4 w-4" /> Hacer nueva cotización
              </Button>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Button 1: Download PDF (Direct Download - Observation 1) */}
              <Button onClick={handleDownloadPdf} className="bg-teal-600 hover:bg-teal-700 text-white px-6 font-bold shadow flex items-center gap-1.5">
                <Download className="h-4.5 w-4.5" /> Descargar en PDF
              </Button>
              
              {/* Button 2: Print Quote */}
              <Button onClick={handlePrint} variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50 px-6 font-semibold flex items-center gap-1.5">
                <Printer className="h-4.5 w-4.5" /> Imprimir Cotización
              </Button>
            </div>
          </div>

          {/* PRINT CONTAINER START */}
          <div id="printable-report" className="space-y-6 bg-white dark:bg-zinc-950 p-0 md:p-6 print:p-0 rounded-2xl print:border-0 border shadow-md print:shadow-none print:text-black">
            
            {/* PRINT LOGO & TITLE HEADER */}
            <div className="border-b-2 border-teal-500 pb-4 flex flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-teal-600 uppercase tracking-widest block">
                  Propuesta Técnica Comercial
                </span>
                <h2 className="text-2xl font-extrabold text-slate-800 print:text-black">
                  Análisis Financiero de {formData.producto}
                </h2>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-slate-500">
                  <span><strong>Cliente:</strong> {formData.cliente || "No Especificado"}</span>
                  <span>•</span>
                  <span><strong>Teléfono:</strong> {formData.telefono || "No Especificado"}</span>
                  <span>•</span>
                  <span><strong>Fecha:</strong> {new Date().toLocaleDateString("es-MX", { timeZone: 'America/Mexico_City',  day: "numeric", month: "long", year: "numeric" })}</span>
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                {/* Logo of AACOM Seguros integrated in the PDF header */}
                <img src="/logo.png" alt="AACOM Seguros" className="h-10 w-auto object-contain mb-1" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wide">AACOM cotizador</span>
                <span className="text-[10px] text-slate-400"><strong>Agente:</strong> {formData.agente || "No Especificado"}</span>
              </div>
            </div>

            {/* TOP METRIC CARDS (Corrected calculations at age 65 and total ISR) */}
            <div className={`grid gap-4 print:gap-2 ${formData.producto.includes("PPR") ? "grid-cols-2 lg:grid-cols-5" : "grid-cols-2 lg:grid-cols-4"}`}>
              <Card className="shadow-sm border-slate-100 bg-slate-50/50 print:bg-white print:border">
                <CardContent className="p-4 print:p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase">Ahorro a Edad 65</span>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded leading-none">Hito 65</span>
                  </div>
                  <span className="text-lg md:text-2xl font-black text-emerald-600 block mt-1.5">
                    ${summaryMetrics.totalAhorroPesos.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-[9px] md:text-xs font-semibold text-slate-400 block mt-0.5">
                    ({summaryMetrics.totalAhorroUdis.toLocaleString("es-MX", { maximumFractionDigits: 0 })} UDIS proyectadas)
                  </span>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-slate-100 bg-slate-50/50 print:bg-white print:border">
                <CardContent className="p-4 print:p-2.5">
                  <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase block">Aportación Total</span>
                  <span className="text-lg md:text-2xl font-black text-slate-800 print:text-black block mt-2">
                    ${summaryMetrics.totalPrimasPesos.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-[9px] md:text-xs font-medium text-slate-400 block mt-1">
                    Suma total de aportaciones
                  </span>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-slate-100 bg-slate-50/50 print:bg-white print:border">
                <CardContent className="p-4 print:p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase">Rendimiento a Edad 65</span>
                    <span className="text-[9px] bg-teal-100 text-teal-800 font-bold px-1.5 py-0.5 rounded leading-none">Retorno</span>
                  </div>
                  <span className="text-lg md:text-2xl font-black text-teal-600 block mt-1.5">
                    {summaryMetrics.rendimientoFinal65.toFixed(1)}%
                  </span>
                  <span className="text-[9px] md:text-xs font-semibold text-slate-400 block mt-0.5">
                    Multiplicador total del ahorro
                  </span>
                </CardContent>
              </Card>

              {formData.producto.includes("PPR") && (
                <>
                  <Card className="shadow-sm border-slate-100 bg-slate-50/50 print:bg-white print:border">
                    <CardContent className="p-4 print:p-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase">Beneficio Fiscal PPR</span>
                        <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded leading-none">ISR {formData.isr}%</span>
                      </div>
                      <span className="text-lg md:text-2xl font-black text-teal-700 print:text-black block mt-1.5">
                        ${summaryMetrics.beneficioFiscalTotal.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                      </span>
                      <span className="text-[9px] md:text-xs font-bold text-emerald-600 block mt-0.5">
                        Ahorro fiscal acumulado total
                      </span>
                    </CardContent>
                  </Card>

                  {/* Observation 2 (PPR): New Metric "Ahorro real efectivo" Card */}
                  <Card className="shadow-sm border-teal-200 bg-teal-50/30 print:bg-white print:border">
                    <CardContent className="p-4 print:p-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase">Ahorro real efectivo</span>
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded leading-none">Costo Neto</span>
                      </div>
                      <span className="text-lg md:text-2xl font-black text-teal-800 print:text-black block mt-1.5">
                        ${pprAhorroRealEfectivo.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                      </span>
                      <span className="text-[9px] md:text-xs font-bold text-emerald-600 block mt-0.5">
                        % Real de Rentabilidad: {pprRentabilidadReal.toFixed(1)}%
                      </span>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            {/* PRODUCT SPECIFICS, COVERAGES AND SA PROGRESSION */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 print:gap-4">
              
              {/* Product and Hipotesis */}
              <div className="md:col-span-5 space-y-4 flex flex-col">
                <Card className="border shadow-none flex-1">
                  <CardHeader className="py-3 px-4 bg-slate-50/50 border-b">
                    <CardTitle className="text-xs font-black text-slate-700 uppercase tracking-widest">
                      Parámetros de Proyección
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 text-xs space-y-2">
                    <div className="flex justify-between border-b pb-1.5">
                      <span className="text-slate-500 font-medium">Producto</span>
                      <span className="font-bold text-slate-800 print:text-black">{formData.producto}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1.5">
                      <span className="text-slate-500 font-medium">Forma de Pago</span>
                      <span className="font-bold text-slate-800 print:text-black">{formData.formaDePagoCotizada}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1.5">
                      <span className="text-slate-500 font-medium">Plazo de Pago / Duración</span>
                      <span className="font-bold text-slate-800 print:text-black">
                        {formData.duracion === "EA65" ? "Edad Alcanzada 65 Años" : `${formData.duracion} Años`}
                      </span>
                    </div>
                    <div className="flex justify-between border-b pb-1.5">
                      <span className="text-slate-500 font-medium">Valor de la UDI Inicial</span>
                      <span className="font-bold text-slate-800 print:text-black">${formData.valorUdi.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1.5">
                      <span className="text-slate-500 font-medium">Inflación de UDI Proyectada</span>
                      <span className="font-bold text-teal-600 print:text-black">{formData.inflacionUdi.toFixed(1)}% anual</span>
                    </div>
                    {formData.producto.includes("PPR") && (
                      <div className="flex justify-between pb-0.5">
                        <span className="text-slate-500 font-medium">Tasa de Deducción de ISR</span>
                        <span className="font-bold text-slate-800 print:text-black">{formData.isr}%</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Correction 8: Suma Asegurada (SA) Progression Timeline every 10 years */}
                <Card className="border shadow-none">
                  <CardHeader className="py-3 px-4 bg-slate-50/50 border-b">
                    <CardTitle className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-teal-600" /> Crecimiento Suma Asegurada (Pesos)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 text-xs">
                    <div className="relative border-l border-teal-200 pl-4 space-y-2">
                      <div className="relative">
                        <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-teal-600"></span>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500">Año 1 (Inicial)</span>
                          <span className="font-bold text-slate-800 print:text-black">${saProgression.y1.toLocaleString("es-MX", {maximumFractionDigits:0})}</span>
                        </div>
                      </div>
                      {saProgression.y10 > 0 && (
                        <div className="relative">
                          <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-teal-600"></span>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-500">Año 10</span>
                            <span className="font-bold text-slate-800 print:text-black">${saProgression.y10.toLocaleString("es-MX", {maximumFractionDigits:0})}</span>
                          </div>
                        </div>
                      )}
                      {saProgression.y20 > 0 && (
                        <div className="relative">
                          <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-teal-600"></span>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-500">Año 20</span>
                            <span className="font-bold text-slate-800 print:text-black">${saProgression.y20.toLocaleString("es-MX", {maximumFractionDigits:0})}</span>
                          </div>
                        </div>
                      )}
                      {saProgression.y30 > 0 && (
                        <div className="relative">
                          <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-teal-600"></span>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-500">Año 30</span>
                            <span className="font-bold text-slate-800 print:text-black">${saProgression.y30.toLocaleString("es-MX", {maximumFractionDigits:0})}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Observation 4: Explanatory legend PROTECCIÓN below Suma Asegurada table */}
                    <div className="text-[10px] text-slate-500 font-medium mt-3 border-t pt-2 flex items-center gap-2 select-none">
                      <span className="text-[9px] bg-teal-600 text-white font-extrabold px-1.5 py-0.5 rounded tracking-widest uppercase">
                        PROTECCIÓN
                      </span>
                      <span>Monto de cobertura por fallecimiento garantizado.</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Financial chart */}
              <div className="md:col-span-7 border rounded-2xl p-4 flex flex-col justify-between min-h-64 shadow-none print:break-inside-avoid">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black text-slate-700 uppercase tracking-widest">
                    Crecimiento del Ahorro Garantizado vs Aportación
                  </span>
                  <span className="text-[10px] text-muted-foreground">Proyección en Pesos</span>
                </div>
                
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={calculatedData}
                      margin={{ top: 5, right: 5, left: 10, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="colorAhorro" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.01}/>
                        </linearGradient>
                        <linearGradient id="colorAportado" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#64748b" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#64748b" stopOpacity={0.01}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
                      {/* Shading/ReferenceArea for payment period */}
                      {endPaymentAge && startAge && (
                        <ReferenceArea
                          x1={startAge}
                          x2={endPaymentAge}
                          fill="#3b82f6"
                          fillOpacity={0.06}
                          label={{
                            value: "Periodo de Pago",
                            position: "insideBottomLeft",
                            fill: "#1e3a8a",
                            fontSize: 10,
                            fontWeight: "bold",
                            opacity: 0.6
                          }}
                        />
                      )}
                      {/* Vertical line marker at Fin de Aportaciones */}
                      {endPaymentAge && (
                        <ReferenceLine
                          x={endPaymentAge}
                          stroke="#1e3a8a"
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          label={{
                            value: `Fin de Aportaciones (Edad ${endPaymentAge})`,
                            position: "top",
                            fill: "#1e3a8a",
                            fontSize: 10,
                            fontWeight: "black"
                          }}
                        />
                      )}
                      <XAxis 
                        dataKey="edad" 
                        tickLine={false} 
                        axisLine={false} 
                        tick={{ fontSize: 10 }} 
                        label={{ value: 'Edad del Cliente', position: 'insideBottom', offset: -2, fontSize: 10, fill: '#64748b' }}
                        tickFormatter={(v) => `${v}`}
                      />
                      <YAxis 
                        tickLine={false} 
                        axisLine={false} 
                        tick={{ fontSize: 10 }} 
                        tickFormatter={(v) => {
                          if (v >= 1000000) return `$${(v/1000000).toFixed(1)}M`
                          if (v >= 1000) return `$${(v/1000).toFixed(0)}k`
                          return `$${v}`
                        }} 
                      />
                      <Tooltip 
                        labelFormatter={(label) => `Edad: ${label}`}
                        formatter={(value: any) => [`$${value.toLocaleString("es-MX", {maximumFractionDigits:0})}`, ""]} 
                      />
                      <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                      <Area name="Ahorro Garantizado ($)" type="monotone" dataKey="valoresPesos" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAhorro)" />
                      <Area name="Aportación Acumulada ($)" type="monotone" dataKey="accumulatedPremiumPesos" stroke="#64748b" strokeWidth={1.5} fillOpacity={1} fill="url(#colorAportado)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* MAIN CALCULATION RESULTS TABLE */}
            <div className="space-y-3 print:block">
              <div className="flex items-center justify-between border-b pb-1">
                <div className="flex items-center gap-2">
                  <img src="/logo.png" alt="AACOM" className="h-5 w-auto object-contain hidden print:block" />
                  <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">
                    Tabla de Proyección de Beneficios Garantizados Completa
                  </h3>
                </div>
                <span className="text-[10px] text-muted-foreground">Valores calculados en tiempo real.</span>
              </div>
              
              <div className="border rounded-2xl overflow-hidden shadow-sm table-container">
                <Table className="w-full text-xs">
                  <TableHeader>
                    <TableRow className="bg-[#87D1B5] hover:bg-[#87D1B5]">
                      <TableHead className="font-black text-white text-center py-2.5">Año</TableHead>
                      <TableHead className="font-black text-white text-center py-2.5">Edad</TableHead>
                      {formData.producto === "Insignia Life Universal" ? (
                        <>
                          <TableHead className="font-black text-white text-center py-2.5">Protección</TableHead>
                          <TableHead className="font-black text-white text-center py-2.5">Prima de Protección</TableHead>
                          <TableHead className="font-black text-white text-center py-2.5">Prima de Ahorro</TableHead>
                          <TableHead className="font-black text-white text-center py-2.5">Prima Total</TableHead>
                          <TableHead className="font-black text-white text-center py-2.5">Aportación Acumulada</TableHead>
                          <TableHead className="font-black text-white text-center py-2.5">Fondo Disponible</TableHead>
                          <TableHead className="font-black text-white text-center py-2.5">Recuperación</TableHead>
                        </>
                      ) : (
                        <>
                          <TableHead className="font-black text-white text-center py-2.5">Valor UDI</TableHead>
                          <TableHead className="font-black text-white text-center py-2.5">Prima en UDIS</TableHead>
                          <TableHead className="font-black text-white text-center py-2.5">Prima en Pesos</TableHead>
                          <TableHead className="font-black text-white text-center py-2.5">SA en UDIS</TableHead>
                          <TableHead className="font-black text-white text-center py-2.5">SA en Pesos</TableHead>
                          <TableHead className="font-black text-white text-center py-2.5">Ahorro UDIS</TableHead>
                          <TableHead className="font-black text-white text-center py-2.5">Ahorro Pesos</TableHead>
                          <TableHead className="font-black text-white text-center py-2.5">Rendimiento</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calculatedData.map((row, idx) => {
                      
                      // Highlight logic matching Excel:
                      // Alternating rows in very light grey
                      let rowStyle = "bg-white text-slate-800"
                      if (idx % 2 === 0) rowStyle = "bg-slate-50/40 text-slate-800"
                      
                      // Observation 3: Blue row highlight ONLY in the year the payment ends (Dark Blue with White Text)
                      const paymentDurationNum = parseInt(formData.duracion)
                      const isPaymentEndRow = !isNaN(paymentDurationNum)
                        ? row.anio === paymentDurationNum
                        : (formData.duracion === "EA65" && row.edad === 65)

                      const isGreenRow = row.edad === 65 && !isPaymentEndRow

                      if (isPaymentEndRow) {
                        rowStyle = "bg-[#1e3a8a] text-white hover:bg-[#172554] font-black border-y-2 border-teal-500 print-row-blue"
                      } else if (isGreenRow) {
                        // Age 65 in Green
                        rowStyle = "bg-[#77ac52] text-white hover:bg-[#6b9a4a] font-bold print-row-green"
                      }

                      // Helper to ensure cells have perfect white color on highlighted rows for high contrast
                      const cellClass = (baseClass: string, colorClass: string) => {
                        if (isPaymentEndRow || isGreenRow) {
                          return `${baseClass} text-white font-bold`
                        }
                        return `${baseClass} ${colorClass}`
                      }

                      return (
                        <TableRow 
                          key={idx} 
                          className={`transition-colors duration-150 border-b ${rowStyle} hover:bg-slate-100/40`}
                        >
                          <TableCell className={cellClass("text-center py-2 font-medium", "text-slate-800")}>{row.anio}</TableCell>
                          <TableCell className={cellClass("text-center py-2", "text-slate-800")}>{row.edad}</TableCell>
                          {formData.producto === "Insignia Life Universal" ? (
                            <>
                              <TableCell className={cellClass("text-center py-2 font-semibold", "text-slate-800")}>
                                ${row.saPesos.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                              </TableCell>
                              <TableCell className={cellClass("text-center py-2 font-medium", "text-slate-800")}>
                                ${row.primaProteccionPesos?.toLocaleString("es-MX", { maximumFractionDigits: 0 }) || "0"}
                              </TableCell>
                              <TableCell className={cellClass("text-center py-2 font-medium", "text-slate-800")}>
                                ${row.primaAhorroPesos?.toLocaleString("es-MX", { maximumFractionDigits: 0 }) || "0"}
                              </TableCell>
                              <TableCell className={cellClass("text-center py-2 font-bold", "text-slate-800")}>
                                ${row.primaPesos.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                              </TableCell>
                              <TableCell className={cellClass("text-center py-2 font-semibold", "text-slate-700")}>
                                ${row.valoresPesos.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                              </TableCell>
                              <TableCell className={cellClass("text-center py-2 font-bold", "text-emerald-600 print:text-black")}>
                                ${row.fondoDisponiblePesos?.toLocaleString("es-MX", { maximumFractionDigits: 0 }) || "0"}
                              </TableCell>
                              <TableCell className={cellClass("text-center py-2 font-semibold", "text-teal-700 print:text-black")}>
                                {row.recuperacionSobreFondo ? `${(row.recuperacionSobreFondo * 100).toFixed(1)}%` : "0%"}
                              </TableCell>
                            </>
                          ) : (
                            <>
                              <TableCell className={cellClass("text-center py-2", "text-slate-600 print:text-black")}>
                                {row.udiValue.toFixed(4)}
                              </TableCell>
                              <TableCell className={cellClass("text-center py-2 font-semibold", "text-slate-800")}>
                                {row.primaUdis.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                              </TableCell>
                              <TableCell className={cellClass("text-center py-2 font-medium", "text-slate-800")}>
                                ${row.primaPesos.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                              </TableCell>
                              <TableCell className={cellClass("text-center py-2", "text-slate-800")}>
                                {row.saUdis.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                              </TableCell>
                              <TableCell className={cellClass("text-center py-2 font-semibold", "text-slate-800")}>
                                ${row.saPesos.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                              </TableCell>
                              <TableCell className={cellClass("text-center py-2 font-semibold", "text-teal-700 print:text-black")}>
                                {row.ahorroUdis.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                              </TableCell>
                              <TableCell className={cellClass("text-center py-2 font-bold", "text-emerald-600 print:text-black")}>
                                ${row.valoresPesos.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                              </TableCell>
                              <TableCell className={cellClass("text-center py-2 font-semibold", "text-slate-700 print:text-black")}>
                                {(row.rendimiento * 100).toFixed(1)}%
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Observation 5: Always render the coverages summary as a Table */}
            <div className="bg-slate-50 border p-5 rounded-2xl print:break-inside-avoid">
              <span className="text-[10px] font-black text-slate-500 uppercase block tracking-wider mb-3">
                Coberturas Amparadas en esta Propuesta
              </span>
              <div className="border rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
                <Table className="w-full text-xs">
                  <TableHeader className="bg-slate-100 dark:bg-zinc-800">
                    <TableRow>
                      <TableHead className="font-bold text-slate-700 dark:text-slate-300 py-2">Cobertura</TableHead>
                      <TableHead className="font-bold text-slate-700 dark:text-slate-300 py-2 text-center">Tipo</TableHead>
                      <TableHead className="font-bold text-slate-700 dark:text-slate-300 py-2 text-center">Suma Asegurada Inicial</TableHead>
                      <TableHead className="font-bold text-slate-700 dark:text-slate-300 py-2 text-center">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="hover:bg-slate-50 dark:hover:bg-zinc-800 border-b">
                      <TableCell className="font-bold py-2 text-slate-800 dark:text-slate-200">
                        Fallecimiento (Cobertura Base)
                      </TableCell>
                      <TableCell className="text-center py-2">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-700 text-slate-700 dark:text-slate-300 text-[10px] font-semibold">
                          Básica
                        </span>
                      </TableCell>
                      <TableCell className="text-center py-2 font-semibold text-slate-700 dark:text-slate-300">
                        ${saProgression.y1.toLocaleString("es-MX", {maximumFractionDigits:0})} MXN
                      </TableCell>
                      <TableCell className="text-center py-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 text-[10px] font-bold">
                          <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" /> Amparada
                        </span>
                      </TableCell>
                    </TableRow>
                    
                    {formData.coberturas.itp && (
                      <TableRow className="hover:bg-slate-50 dark:hover:bg-zinc-800 border-b">
                        <TableCell className="font-bold py-2 text-slate-800 dark:text-slate-200">
                          Invalidez Total y Permanente (ITP)
                        </TableCell>
                        <TableCell className="text-center py-2">
                          <span className="px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 text-[10px] font-semibold border border-teal-200/50 dark:border-teal-900/50">
                            Adicional
                          </span>
                        </TableCell>
                        <TableCell className="text-center py-2 font-semibold text-slate-700 dark:text-slate-300">
                          ${saProgression.y1.toLocaleString("es-MX", {maximumFractionDigits:0})} MXN
                        </TableCell>
                        <TableCell className="text-center py-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 text-[10px] font-bold">
                            <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" /> Amparada
                          </span>
                        </TableCell>
                      </TableRow>
                    )}

                    {formData.coberturas.epp && (
                      <TableRow className="hover:bg-slate-50 dark:hover:bg-zinc-800 border-b">
                        <TableCell className="font-bold py-2 text-slate-800 dark:text-slate-200">
                          Exención de Pago de Primas por ITP (EPP)
                        </TableCell>
                        <TableCell className="text-center py-2">
                          <span className="px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 text-[10px] font-semibold border border-teal-200/50 dark:border-teal-900/50">
                            Adicional
                          </span>
                        </TableCell>
                        <TableCell className="text-center py-2 font-semibold text-slate-700 dark:text-slate-300">
                          Exención de Aportaciones
                        </TableCell>
                        <TableCell className="text-center py-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 text-[10px] font-bold">
                            <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" /> Amparada
                          </span>
                        </TableCell>
                      </TableRow>
                    )}

                    {formData.coberturas.ma && (
                      <TableRow className="hover:bg-slate-50 dark:hover:bg-zinc-800">
                        <TableCell className="font-bold py-2 text-slate-800 dark:text-slate-200">
                          Muerte Accidental (MA)
                        </TableCell>
                        <TableCell className="text-center py-2">
                          <span className="px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 text-[10px] font-semibold border border-teal-200/50 dark:border-teal-900/50">
                            Adicional
                          </span>
                        </TableCell>
                        <TableCell className="text-center py-2 font-semibold text-slate-700 dark:text-slate-300">
                          ${saProgression.y1.toLocaleString("es-MX", {maximumFractionDigits:0})} MXN
                        </TableCell>
                        <TableCell className="text-center py-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 text-[10px] font-bold">
                            <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" /> Amparada
                          </span>
                        </TableCell>
                      </TableRow>
                    )}

                    {formData.coberturas.mapo && (
                      <TableRow className="hover:bg-slate-50 dark:hover:bg-zinc-800 border-t">
                        <TableCell className="font-bold py-2 text-slate-800 dark:text-slate-200">
                          Muerte Accidental con Pérdidas Orgánicas (MAPO)
                        </TableCell>
                        <TableCell className="text-center py-2">
                          <span className="px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 text-[10px] font-semibold border border-teal-200/50 dark:border-teal-900/50">
                            Adicional
                          </span>
                        </TableCell>
                        <TableCell className="text-center py-2 font-semibold text-slate-700 dark:text-slate-300">
                          ${saProgression.y1.toLocaleString("es-MX", {maximumFractionDigits:0})} MXN
                        </TableCell>
                        <TableCell className="text-center py-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 text-[10px] font-bold">
                            <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" /> Amparada
                          </span>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* BENEFICIO FISCAL HIGHLIGHT (If PPR) */}
            {formData.producto.includes("PPR") && (
              <div className="bg-teal-50/40 border border-teal-200 p-5 rounded-2xl space-y-2 print:break-inside-avoid print:bg-white print:border-slate-300">
                <div className="flex items-center gap-2">
                  <Percent className="h-5 w-5 text-teal-700 print:text-black" />
                  <h4 className="text-sm font-black text-teal-800 print:text-black uppercase tracking-wider">
                    Detalle del Beneficio Fiscal Especial (PPR - Art 151 LISR)
                  </h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Dado que elegiste un plan de **Retiro Deductible (PPR)**, cada aportación que realizas se deduce directamente de tu base gravable anual. Considerando tu tasa de impuestos marginal recomendada de **{formData.isr}%**:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="border bg-white p-3.5 rounded-xl text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Ahorro Fiscal en tu Próxima Declaración</span>
                    <span className="text-xl font-extrabold text-teal-700 block mt-1">
                      ${summaryMetrics.beneficioFiscalAnual.toLocaleString("es-MX", { maximumFractionDigits: 0 })} pesos
                    </span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Retorno inmediato en el año 1</span>
                  </div>
                  <div className="border bg-white p-3.5 rounded-xl text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Ahorro Fiscal Acumulado Total</span>
                    <span className="text-xl font-extrabold text-emerald-600 block mt-1">
                      ${summaryMetrics.beneficioFiscalTotal.toLocaleString("es-MX", { maximumFractionDigits: 0 })} pesos
                    </span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Inyección de capital total devuelto por el SAT</span>
                  </div>
                </div>
              </div>
            )}

            {/* REPORT FOOTER */}
            <div className="border-t pt-4 flex flex-col md:flex-row justify-between items-center text-[10px] text-slate-400 gap-2 print:border-t-slate-300">
              <span>* Esta cotización representa una proyección ilustrativa y no constituye un contrato definitivo.</span>
              <div className="flex items-center gap-1 font-semibold text-slate-500 print:text-black">
                <span>Generado por la plataforma</span>
                <img src="/logo.png" alt="AACOM" className="h-4 w-auto object-contain" />
                <span>AACOM cotizador</span>
              </div>
            </div>
            
          </div>
          {/* PRINT CONTAINER END */}
        </div>
      )}

      {/* PRINT STYLES - Inject into page using styled jsx or standard css */}
      <style jsx global>{`
        @media print {
          /* Hide full layout elements */
          body * {
            visibility: hidden;
            background-color: transparent !important;
          }
          /* Show print report and children explicitly */
          #printable-report, #printable-report * {
            visibility: visible;
          }
          #printable-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            color: black !important;
            background-color: white !important;
          }
          
          /* Table print styling to ensure complete table is printed without cutoff */
          .table-container {
            border: 1px solid #cbd5e1 !important;
            overflow: visible !important;
            max-height: none !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            page-break-inside: auto !important;
          }
          tr {
            page-break-inside: avoid !important;
            page-break-after: auto !important;
          }
          thead {
            display: table-header-group !important;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          .print\\:border {
            border: 1px solid #cbd5e1 !important;
          }
          .print\\:bg-white {
            background-color: white !important;
          }
          .print\\:text-black {
            color: black !important;
          }
          .print\\:break-inside-avoid {
            break-inside: avoid !important;
          }
          /* Perfect headers coloring, padding, and font size for printing to fit 10 columns */
          th {
            background-color: #87D1B5 !important;
            color: white !important;
            padding: 4px 2px !important;
            font-size: 9px !important;
            text-align: center !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          td {
            padding: 4px 2px !important;
            font-size: 9px !important;
            text-align: center !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          /* Highlight columns colors in print */
          tr.bg-\\[\\#337ab7\\] {
            background-color: #337ab7 !important;
            color: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          /* Deep blue custom payments end row highlight in print */
          tr.print-row-blue td, tr.print-row-blue {
            background-color: #1e3a8a !important;
            color: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          tr.print-row-green td, tr.print-row-green {
            background-color: #77ac52 !important;
            color: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Alternate rows grey coloring */
          tr.bg-slate-50\\/40 {
            background-color: #f8fafc !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          /* Green metrics */
          .text-emerald-600 {
            color: #059669 !important;
          }
          .text-teal-600 {
            color: #0d9488 !important;
          }
          .text-teal-700 {
            color: #0f766e !important;
          }
          /* Ensure tables don't cut off when printing */
          .overflow-x-auto {
            overflow: visible !important;
            width: 100% !important;
          }
          table {
            width: 100% !important;
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      `}</style>
        </>
      )}
    </div>
  )
}


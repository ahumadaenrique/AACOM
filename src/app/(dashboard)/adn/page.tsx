'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  User, Users, Shield, TrendingUp, DollarSign, Wallet, 
  Calendar, Plus, Trash2, Download, RefreshCw, AlertTriangle, 
  CheckCircle, HelpCircle, FileText, ArrowRight, ArrowLeft, 
  Heart, GraduationCap, Percent, ShoppingBag, Landmark, Coffee, Smile,
  Search, Eye, X, ShieldCheck, Camera, Upload, CreditCard
} from 'lucide-react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, 
  Bar, XAxis, YAxis, Tooltip as ChartTooltip, Legend
} from 'recharts'
import { saveAdnDiagnostic, getAdnDiagnostics, toggleAdnDiagnosticClosedStatus } from '@/app/actions'

// --- Interfaces ---
interface Hijo {
  nombre: string;
  edad: number;
}

interface GastosDetallados {
  // Vivienda
  renta: number; hipoteca: number; mantenimiento: number; luz: number;
  gas: number; agua: number; telefono: number; internet: number;
  streamings: number; celular: number; otrosServicios: number;
  predial: number; // NUEVO
  // Transporte
  mensualidadAuto: number; tenencia: number; verificacion: number;
  mantenimientoAuto: number; seguroAuto: number; gasolina: number;
  transportePublico: number; uber: number; estacionamientos: number;
  // Educación
  escuelaHijos: number; escuelaPropia: number; utiles: number; materiales: number; libros: number;
  // Deudas
  prestamos: number; creditos: number;
  // Entretenimiento
  hobbies: number; finDeSemana: number; vacaciones: number; cineTeatro: number;
  comidasEsparcimiento: number; baresRecreacion: number; cafecitos: number;
  clubSocial: number; amazonCompras: number;
  // Alimentación
  supermercado: number; mercado: number; accesoriosCasa: number;
  // Cuidado Personal
  estetica: number; accesoriosBelleza: number; medicamentos: number; checkups: number;
  ropaZapatos: number; gimnasio: number;
  // Ahorro
  inversiones: number;
  // Mascotas
  comidaMascota: number; saludMascota: number; vacunasMascota: number;
  esteticaMascota: number; accesoriosMascota: number;
}

interface GastosResumidos {
  vivienda: number;
  transporte: number;
  educacion: number;
  deudas: number;
  entretenimiento: number;
  alimentacion: number;
  cuidadoPersonal: number;
  ahorro: number;
  mascotas: number;
}

// Initial states
const initialGastosDetallados: GastosDetallados = {
  renta: 0, hipoteca: 0, mantenimiento: 0, luz: 0, gas: 0, agua: 0, telefono: 0, internet: 0, streamings: 0, celular: 0, otrosServicios: 0,
  predial: 0,
  mensualidadAuto: 0, tenencia: 0, verificacion: 0, mantenimientoAuto: 0, seguroAuto: 0, gasolina: 0, transportePublico: 0, uber: 0, estacionamientos: 0,
  escuelaHijos: 0, escuelaPropia: 0, utiles: 0, materiales: 0, libros: 0,
  prestamos: 0, creditos: 0,
  hobbies: 0, finDeSemana: 0, vacaciones: 0, cineTeatro: 0, comidasEsparcimiento: 0, baresRecreacion: 0, cafecitos: 0, clubSocial: 0, amazonCompras: 0,
  supermercado: 0, mercado: 0, accesoriosCasa: 0,
  estetica: 0, accesoriosBelleza: 0, medicamentos: 0, checkups: 0, ropaZapatos: 0, gimnasio: 0,
  inversiones: 0,
  comidaMascota: 0, saludMascota: 0, vacunasMascota: 0, esteticaMascota: 0, accesoriosMascota: 0
}

const initialGastosResumidos: GastosResumidos = {
  vivienda: 0,
  transporte: 0,
  educacion: 0,
  deudas: 0,
  entretenimiento: 0,
  alimentacion: 0,
  cuidadoPersonal: 0,
  ahorro: 0,
  mascotas: 0
}

export default function AdnPage() {
  const router = useRouter()
  const [modalidad, setModalidad] = useState<'DETALLADO' | 'RESUMIDO' | 'BASICO' | null>(null)
  const [step, setStep] = useState(0) // Step 0 is Mode Selection
  const [viewMode, setViewMode] = useState<'MENU' | 'WIZARD' | 'HISTORIAL'>('MENU')
  const [savedAdns, setSavedAdns] = useState<any[]>([])
  const [loadingSaved, setLoadingSaved] = useState(false)
  const [searchAdnQuery, setSearchAdnQuery] = useState('')
  const [selectedSavedAdn, setSelectedSavedAdn] = useState<any | null>(null)

  const fetchSavedAdns = async () => {
    setLoadingSaved(true)
    try {
      const res = await getAdnDiagnostics()
      if (res.success && res.diagnostics) {
        setSavedAdns(res.diagnostics)
      }
    } catch (err) {
      console.error("Error loading saved ADNs:", err)
    } finally {
      setLoadingSaved(false)
    }
  }

  const handleToggleAdnClosed = async (id: string) => {
    try {
      // Optimistic UI update for fluid response
      setSavedAdns(prev => prev.map(adn => 
        adn.id === id ? { ...adn, cerradaPagada: !adn.cerradaPagada } : adn
      ))

      const res = await toggleAdnDiagnosticClosedStatus(id)
      if (!res.success) {
        alert(res.message || "Error al actualizar estado")
        fetchSavedAdns()
      }
    } catch (err) {
      console.error(err)
      alert("Error de red al actualizar estado")
      fetchSavedAdns()
    }
  }

  useEffect(() => {
    if (viewMode === 'HISTORIAL') {
      fetchSavedAdns()
    }
  }, [viewMode])
  
  // Step 1: Perfil
  const [clienteNombre, setClienteNombre] = useState('')
  const [clienteEdad, setClienteEdad] = useState<number | ''>('')
  const [conyugeNombre, setConyugeNombre] = useState('')
  const [conyugeEdad, setConyugeEdad] = useState<number | ''>('')
  const [situacionLaboral, setSituacionLaboral] = useState('Empleado')
  const [hijos, setHijos] = useState<Hijo[]>([])
  const [nuevoHijoNombre, setNuevoHijoNombre] = useState('')
  const [nuevoHijoEdad, setNuevoHijoEdad] = useState<number | ''>('')

  // Salud y Hábitos
  const [estatura, setEstatura] = useState('')
  const [peso, setPeso] = useState('')
  const [fumador, setFumador] = useState(false)
  const [padecimientos, setPadecimientos] = useState('')

  // Step 2: Seguros Existentes
  const [hasSeguroAhorro, setHasSeguroAhorro] = useState(false)
  const [ahorroAporte, setAhorroAporte] = useState<number | ''>('')
  const [ahorroFrecuencia, setAhorroFrecuencia] = useState<'MENSUAL' | 'ANUAL'>('MENSUAL')

  const [hasPpr, setHasPpr] = useState(false)
  const [pprAporte, setPprAporte] = useState<number | ''>('')
  const [pprFrecuencia, setPprFrecuencia] = useState<'MENSUAL' | 'ANUAL'>('MENSUAL')
  const [pprAniosPlazo, setPprAniosPlazo] = useState<string>('10') // AJUSTE 5: Años contratados

  const [hasGmm, setHasGmm] = useState(false)
  
  const [hasSeguroVida, setHasSeguroVida] = useState(false)
  const [vidaSumaAsegurada, setVidaSumaAsegurada] = useState<number | ''>('') // AJUSTE 1: Suma asegurada

  // Step 3: Finanzas (Ingresos y Ahorros)
  const [ingresosTotales, setIngresosTotales] = useState<number | ''>('')
  const [ingresosNetos, setIngresosNetos] = useState<number | ''>('')
  const [ahorroActual, setAhorroActual] = useState<number | ''>('')

  // Tarjetas de Crédito
  const [hasTarjetasCredito, setHasTarjetasCredito] = useState(false)
  const [tarjetasCuales, setTarjetasCuales] = useState('')
  const [tarjetasLimite, setTarjetasLimite] = useState('')

  // Egresos por modalidad
  const [gastosDet, setGastosDet] = useState<GastosDetallados>(initialGastosDetallados)
  const [gastosRes, setGastosRes] = useState<GastosResumidos>(initialGastosResumidos)
  const [gastosBasicosTotales, setGastosBasicosTotales] = useState<number | ''>('')
  const [evidenciaBase64, setEvidenciaBase64] = useState<string | null>(null)

  const [isSaving, setIsSaving] = useState(false)
  const [validationError, setValidationError] = useState('')

  // --- Handlers para hijos ---
  const addHijo = () => {
    if (!nuevoHijoNombre.trim()) {
      setValidationError('Ingresa el nombre del hijo')
      return
    }
    if (nuevoHijoEdad === '' || nuevoHijoEdad < 0) {
      setValidationError('Ingresa una edad válida para el hijo')
      return
    }
    setHijos([...hijos, { nombre: nuevoHijoNombre.trim(), edad: Number(nuevoHijoEdad) }])
    setNuevoHijoNombre('')
    setNuevoHijoEdad('')
    setValidationError('')
  }

  const removeHijo = (idx: number) => {
    setHijos(hijos.filter((_, i) => i !== idx))
  }

  // --- Handler for Upload & Compression ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // For PDFs, just read as base64 without canvas resize
    if (file.type === 'application/pdf') {
      const reader = new FileReader()
      reader.onload = (upEv) => {
        setEvidenciaBase64(upEv.target?.result as string)
      }
      reader.readAsDataURL(file)
      return
    }

    // Image compression (resize and lower quality)
    const reader = new FileReader()
    reader.onload = (upEv) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 1200
        const MAX_HEIGHT = 1200
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height
            height = MAX_HEIGHT
          }
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6) // Compress to 60% quality JPEG
        setEvidenciaBase64(compressedBase64)
      }
      img.src = upEv.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  // --- Sumas y Cálculos Financieros Desglosados por Ramo (AJUSTE 6) ---
  const totalsByRamo = useMemo(() => {
    let vivienda = 0
    let transporte = 0
    let educacion = 0
    let deudas = 0
    let entretenimiento = 0
    let alimentacion = 0
    let cuidadoPersonal = 0
    let ahorro = 0
    let mascotas = 0

    // Sumar aportes de seguros que son tipo Ahorro / PPR
    if (hasSeguroAhorro && ahorroAporte) {
      const aporte = Number(ahorroAporte)
      ahorro += ahorroFrecuencia === 'MENSUAL' ? aporte : aporte / 12
    }
    if (hasPpr && pprAporte) {
      const aporte = Number(pprAporte)
      ahorro += pprFrecuencia === 'MENSUAL' ? aporte : aporte / 12
    }

    if (modalidad === 'DETALLADO') {
      const g = gastosDet
      
      // AJUSTE 2 & 3: Mensualización (/12) de gastos anuales (Predial, Tenencia, Verificación, Mantenimiento Auto, Seguro Auto)
      vivienda = g.renta + g.hipoteca + g.mantenimiento + g.luz + g.gas + g.agua + g.telefono + g.internet + g.streamings + g.celular + g.otrosServicios + (g.predial / 12)
      
      transporte = g.mensualidadAuto + (g.tenencia / 12) + (g.verificacion / 12) + (g.mantenimientoAuto / 12) + (g.seguroAuto / 12) + g.gasolina + g.transportePublico + g.uber + g.estacionamientos
      
      educacion = g.escuelaHijos + g.escuelaPropia + g.utiles + g.materiales + g.libros
      deudas = g.prestamos + g.creditos
      entretenimiento = g.hobbies + g.finDeSemana + g.vacaciones + g.cineTeatro + g.comidasEsparcimiento + g.baresRecreacion + g.cafecitos + g.clubSocial + g.amazonCompras
      alimentacion = g.supermercado + g.mercado + g.accesoriosCasa
      cuidadoPersonal = g.estetica + g.accesoriosBelleza + g.medicamentos + g.checkups + g.ropaZapatos + g.gimnasio
      ahorro += g.inversiones // fondoEmergencia eliminado de la lista detallada
      mascotas = g.comidaMascota + g.saludMascota + g.vacunasMascota + g.esteticaMascota + g.accesoriosMascota

    } else if (modalidad === 'RESUMIDO') {
      const r = gastosRes
      vivienda = r.vivienda
      transporte = r.transporte
      educacion = r.educacion
      deudas = r.deudas
      entretenimiento = r.entretenimiento
      alimentacion = r.alimentacion
      cuidadoPersonal = r.cuidadoPersonal
      ahorro += r.ahorro
      mascotas = r.mascotas
    } else {
      // BASICO
      const gTot = Number(gastosBasicosTotales) || 0
      vivienda = gTot * 0.4
      transporte = gTot * 0.15
      educacion = gTot * 0.1
      deudas = gTot * 0.1
      entretenimiento = gTot * 0.1
      alimentacion = gTot * 0.1
      cuidadoPersonal = gTot * 0.05
    }

    const totalGastos = vivienda + transporte + educacion + deudas + entretenimiento + alimentacion + cuidadoPersonal + (modalidad === 'DETALLADO' ? gastosDet.inversiones : (modalidad === 'RESUMIDO' ? gastosRes.ahorro : 0)) + mascotas
    const necesidades = vivienda + transporte + educacion + deudas + alimentacion + cuidadoPersonal + mascotas
    const deseos = entretenimiento
    const netIncome = Number(ingresosNetos) || 0
    const remanente = Math.max(0, netIncome - totalGastos)

    return {
      vivienda,
      transporte,
      educacion,
      deudas,
      entretenimiento,
      alimentacion,
      cuidadoPersonal,
      ahorro,
      mascotas,
      totalGastos,
      necesidades,
      deseos,
      remanente
    }
  }, [modalidad, gastosDet, gastosRes, gastosBasicosTotales, ingresosNetos, ahorroActual, hasSeguroAhorro, ahorroAporte, ahorroFrecuencia, hasPpr, pprAporte, pprFrecuencia])

  // --- Elizabeth Warren 50-30-20 Calculations ---
  const warrenMetrics = useMemo(() => {
    const netIncome = Number(ingresosNetos) || 1
    
    const pctNecesidades = Math.round((totalsByRamo.necesidades / netIncome) * 100)
    const pctDeseos = Math.round((totalsByRamo.deseos / netIncome) * 100)
    const pctAhorro = Math.round((totalsByRamo.ahorro / netIncome) * 100)

    const recNecesidades = Math.round(netIncome * 0.5)
    const recDeseos = Math.round(netIncome * 0.2)
    const recAhorro = Math.round(netIncome * 0.3)

    return {
      pctNecesidades,
      pctDeseos,
      pctAhorro,
      recNecesidades,
      recDeseos,
      recAhorro
    }
  }, [totalsByRamo, ingresosNetos])

  // --- AJUSTE 5: Cálculo de Suficiencia Financiera del PPR ---
  const pprSufficiency = useMemo(() => {
    if (!hasPpr || !pprAporte) return null

    const netIncome = Number(ingresosNetos) || 0
    const retirementGoal = netIncome * 12 * 20 // 20 años de ingresos netos mensuales

    // Calcular aportación anual
    const aporteMensual = pprFrecuencia === 'MENSUAL' ? Number(pprAporte) : Number(pprAporte) / 12
    const aporteAnual = aporteMensual * 12

    // Plazo en años
    let plazoAnios = 0
    if (pprAniosPlazo === '65') {
      plazoAnios = Math.max(0, 65 - Number(clienteEdad || 0))
    } else {
      plazoAnios = Number(pprAniosPlazo)
    }

    // Proyección acumulada inflacionada con tasa del 5% anual
    let projectedAccumulation = 0
    let tempAporte = aporteAnual
    for (let i = 0; i < plazoAnios; i++) {
      projectedAccumulation = (projectedAccumulation + tempAporte) * 1.05
      tempAporte = tempAporte * 1.05
    }

    // Fase 2: Maduración pasiva (Interés compuesto sin aportaciones adicionales hasta los 65 años)
    const edadActual = Number(clienteEdad || 0)
    const edadFinDePago = edadActual + plazoAnios
    const aniosDeMaduracion = Math.max(0, 65 - edadFinDePago)
    
    if (aniosDeMaduracion > 0) {
      projectedAccumulation = projectedAccumulation * Math.pow(1.05, aniosDeMaduracion)
    }

    const brechaRetiro = Math.max(0, retirementGoal - projectedAccumulation)
    const isSufficient = projectedAccumulation >= retirementGoal

    // Sugerencia de aportación mensual adicional para cubrir brecha
    // Asumimos que tiene hasta los 65 años para juntarlo de alguna forma
    const aniosTotalesParaRetiro = Math.max(1, 65 - edadActual)
    const adicionalMensualSugerido = (brechaRetiro / Math.max(1, aniosTotalesParaRetiro)) / 12

    return {
      retirementGoal,
      plazoAnios,
      projectedAccumulation,
      brechaRetiro,
      isSufficient,
      adicionalMensualSugerido
    }
  }, [hasPpr, pprAporte, pprFrecuencia, pprAniosPlazo, clienteEdad, ingresosNetos])

  // --- Semáforo de Prioridades ---
  const prioridades = useMemo(() => {
    const p1_retiro = !hasPpr
    const p2_gmm = !hasGmm
    
    // Prioridad 3: Fondo de emergencia
    const income = Number(ingresosNetos) || 0
    const currentAhorro = Number(ahorroActual) || 0
    const idealMonths = hasGmm ? 1 : 3
    const fondoIdeal = income * idealMonths
    const hasEmergencyFundOk = currentAhorro >= fondoIdeal
    const p3_fondo_gap = Math.max(0, fondoIdeal - currentAhorro)

    // Prioridad 4: Seguro Educación Hijos (entre 0 y 9 años)
    const tieneHijosChicos = hijos.some(h => h.edad >= 0 && h.edad <= 9)
    const p4_educacion = tieneHijosChicos && !hasSeguroAhorro

    // Prioridad 5: Gastos Hormiga
    let hasGastosHormigaHigh = false
    if (modalidad === 'DETALLADO') {
      const g = gastosDet
      const hormigaSum = g.cafecitos + g.amazonCompras + g.baresRecreacion + g.comidasEsparcimiento
      hasGastosHormigaHigh = hormigaSum > (income * 0.08)
    } else if (modalidad === 'RESUMIDO') {
      hasGastosHormigaHigh = totalsByRamo.deseos > (income * 0.25)
    }

    return {
      p1_retiro,
      p2_gmm,
      p3_fondo: {
        idealMonths,
        fondoIdeal,
        gap: p3_fondo_gap,
        isOk: hasEmergencyFundOk
      },
      p4_educacion,
      p5_hormiga: hasGastosHormigaHigh,
      tieneHijosChicos
    }
  }, [hasPpr, hasGmm, ingresosNetos, ahorroActual, hijos, hasSeguroAhorro, modalidad, gastosDet, totalsByRamo])

  // --- Recharts data ---
  const pieData = [
    { name: 'Gastos Fijos (Necesidades)', value: totalsByRamo.necesidades, color: '#3b82f6' },
    { name: 'Ahorro / Patrimonio', value: totalsByRamo.ahorro, color: '#10b981' },
    { name: 'Esparcimiento (Deseos)', value: totalsByRamo.deseos, color: '#f59e0b' }
  ].filter(d => d.value > 0)

  const barData = [
    {
      name: 'Necesidades (50%)',
      Recomendado: warrenMetrics.recNecesidades,
      Real: totalsByRamo.necesidades
    },
    {
      name: 'Ahorro (30%)',
      Recomendado: warrenMetrics.recAhorro,
      Real: totalsByRamo.ahorro
    },
    {
      name: 'Deseos (20%)',
      Recomendado: warrenMetrics.recDeseos,
      Real: totalsByRamo.deseos
  // --- Step Validation ---
  const validateStep = () => {
    setValidationError('')
    if (step === 1) {
      if (!clienteNombre.trim()) return 'Por favor ingresa el nombre del cliente'
      if (clienteEdad === '' || Number(clienteEdad) <= 0) return 'Por favor ingresa una edad válida'
      if (!padecimientos.trim()) return 'Por favor responde a la pregunta de Padecimientos'
    }
    if (step === 2) {
      if (hasSeguroAhorro && (ahorroAporte === '' || Number(ahorroAporte) <= 0)) {
        return 'Por favor especifica cuánto aporta en el seguro de Ahorro'
      }
      if (hasPpr && (pprAporte === '' || Number(pprAporte) <= 0)) {
        return 'Por favor especifica cuánto aporta en su PPR'
      }
      if (hasSeguroVida && (vidaSumaAsegurada === '' || Number(vidaSumaAsegurada) <= 0)) {
        return 'Por favor especifica la Suma Asegurada de tu seguro de Vida'
      }
    }
    if (step === 3) {
      if (ingresosTotales === '' || Number(ingresosTotales) <= 0) return 'Por favor ingresa los ingresos brutos'
      if (ingresosNetos === '' || Number(ingresosNetos) <= 0) return 'Por favor ingresa los ingresos netos'
      if (Number(ingresosNetos) > Number(ingresosTotales)) return 'Los ingresos netos no pueden superar a los ingresos brutos'
      if (hasTarjetasCredito && (!tarjetasCuales.trim() || !tarjetasLimite.trim())) return 'Por favor especifica cuáles tarjetas tienes y su límite de crédito'
      if (modalidad === 'BASICO') {
        if (gastosBasicosTotales === '' || Number(gastosBasicosTotales) < 0) {
          return 'Por favor especifica el total de gastos'
        }
        if (!evidenciaBase64) {
          return 'Es obligatorio adjuntar una foto de tu formato físico para la modalidad Básica'
        }
      }
    }
    return ''
  }

  const handleNext = () => {
    const error = validateStep()
    if (error) {
      setValidationError(error)
      return
    }
    setStep(prev => prev + 1)
  }

  const handleBack = () => {
    setValidationError('')
    setStep(prev => prev - 1)
  }

  // --- Save to Database ---
  const handleSaveDiagnostic = async () => {
    setIsSaving(true)
    setValidationError('')

    // REQUERIR GPS
    if (!navigator.geolocation) {
      setValidationError("Tu navegador no soporta geolocalización. Es obligatoria para guardar ADNs.")
      setIsSaving(false)
      return
    }

    try {
      // Prompt GPS
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        })
      })

      const latitude = position.coords.latitude
      const longitude = position.coords.longitude

      let gastosObj = {}
      if (modalidad === 'DETALLADO') {
        gastosObj = gastosDet
      } else if (modalidad === 'RESUMIDO') {
        gastosObj = gastosRes
      } else {
        gastosObj = { totalBasico: gastosBasicosTotales }
      }

      const payload = {
        modalidad: modalidad!,
        clienteNombre,
        clienteEdad: Number(clienteEdad),
        conyugeNombre: conyugeNombre || undefined,
        conyugeEdad: conyugeEdad !== '' ? Number(conyugeEdad) : undefined,
        situacionLaboral,
        estatura: estatura || undefined,
        peso: peso || undefined,
        fumador,
        padecimientos: padecimientos || undefined,
        hijosData: hijos.length > 0 ? JSON.stringify(hijos) : undefined,
        hasSeguroAhorro,
        ahorroAporte: hasSeguroAhorro && ahorroAporte !== '' ? Number(ahorroAporte) : undefined,
        ahorroFrecuencia: hasSeguroAhorro ? ahorroFrecuencia : undefined,
        hasPpr,
        pprAporte: hasPpr && pprAporte !== '' ? Number(pprAporte) : undefined,
        pprFrecuencia: hasPpr ? pprFrecuencia : undefined,
        pprAniosPlazo: hasPpr ? pprAniosPlazo : undefined,
        hasGmm,
        hasSeguroVida,
        vidaSumaAsegurada: hasSeguroVida && vidaSumaAsegurada !== '' ? Number(vidaSumaAsegurada) : undefined,
        ingresosTotales: Number(ingresosTotales),
        ingresosNetos: Number(ingresosNetos),
        ahorroActual: Number(ahorroActual) || 0,
        hasTarjetasCredito,
        tarjetasCuales: hasTarjetasCredito ? tarjetasCuales : undefined,
        tarjetasLimite: hasTarjetasCredito ? tarjetasLimite : undefined,
        gastosData: JSON.stringify(gastosObj),
        totalGastos: totalsByRamo.totalGastos,
        evidenciaBase64: evidenciaBase64 || undefined,
        latitude,
        longitude
      }

      const res = await saveAdnDiagnostic(payload)
      if (res.success) {
        alert('¡Diagnóstico ADN guardado exitosamente!')
      } else {
        setValidationError(res.message || 'Error al guardar el diagnóstico')
      }
    } catch (err: any) {
      if (err.code === 1) { // PERMISSION_DENIED
        setValidationError("🛑 Es obligatorio compartir tu ubicación GPS para registrar diagnósticos. Ve a la configuración de tu navegador para otorgar los permisos e inténtalo de nuevo.")
      } else if (err.code === 2) { // POSITION_UNAVAILABLE
        setValidationError("No se pudo obtener tu ubicación actual. Asegúrate de tener encendido el GPS.")
      } else if (err.code === 3) { // TIMEOUT
        setValidationError("El tiempo para obtener la ubicación se agotó. Revisa tu conexión y señal GPS.")
      } else {
        setValidationError(err.message || 'Ocurrió un error inesperado al guardar')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleReset = () => {
    setModalidad(null)
    setStep(0)
    setViewMode('MENU')
    setClienteNombre('')
    setClienteEdad('')
    setConyugeNombre('')
    setConyugeEdad('')
    setSituacionLaboral('Empleado')
    setEstatura('')
    setPeso('')
    setFumador(false)
    setPadecimientos('')
    setHijos([])
    setHasSeguroAhorro(false)
    setAhorroAporte('')
    setHasPpr(false)
    setPprAporte('')
    setPprAniosPlazo('10')
    setHasGmm(false)
    setHasSeguroVida(false)
    setVidaSumaAsegurada('')
    setIngresosTotales('')
    setIngresosNetos('')
    setAhorroActual('')
    setHasTarjetasCredito(false)
    setTarjetasCuales('')
    setTarjetasLimite('')
    setGastosDet(initialGastosDetallados)
    setGastosRes(initialGastosResumidos)
    setGastosBasicosTotales('')
    setValidationError('')
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 px-4">
      {/* HEADER SECTION (HIDDEN IN PRINT) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5 print:hidden">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-teal-800 dark:text-teal-400 flex items-center gap-2">
            <Heart className="h-8 w-8 text-teal-600 animate-pulse" /> ADN AACOM
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Herramienta premium para el diagnóstico financiero y patrimonial digital del cliente.
          </p>
        </div>
        {viewMode === 'WIZARD' && step > 0 && (
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 text-xs font-black uppercase border border-teal-200/50">
              Modalidad: {modalidad}
            </span>
            <button 
              onClick={handleReset}
              className="flex items-center gap-1 text-slate-500 hover:text-red-500 text-xs font-bold transition-all border p-2 rounded-xl bg-white dark:bg-zinc-900"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Reiniciar ADN
            </button>
          </div>
        )}
      </div>

      {/* ERROR ALERT (HIDDEN IN PRINT) */}
      {validationError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-center gap-3 print:hidden">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
          <p className="text-sm text-red-800 font-semibold">{validationError}</p>
        </div>
      )}

      {/* --- INITIAL MENU PRE-SCREEN --- */}
      {viewMode === 'MENU' && (
        <div className="space-y-8 animate-fade-in print:hidden max-w-4xl mx-auto py-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-200">
              ¿Qué deseas realizar hoy en tu ADN Digital?
            </h2>
            <p className="text-xs text-slate-500">
              Selecciona una opción para comenzar a trabajar con tu base de clientes o iniciar una nueva captura de cliente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Card 1: Capturar ADN */}
            <div 
              onClick={() => { setViewMode('WIZARD'); setStep(0) }}
              className="group cursor-pointer border hover:border-teal-500 rounded-3xl p-8 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-center flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="h-20 w-20 mx-auto bg-teal-50 dark:bg-teal-950/40 rounded-2xl flex items-center justify-center text-teal-600 transition-colors group-hover:bg-teal-500 group-hover:text-white">
                  <Plus className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-black text-slate-800 dark:text-slate-200">Capturar Nuevo ADN</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Registra los datos de ingresos, gastos y estructura familiar de un cliente nuevo para generar su Diagnóstico Patrimonial y análisis de brecha 50-30-20.
                </p>
              </div>
              <span className="mt-8 text-xs font-black text-teal-600 group-hover:underline flex items-center justify-center gap-1">
                Iniciar captura <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>

            {/* Card 2: Revisar ADN's */}
            <div 
              onClick={() => { setViewMode('HISTORIAL') }}
              className="group cursor-pointer border hover:border-teal-500 rounded-3xl p-8 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-center flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="h-20 w-20 mx-auto bg-teal-50 dark:bg-teal-950/40 rounded-2xl flex items-center justify-center text-teal-600 transition-colors group-hover:bg-teal-500 group-hover:text-white">
                  <Users className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-black text-slate-800 dark:text-slate-200">Mi Base de Clientes (ADNs)</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Consulta el historial completo de los diagnósticos patrimoniales que has guardado en el sistema, descarga sus reportes en PDF o revisa sus metas.
                </p>
              </div>
              <span className="mt-8 text-xs font-black text-teal-600 group-hover:underline flex items-center justify-center gap-1">
                Ver mis diagnósticos <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>
        </div>
      )}

      {/* --- AGENT HISTORIAL CLIENT BASE SCREEN --- */}
      {viewMode === 'HISTORIAL' && (
        <div className="space-y-6 animate-fade-in print:hidden max-w-6xl mx-auto py-4">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Users className="h-6 w-6 text-teal-600" /> Mi Base de Clientes (Diagnósticos ADN)
              </h2>
              <p className="text-xs text-slate-500">
                Historial completo de tus asesorías patrimoniales. Haz clic en cualquier cliente para consultar y descargar.
              </p>
            </div>
            <button 
              onClick={() => setViewMode('MENU')}
              className="flex items-center gap-1.5 border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-slate-300 p-2.5 px-4 rounded-xl text-xs font-black bg-white dark:bg-zinc-950 transition-all hover:bg-slate-50 shadow-sm"
            >
              <ArrowLeft className="h-4 w-4" /> Volver al Menú
            </button>
          </div>

          {/* Search bar */}
          <div className="bg-white dark:bg-zinc-900 border rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar cliente por nombre..."
                value={searchAdnQuery}
                onChange={e => setSearchAdnQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-xl w-full text-xs bg-slate-50 dark:bg-zinc-800 focus:outline-teal-500"
              />
            </div>
          </div>

          {/* Table list */}
          <div className="bg-white dark:bg-zinc-900 border rounded-2xl shadow-sm overflow-hidden">
            {loadingSaved ? (
              <div className="p-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
                <RefreshCw className="h-8 w-8 animate-spin text-teal-600" />
                <span>Cargando tu base de clientes...</span>
              </div>
            ) : savedAdns.filter(adn => adn.clienteNombre.toLowerCase().includes(searchAdnQuery.toLowerCase())).length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
                <Users className="h-8 w-8 text-slate-300" />
                <span>No se encontraron diagnósticos guardados.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-slate-200 uppercase tracking-wider font-bold border-b text-[10px]">
                      <th className="py-3 px-4">Fecha</th>
                      <th className="py-3 px-4">Nombre del Cliente</th>
                      <th className="py-3 px-4 text-center">Edad</th>
                      <th className="py-3 px-4 text-center">Modalidad</th>
                      <th className="py-3 px-4 text-right">Ingresos Netos</th>
                      <th className="py-3 px-4 text-right">Egresos Totales</th>
                      <th className="py-3 px-4 text-center">¿Cerrada y Pagada?</th>
                      <th className="py-3 px-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                    {savedAdns
                      .filter(adn => adn.clienteNombre.toLowerCase().includes(searchAdnQuery.toLowerCase()))
                      .map(adn => (
                        <tr key={adn.id} className="hover:bg-slate-50/50">
                          <td className="py-3.5 px-4 text-slate-500">
                            {new Date(adn.createdAt).toLocaleDateString("es-MX", { timeZone: 'America/Mexico_City' })}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                            {adn.clienteNombre}
                          </td>
                          <td className="py-3.5 px-4 text-center">{adn.clienteEdad} años</td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-block px-2.5 py-0.5 rounded-full font-bold text-[9px] bg-teal-50 dark:bg-zinc-800 text-teal-800 dark:text-teal-300 border border-teal-200/50 uppercase">
                              {adn.modalidad}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-semibold">
                            ${adn.ingresosNetos.toLocaleString('es-MX')}
                          </td>
                          <td className="py-3.5 px-4 text-right font-semibold text-teal-700">
                            ${adn.totalGastos.toLocaleString('es-MX')}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <input
                                type="checkbox"
                                id={`cerrada-${adn.id}`}
                                checked={adn.cerradaPagada || false}
                                onChange={() => handleToggleAdnClosed(adn.id)}
                                className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                              />
                              <span className={`text-[10px] font-bold select-none ${adn.cerradaPagada ? "text-emerald-600" : "text-slate-400"}`}>
                                {adn.cerradaPagada ? "Emitida y Pagada" : "Pendiente"}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button 
                              onClick={() => setSelectedSavedAdn(adn)}
                              className="text-teal-600 hover:text-teal-700 font-bold hover:underline flex items-center justify-center gap-1 mx-auto bg-teal-50 hover:bg-teal-100 p-1.5 px3 rounded-lg border border-teal-200"
                            >
                              <Eye className="h-3.5 w-3.5" /> Consultar
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- STEP 0: SELECCION DE MODALIDAD --- */}
      {viewMode === 'WIZARD' && step === 0 && (
        <div className="space-y-8 animate-fade-in print:hidden">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-200">
              ¿De qué manera deseas capturar el diagnóstico financiero?
            </h2>
            <p className="text-xs text-slate-500">
              Elige el nivel de detalle que prefieras con base en el tiempo que tengas disponible con tu cliente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Card 1: Detallado */}
            <div 
              onClick={() => { setModalidad('DETALLADO'); setStep(1) }}
              className="group cursor-pointer border hover:border-teal-500 rounded-3xl p-6 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-center flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="h-16 w-16 mx-auto bg-teal-50 dark:bg-teal-950/40 rounded-2xl flex items-center justify-center text-teal-600 transition-colors group-hover:bg-teal-500 group-hover:text-white">
                  <FileText className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-200">Cuestionario Extendido</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Análisis completo de finanzas con desglose detallado de todos los gastos de casa, transporte, educación, diversión, deudas y mascotas.
                </p>
              </div>
              <span className="mt-6 text-xs font-black text-teal-600 group-hover:underline flex items-center justify-center gap-1">
                Iniciar detallado <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>

            {/* Card 2: Resumido */}
            <div 
              onClick={() => { setModalidad('RESUMIDO'); setStep(1) }}
              className="group cursor-pointer border hover:border-teal-500 rounded-3xl p-6 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-center flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="h-16 w-16 mx-auto bg-teal-50 dark:bg-teal-950/40 rounded-2xl flex items-center justify-center text-teal-600 transition-colors group-hover:bg-teal-500 group-hover:text-white">
                  <Percent className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-200">Resumen de Rubros</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Captura ágil de totales acumulados en las 9 categorías principales de gastos. Ideal para un diagnóstico ejecutivo rápido.
                </p>
              </div>
              <span className="mt-6 text-xs font-black text-teal-600 group-hover:underline flex items-center justify-center gap-1">
                Iniciar resumido <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>

            {/* Card 3: Basico */}
            <div 
              onClick={() => { setModalidad('BASICO'); setStep(1) }}
              className="group cursor-pointer border hover:border-teal-500 rounded-3xl p-6 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-center flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="h-16 w-16 mx-auto bg-teal-50 dark:bg-teal-950/40 rounded-2xl flex items-center justify-center text-teal-600 transition-colors group-hover:bg-teal-500 group-hover:text-white">
                  <Wallet className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-200">Ingreso y Gasto Total</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Análisis exprés. Solo se ingresa el total de ingresos mensuales brutos/netos y el total aproximado de gastos mensuales.
                </p>
              </div>
              <span className="mt-6 text-xs font-black text-teal-600 group-hover:underline flex items-center justify-center gap-1">
                Iniciar básico <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>
        </div>
      )}

      {/* --- STEPS CONTAINER (1 to 3) (HIDDEN IN PRINT) --- */}
      {step > 0 && step <= 3 && (
        <div className="space-y-6 max-w-4xl mx-auto print:hidden">
          {/* Progress Bar */}
          <div className="bg-white dark:bg-zinc-900 border p-4 rounded-2xl shadow-sm">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              <span className={step === 1 ? 'text-teal-600 font-extrabold' : ''}>1. Perfil Familiar</span>
              <span className={step === 2 ? 'text-teal-600 font-extrabold' : ''}>2. Protección Actual</span>
              <span className={step === 3 ? 'text-teal-600 font-extrabold' : ''}>3. Diagnóstico Financiero</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-teal-500 h-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border rounded-3xl shadow-sm p-6 md:p-8">
            {/* --- PASO 1: PERFIL PERSONAL Y FAMILIAR --- */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 flex items-center gap-2 border-b pb-3">
                    <User className="h-5 w-5 text-teal-600" /> Paso 1: Perfil Personal y Familiar
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Nombre del Cliente *</label>
                    <input 
                      type="text" 
                      placeholder="Ej. Juan Pérez" 
                      value={clienteNombre} 
                      onChange={e => setClienteNombre(e.target.value)}
                      className="border p-3 rounded-xl w-full text-sm bg-slate-50 dark:bg-zinc-800 focus:outline-teal-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Edad del Cliente *</label>
                    <input 
                      type="number" 
                      placeholder="Ej. 35" 
                      value={clienteEdad} 
                      onChange={e => setClienteEdad(e.target.value === '' ? '' : Number(e.target.value))}
                      className="border p-3 rounded-xl w-full text-sm bg-slate-50 dark:bg-zinc-800 focus:outline-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Nombre del Cónyuge (Opcional)</label>
                    <input 
                      type="text" 
                      placeholder="Ej. María López" 
                      value={conyugeNombre} 
                      onChange={e => setConyugeNombre(e.target.value)}
                      className="border p-3 rounded-xl w-full text-sm bg-slate-50 dark:bg-zinc-800 focus:outline-teal-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Edad del Cónyuge (Opcional)</label>
                    <input 
                      type="number" 
                      placeholder="Ej. 32" 
                      value={conyugeEdad} 
                      onChange={e => setConyugeEdad(e.target.value === '' ? '' : Number(e.target.value))}
                      className="border p-3 rounded-xl w-full text-sm bg-slate-50 dark:bg-zinc-800 focus:outline-teal-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Situación Laboral</label>
                  <select 
                    value={situacionLaboral}
                    onChange={e => setSituacionLaboral(e.target.value)}
                    className="border p-3 rounded-xl w-full text-sm bg-slate-50 dark:bg-zinc-800 focus:outline-teal-500"
                  >
                    <option value="Empleado">Empleado (Nómina)</option>
                    <option value="Independiente">Independiente (Honorarios / Empresario)</option>
                    <option value="Hogar">Hogar</option>
                    <option value="Retirado">Retirado</option>
                  </select>
                </div>

                {/* Salud y Hábitos */}
                <div className="border border-slate-100 dark:border-zinc-800 p-5 rounded-2xl space-y-4">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                    <Heart className="h-4 w-4 text-teal-600" /> Salud y Hábitos del Cliente
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-600 uppercase block">Estatura (Opcional)</label>
                      <input type="text" placeholder="Ej. 1.75m" value={estatura} onChange={e => setEstatura(e.target.value)} className="border p-2.5 rounded-xl w-full text-sm bg-slate-50 dark:bg-zinc-800 focus:outline-teal-500" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-600 uppercase block">Peso (Opcional)</label>
                      <input type="text" placeholder="Ej. 80kg" value={peso} onChange={e => setPeso(e.target.value)} className="border p-2.5 rounded-xl w-full text-sm bg-slate-50 dark:bg-zinc-800 focus:outline-teal-500" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-600 uppercase block">¿Es Fumador? *</label>
                      <select value={fumador ? 'SI' : 'NO'} onChange={e => setFumador(e.target.value === 'SI')} className="border p-2.5 rounded-xl w-full text-sm bg-slate-50 dark:bg-zinc-800 focus:outline-teal-500">
                        <option value="NO">No</option>
                        <option value="SI">Sí</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-600 uppercase block">Padecimientos *</label>
                      <input type="text" placeholder="Ninguno / Asma" value={padecimientos} onChange={e => setPadecimientos(e.target.value)} className="border p-2.5 rounded-xl w-full text-sm bg-slate-50 dark:bg-zinc-800 focus:outline-teal-500" />
                    </div>
                  </div>
                </div>

                {/* Hijos list */}
                <div className="border border-slate-100 dark:border-zinc-800 p-5 rounded-2xl space-y-4">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-teal-600" /> Estructura Familiar (Hijos)
                  </h4>
                  
                  {hijos.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-2">
                      {hijos.map((h, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-zinc-800/40 p-3 rounded-xl border border-slate-200/50">
                          <div>
                            <span className="font-bold text-xs text-slate-800">{h.nombre}</span>
                            <span className="text-[10px] text-slate-500 block">Edad: {h.edad} años</span>
                          </div>
                          <button 
                            type="button"
                            onClick={() => removeHijo(idx)}
                            className="text-red-500 hover:text-red-700 transition-colors p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 italic">No se han registrado hijos en este diagnóstico.</p>
                  )}

                  {/* Add child inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end pt-2 border-t border-slate-100/50">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Nombre del Hijo</label>
                      <input 
                        type="text" 
                        placeholder="Ej. Sofía" 
                        value={nuevoHijoNombre}
                        onChange={e => setNuevoHijoNombre(e.target.value)}
                        className="border p-2 rounded-xl w-full text-xs bg-slate-50 dark:bg-zinc-800 focus:outline-teal-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Edad del Hijo</label>
                      <input 
                        type="number" 
                        placeholder="Ej. 6" 
                        value={nuevoHijoEdad}
                        onChange={e => setNuevoHijoEdad(e.target.value === '' ? '' : Number(e.target.value))}
                        className="border p-2 rounded-xl w-full text-xs bg-slate-50 dark:bg-zinc-800 focus:outline-teal-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addHijo}
                      className="bg-teal-50 hover:bg-teal-100 text-teal-800 p-2.5 rounded-xl text-xs font-black border border-teal-200 transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus className="h-4 w-4" /> Agregar Hijo
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* --- PASO 2: CUESTIONARIO DE PROTECCIÓN ACTUAL --- */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 flex items-center gap-2 border-b pb-3">
                    <Shield className="h-5 w-5 text-teal-600" /> Paso 2: Seguros y Aportaciones Actuales
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* PPR */}
                  <div className="border rounded-2xl p-4 bg-slate-50/50 space-y-4 border-slate-200/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="h-5 w-5 text-teal-600" />
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-800">Plan Personal para Retiro (PPR)</h4>
                          <span className="text-[10px] text-slate-400 block">Deducible de impuestos bajo Art. 151 LISR</span>
                        </div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={hasPpr}
                        onChange={e => setHasPpr(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                      />
                    </div>
                    {hasPpr && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-600 uppercase block">¿Cuánto aporta a su PPR?</label>
                          <input 
                            type="number" 
                            placeholder="Monto de aportación" 
                            value={pprAporte}
                            onChange={e => setPprAporte(e.target.value === '' ? '' : Number(e.target.value))}
                            className="border p-2 rounded-xl w-full text-xs bg-white focus:outline-teal-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-600 uppercase block">Frecuencia de Aporte</label>
                          <select 
                            value={pprFrecuencia}
                            onChange={e => setPprFrecuencia(e.target.value as 'MENSUAL' | 'ANUAL')}
                            className="border p-2.5 rounded-xl w-full text-xs bg-white focus:outline-teal-500"
                          >
                            <option value="MENSUAL">Mensual</option>
                            <option value="ANUAL">Anual</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-600 uppercase block">Plazo Contratado PPR *</label>
                          <select 
                            value={pprAniosPlazo}
                            onChange={e => setPprAniosPlazo(e.target.value)}
                            className="border p-2.5 rounded-xl w-full text-xs bg-white focus:outline-teal-500 font-bold"
                          >
                            <option value="10">10 Años</option>
                            <option value="15">15 Años</option>
                            <option value="20">20 Años</option>
                            <option value="65">Edad Alcanzada 65 Años</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Seguro de Ahorro / Educación */}
                  <div className="border rounded-2xl p-4 bg-slate-50/50 space-y-4 border-slate-200/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <GraduationCap className="h-5 w-5 text-teal-600" />
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-800">Seguro de Ahorro / Plan Educativo</h4>
                          <span className="text-[10px] text-slate-400 block">Póliza de acumulación patrimonial a mediano/largo plazo</span>
                        </div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={hasSeguroAhorro}
                        onChange={e => setHasSeguroAhorro(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                      />
                    </div>
                    {hasSeguroAhorro && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-600 uppercase block">¿Cuánto aporta a su plan?</label>
                          <input 
                            type="number" 
                            placeholder="Monto de aportación" 
                            value={ahorroAporte}
                            onChange={e => setAhorroAporte(e.target.value === '' ? '' : Number(e.target.value))}
                            className="border p-2 rounded-xl w-full text-xs bg-white focus:outline-teal-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-600 uppercase block">Frecuencia de Aporte</label>
                          <select 
                            value={ahorroFrecuencia}
                            onChange={e => setAhorroFrecuencia(e.target.value as 'MENSUAL' | 'ANUAL')}
                            className="border p-2.5 rounded-xl w-full text-xs bg-white focus:outline-teal-500"
                          >
                            <option value="MENSUAL">Mensual</option>
                            <option value="ANUAL">Anual</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Seguro de Gastos Médicos Mayores (GMM) */}
                  <div className="border rounded-2xl p-4 bg-slate-50/50 flex justify-between items-center border-slate-200/50">
                    <div className="flex items-center gap-3">
                      <Heart className="h-5 w-5 text-teal-600" />
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-800">Seguro de Gastos Médicos Mayores (GMM)</h4>
                        <span className="text-[10px] text-slate-400 block">Póliza de salud ante accidentes y enfermedades graves</span>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={hasGmm}
                      onChange={e => setHasGmm(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                    />
                  </div>

                  {/* Seguro de Vida */}
                  <div className="border rounded-2xl p-4 bg-slate-50/50 space-y-4 border-slate-200/50">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-teal-600" />
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-800">Seguro de Vida</h4>
                          <span className="text-[10px] text-slate-400 block">Protección por fallecimiento o invalidez</span>
                        </div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={hasSeguroVida}
                        onChange={e => setHasSeguroVida(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                      />
                    </div>
                    {hasSeguroVida && (
                      <div className="pt-2 border-t border-slate-100 max-w-md">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-600 uppercase block">Suma Asegurada Seguro de Vida *</label>
                          <input 
                            type="number" 
                            placeholder="Monto en pesos (Ej. 1000000)" 
                            value={vidaSumaAsegurada}
                            onChange={e => setVidaSumaAsegurada(e.target.value === '' ? '' : Number(e.target.value))}
                            className="border p-2 rounded-xl w-full text-xs bg-white focus:outline-teal-500 font-semibold"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}

            {/* --- PASO 3: DIAGNÓSTICO FINANCIERO (INGRESOS, AHORROS, GASTOS) --- */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 flex items-center gap-2 border-b pb-3">
                    <Wallet className="h-5 w-5 text-teal-600" /> Paso 3: Análisis de Ingresos y Gastos
                  </h3>
                </div>

                {/* Ingresos e Inversiones */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-zinc-800/40 p-5 rounded-2xl border">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-600 uppercase block">Ingresos Mensuales Brutos *</label>
                    <input 
                      type="number" 
                      placeholder="Ej. 50000" 
                      value={ingresosTotales} 
                      onChange={e => setIngresosTotales(e.target.value === '' ? '' : Number(e.target.value))}
                      className="border p-2.5 rounded-xl w-full text-xs bg-white focus:outline-teal-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-600 uppercase block">Ingresos Mensuales Netos *</label>
                    <input 
                      type="number" 
                      placeholder="Ej. 42000" 
                      value={ingresosNetos} 
                      onChange={e => setIngresosNetos(e.target.value === '' ? '' : Number(e.target.value))}
                      className="border p-2.5 rounded-xl w-full text-xs bg-white focus:outline-teal-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-600 uppercase block">Fondo de Emergencia Actual</label>
                    <input 
                      type="number" 
                      placeholder="Ej. 15000" 
                      value={ahorroActual} 
                      onChange={e => setAhorroActual(e.target.value === '' ? '' : Number(e.target.value))}
                      className="border p-2.5 rounded-xl w-full text-xs bg-white focus:outline-teal-500"
                    />
                  </div>
                </div>

                {/* Tarjetas de Crédito */}
                <div className="border border-slate-100 dark:border-zinc-800 p-5 rounded-2xl space-y-4">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4 text-teal-600" /> Tarjetas de Crédito
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-600 uppercase block">¿Cuentas con tarjeta de crédito? *</label>
                      <select value={hasTarjetasCredito ? 'SI' : 'NO'} onChange={e => setHasTarjetasCredito(e.target.value === 'SI')} className="border p-2.5 rounded-xl w-full text-sm bg-white dark:bg-zinc-800 focus:outline-teal-500">
                        <option value="NO">No</option>
                        <option value="SI">Sí</option>
                      </select>
                    </div>
                    {hasTarjetasCredito && (
                      <>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-600 uppercase block">¿Cuáles? *</label>
                          <input type="text" placeholder="Ej. BBVA Azul, Nu" value={tarjetasCuales} onChange={e => setTarjetasCuales(e.target.value)} className="border p-2.5 rounded-xl w-full text-sm bg-white dark:bg-zinc-800 focus:outline-teal-500" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-600 uppercase block">Límite de Crédito *</label>
                          <input type="text" placeholder="Ej. $50,000" value={tarjetasLimite} onChange={e => setTarjetasLimite(e.target.value)} className="border p-2.5 rounded-xl w-full text-sm bg-white dark:bg-zinc-800 focus:outline-teal-500" />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Gastos Desglosados según modalidad */}
                {modalidad === 'DETALLADO' && (
                  <div className="space-y-6">
                    <h4 className="text-xs font-black text-teal-800 uppercase tracking-widest border-b pb-2">Gastos Mensuales Detallados</h4>
                    
                    {/* Vivienda */}
                    <div className="space-y-3">
                      <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1"><Landmark className="h-4 w-4 text-teal-600" /> Vivienda y Servicios</span>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.keys(initialGastosDetallados).slice(0, 11).map((key) => (
                          <div key={key} className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase">{key === 'streamings' ? 'Streamings' : key.replace(/([A-Z])/g, ' $1')}</label>
                            <input 
                              type="number" 
                              placeholder="0" 
                              value={gastosDet[key as keyof GastosDetallados] || ''}
                              onChange={e => setGastosDet({...gastosDet, [key]: Number(e.target.value)})}
                              className="border p-2 rounded-xl w-full text-xs focus:outline-teal-500"
                            />
                          </div>
                        ))}
                        {/* Campo Predial * (anual) */}
                        <div className="space-y-1 border border-teal-200/60 p-1.5 rounded-xl bg-teal-50/10">
                          <label className="text-[9px] font-extrabold text-teal-700 uppercase">Predial * (anual)</label>
                          <input 
                            type="number" 
                            placeholder="0" 
                            value={gastosDet.predial || ''}
                            onChange={e => setGastosDet({...gastosDet, predial: Number(e.target.value)})}
                            className="border p-2 rounded-xl w-full text-xs focus:outline-teal-500 font-bold text-teal-800 bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Transporte (AJUSTE 2: Asteriscos * (anual) en Tenencia, Verificación, Mantenimiento, Seguro) */}
                    <div className="space-y-3">
                      <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1"><ShoppingBag className="h-4 w-4 text-teal-600" /> Transporte y Auto</span>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase">Mensualidad Auto</label>
                          <input 
                            type="number" 
                            placeholder="0" 
                            value={gastosDet.mensualidadAuto || ''}
                            onChange={e => setGastosDet({...gastosDet, mensualidadAuto: Number(e.target.value)})}
                            className="border p-2 rounded-xl w-full text-xs focus:outline-teal-500"
                          />
                        </div>
                        {/* Anuales */}
                        <div className="space-y-1 border border-teal-200/60 p-1.5 rounded-xl bg-teal-50/10">
                          <label className="text-[9px] font-extrabold text-teal-700 uppercase">Tenencia * (anual)</label>
                          <input 
                            type="number" 
                            placeholder="0" 
                            value={gastosDet.tenencia || ''}
                            onChange={e => setGastosDet({...gastosDet, tenencia: Number(e.target.value)})}
                            className="border p-2 rounded-xl w-full text-xs focus:outline-teal-500 font-bold bg-white"
                          />
                        </div>
                        <div className="space-y-1 border border-teal-200/60 p-1.5 rounded-xl bg-teal-50/10">
                          <label className="text-[9px] font-extrabold text-teal-700 uppercase">Verificación * (anual)</label>
                          <input 
                            type="number" 
                            placeholder="0" 
                            value={gastosDet.verificacion || ''}
                            onChange={e => setGastosDet({...gastosDet, verificacion: Number(e.target.value)})}
                            className="border p-2 rounded-xl w-full text-xs focus:outline-teal-500 font-bold bg-white"
                          />
                        </div>
                        <div className="space-y-1 border border-teal-200/60 p-1.5 rounded-xl bg-teal-50/10">
                          <label className="text-[9px] font-extrabold text-teal-700 uppercase">Mantenimiento * (anual)</label>
                          <input 
                            type="number" 
                            placeholder="0" 
                            value={gastosDet.mantenimientoAuto || ''}
                            onChange={e => setGastosDet({...gastosDet, mantenimientoAuto: Number(e.target.value)})}
                            className="border p-2 rounded-xl w-full text-xs focus:outline-teal-500 font-bold bg-white"
                          />
                        </div>
                        <div className="space-y-1 border border-teal-200/60 p-1.5 rounded-xl bg-teal-50/10">
                          <label className="text-[9px] font-extrabold text-teal-700 uppercase">Seguro Auto * (anual)</label>
                          <input 
                            type="number" 
                            placeholder="0" 
                            value={gastosDet.seguroAuto || ''}
                            onChange={e => setGastosDet({...gastosDet, seguroAuto: Number(e.target.value)})}
                            className="border p-2 rounded-xl w-full text-xs focus:outline-teal-500 font-bold bg-white"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase">Gasolina</label>
                          <input 
                            type="number" 
                            placeholder="0" 
                            value={gastosDet.gasolina || ''}
                            onChange={e => setGastosDet({...gastosDet, gasolina: Number(e.target.value)})}
                            className="border p-2 rounded-xl w-full text-xs focus:outline-teal-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase">Transporte Público</label>
                          <input 
                            type="number" 
                            placeholder="0" 
                            value={gastosDet.transportePublico || ''}
                            onChange={e => setGastosDet({...gastosDet, transportePublico: Number(e.target.value)})}
                            className="border p-2 rounded-xl w-full text-xs focus:outline-teal-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase">Uber</label>
                          <input 
                            type="number" 
                            placeholder="0" 
                            value={gastosDet.uber || ''}
                            onChange={e => setGastosDet({...gastosDet, uber: Number(e.target.value)})}
                            className="border p-2 rounded-xl w-full text-xs focus:outline-teal-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase">Estacionamientos</label>
                          <input 
                            type="number" 
                            placeholder="0" 
                            value={gastosDet.estacionamientos || ''}
                            onChange={e => setGastosDet({...gastosDet, estacionamientos: Number(e.target.value)})}
                            className="border p-2 rounded-xl w-full text-xs focus:outline-teal-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Educación */}
                    <div className="space-y-3">
                      <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1"><GraduationCap className="h-4 w-4 text-teal-600" /> Educación</span>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.keys(initialGastosDetallados).slice(21, 26).map((key) => (
                          <div key={key} className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase">{key.replace(/([A-Z])/g, ' $1')}</label>
                            <input 
                              type="number" 
                              placeholder="0" 
                              value={gastosDet[key as keyof GastosDetallados] || ''}
                              onChange={e => setGastosDet({...gastosDet, [key]: Number(e.target.value)})}
                              className="border p-2 rounded-xl w-full text-xs focus:outline-teal-500"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Deudas */}
                    <div className="space-y-3">
                      <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1"><Wallet className="h-4 w-4 text-teal-600" /> Deudas y Créditos</span>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.keys(initialGastosDetallados).slice(26, 28).map((key) => (
                          <div key={key} className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase">{key.replace(/([A-Z])/g, ' $1')}</label>
                            <input 
                              type="number" 
                              placeholder="0" 
                              value={gastosDet[key as keyof GastosDetallados] || ''}
                              onChange={e => setGastosDet({...gastosDet, [key]: Number(e.target.value)})}
                              className="border p-2 rounded-xl w-full text-xs focus:outline-teal-500"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Entretenimiento */}
                    <div className="space-y-3">
                      <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1"><Coffee className="h-4 w-4 text-teal-600" /> Diversión, Hobbies y Compras</span>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.keys(initialGastosDetallados).slice(28, 37).map((key) => (
                          <div key={key} className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase">{key.replace(/([A-Z])/g, ' $1')}</label>
                            <input 
                              type="number" 
                              placeholder="0" 
                              value={gastosDet[key as keyof GastosDetallados] || ''}
                              onChange={e => setGastosDet({...gastosDet, [key]: Number(e.target.value)})}
                              className="border p-2 rounded-xl w-full text-xs focus:outline-teal-500"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Alimentación */}
                    <div className="space-y-3">
                      <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1"><ShoppingBag className="h-4 w-4 text-teal-600" /> Alimentación y Casa</span>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {Object.keys(initialGastosDetallados).slice(37, 40).map((key) => (
                          <div key={key} className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase">{key.replace(/([A-Z])/g, ' $1')}</label>
                            <input 
                              type="number" 
                              placeholder="0" 
                              value={gastosDet[key as keyof GastosDetallados] || ''}
                              onChange={e => setGastosDet({...gastosDet, [key]: Number(e.target.value)})}
                              className="border p-2 rounded-xl w-full text-xs focus:outline-teal-500"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Cuidado Personal */}
                    <div className="space-y-3">
                      <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1"><Heart className="h-4 w-4 text-teal-600" /> Cuidado Personal y Salud</span>
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                        {Object.keys(initialGastosDetallados).slice(40, 46).map((key) => (
                          <div key={key} className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase">{key.replace(/([A-Z])/g, ' $1')}</label>
                            <input 
                              type="number" 
                              placeholder="0" 
                              value={gastosDet[key as keyof GastosDetallados] || ''}
                              onChange={e => setGastosDet({...gastosDet, [key]: Number(e.target.value)})}
                              className="border p-2 rounded-xl w-full text-xs focus:outline-teal-500"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Mascotas */}
                    <div className="space-y-3">
                      <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1"><Smile className="h-4 w-4 text-teal-600" /> Mascotas</span>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {Object.keys(initialGastosDetallados).slice(46).map((key) => (
                          <div key={key} className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase">{key.replace(/([A-Z])/g, ' $1')}</label>
                            <input 
                              type="number" 
                              placeholder="0" 
                              value={gastosDet[key as keyof GastosDetallados] || ''}
                              onChange={e => setGastosDet({...gastosDet, [key]: Number(e.target.value)})}
                              className="border p-2 rounded-xl w-full text-xs focus:outline-teal-500"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Ahorro manual (AJUSTE 4: fondoEmergencia eliminado por duplicidad) */}
                    <div className="space-y-3">
                      <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1"><Wallet className="h-4 w-4 text-teal-600" /> Ahorros manuales e Inversiones</span>
                      <div className="max-w-xs space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Inversiones</label>
                        <input 
                          type="number" 
                          placeholder="0" 
                          value={gastosDet.inversiones || ''}
                          onChange={e => setGastosDet({...gastosDet, inversiones: Number(e.target.value)})}
                          className="border p-2 rounded-xl w-full text-xs focus:outline-teal-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {modalidad === 'RESUMIDO' && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-teal-800 uppercase tracking-widest border-b pb-2">Gastos Totales Acumulados por Rubro</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.keys(initialGastosResumidos).map((key) => (
                        <div key={key} className="space-y-1 bg-slate-50 dark:bg-zinc-800/40 p-3 rounded-2xl border">
                          <label className="text-[10px] font-bold text-slate-600 uppercase block">{key.replace(/([A-Z])/g, ' $1')}</label>
                          <input 
                            type="number" 
                            placeholder="0" 
                            value={gastosRes[key as keyof GastosResumidos] || ''}
                            onChange={e => setGastosRes({...gastosRes, [key]: Number(e.target.value)})}
                            className="border p-2.5 rounded-xl w-full text-xs focus:outline-teal-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {modalidad === 'BASICO' && (
                  <div className="space-y-6 border-t pt-4">
                    <div className="space-y-1 max-w-md">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Gastos Mensuales Totales *</label>
                      <input 
                        type="number" 
                        placeholder="Ej. 25000" 
                        value={gastosBasicosTotales} 
                        onChange={e => setGastosBasicosTotales(e.target.value === '' ? '' : Number(e.target.value))}
                        className="border p-3 rounded-xl w-full text-sm bg-slate-50 dark:bg-zinc-800 focus:outline-teal-500 font-bold"
                      />
                    </div>

                    {/* EVIDENCIA BÁSICA */}
                    <div className="space-y-1 max-w-md">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block flex items-center gap-1.5">
                        <Camera className="h-4 w-4 text-teal-600" /> Evidencia del Diagnóstico *
                      </label>
                      <p className="text-[10px] text-slate-500 mb-2">
                        Toma una foto o sube el PDF de tus apuntes/formato donde calculaste estos montos (Obligatorio).
                      </p>
                      
                      {!evidenciaBase64 ? (
                        <div className="border-2 border-dashed border-teal-200 bg-teal-50/50 p-6 rounded-2xl text-center hover:bg-teal-50 transition-colors">
                          <label className="cursor-pointer flex flex-col items-center gap-2">
                            <div className="bg-white p-3 rounded-full shadow-sm border border-teal-100">
                              <Camera className="h-6 w-6 text-teal-600" />
                            </div>
                            <span className="text-xs font-bold text-teal-800 mt-2 hover:underline">Tomar Foto o Subir Archivo</span>
                            <span className="text-[9px] text-teal-600/70">JPG, PNG o PDF</span>
                            <input 
                              type="file" 
                              accept="image/*,application/pdf"
                              capture="environment" 
                              className="hidden" 
                              onChange={handleImageUpload} 
                            />
                          </label>
                        </div>
                      ) : (
                        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-emerald-600" />
                            <span className="text-xs font-bold text-emerald-800">Evidencia Cargada</span>
                          </div>
                          <button 
                            onClick={() => setEvidenciaBase64(null)} 
                            className="text-xs text-red-600 font-bold hover:underline"
                          >
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* DINAMIC REALTIME CALCULATOR BOX */}
                <div className="bg-teal-50/50 border border-teal-200 p-5 rounded-3xl grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  <div className="text-center md:text-left">
                    <span className="text-[10px] font-black text-teal-800 uppercase tracking-widest">Egresos Totales (Mensuales)</span>
                    <span className="text-2xl font-black text-teal-700 block mt-1">
                      ${totalsByRamo.totalGastos.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="text-center md:text-left">
                    <span className="text-[10px] font-black text-teal-800 uppercase tracking-widest">Necesidades (Gastos Fijos)</span>
                    <span className="text-lg font-black text-slate-700 block mt-1">
                      ${totalsByRamo.necesidades.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="text-center md:text-left">
                    <span className="text-[10px] font-black text-teal-800 uppercase tracking-widest">Ahorro e Inversiones</span>
                    <span className="text-lg font-black text-emerald-600 block mt-1">
                      ${totalsByRamo.ahorro.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="text-center md:text-left">
                    <span className="text-[10px] font-black text-teal-800 uppercase tracking-widest">Remanente Final</span>
                    <span className={`text-lg font-black block mt-1 ${totalsByRamo.remanente > 0 ? 'text-teal-700' : 'text-red-500'}`}>
                      ${totalsByRamo.remanente.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>

              </div>
            )}

            {/* WIZARD ACTIONS */}
            <div className="flex justify-between items-center border-t border-slate-100 dark:border-zinc-800 pt-6 mt-8">
              {step > 1 ? (
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1.5 border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-slate-300 p-3 rounded-2xl text-xs font-black bg-white dark:bg-zinc-950 transition-all hover:bg-slate-50"
                >
                  <ArrowLeft className="h-4 w-4" /> Anterior
                </button>
              ) : (
                <button
                  onClick={() => { setModalidad(null); setStep(0) }}
                  className="flex items-center gap-1.5 border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-slate-300 p-3 rounded-2xl text-xs font-black bg-white dark:bg-zinc-950 transition-all hover:bg-slate-50"
                >
                  <ArrowLeft className="h-4 w-4" /> Volver a Modalidad
                </button>
              )}

              {step < 3 ? (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white p-3 px-5 rounded-2xl text-xs font-black transition-all shadow-md hover:shadow-lg"
                >
                  Siguiente <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1.5 bg-teal-800 hover:bg-teal-900 text-white p-3 px-6 rounded-2xl text-xs font-black transition-all shadow-md hover:shadow-lg"
                >
                  Generar Diagnóstico <CheckCircle className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- STEP 4: RESULTADOS Y REPORTES (PRINT CONTAINER INTEGRATED) --- */}
      {step === 4 && (
        <div className="space-y-8 animate-fade-in">
          {/* Action Toolbar (Hidden in print) */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 dark:bg-zinc-800/40 p-4 border rounded-3xl shadow-sm print:hidden">
            <span className="text-xs font-bold text-slate-600">El diagnóstico ha sido generado para **{clienteNombre}** ({clienteEdad} años)</span>
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={handlePrint}
                className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white p-2.5 px-4 rounded-xl text-xs font-black shadow transition-all"
              >
                <Download className="h-4 w-4" /> Descargar Diagnóstico (PDF)
              </button>
              <button 
                onClick={handleSaveDiagnostic}
                disabled={isSaving}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 px-4 rounded-xl text-xs font-black shadow transition-all disabled:opacity-50"
              >
                {isSaving ? 'Guardando...' : 'Guardar en Base de Datos'}
              </button>
              <button 
                onClick={() => setStep(3)}
                className="flex items-center gap-1.5 border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-slate-300 p-2.5 px-4 rounded-xl text-xs font-black bg-white dark:bg-zinc-950 transition-all hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" /> Modificar Datos
              </button>
              <button 
                onClick={handleReset}
                className="flex items-center gap-1.5 border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-slate-300 p-2.5 px-4 rounded-xl text-xs font-black bg-white dark:bg-zinc-950 transition-all hover:bg-slate-50"
              >
                <RefreshCw className="h-4 w-4" /> Hacer Nuevo Diagnóstico
              </button>
            </div>
          </div>

          {/* VISUAL DASHBOARD RESULTS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:hidden">
            {/* Warren 50-30-20 visual analysis */}
            <div className="bg-white dark:bg-zinc-900 border rounded-3xl p-6 shadow-sm space-y-6 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 border-b pb-3 flex items-center gap-2">
                  <Percent className="h-5 w-5 text-teal-600" /> Distribución de Presupuesto (Warren 50-30-20)
                </h3>
                <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                  La regla de Elizabeth Warren propone: **50% Necesidades Fijas**, **30% Ahorro/Inversiones/Seguros** y **20% Deseos/Gustos**. A continuación se compara tu situación real frente a la óptima:
                </p>
              </div>

              {/* Bar Chart comparing real vs recommended */}
              <div className="h-64 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} unit=" MXN" />
                    <ChartTooltip formatter={(val) => [`$${val.toLocaleString('es-MX')}`, '']} />
                    <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                    <Bar dataKey="Recomendado" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Real" fill="#0f766e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Status summary metrics */}
              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100">
                <div className="text-center p-3 rounded-2xl bg-blue-50/50 border border-blue-100">
                  <span className="text-[8px] font-bold text-blue-500 uppercase block">Necesidades</span>
                  <span className="text-md font-black text-blue-700 block mt-1">{warrenMetrics.pctNecesidades}%</span>
                  <span className="text-[7px] text-slate-400 block">Límite: 50%</span>
                </div>
                <div className="text-center p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                  <span className="text-[8px] font-bold text-emerald-500 uppercase block">Ahorro</span>
                  <span className="text-md font-black text-emerald-700 block mt-1">{warrenMetrics.pctAhorro}%</span>
                  <span className="text-[7px] text-slate-400 block">Límite: 30%</span>
                </div>
                <div className="text-center p-3 rounded-2xl bg-amber-50/50 border border-amber-100">
                  <span className="text-[8px] font-bold text-amber-500 uppercase block">Deseos</span>
                  <span className="text-md font-black text-amber-700 block mt-1">{warrenMetrics.pctDeseos}%</span>
                  <span className="text-[7px] text-slate-400 block">Límite: 20%</span>
                </div>
              </div>
            </div>

            {/* Pie chart and summary metrics */}
            <div className="bg-white dark:bg-zinc-900 border rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 border-b pb-3 flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-teal-600" /> Distribución Real de Gastos Mensuales
                </h3>
              </div>

              <div className="h-64 relative flex items-center justify-center">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip formatter={(val) => [`$${val.toLocaleString('es-MX')}`, '']} />
                      <Legend 
                        layout="horizontal" 
                        verticalAlign="bottom" 
                        align="center"
                        wrapperStyle={{ fontSize: '9px', fontWeight: 'bold' }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-slate-400 italic">No hay suficientes gastos para generar la distribución.</p>
                )}
                <div className="absolute flex flex-col items-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Gasto Total</span>
                  <span className="text-xl font-black text-slate-800">
                    ${totalsByRamo.totalGastos.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-zinc-800/40 p-4 rounded-2xl space-y-2 border">
                <span className="text-[9px] font-black text-teal-800 uppercase tracking-widest block">Remanente de Ingresos</span>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Tras pagar todos tus gastos mensuales e inversiones registradas, cuentas con un flujo de efectivo libre de **${totalsByRamo.remanente.toLocaleString('es-MX', { maximumFractionDigits: 0 })} pesos** para ahorro adicional o emergencias.
                </p>
              </div>
            </div>
          </div>

          {/* AJUSTE 6: Tabla Desglosada por Rubros Principales de Egresos */}
          <div className="bg-white dark:bg-zinc-900 border rounded-3xl p-6 shadow-sm space-y-4 print:hidden">
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 border-b pb-3 flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-teal-600" /> Resumen de Gastos por Ramo Principal
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-slate-200 uppercase tracking-wider font-bold border-b">
                    <th className="py-2.5 px-4">Ramo de Gasto</th>
                    <th className="py-2.5 px-4 text-center">Gasto Mensualizado</th>
                    <th className="py-2.5 px-4 text-center">Porcentaje del Ingreso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2 px-4 font-semibold">Vivienda y Servicios (incluye Predial)</td>
                    <td className="py-2 px-4 text-center">${totalsByRamo.vivienda.toLocaleString('es-MX', {maximumFractionDigits:0})}</td>
                    <td className="py-2 px-4 text-center font-bold text-teal-600">{Math.round((totalsByRamo.vivienda / (Number(ingresosNetos) || 1)) * 100)}%</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2 px-4 font-semibold">Transporte y Auto (anuales mensualizados)</td>
                    <td className="py-2 px-4 text-center">${totalsByRamo.transporte.toLocaleString('es-MX', {maximumFractionDigits:0})}</td>
                    <td className="py-2 px-4 text-center font-bold text-teal-600">{Math.round((totalsByRamo.transporte / (Number(ingresosNetos) || 1)) * 100)}%</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2 px-4 font-semibold">Educación</td>
                    <td className="py-2 px-4 text-center">${totalsByRamo.educacion.toLocaleString('es-MX', {maximumFractionDigits:0})}</td>
                    <td className="py-2 px-4 text-center font-bold text-teal-600">{Math.round((totalsByRamo.educacion / (Number(ingresosNetos) || 1)) * 100)}%</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2 px-4 font-semibold">Deudas y Créditos</td>
                    <td className="py-2 px-4 text-center">${totalsByRamo.deudas.toLocaleString('es-MX', {maximumFractionDigits:0})}</td>
                    <td className="py-2 px-4 text-center font-bold text-teal-600">{Math.round((totalsByRamo.deudas / (Number(ingresosNetos) || 1)) * 100)}%</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2 px-4 font-semibold">Diversión y Entretenimiento (Deseos)</td>
                    <td className="py-2 px-4 text-center">${totalsByRamo.entretenimiento.toLocaleString('es-MX', {maximumFractionDigits:0})}</td>
                    <td className="py-2 px-4 text-center font-bold text-teal-600">{Math.round((totalsByRamo.entretenimiento / (Number(ingresosNetos) || 1)) * 100)}%</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2 px-4 font-semibold">Alimentación y Despensa</td>
                    <td className="py-2 px-4 text-center">${totalsByRamo.alimentacion.toLocaleString('es-MX', {maximumFractionDigits:0})}</td>
                    <td className="py-2 px-4 text-center font-bold text-teal-600">{Math.round((totalsByRamo.alimentacion / (Number(ingresosNetos) || 1)) * 100)}%</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2 px-4 font-semibold">Cuidado Personal y Salud</td>
                    <td className="py-2 px-4 text-center">${totalsByRamo.cuidadoPersonal.toLocaleString('es-MX', {maximumFractionDigits:0})}</td>
                    <td className="py-2 px-4 text-center font-bold text-teal-600">{Math.round((totalsByRamo.cuidadoPersonal / (Number(ingresosNetos) || 1)) * 100)}%</td>
                  </tr>
                  {totalsByRamo.mascotas > 0 && (
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-2 px-4 font-semibold">Mascotas</td>
                      <td className="py-2 px-4 text-center">${totalsByRamo.mascotas.toLocaleString('es-MX', {maximumFractionDigits:0})}</td>
                      <td className="py-2 px-4 text-center font-bold text-teal-600">{Math.round((totalsByRamo.mascotas / (Number(ingresosNetos) || 1)) * 100)}%</td>
                    </tr>
                  )}
                  <tr className="hover:bg-slate-50/50 bg-teal-50/20 font-black">
                    <td className="py-2.5 px-4 text-teal-800">Ahorro y Construcción Patrimonial (Seguros + Fondo)</td>
                    <td className="py-2.5 px-4 text-center text-teal-800">${totalsByRamo.ahorro.toLocaleString('es-MX', {maximumFractionDigits:0})}</td>
                    <td className="py-2.5 px-4 text-center text-emerald-600">{Math.round((totalsByRamo.ahorro / (Number(ingresosNetos) || 1)) * 100)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* PRIORIDADES SEMAFORO SYSTEM */}
          <div className="bg-white dark:bg-zinc-900 border rounded-3xl p-6 shadow-sm space-y-6 print:hidden">
            <div>
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 border-b pb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-teal-600" /> Pilares y Prioridades Financieras Recomendadas
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Prioridad 1: PPR con Suficiencia e indicación de brecha (AJUSTE 5) */}
              <div className={`p-5 rounded-2xl border flex items-start gap-4 transition-all md:col-span-2 ${prioridades.p1_retiro ? 'bg-red-50/55 border-red-200' : pprSufficiency && !pprSufficiency.isSufficient ? 'bg-amber-50/55 border-amber-200' : 'bg-emerald-50/40 border-emerald-200'}`}>
                {prioridades.p1_retiro ? (
                  <AlertTriangle className="h-6 w-6 text-red-600 shrink-0" />
                ) : pprSufficiency && !pprSufficiency.isSufficient ? (
                  <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
                ) : (
                  <CheckCircle className="h-6 w-6 text-emerald-600 shrink-0" />
                )}
                <div className="space-y-2 w-full">
                  <span className="text-[9px] font-extrabold uppercase tracking-widest block text-slate-400">Prioridad 1</span>
                  <h4 className="font-extrabold text-sm text-slate-800">Plan Personal para Retiro (PPR)</h4>
                  
                  {prioridades.p1_retiro ? (
                    <p className="text-xs text-slate-600 leading-relaxed">
                      ⚠️ CRÍTICO: No cuentas con plan de retiro. Iniciar tu ahorro deducible para el retiro es el pilar de construcción patrimonial más importante para evitar dependencia a futuro.
                    </p>
                  ) : pprSufficiency && (
                    <div className="space-y-2 text-xs text-slate-600">
                      <p>
                        ✅ Tienes un plan de PPR contratado a <strong>{pprAniosPlazo === '65' ? 'Edad 65' : `${pprAniosPlazo} Años`}</strong> de aportaciones.
                      </p>
                      <div className="bg-white/80 p-3.5 rounded-xl border border-slate-200/60 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center mt-2">
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 block uppercase">Meta para Retiro (20 Años)</span>
                          <span className="text-sm font-extrabold text-slate-800 block mt-0.5">${pprSufficiency.retirementGoal.toLocaleString('es-MX', {maximumFractionDigits:0})} pesos</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 block uppercase">Tu Capital PPR Proyectado</span>
                          <span className="text-sm font-extrabold text-teal-700 block mt-0.5">${pprSufficiency.projectedAccumulation.toLocaleString('es-MX', {maximumFractionDigits:0})} pesos</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 block uppercase">Brecha Faltante</span>
                          <span className={`text-sm font-extrabold block mt-0.5 ${pprSufficiency.brechaRetiro > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            ${pprSufficiency.brechaRetiro.toLocaleString('es-MX', {maximumFractionDigits:0})} pesos
                          </span>
                        </div>
                      </div>
                      
                      {pprSufficiency.brechaRetiro > 0 && (
                        <div className="bg-red-50/50 p-2.5 rounded-xl border border-red-200/50 text-[11px] text-red-800 font-bold mt-2">
                          ⚠️ Tu PPR actual acumulará ${pprSufficiency.projectedAccumulation.toLocaleString('es-MX', {maximumFractionDigits:0})} pesos, pero tu meta de retiro para vivir 20 años de jubilación es de ${pprSufficiency.retirementGoal.toLocaleString('es-MX', {maximumFractionDigits:0})} pesos. Tienes un faltante de **${pprSufficiency.brechaRetiro.toLocaleString('es-MX', {maximumFractionDigits:0})} pesos**. Te sugerimos incrementar sustancialmente tu aportación para lograr tu meta de retiro.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Prioridad 2: GMM */}
              <div className={`p-5 rounded-2xl border flex items-start gap-4 transition-all ${prioridades.p2_gmm ? 'bg-red-50/55 border-red-200' : 'bg-emerald-50/40 border-emerald-200'}`}>
                {prioridades.p2_gmm ? (
                  <AlertTriangle className="h-6 w-6 text-red-600 shrink-0" />
                ) : (
                  <CheckCircle className="h-6 w-6 text-emerald-600 shrink-0" />
                )}
                <div className="space-y-1">
                  <span className="text-[9px] font-extrabold uppercase tracking-widest block text-slate-400">Prioridad 2</span>
                  <h4 className="font-extrabold text-sm text-slate-800">Seguro de Gastos Médicos Mayores</h4>
                  <p className="text-xs text-slate-600">
                    {prioridades.p2_gmm 
                      ? '⚠️ CRÍTICO: No tienes seguro de GMM. Un accidente o enfermedad grave puede consumir todo tu patrimonio y acabar con tus metas de ahorro.'
                      : '✅ Excelente: Tu salud y finanzas están protegidas ante siniestros de salud costosos con tu seguro de GMM.'}
                  </p>
                </div>
              </div>

              {/* Prioridad 3: Fondo de Emergencia (mencionada solo si no es suficiente) */}
              {!prioridades.p3_fondo.isOk && (
                <div className="p-5 rounded-2xl border flex items-start gap-4 transition-all bg-red-50/55 border-red-200">
                  <AlertTriangle className="h-6 w-6 text-red-600 shrink-0" />
                  <div className="space-y-1">
                    <span className="text-[9px] font-extrabold uppercase tracking-widest block text-slate-400">Prioridad 3</span>
                    <h4 className="font-extrabold text-sm text-slate-800">Fondo de Emergencia Inmediato</h4>
                    <p className="text-xs text-slate-600">
                      ⚠️ REQUIERE ATENCIÓN: Tu fondo sugerido es de $${prioridades.p3_fondo.fondoIdeal.toLocaleString('es-MX', { maximumFractionDigits: 0 })} (${prioridades.p3_fondo.idealMonths} meses). Tu brecha faltante es de $${prioridades.p3_fondo.gap.toLocaleString('es-MX', { maximumFractionDigits: 0 })}.
                    </p>
                  </div>
                </div>
              )}

              {/* Prioridad 4: Seguro Educativo */}
              {prioridades.tieneHijosChicos ? (
                <div className={`p-5 rounded-2xl border flex items-start gap-4 transition-all ${prioridades.p4_educacion ? 'bg-amber-50/50 border-amber-200' : 'bg-emerald-50/40 border-emerald-200'}`}>
                  {prioridades.p4_educacion ? (
                    <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
                  ) : (
                    <CheckCircle className="h-6 w-6 text-emerald-600 shrink-0" />
                  )}
                  <div className="space-y-1">
                    <span className="text-[9px] font-extrabold uppercase tracking-widest block text-slate-400">Prioridad 4</span>
                    <h4 className="font-extrabold text-sm text-slate-800">Seguro de Educación Universitaria</h4>
                    <p className="text-xs text-slate-600">
                      {prioridades.p4_educacion 
                        ? '⚠️ ADVERTENCIA: Tienes hijos de entre 0 y 9 años y no cuentas con plan educativo garantizado. Aprovechar las tasas de retorno en esta etapa temprana abaratará sustancialmente la educación de tus hijos.'
                        : '✅ Excelente: Ya cuentas con previsión financiera o seguro de ahorro educativo para garantizar el futuro profesional de tus hijos.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/30 flex items-start gap-4">
                  <CheckCircle className="h-6 w-6 text-slate-400 shrink-0" />
                  <div className="space-y-1">
                    <span className="text-[9px] font-extrabold uppercase tracking-widest block text-slate-400">Prioridad 4</span>
                    <h4 className="font-extrabold text-sm text-slate-800">Seguro de Educación Universitaria</h4>
                    <p className="text-xs text-slate-400 italic">
                      No aplica (No registraste hijos en el rango de 0 a 9 años de edad).
                    </p>
                  </div>
                </div>
              )}

              {/* Prioridad 5: Gastos Hormiga */}
              <div className={`p-5 rounded-2xl border flex items-start gap-4 transition-all ${prioridades.p5_hormiga ? 'bg-amber-50/50 border-amber-200' : 'bg-emerald-50/40 border-emerald-200'}`}>
                {prioridades.p5_hormiga ? (
                  <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
                ) : (
                  <CheckCircle className="h-6 w-6 text-emerald-600 shrink-0" />
                )}
                <div className="space-y-1">
                  <span className="text-[9px] font-extrabold uppercase tracking-widest block text-slate-400">Prioridad 5</span>
                  <h4 className="font-extrabold text-sm text-slate-800">Optimización de Gastos Hormiga</h4>
                  <p className="text-xs text-slate-600">
                    {prioridades.p5_hormiga 
                      ? '⚠️ ADVERTENCIA: Detectamos consumos elevados en salidas de fin de semana, cafecitos o compras innecesarias online. Reestructurar estos gastos te dará el capital libre para tu retiro o emergencias.'
                      : '✅ Excelente: Mantienes una disciplina excepcional de gastos cotidianos y entretenimiento dentro de límites óptimos.'}
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* ======================================================== */}
          {/* PRINT CONTAINER START (PERFECTLY FORMATTED PRINT DOCUMENT) */}
          {/* ======================================================== */}
          <div id="printable-report" className="hidden print:block bg-white text-black p-8 max-w-5xl mx-auto space-y-8 font-sans">
            
            {/* Elegant Cover Page Header */}
            <div className="border-b-4 border-teal-600 pb-5 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="AACOM Seguros" className="h-14 w-auto object-contain" />
                <div>
                  <h2 className="text-2xl font-black text-slate-800 uppercase tracking-widest">ADN DIGITAL</h2>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Diagnóstico Financiero y Blindaje Patrimonial</span>
                </div>
              </div>
              <div className="text-right text-xs text-slate-500">
                <span className="block font-bold">AACOM SEGUROS</span>
                <span className="block">Fecha: {new Date().toLocaleDateString("es-MX", { timeZone: 'America/Mexico_City' })}</span>
              </div>
            </div>

            {/* General Client Details */}
            <div className="bg-slate-50 border p-5 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Cliente</span>
                <span className="text-sm font-extrabold text-slate-800 block mt-0.5">{clienteNombre}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Edad</span>
                <span className="text-sm font-extrabold text-slate-800 block mt-0.5">{clienteEdad} años</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Cónyuge</span>
                <span className="text-sm font-extrabold text-slate-800 block mt-0.5">{conyugeNombre ? `${conyugeNombre} (${conyugeEdad} años)` : 'No registrado'}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Situación Laboral</span>
                <span className="text-sm font-extrabold text-slate-800 block mt-0.5">{situacionLaboral}</span>
              </div>
            </div>

            {/* Seguro de Vida Suma Asegurada if has GMM / Vida (AJUSTE 1) */}
            {(hasSeguroVida || hasGmm) && (
              <div className="border border-slate-200 p-4 rounded-xl grid grid-cols-2 gap-4">
                {hasSeguroVida && (
                  <div>
                    <span className="text-[9px] font-black text-slate-500 uppercase block tracking-wider">Seguro de Vida Vigente</span>
                    <span className="text-sm font-black text-slate-800 mt-0.5 block">Suma Asegurada: ${Number(vidaSumaAsegurada).toLocaleString('es-MX')} pesos</span>
                  </div>
                )}
                {hasGmm && (
                  <div>
                    <span className="text-[9px] font-black text-slate-500 uppercase block tracking-wider">Seguro de Gastos Médicos Mayores</span>
                    <span className="text-sm font-black text-slate-800 mt-0.5 block">Estatus: Activo / Amparado</span>
                  </div>
                )}
              </div>
            )}

            {/* Family Structure if has kids */}
            {hijos.length > 0 && (
              <div className="border border-slate-200 p-4 rounded-xl space-y-2">
                <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider block">Estructura de Protección Familiar (Hijos)</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {hijos.map((h, i) => (
                    <div key={i} className="border-l-2 border-teal-500 pl-3">
                      <span className="text-xs font-bold text-slate-800 block">{h.nombre}</span>
                      <span className="text-[10px] text-slate-500 block">{h.edad} años de edad</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Financial Health Analysis and Elizabeth Warren 50-30-20 */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b pb-2 flex items-center gap-1.5">
                <Percent className="h-4.5 w-4.5 text-teal-600" /> 1. Análisis de Salud Financiera (Regla 50-30-20)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Visual metrics list */}
                <div className="border rounded-2xl p-5 space-y-4">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Desglose de Ingresos y Egresos</h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between border-b pb-1.5 text-xs">
                      <span className="font-bold text-slate-600">Ingresos Mensuales Netos:</span>
                      <span className="font-black text-slate-800">${(Number(ingresosNetos) || 0).toLocaleString('es-MX')} MXN</span>
                    </div>
                    <div className="flex justify-between border-b pb-1.5 text-xs">
                      <span className="font-bold text-slate-600">Gastos Fijos (Necesidades):</span>
                      <span className="font-black text-slate-800">${totalsByRamo.necesidades.toLocaleString('es-MX')} MXN ({warrenMetrics.pctNecesidades}%)</span>
                    </div>
                    <div className="flex justify-between border-b pb-1.5 text-xs">
                      <span className="font-bold text-slate-600">Ahorro y Patrimonio:</span>
                      <span className="font-black text-emerald-600">${totalsByRamo.ahorro.toLocaleString('es-MX')} MXN ({warrenMetrics.pctAhorro}%)</span>
                    </div>
                    <div className="flex justify-between border-b pb-1.5 text-xs">
                      <span className="font-bold text-slate-600">Deseos y Gustos:</span>
                      <span className="font-black text-amber-600">${totalsByRamo.deseos.toLocaleString('es-MX')} MXN ({warrenMetrics.pctDeseos}%)</span>
                    </div>
                    <div className="flex justify-between pt-1 text-xs">
                      <span className="font-black text-teal-800">Flujo de Caja Libre (Remanente):</span>
                      <span className="font-black text-teal-700">${totalsByRamo.remanente.toLocaleString('es-MX')} MXN</span>
                    </div>
                  </div>
                </div>

                {/* Warren 50-30-20 Comparison table */}
                <div className="border rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Distribución vs Elizabeth Warren</h4>
                  
                  <div className="space-y-3.5">
                    {/* Necesidades */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-600">
                        <span>Necesidades (Fijo)</span>
                        <span>{warrenMetrics.pctNecesidades}% / 50%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full" style={{ width: `${Math.min(100, (totalsByRamo.necesidades / (Number(ingresosNetos) || 1)) * 100)}%` }} />
                      </div>
                    </div>

                    {/* Ahorro */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-600">
                        <span>Ahorro / Seguros</span>
                        <span>{warrenMetrics.pctAhorro}% / 30%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full" style={{ width: `${Math.min(100, (totalsByRamo.ahorro / (Number(ingresosNetos) || 1)) * 100)}%` }} />
                      </div>
                    </div>

                    {/* Deseos */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-600">
                        <span>Gustos y Deseos</span>
                        <span>{warrenMetrics.pctDeseos}% / 20%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full" style={{ width: `${Math.min(100, (totalsByRamo.deseos / (Number(ingresosNetos) || 1)) * 100)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AJUSTE 6: Desglose en PDF de subtotales por Ramo Principal */}
            <div className="space-y-3 break-inside-avoid">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b pb-2">Resumen de Gastos por Ramo Principal</h4>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 uppercase font-bold border-b">
                    <th className="py-2 px-3">Ramo de Gasto</th>
                    <th className="py-2 px-3 text-center">Gasto Mensualizado</th>
                    <th className="py-2 px-3 text-center">Porcentaje del Ingreso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2 px-3 font-semibold">Vivienda y Servicios (Predial incluido)</td>
                    <td className="py-2 px-3 text-center">${totalsByRamo.vivienda.toLocaleString('es-MX', {maximumFractionDigits:0})}</td>
                    <td className="py-2 px-3 text-center font-bold text-teal-700">{Math.round((totalsByRamo.vivienda / (Number(ingresosNetos) || 1)) * 100)}%</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold">Transporte y Auto (anuales mensualizados)</td>
                    <td className="py-2 px-3 text-center">${totalsByRamo.transporte.toLocaleString('es-MX', {maximumFractionDigits:0})}</td>
                    <td className="py-2 px-3 text-center font-bold text-teal-700">{Math.round((totalsByRamo.transporte / (Number(ingresosNetos) || 1)) * 100)}%</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold">Educación</td>
                    <td className="py-2 px-3 text-center">${totalsByRamo.educacion.toLocaleString('es-MX', {maximumFractionDigits:0})}</td>
                    <td className="py-2 px-3 text-center font-bold text-teal-700">{Math.round((totalsByRamo.educacion / (Number(ingresosNetos) || 1)) * 100)}%</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold">Deudas y Créditos</td>
                    <td className="py-2 px-3 text-center">${totalsByRamo.deudas.toLocaleString('es-MX', {maximumFractionDigits:0})}</td>
                    <td className="py-2 px-3 text-center font-bold text-teal-700">{Math.round((totalsByRamo.deudas / (Number(ingresosNetos) || 1)) * 100)}%</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold">Diversión y Entretenimiento (Deseos)</td>
                    <td className="py-2 px-3 text-center">${totalsByRamo.entretenimiento.toLocaleString('es-MX', {maximumFractionDigits:0})}</td>
                    <td className="py-2 px-3 text-center font-bold text-teal-700">{Math.round((totalsByRamo.entretenimiento / (Number(ingresosNetos) || 1)) * 100)}%</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold">Alimentación y Despensa</td>
                    <td className="py-2 px-3 text-center">${totalsByRamo.alimentacion.toLocaleString('es-MX', {maximumFractionDigits:0})}</td>
                    <td className="py-2 px-3 text-center font-bold text-teal-700">{Math.round((totalsByRamo.alimentacion / (Number(ingresosNetos) || 1)) * 100)}%</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold">Cuidado Personal y Salud</td>
                    <td className="py-2 px-3 text-center">${totalsByRamo.cuidadoPersonal.toLocaleString('es-MX', {maximumFractionDigits:0})}</td>
                    <td className="py-2 px-3 text-center font-bold text-teal-700">{Math.round((totalsByRamo.cuidadoPersonal / (Number(ingresosNetos) || 1)) * 100)}%</td>
                  </tr>
                  {totalsByRamo.mascotas > 0 && (
                    <tr>
                      <td className="py-2 px-3 font-semibold">Mascotas</td>
                      <td className="py-2 px-3 text-center">${totalsByRamo.mascotas.toLocaleString('es-MX', {maximumFractionDigits:0})}</td>
                      <td className="py-2 px-3 text-center font-bold text-teal-700">{Math.round((totalsByRamo.mascotas / (Number(ingresosNetos) || 1)) * 100)}%</td>
                    </tr>
                  )}
                  <tr className="bg-slate-50 font-black">
                    <td className="py-2 px-3">Ahorro y Construcción Patrimonial (Seguros + Fondo)</td>
                    <td className="py-2 px-3 text-center">${totalsByRamo.ahorro.toLocaleString('es-MX', {maximumFractionDigits:0})}</td>
                    <td className="py-2 px-3 text-center text-teal-700">{Math.round((totalsByRamo.ahorro / (Number(ingresosNetos) || 1)) * 100)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Shield and Protection Diagnostico (The 5 pillars detailed) */}
            <div className="space-y-4 break-before-page break-inside-avoid">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b pb-2 flex items-center gap-1.5">
                <Shield className="h-4.5 w-4.5 text-teal-600" /> 2. Pilares de Protección y Prioridades Recomendadas
              </h3>

              <div className="space-y-4">
                {/* Pilar 1: Retiro con brecha de suficiencia (AJUSTE 5) */}
                <div className="border p-4 rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${prioridades.p1_retiro ? 'bg-red-500' : pprSufficiency && !pprSufficiency.isSufficient ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                    <span className="text-xs font-black text-slate-800">PILAR 1: PLAN PERSONAL DE RETIRO (PPR)</span>
                  </div>
                  
                  {prioridades.p1_retiro ? (
                    <p className="text-xs text-slate-600 leading-relaxed pl-4">
                      ⚠️ CRÍTICO: No cuentas con plan de retiro. Construir tu fondo de retiro es la prioridad #1 en tu blindaje patrimonial para evitar que dependas de terceros en tu vejez. Contratar una póliza de retiro con aportaciones mensuales deducibles te dará un beneficio fiscal inmediato y blindará tu futuro ante la inflación.
                    </p>
                  ) : pprSufficiency && (
                    <div className="text-xs text-slate-600 pl-4 space-y-2">
                      <p>
                        El cliente ya cuenta con un plan de PPR contratado a <strong>{pprAniosPlazo === '65' ? 'Edad 65' : `${pprAniosPlazo} Años`}</strong> de aportaciones.
                      </p>
                      
                      <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border text-center font-semibold text-[10px]">
                        <div>
                          <span>Meta Retiro (20 Años)</span>
                          <span className="block text-slate-800 font-extrabold mt-0.5">${pprSufficiency.retirementGoal.toLocaleString('es-MX', {maximumFractionDigits:0})} pesos</span>
                        </div>
                        <div>
                          <span>Ahorro PPR Proyectado</span>
                          <span className="block text-teal-700 font-extrabold mt-0.5">${pprSufficiency.projectedAccumulation.toLocaleString('es-MX', {maximumFractionDigits:0})} pesos</span>
                        </div>
                        <div>
                          <span>Brecha Faltante</span>
                          <span className={`block font-extrabold mt-0.5 ${pprSufficiency.brechaRetiro > 0 ? 'text-red-600 animate-pulse' : 'text-emerald-600'}`}>
                            ${pprSufficiency.brechaRetiro.toLocaleString('es-MX', {maximumFractionDigits:0})} pesos
                          </span>
                        </div>
                      </div>

                      {pprSufficiency.brechaRetiro > 0 && (
                        <div className="bg-red-50 p-2 rounded-xl text-[10px] text-red-800 font-bold border border-red-200 mt-2">
                          ⚠️ FALTANTE DETECTADO: El PPR actual acumulará ${pprSufficiency.projectedAccumulation.toLocaleString('es-MX', {maximumFractionDigits:0})} pesos, arrojando una brecha de **${pprSufficiency.brechaRetiro.toLocaleString('es-MX', {maximumFractionDigits:0})} pesos** por debajo de la meta de retiro ideal. Recomendamos incrementar sustancialmente tu aportación para lograr tu meta de retiro.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Pilar 2: GMM */}
                <div className="border p-4 rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${prioridades.p2_gmm ? 'bg-red-500' : 'bg-emerald-500'}`} />
                    <span className="text-xs font-black text-slate-800">PILAR 2: SEGURO DE GASTOS MÉDICOS MAYORES (GMM)</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pl-4">
                    {prioridades.p2_gmm
                      ? '⚠️ CRÍTICO: No tienes seguro de GMM. Un accidente o enfermedad grave representa un choque financiero devastador que puede consumir por completo tu prioridad #1 de ahorro. Un seguro de GMM blinda tu patrimonio contra siniestros hospitalarios costosos.'
                      : '✅ CUBIERTO: Tu salud y economía familiar están blindadas ante hospitalizaciones y siniestros médicos graves.'}
                  </p>
                </div>

                {/* Pilar 3: Fondo de Emergencia (mencionado solo si no es suficiente) */}
                {!prioridades.p3_fondo.isOk && (
                  <div className="border p-4 rounded-xl space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                      <span className="text-xs font-black text-slate-800">PILAR 3: FONDO DE EMERGENCIA INMEDIATO</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed pl-4">
                      ⚠️ INSUFICIENTE: Tu fondo de emergencia sugerido es de $${prioridades.p3_fondo.fondoIdeal.toLocaleString('es-MX', { maximumFractionDigits: 0 })} pesos (equivalente a ${prioridades.p3_fondo.idealMonths} meses de tus ingresos netos). Tu ahorro actual es de $${(Number(ahorroActual) || 0).toLocaleString('es-MX')} pesos, por lo que requieres construir una reserva adicional de $${prioridades.p3_fondo.gap.toLocaleString('es-MX', { maximumFractionDigits: 0 })} pesos para emergencias.
                    </p>
                  </div>
                )}

                {/* Pilar 4: Seguro Educativo */}
                {prioridades.tieneHijosChicos && (
                  <div className="border p-4 rounded-xl space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${prioridades.p4_educacion ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                      <span className="text-xs font-black text-slate-800">PILAR 4: SEGURO DE EDUCACIÓN UNIVERSITARIA</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed pl-4">
                      {prioridades.p4_educacion 
                        ? '⚠️ ADVERTENCIA: Tienes hijos en edad temprana (0 a 9 años) y no cuentas con plan de ahorro educativo. La universidad es un gasto predecible a largo plazo. Iniciar un plan de ahorro educativo garantizado ahora reduce drásticamente el costo mensual y asegura su futuro profesional pase lo que pase.'
                        : '✅ CUBIERTO: Ya cuentas con un plan para educación universitaria estructurado para garantizar el futuro de tus hijos.'}
                    </p>
                  </div>
                )}

                {/* Pilar 5: Gastos Hormiga */}
                <div className="border p-4 rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${prioridades.p5_hormiga ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                    <span className="text-xs font-black text-slate-800">PILAR 5: OPTIMIZACIÓN DE FINANZAS BÁSICAS</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pl-4">
                    {prioridades.p5_hormiga 
                      ? '⚠️ RECOMENDACIÓN: Tu rubro de entretenimiento y compras cotidianas supera la regla recomendada. Reestructurar gastos menores superfluos (cafecitos, comidas fuera de casa recurrentes, suscripciones no usadas) te inyectará de inmediato el capital libre para fonear tus prioridades patrimoniales.'
                      : '✅ CONTROLADO: Mantienes una disciplina intachable en tus gastos superfluos y de diversión cotidiana.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Report Signature & Footer */}
            <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center text-[10px] text-slate-400 gap-4 mt-8">
              <span>* Diagnóstico financiero ilustrativo proporcionado por AACOM Seguros.</span>
              <div className="flex items-center gap-1 font-bold text-slate-600">
                <span>Generado con el respaldo de</span>
                <img src="/logo.png" alt="AACOM" className="h-5 w-auto object-contain" />
                <span>AACOM cotizador</span>
              </div>
            </div>

          </div>
          {/* PRINT CONTAINER END */}

        </div>
      )}

      {/* --- INJECTED PRINT STYLE (HIDDEN IN BROWSER VIEW) --- */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
            background-color: transparent !important;
          }
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
            background-color: white !important;
            color: black !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          /* Custom styling headers inside print */
          th {
            background-color: #87D1B5 !important;
            color: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          tr.bg-slate-50 {
            background-color: #f8fafc !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      {/* DETAILED VIEW MODAL FOR SELECTED SAVED ADN DIAGNOSTIC */}
      {selectedSavedAdn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto print:hidden">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-5xl rounded-2xl border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="bg-slate-100 dark:bg-zinc-900 border-b p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="AACOM" className="h-7 w-auto object-contain" />
                <div className="h-5 w-px bg-slate-300"></div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">
                    ADN Digital Rescatado: {selectedSavedAdn.clienteNombre}
                  </h3>
                  <p className="text-[10px] text-muted-foreground">
                    Diagnosticado el {new Date(selectedSavedAdn.createdAt).toLocaleDateString("es-MX", { timeZone: 'America/Mexico_City' })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => window.print()} 
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold h-8 px-4 rounded-lg text-xs flex items-center gap-1.5 shadow"
                >
                  <Download className="h-4 w-4" /> Imprimir Diagnóstico
                </button>
                <button 
                  onClick={() => setSelectedSavedAdn(null)} 
                  className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 shrink-0 border rounded-lg flex items-center justify-center hover:bg-slate-50 bg-white"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            {/* Modal Body / Projection Re-render Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* VISUAL DASHBOARD RESCUE */}
              <div className="space-y-6 bg-white p-2 text-slate-800">
                
                {/* Print Title Header */}
                <div className="border-b-2 border-teal-500 pb-4 flex flex-row items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest block">
                      Diagnóstico Patrimonial Digital
                    </span>
                    <h2 className="text-xl font-extrabold text-slate-800">
                      ADN DIGITAL AACOM
                    </h2>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[11px] text-slate-500">
                      <span><strong>Cliente:</strong> {selectedSavedAdn.clienteNombre}</span>
                      <span>•</span>
                      <span><strong>Edad:</strong> {selectedSavedAdn.clienteEdad} años</span>
                      <span>•</span>
                      <span><strong>Fecha:</strong> {new Date(selectedSavedAdn.createdAt).toLocaleDateString("es-MX", { timeZone: 'America/Mexico_City',  day: "numeric", month: "long", year: "numeric" })}</span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <img src="/logo.png" alt="AACOM Seguros" className="h-8 w-auto object-contain mb-1" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wide">AACOM cotizador</span>
                    <span className="text-[9px] text-slate-400"><strong>Agente:</strong> {selectedSavedAdn.user?.name || selectedSavedAdn.user?.email || "Sin Agente"}</span>
                  </div>
                </div>

                {/* Profile detail */}
                <div className="bg-slate-50 border p-4 rounded-xl grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Cliente</span>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5">{selectedSavedAdn.clienteNombre}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Edad</span>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5">{selectedSavedAdn.clienteEdad} años</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Cónyuge</span>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5">{selectedSavedAdn.conyugeNombre ? `${selectedSavedAdn.conyugeNombre} (${selectedSavedAdn.conyugeEdad} años)` : 'No registrado'}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Situación Laboral</span>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5">{selectedSavedAdn.situacionLaboral}</span>
                  </div>
                </div>

                {/* Hijos list */}
                {selectedSavedAdn.hijosData && JSON.parse(selectedSavedAdn.hijosData).length > 0 && (
                  <div className="border border-slate-200 p-3.5 rounded-xl space-y-1.5">
                    <span className="text-[9px] font-black text-slate-600 uppercase block tracking-wider">Estructura de Protección Familiar (Hijos)</span>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {JSON.parse(selectedSavedAdn.hijosData).map((h: any, i: number) => (
                        <div key={i} className="border-l-2 border-teal-500 pl-2">
                          <span className="text-xs font-bold text-slate-800 block">{h.nombre}</span>
                          <span className="text-[9px] text-slate-500 block">{h.edad} años</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Calculations metrics */}
                {(() => {
                  const parsedGastos = JSON.parse(selectedSavedAdn.gastosData)
                  const income = selectedSavedAdn.ingresosNetos || 0
                  const totalEgresos = selectedSavedAdn.totalGastos || 0
                  
                  let necesidades = 0
                  let deseos = 0
                  let ahorro = 0

                  // Sumar aportes de seguros que son tipo Ahorro / PPR
                  if (selectedSavedAdn.hasSeguroAhorro && selectedSavedAdn.ahorroAporte) {
                    const aporte = selectedSavedAdn.ahorroAporte
                    ahorro += selectedSavedAdn.ahorroFrecuencia === 'MENSUAL' ? aporte : aporte / 12
                  }
                  if (selectedSavedAdn.hasPpr && selectedSavedAdn.pprAporte) {
                    const aporte = selectedSavedAdn.pprAporte
                    ahorro += selectedSavedAdn.pprFrecuencia === 'MENSUAL' ? aporte : aporte / 12
                  }

                  let catVivienda = 0
                  let catTransporte = 0
                  let catEducacion = 0
                  let catDeudas = 0
                  let catEntretenimiento = 0
                  let catAlimentacion = 0
                  let catCuidadoPersonal = 0
                  let catAhorro = ahorro
                  let catMascotas = 0

                  if (selectedSavedAdn.modalidad === 'DETALLADO') {
                    const g = parsedGastos
                    catVivienda = (g.renta || 0) + (g.hipoteca || 0) + (g.mantenimiento || 0) + (g.luz || 0) + (g.gas || 0) + (g.agua || 0) + (g.telefono || 0) + (g.internet || 0) + (g.streamings || 0) + (g.celular || 0) + (g.otrosServicios || 0) + ((g.predial || 0) / 12)
                    catTransporte = (g.mensualidadAuto || 0) + ((g.tenencia || 0) / 12) + ((g.verificacion || 0) / 12) + ((g.mantenimientoAuto || 0) / 12) + ((g.seguroAuto || 0) / 12) + (g.gasolina || 0) + (g.transportePublico || 0) + (g.uber || 0) + (g.estacionamientos || 0)
                    catEducacion = (g.escuelaHijos || 0) + (g.escuelaPropia || 0) + (g.utiles || 0) + (g.materiales || 0) + (g.libros || 0)
                    catDeudas = (g.prestamos || 0) + (g.creditos || 0)
                    catAlimentacion = (g.supermercado || 0) + (g.mercado || 0) + (g.accesoriosCasa || 0)
                    catCuidadoPersonal = (g.estetica || 0) + (g.accesoriosBelleza || 0) + (g.medicamentos || 0) + (g.checkups || 0) + (g.ropaZapatos || 0) + (g.gimnasio || 0) + (g.ropaZapatos || 0) + (g.gimnasio || 0)
                    catMascotas = (g.comidaMascota || 0) + (g.saludMascota || 0) + (g.vacunasMascota || 0) + (g.esteticaMascota || 0) + (g.accesoriosMascota || 0)
                    catEntretenimiento = (g.hobbies || 0) + (g.finDeSemana || 0) + (g.vacaciones || 0) + (g.cineTeatro || 0) + (g.comidasEsparcimiento || 0) + (g.baresRecreacion || 0) + (g.cafecitos || 0) + (g.clubSocial || 0) + (g.amazonCompras || 0)
                    catAhorro += (g.inversiones || 0)

                    necesidades = catVivienda + catTransporte + catEducacion + catDeudas + catAlimentacion + catCuidadoPersonal + catMascotas
                    deseos = catEntretenimiento
                  } else if (selectedSavedAdn.modalidad === 'RESUMIDO') {
                    const r = parsedGastos
                    catVivienda = r.vivienda || 0
                    catTransporte = r.transporte || 0
                    catEducacion = r.educacion || 0
                    catDeudas = r.deudas || 0
                    catAlimentacion = r.alimentacion || 0
                    catCuidadoPersonal = r.cuidadoPersonal || 0
                    catMascotas = r.mascotas || 0
                    catEntretenimiento = r.entretenimiento || 0
                    catAhorro += r.ahorro || 0

                    necesidades = catVivienda + catTransporte + catEducacion + catDeudas + catAlimentacion + catCuidadoPersonal + catMascotas
                    deseos = catEntretenimiento
                  } else {
                    necesidades = totalEgresos * 0.7
                    deseos = totalEgresos * 0.3
                    
                    catVivienda = totalEgresos * 0.4
                    catTransporte = totalEgresos * 0.15
                    catEducacion = totalEgresos * 0.1
                    catDeudas = totalEgresos * 0.1
                    catEntretenimiento = totalEgresos * 0.1
                    catAlimentacion = totalEgresos * 0.1
                    catCuidadoPersonal = totalEgresos * 0.05
                  }

                  const pctNecesidades = Math.round((necesidades / (income || 1)) * 100)
                  const pctDeseos = Math.round((deseos / (income || 1)) * 100)
                  const pctAhorro = Math.round((ahorro / (income || 1)) * 100)

                  const p1_retiro = !selectedSavedAdn.hasPpr
                  const p2_gmm = !selectedSavedAdn.hasGmm
                  const idealMonths = selectedSavedAdn.hasGmm ? 1 : 3
                  const fondoIdeal = income * idealMonths
                  const p3_fondo_isOk = (selectedSavedAdn.ahorroActual || 0) >= fondoIdeal
                  const p3_fondo_gap = Math.max(0, fondoIdeal - (selectedSavedAdn.ahorroActual || 0))

                  const tieneHijosChicos = selectedSavedAdn.hijosData && JSON.parse(selectedSavedAdn.hijosData).some((h: any) => h.edad >= 0 && h.edad <= 9)
                  const p4_educacion = tieneHijosChicos && !selectedSavedAdn.hasSeguroAhorro

                  // PPR Plazo and Suficiencia Math Logic
                  const retirementGoal = income * 12 * 20
                  const pprAporteMensual = selectedSavedAdn.pprFrecuencia === 'MENSUAL' ? Number(selectedSavedAdn.pprAporte || 0) : Number(selectedSavedAdn.pprAporte || 0) / 12
                  const pprAporteAnual = pprAporteMensual * 12
                  let plazoAnios = 0
                  if (selectedSavedAdn.pprAniosPlazo === '65') {
                    plazoAnios = Math.max(0, 65 - Number(selectedSavedAdn.clienteEdad || 0))
                  } else {
                    plazoAnios = Number(selectedSavedAdn.pprAniosPlazo || 10)
                  }
                  // Proyección acumulada inflacionada con tasa del 4% anual
                  let projectedPprAccumulation = 0
                  let tempAporte = pprAporteAnual
                  for (let i = 0; i < plazoAnios; i++) {
                    projectedPprAccumulation = (projectedPprAccumulation + tempAporte) * 1.04
                    tempAporte = tempAporte * 1.04
                  }
                  const brechaRetiro = Math.max(0, retirementGoal - projectedPprAccumulation)
                  const isPprSufficient = projectedPprAccumulation >= retirementGoal

                  return (
                    <>
                      {/* Seguros y Ahorros Activos */}
                      <div className="border border-slate-200 p-4 rounded-xl space-y-2 bg-slate-50/40">
                        <span className="text-[9px] font-black text-slate-600 uppercase block tracking-wider">
                          Seguros y Ahorros Activos
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-slate-800">
                          {selectedSavedAdn.hasPpr && (
                            <div className="border-l-2 border-emerald-500 pl-2">
                              <span className="text-xs font-bold text-slate-800 block">PPR (Retiro)</span>
                              <span className="text-[9px] text-slate-500 block">
                                Aporte: ${selectedSavedAdn.pprAporte?.toLocaleString('es-MX')} ({selectedSavedAdn.pprFrecuencia === 'MENSUAL' ? 'Mensual' : 'Anual'})
                                <br />
                                Plazo: {selectedSavedAdn.pprAniosPlazo === '65' ? 'Hasta edad 65' : `${selectedSavedAdn.pprAniosPlazo} años`}
                              </span>
                            </div>
                          )}
                          {selectedSavedAdn.hasSeguroAhorro && (
                            <div className="border-l-2 border-emerald-500 pl-2">
                              <span className="text-xs font-bold text-slate-800 block">Ahorro / Plan Educativo</span>
                              <span className="text-[9px] text-slate-500 block">
                                Aporte: ${selectedSavedAdn.ahorroAporte?.toLocaleString('es-MX')} ({selectedSavedAdn.ahorroFrecuencia === 'MENSUAL' ? 'Mensual' : 'Anual'})
                              </span>
                            </div>
                          )}
                          {selectedSavedAdn.hasGmm && (
                            <div className="border-l-2 border-teal-500 pl-2">
                              <span className="text-xs font-bold text-slate-800 block">Gastos Médicos (GMM)</span>
                              <span className="text-[9px] text-slate-500 block">Póliza de Salud Activa</span>
                            </div>
                          )}
                          {selectedSavedAdn.hasSeguroVida && (
                            <div className="border-l-2 border-teal-500 pl-2">
                              <span className="text-xs font-bold text-slate-800 block">Seguro de Vida</span>
                              <span className="text-[9px] text-slate-500 block">
                                {selectedSavedAdn.vidaSumaAsegurada 
                                  ? `Suma Asegurada: $${selectedSavedAdn.vidaSumaAsegurada.toLocaleString('es-MX')} pesos`
                                  : 'Póliza de Protección Activa'}
                              </span>
                            </div>
                          )}
                          {!selectedSavedAdn.hasPpr && !selectedSavedAdn.hasSeguroAhorro && !selectedSavedAdn.hasGmm && !selectedSavedAdn.hasSeguroVida && (
                            <span className="text-xs text-slate-400 italic col-span-4">Ninguno registrado.</span>
                          )}
                        </div>
                      </div>

                      {/* Financial 50-30-20 Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="border p-4 rounded-xl space-y-3 bg-white">
                          <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Flujo Mensual de Efectivo</h4>
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between border-b pb-1">
                              <span className="font-semibold text-slate-500">Ingresos Netos:</span>
                              <span className="font-bold text-slate-800">${income.toLocaleString('es-MX')} MXN</span>
                            </div>
                            <div className="flex justify-between border-b pb-1">
                              <span className="font-semibold text-slate-500">Gastos Necesidades (Fijos):</span>
                              <span className="font-bold text-slate-800">${necesidades.toLocaleString('es-MX')} MXN ({pctNecesidades}%)</span>
                            </div>
                            <div className="flex justify-between border-b pb-1">
                              <span className="font-semibold text-slate-500">Ahorro y Patrimonio:</span>
                              <span className="font-bold text-emerald-600">${ahorro.toLocaleString('es-MX')} MXN ({pctAhorro}%)</span>
                            </div>
                            <div className="flex justify-between border-b pb-1">
                              <span className="font-semibold text-slate-500">Deseos y Esparcimiento:</span>
                              <span className="font-bold text-amber-600">${deseos.toLocaleString('es-MX')} MXN ({pctDeseos}%)</span>
                            </div>
                            <div className="flex justify-between pt-1">
                              <span className="font-bold text-teal-800">Remanente de Caja:</span>
                              <span className="font-bold text-teal-700">${Math.max(0, income - totalEgresos).toLocaleString('es-MX')} MXN</span>
                            </div>
                          </div>
                        </div>

                        {/* Warren Percent progress bars */}
                        <div className="border p-4 rounded-xl space-y-3.5 flex flex-col justify-between bg-white">
                          <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Comparación Warren 50-30-20</h4>
                          
                          <div className="space-y-3">
                            <div className="space-y-0.5">
                              <div className="flex justify-between text-[11px] font-bold text-slate-600">
                                <span>Necesidades (Real / Óptimo)</span>
                                <span>{pctNecesidades}% / 50%</span>
                              </div>
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div className="bg-blue-500 h-full" style={{ width: `${Math.min(100, pctNecesidades)}%` }} />
                              </div>
                            </div>

                            <div className="space-y-0.5">
                              <div className="flex justify-between text-[11px] font-bold text-slate-600">
                                <span>Ahorro (Real / Óptimo)</span>
                                <span>{pctAhorro}% / 30%</span>
                              </div>
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div className="bg-emerald-500 h-full" style={{ width: `${Math.min(100, pctAhorro)}%` }} />
                              </div>
                            </div>

                            <div className="space-y-0.5">
                              <div className="flex justify-between text-[11px] font-bold text-slate-600">
                                <span>Deseos (Real / Óptimo)</span>
                                <span>{pctDeseos}% / 20%</span>
                              </div>
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div className="bg-amber-500 h-full" style={{ width: `${Math.min(100, pctDeseos)}%` }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Resumen de Gastos por Ramo Principal */}
                      <div className="border p-4 rounded-xl space-y-3 bg-white text-slate-800">
                        <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Resumen de Gastos por Ramo Principal</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-[11px] border-collapse">
                            <thead>
                              <tr className="bg-slate-50 text-slate-700 uppercase tracking-wider font-bold border-b text-[10px]">
                                <th className="py-2 px-3">Ramo de Gasto</th>
                                <th className="py-2 px-3 text-center">Gasto Mensualizado</th>
                                <th className="py-2 px-3 text-center">Porcentaje del Ingreso</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-800">
                              <tr className="hover:bg-slate-50/50">
                                <td className="py-1.5 px-3 font-semibold">Vivienda y Servicios (incluye Predial)</td>
                                <td className="py-1.5 px-3 text-center">${catVivienda.toLocaleString('es-MX', {maximumFractionDigits:0})}</td>
                                <td className="py-1.5 px-3 text-center font-bold text-teal-600">{Math.round((catVivienda / (income || 1)) * 100)}%</td>
                              </tr>
                              <tr className="hover:bg-slate-50/50">
                                <td className="py-1.5 px-3 text-center font-semibold">Transporte y Auto (anuales mensualizados)</td>
                                <td className="py-1.5 px-3 text-center">${catTransporte.toLocaleString('es-MX', {maximumFractionDigits:0})}</td>
                                <td className="py-1.5 px-3 text-center font-bold text-teal-600">{Math.round((catTransporte / (income || 1)) * 100)}%</td>
                              </tr>
                              <tr className="hover:bg-slate-50/50">
                                <td className="py-1.5 px-3 font-semibold">Educación</td>
                                <td className="py-1.5 px-3 text-center">${catEducacion.toLocaleString('es-MX', {maximumFractionDigits:0})}</td>
                                <td className="py-1.5 px-3 text-center font-bold text-teal-600">{Math.round((catEducacion / (income || 1)) * 100)}%</td>
                              </tr>
                              <tr className="hover:bg-slate-50/50">
                                <td className="py-1.5 px-3 font-semibold">Deudas y Créditos</td>
                                <td className="py-1.5 px-3 text-center">${catDeudas.toLocaleString('es-MX', {maximumFractionDigits:0})}</td>
                                <td className="py-1.5 px-3 text-center font-bold text-teal-600">{Math.round((catDeudas / (income || 1)) * 100)}%</td>
                              </tr>
                              <tr className="hover:bg-slate-50/50">
                                <td className="py-1.5 px-3 font-semibold">Diversión y Entretenimiento (Deseos)</td>
                                <td className="py-1.5 px-3 text-center">${catEntretenimiento.toLocaleString('es-MX', {maximumFractionDigits:0})}</td>
                                <td className="py-1.5 px-3 text-center font-bold text-teal-600">{Math.round((catEntretenimiento / (income || 1)) * 100)}%</td>
                              </tr>
                              <tr className="hover:bg-slate-50/50">
                                <td className="py-1.5 px-3 font-semibold">Alimentación y Despensa</td>
                                <td className="py-1.5 px-3 text-center">${catAlimentacion.toLocaleString('es-MX', {maximumFractionDigits:0})}</td>
                                <td className="py-1.5 px-3 text-center font-bold text-teal-600">{Math.round((catAlimentacion / (income || 1)) * 100)}%</td>
                              </tr>
                              <tr className="hover:bg-slate-50/50">
                                <td className="py-1.5 px-3 font-semibold">Cuidado Personal y Salud</td>
                                <td className="py-1.5 px-3 text-center">${catCuidadoPersonal.toLocaleString('es-MX', {maximumFractionDigits:0})}</td>
                                <td className="py-1.5 px-3 text-center font-bold text-teal-600">{Math.round((catCuidadoPersonal / (income || 1)) * 100)}%</td>
                              </tr>
                              {catMascotas > 0 && (
                                <tr className="hover:bg-slate-50/50">
                                  <td className="py-1.5 px-3 font-semibold">Mascotas</td>
                                  <td className="py-1.5 px-3 text-center">${catMascotas.toLocaleString('es-MX', {maximumFractionDigits:0})}</td>
                                  <td className="py-1.5 px-3 text-center font-bold text-teal-600">{Math.round((catMascotas / (income || 1)) * 100)}%</td>
                                </tr>
                              )}
                              <tr className="hover:bg-slate-50/50 bg-slate-50">
                                <td className="py-1.5 px-3 font-bold text-teal-800">Ahorro e Inversiones Totales</td>
                                <td className="py-1.5 px-3 text-center font-bold text-teal-800">${catAhorro.toLocaleString('es-MX', {maximumFractionDigits:0})}</td>
                                <td className="py-1.5 px-3 text-center font-bold text-teal-800">{Math.round((catAhorro / (income || 1)) * 100)}%</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* 5 Priorities Semáforo Evaluation */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
                          <ShieldCheck className="h-4 w-4 text-teal-600" /> Evaluación de Blindaje y Recomendaciones
                        </h4>
                        
                        <div className="space-y-3">
                          {/* Pilar 1: Retiro / PPR */}
                          <div className="border p-3 rounded-lg flex items-start gap-3 bg-white">
                            <span className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${p1_retiro ? 'bg-red-500 animate-pulse' : (!isPprSufficient ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500')}`} />
                            <div className="text-xs w-full">
                              <span className="font-extrabold text-[9px] tracking-wider text-slate-400 block uppercase">Pilar 1: Plan Personal para Retiro (PPR)</span>
                              <p className="text-slate-600 mt-0.5">
                                {p1_retiro 
                                  ? '⚠️ Alerta: El cliente no cuenta con plan para retiro. Es crítico iniciar un ahorro deducible bajo el Art. 151 LISR para construir su independencia a edad de retiro.'
                                  : <>
                                      <span className="font-bold text-slate-700">✅ Registrado: </span> El cliente aporta <strong>${selectedSavedAdn.pprAporte?.toLocaleString('es-MX')}</strong> ({selectedSavedAdn.pprFrecuencia === 'MENSUAL' ? 'Mensual' : 'Anual'}) a un plazo contratado de <strong>{selectedSavedAdn.pprAniosPlazo === '65' ? 'Hasta edad 65' : `${selectedSavedAdn.pprAniosPlazo} años`}</strong>.
                                      <span className="block mt-2 pt-2 border-t border-slate-100 text-slate-700">
                                        <strong>Meta de Retiro (20 años de ingresos):</strong> ${retirementGoal.toLocaleString('es-MX')} pesos.
                                        <br />
                                        <strong>Acumulación PPR Proyectada:</strong> ${projectedPprAccumulation.toLocaleString('es-MX')} pesos.
                                      </span>
                                      {!isPprSufficient && (
                                        <span className="block mt-2 bg-red-50 text-red-800 p-2 rounded-md font-semibold border border-red-100">
                                          ⚠️ Brecha Financiera Detectada: Faltan <strong>${brechaRetiro.toLocaleString('es-MX')} pesos</strong> para alcanzar la meta. 
                                          Se sugiere incrementar sustancialmente su aportación para lograr su meta de retiro.
                                        </span>
                                      )}
                                    </>
                                }
                              </p>
                            </div>
                          </div>

                          {/* Pilar 2: GMM */}
                          <div className="border p-3 rounded-lg flex items-start gap-3 bg-white">
                            <span className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${p2_gmm ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                            <div className="text-xs">
                              <span className="font-extrabold text-[9px] tracking-wider text-slate-400 block uppercase">Pilar 2: Gastos Médicos Mayores (GMM)</span>
                              <p className="text-slate-600 mt-0.5">
                                {p2_gmm 
                                  ? '⚠️ Alerta: Sin póliza de GMM. Un accidente o enfermedad grave extinguirá de inmediato sus fondos líquidos de emergencia e inversiones.'
                                  : '✅ Cubierto: Salud y patrimonio blindados con póliza de Gastos Médicos Mayores.'}
                              </p>
                            </div>
                          </div>

                          {/* Pilar 3: Fondo de Emergencia */}
                          {!p3_fondo_isOk && (
                            <div className="border p-3 rounded-lg flex items-start gap-3 bg-white">
                              <span className="h-2 w-2 rounded-full mt-1.5 shrink-0 bg-red-500" />
                              <div className="text-xs">
                                <span className="font-extrabold text-[9px] tracking-wider text-slate-400 block uppercase">Pilar 3: Fondo de Emergencia</span>
                                <p className="text-slate-600 mt-0.5">
                                  ⚠️ Insuficiente: Fondo de emergencia óptimo sugerido: ${fondoIdeal.toLocaleString('es-MX')} (equivalente a {idealMonths} meses). Cuenta actualmente con ${(selectedSavedAdn.ahorroActual || 0).toLocaleString('es-MX')} pesos (Faltante: ${p3_fondo_gap.toLocaleString('es-MX')} pesos).
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Pilar 4: Seguro Educativo */}
                          {tieneHijosChicos && (
                            <div className="border p-3 rounded-lg flex items-start gap-3 bg-white">
                              <span className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${p4_educacion ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                              <div className="text-xs">
                                <span className="font-extrabold text-[9px] tracking-wider text-slate-400 block uppercase">Pilar 4: Seguro Educativo</span>
                                <p className="text-slate-600 mt-0.5">
                                  {p4_educacion 
                                    ? '⚠️ Recomendación: Cuenta con hijos pequeños (0-9 años) sin plan educativo. Iniciar una póliza de ahorro universitario garantiza su carrera profesional y reduce sustancialmente el costo mensual.'
                                    : '✅ Cubierto: Cuentas con un plan de ahorro educativo previsto.'}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )
                })()}

                {/* Print/Modal footer signature */}
                <div className="border-t pt-4 flex flex-row justify-between items-center text-[9px] text-slate-400 gap-2">
                  <span>* Reporte de diagnóstico ilustrativo generado de forma segura desde la base de datos de desarrollo.</span>
                  <div className="flex items-center gap-1 font-bold text-slate-600">
                    <span>Respaldado por la plataforma</span>
                    <img src="/logo.png" alt="AACOM" className="w-auto object-contain" style={{ height: '18px' }} />
                    <span>AACOM cotizador</span>
                  </div>
                </div>

              </div>

            </div>

            {/* Modal Footer actions */}
            <div className="bg-slate-50 dark:bg-zinc-900 border-t p-4 flex justify-end gap-3 print:hidden">
              <button 
                onClick={() => setSelectedSavedAdn(null)} 
                className="h-9 px-4 text-xs font-bold border rounded-lg hover:bg-slate-50 bg-white"
              >
                Cerrar Diagnóstico
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- ELÉGANT REPORT IMPRIMIBLE PDF (HIDDEN IN SCREEN) --- */}
      <div id="printable-report" className="hidden print:block bg-white text-black p-8 max-w-5xl mx-auto space-y-8 font-sans">
        
        {/* Cover Page Header */}
        <div className="border-b-4 border-teal-600 pb-5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="AACOM" className="h-14 w-auto object-contain" />
            <div>
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-widest">ADN DIGITAL</h2>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Diagnóstico Patrimonial Digital</span>
            </div>
          </div>
          <div className="text-right text-xs text-slate-500">
            <span className="block font-bold">AACOM SEGUROS</span>
            <span className="block">Fecha: {new Date().toLocaleDateString("es-MX", { timeZone: 'America/Mexico_City' })}</span>
          </div>
        </div>

        {/* General Client Details */}
        <div className="bg-slate-50 border p-5 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Cliente</span>
            <span className="text-xs font-bold text-slate-800 block mt-0.5">{selectedSavedAdn ? selectedSavedAdn.clienteNombre : clienteNombre}</span>
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Edad</span>
            <span className="text-xs font-bold text-slate-800 block mt-0.5">{selectedSavedAdn ? selectedSavedAdn.clienteEdad : clienteEdad} años</span>
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Cónyuge</span>
            <span className="text-xs font-bold text-slate-800 block mt-0.5">{selectedSavedAdn ? (selectedSavedAdn.conyugeNombre ? `${selectedSavedAdn.conyugeNombre} (${selectedSavedAdn.conyugeEdad} años)` : 'No registrado') : (conyugeNombre ? `${conyugeNombre} (${conyugeEdad} años)` : 'No registrado')}</span>
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Situación Laboral</span>
            <span className="text-xs font-bold text-slate-800 block mt-0.5">{selectedSavedAdn ? selectedSavedAdn.situacionLaboral : situacionLaboral}</span>
          </div>
        </div>

        {/* Saved ADN Hijos List print */}
        {(selectedSavedAdn ? (selectedSavedAdn.hijosData && JSON.parse(selectedSavedAdn.hijosData).length > 0) : hijos.length > 0) && (
          <div className="border p-4 rounded-xl space-y-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Estructura de Protección Familiar (Hijos)</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {(selectedSavedAdn ? JSON.parse(selectedSavedAdn.hijosData) : hijos).map((h: any, i: number) => (
                <div key={i} className="border-l-2 border-teal-500 pl-2">
                  <span className="text-xs font-bold text-slate-800 block">{h.nombre}</span>
                  <span className="text-[10px] text-slate-500 block">{h.edad} años</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Calculations and analysis printable report */}
        {(() => {
          const currentAdn = selectedSavedAdn || {
            ingresosNetos: ingresosNetos || 0,
            totalGastos: totalsByRamo.totalGastos,
            ahorroActual: ahorroActual || 0,
            hasSeguroAhorro,
            ahorroAporte,
            ahorroFrecuencia,
            hasPpr,
            pprAporte,
            pprFrecuencia,
            pprAniosPlazo,
            clienteEdad,
            hasGmm,
            hijosData: JSON.stringify(hijos)
          }
          const parsedGastos = selectedSavedAdn ? JSON.parse(selectedSavedAdn.gastosData) : gastosDet
          const income = currentAdn.ingresosNetos || 0
          const totalEgresos = currentAdn.totalGastos || 0
          
          let necesidades = 0
          let deseos = 0
          let ahorro = 0 // AJUSTE 1: Fondo de emergencia no se computa como ahorro

          // Sumar aportes de seguros que son tipo Ahorro / PPR
          if (currentAdn.hasSeguroAhorro && currentAdn.ahorroAporte) {
            const aporte = Number(currentAdn.ahorroAporte)
            ahorro += currentAdn.ahorroFrecuencia === 'MENSUAL' ? aporte : aporte / 12
          }
          if (currentAdn.hasPpr && currentAdn.pprAporte) {
            const aporte = Number(currentAdn.pprAporte)
            ahorro += currentAdn.pprFrecuencia === 'MENSUAL' ? aporte : aporte / 12
          }

          let catVivienda = 0
          let catTransporte = 0
          let catEducacion = 0
          let catDeudas = 0
          let catEntretenimiento = 0
          let catAlimentacion = 0
          let catCuidadoPersonal = 0
          let catAhorro = ahorro
          let catMascotas = 0

          if (selectedSavedAdn ? (selectedSavedAdn.modalidad === 'DETALLADO') : (modalidad === 'DETALLADO')) {
            const g = parsedGastos
            catVivienda = (g.renta || 0) + (g.hipoteca || 0) + (g.mantenimiento || 0) + (g.luz || 0) + (g.gas || 0) + (g.agua || 0) + (g.telefono || 0) + (g.internet || 0) + (g.streamings || 0) + (g.celular || 0) + (g.otrosServicios || 0) + ((g.predial || 0) / 12)
            catTransporte = (g.mensualidadAuto || 0) + ((g.tenencia || 0) / 12) + ((g.verificacion || 0) / 12) + ((g.mantenimientoAuto || 0) / 12) + ((g.seguroAuto || 0) / 12) + (g.gasolina || 0) + (g.transportePublico || 0) + (g.uber || 0) + (g.estacionamientos || 0)
            catEducacion = (g.escuelaHijos || 0) + (g.escuelaPropia || 0) + (g.utiles || 0) + (g.materiales || 0) + (g.libros || 0)
            catDeudas = (g.prestamos || 0) + (g.creditos || 0)
            catAlimentacion = (g.supermercado || 0) + (g.mercado || 0) + (g.accesoriosCasa || 0)
            catCuidadoPersonal = (g.estetica || 0) + (g.accesoriosBelleza || 0) + (g.medicamentos || 0) + (g.checkups || 0) + (g.ropaZapatos || 0) + (g.gimnasio || 0)
            catMascotas = (g.comidaMascota || 0) + (g.saludMascota || 0) + (g.vacunasMascota || 0) + (g.esteticaMascota || 0) + (g.accesoriosMascota || 0)
            catEntretenimiento = (g.hobbies || 0) + (g.finDeSemana || 0) + (g.vacaciones || 0) + (g.cineTeatro || 0) + (g.comidasEsparcimiento || 0) + (g.baresRecreacion || 0) + (g.cafecitos || 0) + (g.clubSocial || 0) + (g.amazonCompras || 0)
            catAhorro += (g.inversiones || 0)

            necesidades = catVivienda + catTransporte + catEducacion + catDeudas + catAlimentacion + catCuidadoPersonal + catMascotas
            deseos = catEntretenimiento
          } else if (selectedSavedAdn ? (selectedSavedAdn.modalidad === 'RESUMIDO') : (modalidad === 'RESUMIDO')) {
            const r = parsedGastos
            catVivienda = r.vivienda || 0
            catTransporte = r.transporte || 0
            catEducacion = r.educacion || 0
            catDeudas = r.deudas || 0
            catAlimentacion = r.alimentacion || 0
            catCuidadoPersonal = r.cuidadoPersonal || 0
            catMascotas = r.mascotas || 0
            catEntretenimiento = r.entretenimiento || 0
            catAhorro += r.ahorro || 0

            necesidades = catVivienda + catTransporte + catEducacion + catDeudas + catAlimentacion + catCuidadoPersonal + catMascotas
            deseos = catEntretenimiento
          } else {
            necesidades = totalEgresos * 0.7
            deseos = totalEgresos * 0.3
            
            catVivienda = totalEgresos * 0.4
            catTransporte = totalEgresos * 0.15
            catEducacion = totalEgresos * 0.1
            catDeudas = totalEgresos * 0.1
            catEntretenimiento = totalEgresos * 0.1
            catAlimentacion = totalEgresos * 0.1
            catCuidadoPersonal = totalEgresos * 0.05
          }

          const pctNecesidades = Math.round((necesidades / (income || 1)) * 100)
          const pctDeseos = Math.round((deseos / (income || 1)) * 100)
          const pctAhorro = Math.round((ahorro / (income || 1)) * 100)

          const p1_retiro = !currentAdn.hasPpr
          const p2_gmm = !currentAdn.hasGmm
          const idealMonths = currentAdn.hasGmm ? 1 : 3
          const fondoIdeal = income * idealMonths
          const p3_fondo_isOk = (currentAdn.ahorroActual || 0) >= fondoIdeal
          const p3_fondo_gap = Math.max(0, fondoIdeal - (currentAdn.ahorroActual || 0))

          const tieneHijosChicos = currentAdn.hijosData && JSON.parse(currentAdn.hijosData).some((h: any) => h.edad >= 0 && h.edad <= 9)
          const p4_educacion = tieneHijosChicos && !currentAdn.hasSeguroAhorro

          // PPR Plazo and Suficiencia Math
          const retirementGoal = income * 12 * 20
          const pprAporteMensual = currentAdn.pprFrecuencia === 'MENSUAL' ? Number(currentAdn.pprAporte || 0) : Number(currentAdn.pprAporte || 0) / 12
          const pprAporteAnual = pprAporteMensual * 12
          let plazoAnios = 0
          if (currentAdn.pprAniosPlazo === '65') {
            plazoAnios = Math.max(0, 65 - Number(currentAdn.clienteEdad || 0))
          } else {
            plazoAnios = Number(currentAdn.pprAniosPlazo || 10)
          }
          // Proyección acumulada inflacionada con tasa del 4% anual
          let projectedPprAccumulation = 0
          let tempAporte = pprAporteAnual
          for (let i = 0; i < plazoAnios; i++) {
            projectedPprAccumulation = (projectedPprAccumulation + tempAporte) * 1.04
            tempAporte = tempAporte * 1.04
          }
          const brechaRetiro = Math.max(0, retirementGoal - projectedPprAccumulation)
          const isPprSufficient = projectedPprAccumulation >= retirementGoal

          return (
            <>
              {/* Financial 50-30-20 Summary */}
              <div className="grid grid-cols-2 gap-6">
                <div className="border p-4 rounded-xl space-y-2">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Presupuesto Mensual</span>
                  <table className="w-full text-left text-xs border-collapse">
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      <tr>
                        <td className="py-1 font-semibold text-slate-500">Ingresos Netos:</td>
                        <td className="py-1 font-extrabold text-right text-slate-800">${income.toLocaleString('es-MX')}</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-semibold text-slate-500">Gastos Fijos (Necesidades):</td>
                        <td className="py-1 font-bold text-right text-slate-800">${necesidades.toLocaleString('es-MX')} ({pctNecesidades}%)</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-semibold text-slate-500">Ahorro y Previsión:</td>
                        <td className="py-1 font-bold text-right text-emerald-600">${ahorro.toLocaleString('es-MX')} ({pctAhorro}%)</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-semibold text-slate-500">Diversión (Deseos):</td>
                        <td className="py-1 font-bold text-right text-amber-600">${deseos.toLocaleString('es-MX')} ({pctDeseos}%)</td>
                      </tr>
                      <tr className="bg-slate-50">
                        <td className="py-1.5 font-bold text-teal-800">Remanente de Flujo:</td>
                        <td className="py-1.5 font-extrabold text-right text-teal-700">${Math.max(0, income - totalEgresos).toLocaleString('es-MX')}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="border p-4 rounded-xl space-y-4 bg-slate-50/20">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Distribución Real vs Warren 50-30-20</span>
                  
                  <div className="space-y-3">
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-[10px] font-bold text-slate-600">
                        <span>Necesidades Fijas (Óptimo: 50%)</span>
                        <span>{pctNecesidades}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full" style={{ width: `${Math.min(100, pctNecesidades)}%` }} />
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex justify-between text-[10px] font-bold text-slate-600">
                        <span>Ahorro / Patrimonio (Óptimo: 30%)</span>
                        <span>{pctAhorro}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full" style={{ width: `${Math.min(100, pctAhorro)}%` }} />
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex justify-between text-[10px] font-bold text-slate-600">
                        <span>Deseos / Gustos (Óptimo: 20%)</span>
                        <span>{pctDeseos}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full" style={{ width: `${Math.min(100, pctDeseos)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Printable desglose por ramos */}
              <div className="border p-4 rounded-xl space-y-2">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Gastos Mensuales Consolidados por Ramo</span>
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 uppercase tracking-wider font-bold border-b text-[10px]">
                      <th className="py-2 px-3">Ramo de Gasto</th>
                      <th className="py-2 px-3 text-center">Gasto Mensual</th>
                      <th className="py-2 px-3 text-center">Porcentaje del Ingreso</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    <tr>
                      <td className="py-1.5 px-3 font-semibold">Vivienda y Servicios (incluye Predial)</td>
                      <td className="py-1.5 px-3 text-center">${catVivienda.toLocaleString('es-MX', {maximumFractionDigits:0})}</td>
                      <td className="py-1.5 px-3 text-center font-bold text-teal-600">{Math.round((catVivienda / (income || 1)) * 100)}%</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 font-semibold">Transporte y Auto (anuales mensualizados)</td>
                      <td className="py-1.5 px-3 text-center">${catTransporte.toLocaleString('es-MX', {maximumFractionDigits:0})}</td>
                      <td className="py-1.5 px-3 text-center font-bold text-teal-600">{Math.round((catTransporte / (income || 1)) * 100)}%</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 font-semibold">Educación</td>
                      <td className="py-1.5 px-3 text-center">${catEducacion.toLocaleString('es-MX', {maximumFractionDigits:0})}</td>
                      <td className="py-1.5 px-3 text-center font-bold text-teal-600">{Math.round((catEducacion / (income || 1)) * 100)}%</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 font-semibold">Deudas y Créditos</td>
                      <td className="py-1.5 px-3 text-center">${catDeudas.toLocaleString('es-MX', {maximumFractionDigits:0})}</td>
                      <td className="py-1.5 px-3 text-center font-bold text-teal-600">{Math.round((catDeudas / (income || 1)) * 100)}%</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 font-semibold">Diversión y Entretenimiento (Deseos)</td>
                      <td className="py-1.5 px-3 text-center">${catEntretenimiento.toLocaleString('es-MX', {maximumFractionDigits:0})}</td>
                      <td className="py-1.5 px-3 text-center font-bold text-teal-600">{Math.round((catEntretenimiento / (income || 1)) * 100)}%</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 font-semibold">Alimentación y Despensa</td>
                      <td className="py-1.5 px-3 text-center">${catAlimentacion.toLocaleString('es-MX', {maximumFractionDigits:0})}</td>
                      <td className="py-1.5 px-3 text-center font-bold text-teal-600">{Math.round((catAlimentacion / (income || 1)) * 100)}%</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 font-semibold">Cuidado Personal y Salud</td>
                      <td className="py-1.5 px-3 text-center">${catCuidadoPersonal.toLocaleString('es-MX', {maximumFractionDigits:0})}</td>
                      <td className="py-1.5 px-3 text-center font-bold text-teal-600">{Math.round((catCuidadoPersonal / (income || 1)) * 100)}%</td>
                    </tr>
                    {catMascotas > 0 && (
                      <tr>
                        <td className="py-1.5 px-3 font-semibold">Mascotas</td>
                        <td className="py-1.5 px-3 text-center">${catMascotas.toLocaleString('es-MX', {maximumFractionDigits:0})}</td>
                        <td className="py-1.5 px-3 text-center font-bold text-teal-600">{Math.round((catMascotas / (income || 1)) * 100)}%</td>
                      </tr>
                    )}
                    <tr className="bg-slate-50 font-black">
                      <td className="py-2 px-3">Ahorro e Inversiones Totales</td>
                      <td className="py-2 px-3 text-center">${catAhorro.toLocaleString('es-MX', {maximumFractionDigits:0})}</td>
                      <td className="py-2 px-3 text-center text-teal-700">{Math.round((catAhorro / (income || 1)) * 100)}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Checklist Semáforo in PDF */}
              <div className="space-y-4">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Diagnóstico de Prioridades y Blindaje Recomendado</span>
                
                <div className="space-y-3">
                  {/* Pilar 1: Retiro */}
                  <div className="border p-4 rounded-xl space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${p1_retiro ? 'bg-red-500' : 'bg-emerald-500'}`} />
                      <span className="text-xs font-black text-slate-800">PILAR 1: PLAN PERSONAL PARA RETIRO (PPR)</span>
                    </div>
                    {p1_retiro ? (
                      <p className="text-xs text-slate-600 leading-relaxed pl-4">
                        ⚠️ CRÍTICO: No cuentas con plan de retiro. Construir tu fondo de retiro es la prioridad #1 en tu blindaje patrimonial para evitar que dependas de terceros en tu vejez. Contratar una póliza de retiro con aportaciones mensuales deducibles te dará un beneficio fiscal inmediato y blindará tu futuro ante la inflación.
                      </p>
                    ) : (
                      <div className="text-xs text-slate-600 pl-4 space-y-2">
                        <p>
                          El cliente ya cuenta con un plan de PPR contratado a <strong>{currentAdn.pprAniosPlazo === '65' ? 'Edad 65' : `${currentAdn.pprAniosPlazo} Años`}</strong> de aportaciones.
                        </p>
                        
                        <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border text-center font-semibold text-[10px]">
                          <div>
                            <span>Meta Retiro (20 Años)</span>
                            <span className="block text-slate-800 font-extrabold mt-0.5">${retirementGoal.toLocaleString('es-MX', {maximumFractionDigits:0})} pesos</span>
                          </div>
                          <div>
                            <span>Ahorro PPR Proyectado</span>
                            <span className="block text-teal-700 font-extrabold mt-0.5">${projectedPprAccumulation.toLocaleString('es-MX', {maximumFractionDigits:0})} pesos</span>
                          </div>
                          <div>
                            <span>Brecha Faltante</span>
                            <span className={`block font-extrabold mt-0.5 ${brechaRetiro > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                              ${brechaRetiro.toLocaleString('es-MX', {maximumFractionDigits:0})} pesos
                            </span>
                          </div>
                        </div>

                        {brechaRetiro > 0 && (
                          <div className="bg-red-50 p-2 rounded-xl text-[10px] text-red-800 font-bold border border-red-200 mt-2">
                            ⚠️ FALTANTE DETECTADO: El PPR actual acumulará ${projectedPprAccumulation.toLocaleString('es-MX', {maximumFractionDigits:0})} pesos, arrojando una brecha de **${brechaRetiro.toLocaleString('es-MX', {maximumFractionDigits:0})} pesos** por debajo de la meta de retiro ideal. Recomendamos incrementar sustancialmente tu aportación para lograr tu meta de retiro.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Pilar 2: GMM */}
                  <div className="border p-4 rounded-xl space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${p2_gmm ? 'bg-red-500' : 'bg-emerald-500'}`} />
                      <span className="text-xs font-black text-slate-800">PILAR 2: SEGURO DE GASTOS MÉDICOS MAYORES (GMM)</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed pl-4">
                      {p2_gmm
                        ? '⚠️ CRÍTICO: No tienes seguro de GMM. Un accidente o enfermedad grave representa un choque financiero devastador que puede consumir por completo tu prioridad #1 de ahorro. Un seguro de GMM blinda tu patrimonio contra siniestros hospitalarios costosos.'
                        : '✅ CUBIERTO: Tu salud y economía familiar están blindadas ante hospitalizaciones y siniestros médicos graves.'}
                    </p>
                  </div>

                  {/* Pilar 3: Fondo de Emergencia (mencionado solo si no es suficiente) */}
                  {!p3_fondo_isOk && (
                    <div className="border p-4 rounded-xl space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                        <span className="text-xs font-black text-slate-800">PILAR 3: FONDO DE EMERGENCIA INMEDIATO</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed pl-4">
                        ⚠️ INSUFICIENTE: Tu fondo de emergencia sugerido es de $${fondoIdeal.toLocaleString('es-MX', { maximumFractionDigits: 0 })} pesos (equivalente a {idealMonths} meses de tus ingresos netos). Tu ahorro actual es de $${(Number(currentAdn.ahorroActual) || 0).toLocaleString('es-MX')} pesos, por lo que requieres construir una reserva adicional de $${p3_fondo_gap.toLocaleString('es-MX', { maximumFractionDigits: 0 })} pesos para emergencias.
                      </p>
                    </div>
                  )}

                  {/* Pilar 4: Seguro Educativo */}
                  {tieneHijosChicos && (
                    <div className="border p-4 rounded-xl space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${p4_educacion ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                        <span className="text-xs font-black text-slate-800">PILAR 4: SEGURO DE EDUCACIÓN UNIVERSITARIA</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed pl-4">
                        {p4_educacion 
                          ? '⚠️ ADVERTENCIA: Tienes hijos en edad temprana (0 a 9 años) y no cuentas con plan de ahorro educativo. La universidad es un gasto predecible a largo plazo. Iniciar un plan de ahorro educativo garantizado ahora reduce drásticamente el costo mensual y asegura su futuro profesional pase lo que pase.'
                          : '✅ CUBIERTO: Ya cuentas con un plan para educación universitaria estructurado para garantizar el futuro de tus hijos.'}
                      </p>
                    </div>
                  )}

                  {/* Pilar 5: Gastos Hormiga */}
                  <div className="border p-4 rounded-xl space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      <span className="text-xs font-black text-slate-800">PILAR 5: OPTIMIZACIÓN DE FINANZAS BÁSICAS</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed pl-4">
                      ✅ CONTROLADO: Mantienes una disciplina intachable en tus gastos superfluos y de diversión cotidiana.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )
        })()}

        {/* Print footer signature */}
        <div className="border-t pt-4 flex flex-row justify-between items-center text-[9px] text-slate-400 gap-2">
          <span>* Reporte de diagnóstico patrimonial ilustrativo proporcionado por AACOM Seguros.</span>
          <div className="flex items-center gap-1 font-bold text-slate-600">
            <span>Respaldado por la plataforma</span>
            <img src="/logo.png" alt="AACOM" className="w-auto object-contain" style={{ height: '18px' }} />
            <span>AACOM cotizador</span>
          </div>
        </div>
        </div>
      </div>
  )
}




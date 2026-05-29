'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  User, Users, Shield, TrendingUp, DollarSign, Wallet, 
  Calendar, Plus, Trash2, Download, RefreshCw, AlertTriangle, 
  CheckCircle, HelpCircle, FileText, ArrowRight, ArrowLeft, 
  Heart, GraduationCap, Percent, ShoppingBag, Landmark, Coffee, Smile
} from 'lucide-react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, 
  Bar, XAxis, YAxis, Tooltip as ChartTooltip, Legend
} from 'recharts'
import { saveAdnDiagnostic } from '@/app/actions'

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
  estetica: 0, accesoriosBelleza: 0, medicamentos: 0, checkups: 0,
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
  
  // Step 1: Perfil
  const [clienteNombre, setClienteNombre] = useState('')
  const [clienteEdad, setClienteEdad] = useState<number | ''>('')
  const [conyugeNombre, setConyugeNombre] = useState('')
  const [conyugeEdad, setConyugeEdad] = useState<number | ''>('')
  const [situacionLaboral, setSituacionLaboral] = useState('Empleado')
  const [hijos, setHijos] = useState<Hijo[]>([])
  const [nuevoHijoNombre, setNuevoHijoNombre] = useState('')
  const [nuevoHijoEdad, setNuevoHijoEdad] = useState<number | ''>('')

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

  // Egresos por modalidad
  const [gastosDet, setGastosDet] = useState<GastosDetallados>(initialGastosDetallados)
  const [gastosRes, setGastosRes] = useState<GastosResumidos>(initialGastosResumidos)
  const [gastosBasicosTotales, setGastosBasicosTotales] = useState<number | ''>('')

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

  // --- Sumas y Cálculos Financieros Desglosados por Ramo (AJUSTE 6) ---
  const totalsByRamo = useMemo(() => {
    let vivienda = 0
    let transporte = 0
    let educacion = 0
    let deudas = 0
    let entretenimiento = 0
    let alimentacion = 0
    let cuidadoPersonal = 0
    let ahorro = Number(ahorroActual) || 0
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
      cuidadoPersonal = g.estetica + g.accesoriosBelleza + g.medicamentos + g.checkups
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

    const projectedAccumulation = aporteAnual * plazoAnios
    const brechaRetiro = Math.max(0, retirementGoal - projectedAccumulation)
    const isSufficient = projectedAccumulation >= retirementGoal

    // Sugerencia de aportación mensual adicional para cubrir brecha
    const adicionalMensualSugerido = plazoAnios > 0 ? (brechaRetiro / plazoAnios) / 12 : 0

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
    }
  ]

  // --- Step Validation ---
  const validateStep = () => {
    setValidationError('')
    if (step === 1) {
      if (!clienteNombre.trim()) return 'Por favor ingresa el nombre del cliente'
      if (clienteEdad === '' || Number(clienteEdad) <= 0) return 'Por favor ingresa una edad válida'
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
      if (modalidad === 'BASICO' && (gastosBasicosTotales === '' || Number(gastosBasicosTotales) < 0)) {
        return 'Por favor especifica el total de gastos'
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
      gastosData: JSON.stringify(gastosObj),
      totalGastos: totalsByRamo.totalGastos
    }

    try {
      const res = await saveAdnDiagnostic(payload)
      if (res.success) {
        alert('¡Diagnóstico ADN guardado exitosamente en base de datos de desarrollo!')
      } else {
        setValidationError(res.message || 'Error al guardar el diagnóstico')
      }
    } catch (err: any) {
      setValidationError(err.message || 'Ocurrió un error inesperado al guardar')
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
    setClienteNombre('')
    setClienteEdad('')
    setConyugeNombre('')
    setConyugeEdad('')
    setSituacionLaboral('Empleado')
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
        {step > 0 && (
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

      {/* --- STEP 0: SELECCION DE MODALIDAD --- */}
      {step === 0 && (
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

                {/* Hijos list (AJUSTE 4: Capturar nombre y edad de cada hijo) */}
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
                  {/* PPR (AJUSTE 5: Preguntar plazo contratado) */}
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

                  {/* Seguro de Vida (AJUSTE 1: Preguntar Suma Asegurada) */}
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

                {/* Gastos Desglosados según modalidad */}
                {modalidad === 'DETALLADO' && (
                  <div className="space-y-6">
                    <h4 className="text-xs font-black text-teal-800 uppercase tracking-widest border-b pb-2">Gastos Mensuales Detallados</h4>
                    
                    {/* Vivienda (AJUSTE 3: Agregar Predial a Vivienda y Servicios como anual) */}
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
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.keys(initialGastosDetallados).slice(40, 44).map((key) => (
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
                        {Object.keys(initialGastosDetallados).slice(45).map((key) => (
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
                  <div className="space-y-4 border-t pt-4">
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
                          ⚠️ Tu PPR actual acumulará ${pprSufficiency.projectedAccumulation.toLocaleString('es-MX', {maximumFractionDigits:0})} pesos, pero tu meta de retiro para vivir 20 años de jubilación es de ${pprSufficiency.retirementGoal.toLocaleString('es-MX', {maximumFractionDigits:0})} pesos. Tienes un faltante de **${pprSufficiency.brechaRetiro.toLocaleString('es-MX', {maximumFractionDigits:0})} pesos**. Te sugerimos incrementar tu aportación en **${Math.round(pprSufficiency.adicionalMensualSugerido).toLocaleString('es-MX')} pesos mensuales** para lograr la meta.
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

              {/* Prioridad 3: Fondo de Emergencia */}
              <div className={`p-5 rounded-2xl border flex items-start gap-4 transition-all ${!prioridades.p3_fondo.isOk ? 'bg-red-50/55 border-red-200' : 'bg-emerald-50/40 border-emerald-200'}`}>
                {!prioridades.p3_fondo.isOk ? (
                  <AlertTriangle className="h-6 w-6 text-red-600 shrink-0" />
                ) : (
                  <CheckCircle className="h-6 w-6 text-emerald-600 shrink-0" />
                )}
                <div className="space-y-1">
                  <span className="text-[9px] font-extrabold uppercase tracking-widest block text-slate-400">Prioridad 3</span>
                  <h4 className="font-extrabold text-sm text-slate-800">Fondo de Emergencia Inmediato</h4>
                  <p className="text-xs text-slate-600">
                    {!prioridades.p3_fondo.isOk 
                      ? `⚠️ REQUIERE ATENCIÓN: Tu fondo sugerido es de $${prioridades.p3_fondo.fondoIdeal.toLocaleString('es-MX', { maximumFractionDigits: 0 })} (${prioridades.p3_fondo.idealMonths} meses). Tu brecha faltante es de $${prioridades.p3_fondo.gap.toLocaleString('es-MX', { maximumFractionDigits: 0 })}.`
                      : `✅ Completado: Cuentas con un fondo de emergencia óptimo equivalente a ${prioridades.p3_fondo.idealMonths} meses de tus ingresos netos.`}
                  </p>
                </div>
              </div>

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
                <span className="block font-bold">AACOM SEGUROS S.A. DE C.V.</span>
                <span className="block">Fecha: {new Date().toLocaleDateString('es-MX')}</span>
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
                          ⚠️ FALTANTE DETECTADO: El PPR actual acumulará ${pprSufficiency.projectedAccumulation.toLocaleString('es-MX', {maximumFractionDigits:0})} pesos, arrojando una brecha de **${pprSufficiency.brechaRetiro.toLocaleString('es-MX', {maximumFractionDigits:0})} pesos** por debajo de la meta de retiro ideal. Recomendamos incrementar la aportación en **${Math.round(pprSufficiency.adicionalMensualSugerido).toLocaleString('es-MX')} pesos mensuales** para cerrar la brecha.
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

                {/* Pilar 3: Fondo de Emergencia */}
                <div className="border p-4 rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${!prioridades.p3_fondo.isOk ? 'bg-red-500' : 'bg-emerald-500'}`} />
                    <span className="text-xs font-black text-slate-800">PILAR 3: FONDO DE EMERGENCIA INMEDIATO</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pl-4">
                    {!prioridades.p3_fondo.isOk 
                      ? `⚠️ INSUFICIENTE: Tu fondo de emergencia sugerido es de $${prioridades.p3_fondo.fondoIdeal.toLocaleString('es-MX', { maximumFractionDigits: 0 })} pesos (equivalente a ${prioridades.p3_fondo.idealMonths} meses de tus ingresos netos). Tu ahorro actual es de $${(Number(ahorroActual) || 0).toLocaleString('es-MX')} pesos, por lo que requieres construir una reserva adicional de $${prioridades.p3_fondo.gap.toLocaleString('es-MX', { maximumFractionDigits: 0 })} pesos para emergencias.`
                      : `✅ CUBIERTO: Cuentas con un fondo de emergencia ideal equivalente a ${prioridades.p3_fondo.idealMonths} meses de tus ingresos netos.`}
                  </p>
                </div>

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
    </div>
  )
}

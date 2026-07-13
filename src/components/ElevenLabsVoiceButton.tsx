"use client"

import { useState, useEffect, useRef } from "react"
import { useConversation, ConversationProvider } from "@elevenlabs/react"
import { Mic, MicOff, Loader2, PhoneOff, Phone } from "lucide-react"
import { getVoiceBalance, deductVoiceSeconds, getElevenLabsAgentId, getVoiceAgentPrompt, getVoiceAgenda, getVoiceWeeklyEvents, scheduleVoiceMeeting, draftVoiceEmail, createVoiceTask, listVoiceTasks, completeVoiceTask, deleteVoiceTask, syncVoiceCallSummary } from "@/app/agents/[id]/chat/voiceActions"
import { BuyMinutesModal } from "@/components/BuyMinutesModal"

import { useRouter } from "next/navigation"

export function ElevenLabsVoiceButtonInner({ agentId }: { agentId: string }) {
  const router = useRouter()
  const [balanceSecs, setBalanceSecs] = useState<number>(0)
  const [sessionSeconds, setSessionSeconds] = useState<number>(0)
  const [dynamicPrompt, setDynamicPrompt] = useState<any>(null)
  const [isBuyModalOpen, setIsBuyModalOpen] = useState<boolean>(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const connectionStartRef = useRef<number | null>(null)
  const conversationIdRef = useRef<string | null>(null)
  const weeklyCacheRef = useRef<any>(null)

  useEffect(() => {
    // Cargar saldo inicial y prompt dinámico
    getVoiceBalance().then(balance => setBalanceSecs(balance))
    getVoiceAgentPrompt(agentId).then(prompt => setDynamicPrompt(prompt))
    
    // Pre-cargar la agenda semanal proactivamente al montar el botón
    getVoiceWeeklyEvents(agentId).then(weeklyData => {
      weeklyCacheRef.current = weeklyData
    }).catch(() => {})

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [agentId])

  const conversation = useConversation({
    clientTools: {
      consultar_agenda: async (params?: { fecha?: string }) => {
        console.log("Voice Tool [consultar_agenda] called with:", params)
        try {
          const mxDate = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" }))
          const todayStr = mxDate.getFullYear() + "-" + String(mxDate.getMonth() + 1).padStart(2, '0') + "-" + String(mxDate.getDate()).padStart(2, '0')
          
          let targetDate = params?.fecha
          if (!targetDate || targetDate === 'hoy' || targetDate === 'today') {
            targetDate = todayStr
          } else if (targetDate === 'mañana' || targetDate === 'tomorrow') {
            const tomorrow = new Date(mxDate)
            tomorrow.setDate(mxDate.getDate() + 1)
            targetDate = tomorrow.getFullYear() + "-" + String(tomorrow.getMonth() + 1).padStart(2, '0') + "-" + String(tomorrow.getDate()).padStart(2, '0')
          }
          
          // Si tenemos la agenda semanal pre-cargada y la fecha consultada cae dentro de la semana, respondemos de inmediato
          if (weeklyCacheRef.current?.success) {
            const cache = weeklyCacheRef.current
            
            // Parseo ultra seguro compatible con Safari y navegadores móviles
            const parseDateParts = (dStr: string) => {
              const parts = dStr.split('-');
              return {
                year: parseInt(parts[0], 10),
                month: parseInt(parts[1], 10) - 1,
                day: parseInt(parts[2], 10)
              }
            }
            
            try {
              const target = parseDateParts(targetDate)
              const today = parseDateParts(cache.todayStr)
              const max = parseDateParts(cache.maxDateStr)
              
              const targetTime = new Date(target.year, target.month, target.day).getTime()
              const todayTime = new Date(today.year, today.month, today.day).getTime()
              const maxTime = new Date(max.year, max.month, max.day).getTime()
              
              if (!isNaN(targetTime) && !isNaN(todayTime) && !isNaN(maxTime) && targetTime >= todayTime && targetTime <= maxTime) {
                console.log(`Voice Tool [consultar_agenda] returning CACHED weekly agenda for date: ${targetDate}`)
                
                // 1. Filtrar Google Events de la fecha objetivo
                const googleEvents = (cache.googleEvents || []).filter((e: any) => {
                  const startStr = e.start?.dateTime || e.start?.date || ""
                  return startStr.startsWith(targetDate)
                })
                
                // 2. Filtrar Local Meetings de la fecha objetivo
                const localMeetings = (cache.localMeetings || []).filter((m: any) => {
                  return m.date === targetDate
                })
                
                if (cache.fetchedFromGoogle) {
                  if (googleEvents.length === 0) {
                    return `No tienes reuniones agendadas en tu Google Calendar para el día ${targetDate}.`
                  }
                  
                  const list = googleEvents.map((e: any) => {
                    const start = e.start?.dateTime || e.start?.date || ""
                    let timeFormatted = "Todo el día"
                    if (start.includes('T')) {
                      const eventDate = new Date(start)
                      const localTimeStr = eventDate.toLocaleTimeString('es-MX', { timeZone: 'America/Mexico_City', hour: '2-digit', minute: '2-digit', hour12: false })
                      timeFormatted = localTimeStr
                    }
                    return `- ${timeFormatted}: ${e.summary}`
                  }).join('\n')
                  
                  return `Reuniones agendadas en tu Google Calendar para el ${targetDate}:\n${list}`
                } else {
                  if (localMeetings.length === 0) {
                    return `No tienes reuniones agendadas para la fecha ${targetDate}.`
                  }
                  const list = localMeetings.map((m: any) => `- ${m.time}: ${m.title}`).join('\n')
                  return `Reuniones agendadas para el ${targetDate} (local):\n${list}`
                }
              }
            } catch (parseErr) {
              console.error("Safari Date comparison failed, using server fallback:", parseErr)
            }
          }

          const result = await getVoiceAgenda(targetDate, agentId)
          console.log("Voice Tool [consultar_agenda] success result:", result)
          return result
        } catch (error: any) {
          console.error("Voice Tool [consultar_agenda] execution error:", error)
          return `Error al consultar la agenda: ${error.message}`
        }
      },
      agendar_reunion: async (params: { titulo: string, fecha: string, hora: string, duracion: any }) => {
        console.log("Voice Tool [agendar_reunion] called with:", params)
        try {
          let duration = Number(params.duracion) || 60
          
          // Autocorrección: si la IA manda un valor <= 4 (ej. 1 para '1 hora'),
          // asumimos que omitió la conversión a minutos y multiplicamos por 60.
          if (duration > 0 && duration <= 4) {
            duration = duration * 60
          }
          
          const result = await scheduleVoiceMeeting(params.titulo, params.fecha, params.hora, duration, agentId)
          console.log("Voice Tool [agendar_reunion] success result:", result)
          return result
        } catch (error: any) {
          console.error("Voice Tool [agendar_reunion] execution error:", error)
          return `Error al agendar reunión: ${error.message}`
        }
      },
      redactar_correo: async (params: { destinatario: string, asunto: string, mensaje: string }) => {
        console.log("Voice Tool [redactar_correo] called with:", params)
        try {
          const result = await draftVoiceEmail(params.destinatario, params.asunto, params.mensaje, agentId)
          console.log("Voice Tool [redactar_correo] success result:", result)
          return result
        } catch (error: any) {
          console.error("Voice Tool [redactar_correo] execution error:", error)
          return `Error al redactar correo: ${error.message}`
        }
      },
      gestionar_tareas: async (params: { accion: 'crear' | 'listar' | 'completar' | 'eliminar', titulo?: string, descripcion?: string, prioridad?: string, fecha_limite?: string, completadas?: boolean }) => {
        console.log("Voice Tool [gestionar_tareas] called with:", params)
        try {
          let result = ""
          switch (params.accion) {
            case 'crear': {
              if (!params.titulo) return "Falta el título de la tarea para poder crearla."
              const priority = params.prioridad === 'ALTA' ? 'HIGH' : (params.prioridad === 'BAJA' ? 'LOW' : 'MEDIUM')
              result = await createVoiceTask(params.titulo, params.descripcion, priority, params.fecha_limite, agentId)
              break
            }
            case 'listar': {
              result = await listVoiceTasks(!!params.completadas, agentId)
              break
            }
            case 'completar': {
              if (!params.titulo) return "Falta el título de la tarea a completar."
              result = await completeVoiceTask(params.titulo, agentId)
              break
            }
            case 'eliminar': {
              if (!params.titulo) return "Falta el título de la tarea a eliminar."
              result = await deleteVoiceTask(params.titulo, agentId)
              break
            }
            default:
              result = "Acción no reconocida."
          }
          console.log("Voice Tool [gestionar_tareas] success result:", result)
          return result
        } catch (error: any) {
          console.error("Voice Tool [gestionar_tareas] execution error:", error)
          return `Error al gestionar tareas: ${error.message}`
        }
      },
    },
    onConnect: (params?: any) => {
      if (params?.conversationId) {
        conversationIdRef.current = params.conversationId
      }
      connectionStartRef.current = Date.now()
      setSessionSeconds(0)
      
      // NOTA: Eliminamos la pre-carga al conectar de aquí. Esto previene un pico de red en tu celular
      // justo cuando se está negociando y transmitiendo el audio WebRTC (evitando cortes y lentitud).
      
      timerRef.current = setInterval(() => {
        setSessionSeconds(prev => prev + 1)
        
        setBalanceSecs(currentBalance => {
          return currentBalance > 0 ? currentBalance - 1 : 0
        })
      }, 1000)
    },
    onDisconnect: async () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }

      if (connectionStartRef.current) {
        const exactSecondsUsed = Math.floor((Date.now() - connectionStartRef.current) / 1000)
        connectionStartRef.current = null
        
        if (exactSecondsUsed > 0) {
          try {
            const res = await deductVoiceSeconds(exactSecondsUsed)
            if (res.success && res.remainingBalance !== undefined) {
              setBalanceSecs(res.remainingBalance)
            }
          } catch (error) {
            console.error("Error al descontar saldo:", error)
          }
        }
      }

      if (conversationIdRef.current) {
        const cId = conversationIdRef.current
        conversationIdRef.current = null
        
        // Delay de 3 segundos para dar tiempo a ElevenLabs de compilar transcripción y análisis
        setTimeout(async () => {
          try {
            const syncRes = await syncVoiceCallSummary(cId, agentId)
            console.log("Call sync complete:", syncRes)
            router.refresh()
          } catch (syncErr) {
            console.error("Error syncing voice call summary:", syncErr)
          }
        }, 3000)
      }

      weeklyCacheRef.current = null
      setSessionSeconds(0)
    },
    onError: (error: any) => {
      console.error("Error en conversación:", error)
      alert("Error de ElevenLabs: " + (error?.message || typeof error === 'string' ? error : JSON.stringify(error)))
    }
  })

  const startConversation = async () => {
    if (balanceSecs <= 0) {
      alert("No tienes saldo de minutos disponible. Por favor recarga tu billetera.")
      return
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      
      const elAgentId = await getElevenLabsAgentId()
      if (!elAgentId) {
        alert("El ID del Agente ElevenLabs no está configurado.")
        return
      }

      const sessionOptions: any = { agentId: elAgentId }
      if (dynamicPrompt) {
        sessionOptions.dynamicVariables = dynamicPrompt
      }

      await conversation.startSession(sessionOptions)
    } catch (error) {
      console.error("Error iniciando conversación:", error)
      alert("No se pudo acceder al micrófono o hubo un error al conectar.")
    }
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  if (conversation.status === "connecting") {
    return (
      <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-full py-2 px-4">
        <Loader2 className="w-4 h-4 text-neutral-400 animate-spin" />
        <span className="text-sm font-medium text-neutral-400">Conectando...</span>
      </div>
    )
  }

  if (conversation.status === "connected") {
    return (
      <div className="flex items-center gap-4 bg-green-950/30 border border-green-900/50 rounded-full py-2 px-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-medium text-green-400">
            En Llamada {formatTime(sessionSeconds)}
          </span>
        </div>
        
        <div className="h-4 w-[1px] bg-neutral-800" />
        
        <span className="text-xs font-mono text-neutral-500">
          Saldo: {formatTime(balanceSecs)}
        </span>
        
        <div className="h-4 w-[1px] bg-neutral-800" />

        <button 
          onClick={() => conversation.endSession()}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
        >
          <PhoneOff className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end mr-1">
          <span className="text-xs font-medium text-neutral-400">Llamada</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] font-mono text-neutral-600">Disp: {formatTime(balanceSecs)}</span>
            <span className="text-[9px] text-neutral-700 font-bold">•</span>
            <button 
              onClick={() => setIsBuyModalOpen(true)}
              className="text-[9px] text-indigo-400 hover:text-indigo-300 font-bold hover:underline transition-colors"
            >
              Cargar
            </button>
          </div>
        </div>
        <button
          onClick={startConversation}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg hover:shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={balanceSecs <= 0}
          title="Llamada de voz con la Asistente"
        >
          <Phone className="w-5 h-5" />
        </button>
      </div>

      <BuyMinutesModal 
        isOpen={isBuyModalOpen} 
        onClose={() => setIsBuyModalOpen(false)} 
      />
    </>
  )
}

export function ElevenLabsVoiceButton({ agentId }: { agentId: string }) {
  return (
    <ConversationProvider>
      <ElevenLabsVoiceButtonInner agentId={agentId} />
    </ConversationProvider>
  )
}

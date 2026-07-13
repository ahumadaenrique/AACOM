"use client"

import { useState, useEffect, useRef } from "react"
import { useConversation, ConversationProvider } from "@elevenlabs/react"
import { Mic, MicOff, Loader2, PhoneOff, Phone } from "lucide-react"
import { getVoiceBalance, deductVoiceSeconds, getElevenLabsAgentId, getVoiceAgentPrompt, getVoiceAgenda, scheduleVoiceMeeting, draftVoiceEmail, createVoiceTask, listVoiceTasks, completeVoiceTask, deleteVoiceTask } from "@/app/agents/[id]/chat/voiceActions"
import { BuyMinutesModal } from "@/components/BuyMinutesModal"

export function ElevenLabsVoiceButtonInner({ agentId }: { agentId: string }) {
  const [balanceSecs, setBalanceSecs] = useState<number>(0)
  const [sessionSeconds, setSessionSeconds] = useState<number>(0)
  const [dynamicPrompt, setDynamicPrompt] = useState<any>(null)
  const [isBuyModalOpen, setIsBuyModalOpen] = useState<boolean>(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const connectionStartRef = useRef<number | null>(null)

  useEffect(() => {
    // Cargar saldo inicial y prompt dinámico
    getVoiceBalance().then(balance => setBalanceSecs(balance))
    getVoiceAgentPrompt(agentId).then(prompt => setDynamicPrompt(prompt))
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [agentId])

  const conversation = useConversation({
    clientTools: {
      consultar_agenda: async () => {
        // En un caso real ElevenLabs podría pasar la fecha como parámetro, 
        // pero por ahora consultaremos la agenda de hoy
        const targetDate = new Date().toISOString().split('T')[0]
        const result = await getVoiceAgenda(targetDate, agentId)
        return result;
      },
      agendar_reunion: async (params: { titulo: string, fecha: string, hora: string, duracion: any }) => {
        console.log("Voice Tool [agendar_reunion] called with:", params);
        let duration = Number(params.duracion) || 60;
        
        // Autocorrección: si la IA manda un valor <= 4 (ej. 1 para '1 hora'),
        // asumimos que omitió la conversión a minutos y multiplicamos por 60.
        if (duration > 0 && duration <= 4) {
          duration = duration * 60;
        }
        
        const result = await scheduleVoiceMeeting(params.titulo, params.fecha, params.hora, duration, agentId)
        return result;
      },
      redactar_correo: async (params: { destinatario: string, asunto: string, mensaje: string }) => {
        const result = await draftVoiceEmail(params.destinatario, params.asunto, params.mensaje, agentId)
        return result;
      },
      gestionar_tareas: async (params: { accion: 'crear' | 'listar' | 'completar' | 'eliminar', titulo?: string, descripcion?: string, prioridad?: string, fecha_limite?: string, completadas?: boolean }) => {
        switch (params.accion) {
          case 'crear': {
            if (!params.titulo) return "Falta el título de la tarea para poder crearla.";
            const priority = params.prioridad === 'ALTA' ? 'HIGH' : (params.prioridad === 'BAJA' ? 'LOW' : 'MEDIUM');
            return await createVoiceTask(params.titulo, params.descripcion, priority, params.fecha_limite, agentId);
          }
          case 'listar': {
            return await listVoiceTasks(!!params.completadas, agentId);
          }
          case 'completar': {
            if (!params.titulo) return "Falta el título de la tarea a completar.";
            return await completeVoiceTask(params.titulo, agentId);
          }
          case 'eliminar': {
            if (!params.titulo) return "Falta el título de la tarea a eliminar.";
            return await deleteVoiceTask(params.titulo, agentId);
          }
          default:
            return "Acción no reconocida.";
        }
      }
    },
    onConnect: () => {
      connectionStartRef.current = Date.now()
      setSessionSeconds(0)
      
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

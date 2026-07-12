"use client"

import { useState, useEffect, useRef } from "react"
import { useConversation } from "@elevenlabs/react"
import { Mic, MicOff, Loader2, PhoneOff, Phone } from "lucide-react"
import { getVoiceBalance, deductVoiceSeconds, getElevenLabsAgentId } from "@/app/agents/[id]/chat/voiceActions"

export function ElevenLabsVoiceButton() {
  const [balanceSecs, setBalanceSecs] = useState<number>(0)
  const [sessionSeconds, setSessionSeconds] = useState<number>(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const connectionStartRef = useRef<number | null>(null)

  const conversation = useConversation({
    onConnect: () => {
      connectionStartRef.current = Date.now()
      setSessionSeconds(0)
      
      // Iniciar cronómetro visual y control de saldo
      timerRef.current = setInterval(() => {
        setSessionSeconds(prev => prev + 1)
        
        // Si el saldo visual (balance - session) llega a 0, colgar automáticamente
        setBalanceSecs(currentBalance => {
          if (currentBalance <= 1) {
            conversation.endSession()
            return 0
          }
          return currentBalance - 1
        })
      }, 1000)
    },
    onDisconnect: async () => {
      // Detener cronómetro
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }

      // Calcular segundos exactos
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
    onError: (error) => {
      console.error("Error en conversación:", error)
    }
  })

  useEffect(() => {
    // Cargar saldo inicial
    getVoiceBalance().then(balance => setBalanceSecs(balance))
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const startConversation = async () => {
    if (balanceSecs <= 0) {
      alert("No tienes saldo de minutos disponible. Por favor recarga tu billetera.")
      return
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Obtener el ID del Agente desde el backend (o .env)
      const agentId = await getElevenLabsAgentId()
      if (!agentId) {
        alert("El ID del Agente ElevenLabs no está configurado.")
        return
      }

      await conversation.startSession({ agentId })
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
    <div className="flex items-center gap-3">
      <div className="flex flex-col items-end mr-1">
        <span className="text-xs font-medium text-neutral-400">Llamada</span>
        <span className="text-[10px] font-mono text-neutral-600">Disp: {formatTime(balanceSecs)}</span>
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
  )
}

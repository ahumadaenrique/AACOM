"use client"

import { useRef, useEffect, useState } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import dynamic from "next/dynamic"
const ElevenLabsVoiceButton = dynamic(() => import("@/components/ElevenLabsVoiceButton").then(m => m.ElevenLabsVoiceButton), { ssr: false })
import { Send, User, Bot, Loader2, Download, Calendar, Clock, Trash, Mic, Mail, CheckSquare } from "lucide-react"
import { GraphicDesignPreview } from "@/components/GraphicDesignPreview"
import { AgentAvatar } from "@/components/AgentAvatar"
import React, { Component, ErrorInfo, ReactNode } from "react"

class VoiceErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, errorMsg: string}> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = { hasError: false, errorMsg: "" };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMsg: error.message };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("VoiceButton Error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return <div className="text-red-500 text-xs">Error voz: {this.state.errorMsg}</div>;
    }
    return this.props.children;
  }
}

const downloadBrandedImage = async (imageUrl: string) => {
  try {
    const res = await fetch(`/api/agents/proxy-image?url=${encodeURIComponent(imageUrl)}`);
    if (!res.ok) throw new Error('Proxy failed');
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height + 150; // Extra height for footer

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Draw footer background
      ctx.fillStyle = '#0f172a'; // AACOM dark blue/slate
      ctx.fillRect(0, img.height, canvas.width, 150);

      // Draw AACOM text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 42px sans-serif';
      ctx.fillText('AACOM', 40, img.height + 65);

      // Draw Subtitle text
      ctx.fillStyle = '#94a3b8';
      ctx.font = '24px sans-serif';
      ctx.fillText('Potenciamos tu carrera como Agente de Seguros', 40, img.height + 110);

      // Trigger download
      canvas.toBlob((finalBlob) => {
        if (!finalBlob) return;
        const finalUrl = URL.createObjectURL(finalBlob);
        const a = document.createElement('a');
        a.href = finalUrl;
        a.download = 'AACOM-Post.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(finalUrl);
        URL.revokeObjectURL(objectUrl);
      }, 'image/png');
    };
    img.src = objectUrl;
  } catch (err) {
    console.error('Failed to download branded image:', err);
  }
};

const renderTextWithImages = (text: string) => {
  if (!text) return null;
  const parts = text.split(/(!\[.*?\]\(.*?\))/g);
  return parts.map((part, i) => {
    const match = part.match(/!\[(.*?)\]\((.*?)\)/);
    if (match) {
      return (
        <div key={i} className="relative mt-2 inline-block group w-full max-w-sm rounded-lg overflow-hidden border border-white/10">
          <img src={match[2]} alt={match[1]} className="w-full h-auto object-cover bg-neutral-800" />
          <button 
            onClick={() => downloadBrandedImage(match[2])}
            className="absolute top-2 right-2 bg-black/60 hover:bg-black/90 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm shadow-sm"
            title="Descargar imagen con logo AACOM"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      )
    }
    return <span key={i}>{part}</span>
  })
}

function normalizeToolInvocation(x: any) {
  if (!x) return null;
  
  const isTool = 
    x.type === 'tool-invocation' || 
    x.type === 'dynamic-tool' || 
    (typeof x.type === 'string' && x.type.startsWith('tool-')) ||
    x.toolName !== undefined;
  
  if (!isTool) return null;

  let toolName = x.toolName;
  if (!toolName && typeof x.type === 'string' && x.type.startsWith('tool-') && x.type !== 'tool-invocation') {
    toolName = x.type.slice(5);
  }

  let state = x.state;
  if (state === 'output-available') {
    state = 'result';
  } else if (state === 'output-error') {
    state = 'error';
  }

  const result = x.result !== undefined ? x.result : x.output;
  const args = x.args !== undefined ? x.args : x.input;

  return {
    toolCallId: x.toolCallId,
    toolName,
    state,
    args,
    result
  };
}

interface ChatInterfaceProps {
  agent: any
  initialMessages?: any[]
  fallbackLogoUrl?: string | null
  generationCount?: number
  hasGoogleConnection?: boolean
}

export default function ChatInterface({ 
  agent, 
  initialMessages = [],
  fallbackLogoUrl = null,
  generationCount = 0,
  hasGoogleConnection = true
}: ChatInterfaceProps) {
  const [localInput, setLocalInput] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [recognition, setRecognition] = useState<any>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        const rec = new SpeechRecognition()
        rec.continuous = true
        rec.interimResults = false
        rec.lang = 'es-MX'
        
        rec.onstart = () => {
          setIsRecording(true)
        }
        
        rec.onresult = (event: any) => {
          const resultIndex = event.resultIndex
          const transcript = event.results[resultIndex][0].transcript
          setLocalInput((prev) => (prev ? prev + ' ' + transcript : transcript))
        }
        
        rec.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          setIsRecording(false)
        }
        
        rec.onend = () => {
          setIsRecording(false)
        }
        
        setRecognition(rec)
      }
    }
  }, [])

  const toggleRecording = () => {
    if (!recognition) {
      alert('La entrada por voz no está soportada en este navegador. Te recomendamos usar Google Chrome o Microsoft Edge.')
      return
    }

    if (isRecording) {
      recognition.stop()
    } else {
      recognition.start()
    }
  }

  const [isClearing, setIsClearing] = useState(false)

  const handleClearChat = async () => {
    if (!confirm("¿Estás seguro de que quieres vaciar esta conversación? Se borrará todo el historial de chat con este agente.")) return
    
    setIsClearing(true)
    try {
      const res = await fetch(`/api/agents/chat/clear?agentId=${agent.id}`, {
        method: 'POST'
      })
      if (res.ok) {
        setMessages([])
      } else {
        alert("No se pudo limpiar la conversación. Inténtalo de nuevo.")
      }
    } catch (err) {
      console.error(err)
      alert("Error de conexión al limpiar la conversación.")
    } finally {
      setIsClearing(false)
    }
  }

  const getRoleDisplayName = (type: string) => {
    switch (type) {
      case 'EXECUTIVE_ASSISTANT':
        return 'Asistente Ejecutiva';
      case 'SOCIAL_MEDIA_MANAGER':
        return 'Social Media Manager';
      case 'RECEPTIONIST':
        return 'Recepcionista';
      default:
        return type.replace(/_/g, ' ');
    }
  }
  
  console.log('ChatInterface mounted with initialMessages length:', initialMessages.length)
  console.log('First initialMessage:', initialMessages[0])

  const { messages, setMessages, sendMessage: rawSendMessage, status, error } = useChat({
    id: agent.id,
    maxSteps: 5,
    transport: new DefaultChatTransport({
      api: `/api/agents/chat?agentId=${agent.id}`
    }),
    initialMessages: initialMessages.map(m => ({
      id: m.id,
      role: m.role as 'user' | 'assistant',
      content: m.content,
      toolInvocations: m.toolInvocations
    }))
  } as any)
  const sendMessage = rawSendMessage as any

  // Bypass Next.js Router Cache by fetching fresh history on mount
  useEffect(() => {
    fetch(`/api/agents/history?agentId=${agent.id}`)
      .then(res => res.json())
      .then(history => {
        if (history && Array.isArray(history) && history.length > messages.length) {
          setMessages(history.map((m: any) => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: m.content,
            toolInvocations: m.toolInvocations
          })) as any)
        }
      })
      .catch(err => console.error("Failed to fetch history:", err))
  }, [agent.id, setMessages, messages.length])

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    console.log("Current messages:", JSON.parse(JSON.stringify(messages)))
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // In this new AI SDK, status can be 'connected', 'ready', 'streaming', 'submitted', etc.
  // We only block if it's currently streaming/submitted.
  const isLoading = status === 'streaming' || status === 'submitted'

  const onSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault()
    if (!localInput.trim() || isLoading) return
    
    const userMessage = localInput.trim()
    setLocalInput('')
    
    await sendMessage({
      role: 'user',
      content: userMessage
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Background Gradient */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/10 via-neutral-950 to-neutral-950"></div>
      
      {/* Top Actions Bar */}
      <div className="w-full py-3 px-4 md:px-6 border-b border-neutral-900 bg-neutral-950/40 backdrop-blur-md flex items-center justify-between shrink-0 z-20">
        <div className="text-xs text-neutral-500 font-medium">
          {/* Espacio para estatus o vacío */}
        </div>
        <div className="flex items-center gap-3">
          {agent.type === 'EXECUTIVE_ASSISTANT' && (
            <VoiceErrorBoundary>
              <ElevenLabsVoiceButton agentId={agent.id} />
            </VoiceErrorBoundary>
          )}

          {messages.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearChat}
              disabled={isClearing}
              className="bg-neutral-900/90 border-neutral-800 text-neutral-400 hover:text-red-400 hover:bg-red-950/20 backdrop-blur transition-all text-xs flex items-center gap-1.5 shadow-md rounded-xl py-2 px-3"
            >
              {isClearing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">Limpiar Conversación</span>
            </Button>
          )}
        </div>
      </div>
      
      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth">
        {agent.type === 'EXECUTIVE_ASSISTANT' && hasGoogleConnection === false && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-start gap-3 text-left">
             <div className="p-2 bg-yellow-500/20 rounded-full shrink-0 mt-0.5">
               <Mail className="w-4 h-4 text-yellow-500" />
             </div>
             <div>
               <h4 className="font-semibold text-yellow-500 text-sm mb-1">¡Acción requerida! Conecta tu cuenta de Google</h4>
               <p className="text-xs text-neutral-400 leading-relaxed">
                 Para que tu Asistente Ejecutiva pueda gestionar tu agenda, revisar correos o agendar citas en tu nombre, necesitas vincular tu cuenta. Haz clic en el engranaje de configuración ⚙️ arriba a la derecha y selecciona <strong>Integración con Google</strong>.
               </p>
             </div>
          </div>
        )}
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-neutral-500 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shadow-lg">
              <span className="text-2xl">👋</span>
            </div>
            <h3 className="text-xl font-medium text-neutral-200">Hola, soy {agent.name}</h3>
            <p className="text-sm max-w-sm text-center text-neutral-400">
              Soy tu {getRoleDisplayName(agent.type)}. Escribe un mensaje abajo para comenzar a trabajar.
            </p>
            {agent.type === 'SOCIAL_MEDIA_MANAGER' && (
              <div className="mt-1 px-3 py-1 bg-neutral-900 border border-neutral-800 rounded-full text-xs text-neutral-400">
                Uso de publicaciones mensual: <span className="text-white font-medium">{generationCount}/90 generaciones</span>
              </div>
            )}
            <div className="flex flex-wrap justify-center gap-2 mt-4 max-w-2xl">
              {agent.type === 'EXECUTIVE_ASSISTANT' ? (
                <>
                  <Button 
                    variant="outline" 
                    className="bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-300 whitespace-normal h-auto py-2 text-xs"
                    disabled={isLoading}
                    onClick={async () => {
                      setLocalInput('')
                      await sendMessage({ role: 'user', content: '¿Qué reuniones tengo agendadas hoy?' })
                    }}
                  >
                    ¿Qué reuniones tengo hoy?
                  </Button>
                  <Button 
                    variant="outline" 
                    className="bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-300 whitespace-normal h-auto py-2 text-xs"
                    disabled={isLoading}
                    onClick={async () => {
                      setLocalInput('')
                      await sendMessage({ role: 'user', content: 'Agenda una reunión mañana a las 10:00 AM' })
                    }}
                  >
                    Agenda una reunión para mañana
                  </Button>
                  <Button 
                    variant="outline" 
                    className="bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-300 whitespace-normal h-auto py-2 text-xs"
                    disabled={isLoading}
                    onClick={async () => {
                      setLocalInput('')
                      await sendMessage({ role: 'user', content: 'Muestra todas las reuniones de mi agenda' })
                    }}
                  >
                    Consultar toda mi agenda
                  </Button>
                </>
              ) : agent.type === 'RECEPTIONIST' ? (
                <>
                  <Button 
                    variant="outline" 
                    className="bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-300 whitespace-normal h-auto py-2 text-xs"
                    disabled={isLoading}
                    onClick={async () => {
                      setLocalInput('')
                      await sendMessage({ role: 'user', content: 'Ver bitácora de llamadas recientes' })
                    }}
                  >
                    Llamadas recientes
                  </Button>
                  <Button 
                    variant="outline" 
                    className="bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-300 whitespace-normal h-auto py-2 text-xs"
                    disabled={isLoading}
                    onClick={async () => {
                      setLocalInput('')
                      await sendMessage({ role: 'user', content: '¿Cuáles son tus instrucciones de contestación?' })
                    }}
                  >
                    Instrucciones de contestación
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    className="bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-300 whitespace-normal h-auto py-2 text-xs"
                    disabled={isLoading}
                    onClick={async () => {
                      setLocalInput('')
                      await sendMessage({ role: 'user', content: '¿Me ayudas con sugerencias de post para hoy?' })
                    }}
                  >
                    ¿Sugerencias de post para hoy?
                  </Button>
                  <Button 
                    variant="outline" 
                    className="bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-300 whitespace-normal h-auto py-2 text-xs"
                    disabled={isLoading}
                    onClick={async () => {
                      setLocalInput('')
                      await sendMessage({ role: 'user', content: '¿Puedes buscar las 3 noticias principales de nuestra industria para hacer contenido?' })
                    }}
                  >
                    Noticias principales de la industria
                  </Button>
                  <Button 
                    variant="outline" 
                    className="bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-300 whitespace-normal h-auto py-2 text-xs"
                    disabled={isLoading}
                    onClick={async () => {
                      setLocalInput('')
                      await sendMessage({ role: 'user', content: '¿Me ayudarías con el diseño de un post personalizado?' })
                    }}
                  >
                    Diseñar un post personalizado
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6 max-w-4xl mx-auto w-full pb-4">
            {messages.map((message: any) => (
              <div 
                key={message.id} 
                className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <AgentAvatar type={agent.type} name={agent.name} className="w-8 h-8 mt-1" />
                )}
                
                <div 
                  className={`px-4 py-3 md:px-5 md:py-3.5 rounded-2xl whitespace-pre-wrap text-[15px] leading-relaxed shadow-sm w-full ${
                    message.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-br-sm max-w-[85%] md:max-w-[70%]' 
                      : 'bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-bl-sm max-w-[96%] md:max-w-[80%]'
                  }`}
                >
                  {message.content && renderTextWithImages(message.content)}
                  {message.content === "" && !message.parts && (!message.toolInvocations || message.toolInvocations.length === 0) && (
                    <span className="opacity-50 italic text-xs">Acción completada en una sesión anterior.</span>
                  )}
                  {message.parts?.map((part: any, index: number) => {
                    if (part.type === 'text') {
                      return <span key={index}>{renderTextWithImages(part.text)}</span>
                    }
                    const toolInvocation = normalizeToolInvocation(part)
                    if (toolInvocation) {
                      return (
                        <div key={`part-${index}`} className="mt-2 text-sm flex flex-col gap-2">
                          {toolInvocation.state !== 'result' ? (
                            toolInvocation.toolName === 'generateGraphicDesign' ? (
                              <div className="w-full max-w-sm rounded-xl overflow-hidden border border-white/10 bg-neutral-900 animate-pulse mt-4 shadow-2xl">
                                <div className="w-full aspect-square bg-neutral-800/50 flex flex-col items-center justify-center p-6 text-center">
                                  <Loader2 className="w-10 h-10 text-[#41e6db] animate-spin mb-4" />
                                  <span className="text-white font-semibold text-lg">Diseñando fotografía 8k...</span>
                                  <span className="text-neutral-400 text-sm mt-2">Redactando post (puede tomar 1 min)</span>
                                </div>
                                <div className="h-32 bg-neutral-950 p-4 flex flex-col gap-3 justify-center">
                                  <div className="h-3 bg-neutral-800 rounded-full w-full"></div>
                                  <div className="h-3 bg-neutral-800 rounded-full w-5/6"></div>
                                  <div className="h-3 bg-neutral-800 rounded-full w-4/6"></div>
                                </div>
                              </div>
                            ) : toolInvocation.toolName === 'listMeetings' ? (
                              <div className="flex items-center text-neutral-400 p-3 bg-neutral-900/50 rounded-xl border border-neutral-800/80 max-w-xs">
                                <Loader2 className="w-4 h-4 mr-2 animate-spin text-indigo-400" />
                                <span className="text-sm font-medium">Consultando agenda...</span>
                              </div>
                            ) : toolInvocation.toolName === 'scheduleMeeting' ? (
                              <div className="flex items-center text-neutral-400 p-3 bg-neutral-900/50 rounded-xl border border-neutral-800/80 max-w-xs">
                                <Loader2 className="w-4 h-4 mr-2 animate-spin text-indigo-400" />
                                <span className="text-sm font-medium">Agendando reunión...</span>
                              </div>
                            ) : toolInvocation.toolName === 'cancelMeeting' ? (
                              <div className="flex items-center text-neutral-400 p-3 bg-neutral-900/50 rounded-xl border border-neutral-800/80 max-w-xs">
                                <Loader2 className="w-4 h-4 mr-2 animate-spin text-red-400" />
                                <span className="text-sm font-medium">Cancelando reunión...</span>
                              </div>
                            ) : (
                              <div className="flex items-center text-neutral-400 p-2 bg-neutral-900 rounded border border-neutral-800">
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                <span>Trabajando en {toolInvocation.toolName}...</span>
                              </div>
                            )
                          ) : (
                            toolInvocation.toolName === 'generateGraphicDesign' ? (
                              <GraphicDesignPreview result={toolInvocation.result} fallbackLogoUrl={fallbackLogoUrl} />
                            ) : (toolInvocation.toolName === 'listMeetings' || toolInvocation.toolName === 'scheduleMeeting' || toolInvocation.toolName === 'cancelMeeting') ? (
                              <div className="p-4 bg-neutral-950/60 border border-neutral-800/80 rounded-xl max-w-md text-sm text-neutral-200">
                                <div className="flex items-center gap-2 border-b border-neutral-800 pb-2 mb-2">
                                  {toolInvocation.toolName === 'cancelMeeting' ? (
                                    <Trash className="w-4 h-4 text-red-400" />
                                  ) : (
                                    <Calendar className="w-4 h-4 text-indigo-400" />
                                  )}
                                  <span className="font-semibold text-xs tracking-wider uppercase text-neutral-400">
                                    {toolInvocation.toolName === 'listMeetings' && 'Agenda de Reuniones'}
                                    {toolInvocation.toolName === 'scheduleMeeting' && 'Reunión Agendada'}
                                    {toolInvocation.toolName === 'cancelMeeting' && 'Reunión Cancelada'}
                                  </span>
                                </div>
                                <div className="whitespace-pre-wrap leading-relaxed text-xs text-neutral-300 font-medium">
                                  {toolInvocation.toolName === 'listMeetings' 
                                    ? 'Consulta de eventos completada con éxito.' 
                                    : (typeof toolInvocation.result === 'string' 
                                      ? toolInvocation.result 
                                      : JSON.stringify(toolInvocation.result, null, 2))}
                                </div>
                              </div>
                            ) : (toolInvocation.toolName === 'createTask' || toolInvocation.toolName === 'listTasks' || toolInvocation.toolName === 'completeTask' || toolInvocation.toolName === 'deleteTask') ? (
                              <div className="p-4 bg-neutral-950/60 border border-neutral-800/80 rounded-xl max-w-md text-sm text-neutral-200">
                                <div className="flex items-center gap-2 border-b border-neutral-800 pb-2 mb-2">
                                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                                  <span className="font-semibold text-xs tracking-wider uppercase text-neutral-400">
                                    {toolInvocation.toolName === 'createTask' && 'Tarea Creada'}
                                    {toolInvocation.toolName === 'listTasks' && 'Consulta de Pendientes'}
                                    {toolInvocation.toolName === 'completeTask' && 'Tarea Completada'}
                                    {toolInvocation.toolName === 'deleteTask' && 'Tarea Eliminada'}
                                  </span>
                                </div>
                                <div className="whitespace-pre-wrap leading-relaxed text-xs text-neutral-300 font-medium">
                                  {toolInvocation.toolName === 'listTasks' 
                                    ? 'Consulta de pendientes completada con éxito.' 
                                    : (typeof toolInvocation.result === 'string' 
                                      ? toolInvocation.result 
                                      : JSON.stringify(toolInvocation.result, null, 2))}
                                </div>
                              </div>
                            ) : (
                              <div className="p-4 bg-neutral-900/40 border border-neutral-800/80 rounded-xl text-sm text-neutral-200 w-full max-w-xl">
                                <div className="flex items-center gap-2 border-b border-neutral-800 pb-2 mb-3">
                                  {toolInvocation.toolName.toLowerCase().includes('email') ? (
                                    <Mail className="w-4 h-4 text-emerald-400" />
                                  ) : (
                                    <Bot className="w-4 h-4 text-indigo-400" />
                                  )}
                                  <span className="font-semibold text-xs tracking-wider uppercase text-neutral-400">
                                    {toolInvocation.toolName === 'listEmails' && 'Bandeja de Entrada (Gmail)'}
                                    {toolInvocation.toolName === 'sendEmail' && 'Correo Electrónico (Gmail)'}
                                    {!toolInvocation.toolName.toLowerCase().includes('email') && `Resultado: ${toolInvocation.toolName}`}
                                  </span>
                                </div>
                                <div className="whitespace-pre-wrap leading-relaxed text-xs text-neutral-300">
                                  {typeof toolInvocation.result === 'string'
                                    ? renderTextWithImages(toolInvocation.result)
                                    : JSON.stringify(toolInvocation.result, null, 2)}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )
                    }
                    return null
                  })}
                  
                  {(!message.parts || message.parts.length === 0) && message.toolInvocations?.map((inv: any, index: number) => {
                    const toolInvocation = normalizeToolInvocation(inv)
                    if (!toolInvocation) return null
                    return (
                      <div key={`tool-${index}`} className="mt-2 text-sm flex flex-col gap-2">
                        {toolInvocation.state !== 'result' ? (
                          toolInvocation.toolName === 'generateGraphicDesign' ? (
                            <div className="w-full max-w-sm rounded-xl overflow-hidden border border-white/10 bg-neutral-900 animate-pulse mt-4 shadow-2xl">
                              <div className="w-full aspect-square bg-neutral-800/50 flex flex-col items-center justify-center p-6 text-center">
                                <Loader2 className="w-10 h-10 text-[#41e6db] animate-spin mb-4" />
                                <span className="text-white font-semibold text-lg">Diseñando fotografía 8k...</span>
                                <span className="text-neutral-400 text-sm mt-2">Redactando post (puede tomar 1 min)</span>
                              </div>
                              <div className="h-32 bg-neutral-950 p-4 flex flex-col gap-3 justify-center">
                                <div className="h-3 bg-neutral-800 rounded-full w-full"></div>
                                <div className="h-3 bg-neutral-800 rounded-full w-5/6"></div>
                                <div className="h-3 bg-neutral-800 rounded-full w-4/6"></div>
                              </div>
                            </div>
                          ) : toolInvocation.toolName === 'listMeetings' ? (
                            <div className="flex items-center text-neutral-400 p-3 bg-neutral-900/50 rounded-xl border border-neutral-800/80 max-w-xs">
                              <Loader2 className="w-4 h-4 mr-2 animate-spin text-indigo-400" />
                              <span className="text-sm font-medium">Consultando agenda...</span>
                            </div>
                          ) : toolInvocation.toolName === 'scheduleMeeting' ? (
                            <div className="flex items-center text-neutral-400 p-3 bg-neutral-900/50 rounded-xl border border-neutral-800/80 max-w-xs">
                              <Loader2 className="w-4 h-4 mr-2 animate-spin text-indigo-400" />
                              <span className="text-sm font-medium">Agendando reunión...</span>
                            </div>
                          ) : toolInvocation.toolName === 'cancelMeeting' ? (
                            <div className="flex items-center text-neutral-400 p-3 bg-neutral-900/50 rounded-xl border border-neutral-800/80 max-w-xs">
                              <Loader2 className="w-4 h-4 mr-2 animate-spin text-red-400" />
                              <span className="text-sm font-medium">Cancelando reunión...</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-neutral-400 p-2 bg-neutral-900 rounded border border-neutral-800">
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              <span>Trabajando en {toolInvocation.toolName}...</span>
                            </div>
                          )
                        ) : (
                          toolInvocation.toolName === 'generateGraphicDesign' ? (
                            toolInvocation.result ? (
                              <GraphicDesignPreview result={toolInvocation.result} fallbackLogoUrl={fallbackLogoUrl} />
                            ) : (
                              <div className="text-neutral-400 italic">Error: El diseño no pudo completarse. Por favor, intenta de nuevo.</div>
                            )
                          ) : (toolInvocation.toolName === 'listMeetings' || toolInvocation.toolName === 'scheduleMeeting' || toolInvocation.toolName === 'cancelMeeting') ? (
                            <div className="p-4 bg-neutral-950/60 border border-neutral-800/80 rounded-xl max-w-md text-sm text-neutral-200">
                              <div className="flex items-center gap-2 border-b border-neutral-800 pb-2 mb-2">
                                {toolInvocation.toolName === 'cancelMeeting' ? (
                                  <Trash className="w-4 h-4 text-red-400" />
                                ) : (
                                  <Calendar className="w-4 h-4 text-indigo-400" />
                                )}
                                <span className="font-semibold text-xs tracking-wider uppercase text-neutral-400">
                                  {toolInvocation.toolName === 'listMeetings' && 'Agenda de Reuniones'}
                                  {toolInvocation.toolName === 'scheduleMeeting' && 'Reunión Agendada'}
                                  {toolInvocation.toolName === 'cancelMeeting' && 'Reunión Cancelada'}
                                </span>
                              </div>
                              <div className="whitespace-pre-wrap leading-relaxed text-xs text-neutral-300 font-medium">
                                {toolInvocation.toolName === 'listMeetings' 
                                  ? 'Consulta de eventos completada con éxito.' 
                                  : (typeof toolInvocation.result === 'string' 
                                    ? toolInvocation.result 
                                    : JSON.stringify(toolInvocation.result, null, 2))}
                              </div>
                            </div>
                          ) : (toolInvocation.toolName === 'createTask' || toolInvocation.toolName === 'listTasks' || toolInvocation.toolName === 'completeTask' || toolInvocation.toolName === 'deleteTask') ? (
                            <div className="p-4 bg-neutral-950/60 border border-neutral-800/80 rounded-xl max-w-md text-sm text-neutral-200">
                              <div className="flex items-center gap-2 border-b border-neutral-800 pb-2 mb-2">
                                <CheckSquare className="w-4 h-4 text-emerald-400" />
                                <span className="font-semibold text-xs tracking-wider uppercase text-neutral-400">
                                  {toolInvocation.toolName === 'createTask' && 'Tarea Creada'}
                                  {toolInvocation.toolName === 'listTasks' && 'Consulta de Pendientes'}
                                  {toolInvocation.toolName === 'completeTask' && 'Tarea Completada'}
                                  {toolInvocation.toolName === 'deleteTask' && 'Tarea Eliminada'}
                                </span>
                              </div>
                              <div className="whitespace-pre-wrap leading-relaxed text-xs text-neutral-300 font-medium">
                                {toolInvocation.toolName === 'listTasks' 
                                  ? 'Consulta de pendientes completada con éxito.' 
                                  : (typeof toolInvocation.result === 'string' 
                                    ? toolInvocation.result 
                                    : JSON.stringify(toolInvocation.result, null, 2))}
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 bg-neutral-900/40 border border-neutral-800/80 rounded-xl text-sm text-neutral-200 w-full max-w-xl">
                              <div className="flex items-center gap-2 border-b border-neutral-800 pb-2 mb-3">
                                {toolInvocation.toolName.toLowerCase().includes('email') ? (
                                  <Mail className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <Bot className="w-4 h-4 text-indigo-400" />
                                )}
                                <span className="font-semibold text-xs tracking-wider uppercase text-neutral-400">
                                  {toolInvocation.toolName === 'listEmails' && 'Bandeja de Entrada (Gmail)'}
                                  {toolInvocation.toolName === 'sendEmail' && 'Correo Electrónico (Gmail)'}
                                  {!toolInvocation.toolName.toLowerCase().includes('email') && `Resultado: ${toolInvocation.toolName}`}
                                </span>
                              </div>
                              <div className="whitespace-pre-wrap leading-relaxed text-xs text-neutral-300">
                                {typeof toolInvocation.result === 'string'
                                  ? renderTextWithImages(toolInvocation.result)
                                  : JSON.stringify(toolInvocation.result, null, 2)}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )
                  })}
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center shrink-0 mt-1">
                    <User className="w-4 h-4 text-neutral-400" />
                  </div>
                )}
              </div>
            ))}
            
            {error && (
              <div className="flex gap-4 justify-start">
                <div className="px-5 py-3.5 rounded-2xl max-w-[80%] whitespace-pre-wrap text-[15px] leading-relaxed shadow-sm bg-red-900/50 border border-red-800 text-red-200 rounded-bl-sm">
                  <span className="font-semibold">Error de conexión:</span> {error.message || "Ocurrió un problema de red o de límites de uso. Por favor espera unos segundos y vuelve a intentar."}
                </div>
              </div>
            )}
            
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
               <div className="flex gap-4 justify-start">
                 <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-1">
                   <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                 </div>
                 <div className="px-5 py-4 rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-400 rounded-bl-sm flex items-center gap-2">
                   <span className="w-2 h-2 bg-neutral-600 rounded-full animate-bounce"></span>
                   <span className="w-2 h-2 bg-neutral-600 rounded-full animate-bounce delay-100"></span>
                   <span className="w-2 h-2 bg-neutral-600 rounded-full animate-bounce delay-200"></span>
                 </div>
               </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-neutral-950/80 backdrop-blur-md border-t border-neutral-800">
        <form onSubmit={onSubmit} className="max-w-4xl mx-auto relative">
          <Textarea 
            value={localInput}
            onChange={(e) => setLocalInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribir mensaje..." 
            className={`min-h-[60px] max-h-[200px] w-full bg-neutral-900 border-neutral-800 focus-visible:ring-indigo-500 rounded-2xl pl-4 py-4 resize-none text-neutral-100 placeholder:text-neutral-500 shadow-inner ${
              agent.type === 'EXECUTIVE_ASSISTANT' ? 'pr-24' : 'pr-14'
            }`}
          />
          {agent.type === 'EXECUTIVE_ASSISTANT' && (
            <Button 
              type="button"
              size="icon"
              onClick={toggleRecording}
              className={`absolute right-14 bottom-2 h-10 w-10 rounded-xl border transition-all ${
                isRecording 
                  ? 'bg-red-950/40 border-red-500/50 text-red-400 hover:bg-red-950/60' 
                  : 'bg-neutral-800 border-neutral-700/50 text-neutral-400 hover:bg-neutral-700 hover:text-white'
              }`}
              title={isRecording ? "Detener grabación de voz" : "Grabar mensaje de voz"}
            >
              <Mic className={`w-4 h-4 ${isRecording ? 'animate-pulse' : ''}`} />
            </Button>
          )}
          <Button 
            type="submit"
            size="icon" 
            disabled={isLoading || !localInput.trim()}
            className="absolute right-2 bottom-2 h-10 w-10 rounded-xl bg-neutral-800 text-neutral-400 hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50 disabled:hover:bg-neutral-800"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
        <div className="text-center mt-2">
          <span className="text-[10px] text-neutral-600">Presiona Enter para enviar, Shift + Enter para salto de línea.</span>
        </div>
      </div>
    </div>
  )
}

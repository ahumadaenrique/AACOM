"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Users, Palette, Image as ImageIcon, Zap, X, ShieldCheck, Mail, Calendar, PenTool, TrendingUp, Settings2, Code, PhoneCall } from "lucide-react"
import { disconnectGoogle } from "@/app/workspace/actions"
import { AgentAvatar } from "@/components/AgentAvatar"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

import { AgentForm } from "@/components/AgentForm"

export function SettingsModal({ agent }: { agent: any }) {
  const router = useRouter()
  
  const isExecutive = agent.type === 'EXECUTIVE_ASSISTANT'
  const isReceptionist = agent.type === 'RECEPTIONIST'
  
  const [activeTab, setActiveTab] = useState("perfil")

  const baseTabs = [
    { id: "perfil", label: "Perfil", icon: Settings2 },
  ]

  const cmTabs = [
    ...baseTabs,
    // { id: "social", label: "Social Accounts", icon: Users },
  ]

  const eaTabs = [
    ...baseTabs,
    { id: "inbox", label: "Inbox", icon: Mail },
    { id: "calendario", label: "Calendario", icon: Calendar },
  ]

  const recTabs = [
    ...baseTabs,
    { id: "experience", label: "Experience", icon: TrendingUp },
    { id: "instructions", label: "Instructions", icon: Settings2 },
    { id: "skills", label: "Skills", icon: Code },
    { id: "calendar", label: "Calendar", icon: Calendar },
  ]

  const tabs = isExecutive ? eaTabs : isReceptionist ? recTabs : cmTabs

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1A1A1A] border border-neutral-800 rounded-2xl w-full max-w-4xl h-[600px] flex overflow-hidden shadow-2xl relative">
        
        {/* Close Button */}
        <button 
          onClick={() => router.back()}
          className="absolute top-4 right-4 text-neutral-500 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Sidebar */}
        <div className="w-64 bg-[#141414] border-r border-neutral-800 p-4 flex flex-col gap-2">
          <div className="flex items-center gap-3 mb-6 px-2">
            <AgentAvatar type={agent.type} name={agent.name} className="w-8 h-8" />
            <span className="font-semibold text-neutral-200 uppercase text-sm tracking-wider">{agent.name}</span>
          </div>

          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                activeTab === tab.id 
                  ? "bg-yellow-400 text-black font-medium" 
                  : "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
              }`}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "text-black" : ""}`} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-8 overflow-y-auto">
          {/* PERFIL (GLOBAL) */}
          {activeTab === "perfil" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                <div>
                  <h3 className="text-lg font-medium text-white">Perfil del Agente</h3>
                  <p className="text-sm text-neutral-500">Modifica el nombre y las instrucciones base de tu IA.</p>
                </div>
              </div>
              <div className="mt-8">
                <AgentForm agent={agent} />
              </div>
            </div>
          )}

          {/* COMMUNITY MANAGER TABS */}
          {activeTab === "social" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                <div>
                  <h3 className="text-lg font-medium text-white">Social Accounts</h3>
                  <p className="text-sm text-neutral-500">Conecta tus cuentas de redes sociales para publicar posts</p>
                </div>
                <Button variant="outline" className="bg-neutral-900 border-neutral-700 hover:bg-neutral-800 text-white">
                  Añadir o quitar cuentas
                </Button>
              </div>
              <div className="space-y-4 mt-8">
                {/* Social mockups... */}
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#1877F2] flex items-center justify-center text-white font-bold">f</div>
                    <span className="font-medium text-neutral-200">Facebook</span>
                  </div>
                  <span className="text-sm text-emerald-500 font-medium">Conectado</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 flex items-center justify-center text-white font-bold">ig</div>
                    <span className="font-medium text-neutral-200">Instagram</span>
                  </div>
                  <span className="text-sm text-emerald-500 font-medium">Conectado</span>
                </div>
              </div>
            </div>
          )}




          {/* EXECUTIVE ASSISTANT TABS */}


          {activeTab === "inbox" && (
            <div className="space-y-6">
              <div className="border-b border-neutral-800 pb-4">
                <h3 className="text-lg font-medium text-white mb-4">Inbox</h3>
                <div className="flex mb-6 bg-neutral-900 p-1 rounded-lg border border-neutral-800 w-fit">
                  <button className="px-6 py-1.5 bg-yellow-400 text-black text-sm font-medium rounded-md">Google</button>
                  <button className="px-6 py-1.5 text-neutral-400 text-sm font-medium hover:text-white" disabled>Outlook</button>
                  <button className="px-6 py-1.5 text-neutral-400 text-sm font-medium hover:text-white" disabled>IMAP</button>
                </div>

                {agent.User?.googleRefreshToken ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                      <span className="text-xs text-neutral-300 font-medium">Cuenta de Gmail Conectada</span>
                    </div>
                    <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-blue-500 text-white flex items-center justify-center rounded text-xs font-bold">G</div>
                        <span className="text-sm text-neutral-200">{agent.User.email || "enrique.ahumada@aacommx.com"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => {
                            if (confirm("¿Estás seguro de que deseas desvincular tu cuenta de Google?")) {
                              await disconnectGoogle(agent.userId);
                              router.refresh();
                            }
                          }}
                          className="text-xs text-red-400 hover:text-red-300 font-medium bg-red-500/10 hover:bg-red-500/20 px-3 py-1 rounded transition-colors"
                        >
                          Desvincular
                        </button>
                        <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full font-medium">Vinculado</span>
                      </div>
                    </div>

                    <div className="space-y-3 mt-6">
                      <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white text-sm">Gestionar tu inbox</span>
                          </div>
                          <p className="text-xs text-neutral-500 mt-1">Permíteme buscar y listar los correos de tu bandeja</p>
                        </div>
                        <span className="flex items-center gap-1 text-xs text-emerald-500 font-medium bg-emerald-500/10 px-2 py-1 rounded">
                          <ShieldCheck className="w-3 h-3" /> Autorizado
                        </span>
                      </div>
                      <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white text-sm">Redactar emails</span>
                          </div>
                          <p className="text-xs text-neutral-500 mt-1">Permíteme redactar correos y guardarlos en tus borradores de Gmail</p>
                        </div>
                        <span className="flex items-center gap-1 text-xs text-emerald-500 font-medium bg-emerald-500/10 px-2 py-1 rounded">
                          <ShieldCheck className="w-3 h-3" /> Autorizado
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 py-4">
                    <p className="text-sm text-neutral-400 leading-relaxed">
                      Conecta tu cuenta de Google para permitir que tu Asistente Ejecutiva gestione tu Inbox, busque correos y redacte borradores por ti directamente en Gmail.
                    </p>
                    <button
                      onClick={() => {
                        window.location.href = `/api/auth/google?userId=${agent.userId}`
                      }}
                      className="px-6 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold text-sm rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-yellow-400/10 active:scale-95"
                    >
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.414 0-6.19-2.77-6.19-6.185 0-3.414 2.776-6.184 6.19-6.184 1.543 0 2.943.567 4.028 1.498l3.11-3.113C19.262 2.68 15.967 1.5 12.24 1.5 6.29 1.5 1.5 6.293 1.5 12.24s4.79 10.74 10.74 10.74c6.208 0 10.32-4.364 10.32-10.5 0-.709-.063-1.4-.188-2.195H12.24z"/>
                      </svg>
                      Conectar Google Gmail
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "calendario" && (
            <div className="space-y-6">
              <div className="border-b border-neutral-800 pb-4">
                <h3 className="text-lg font-medium text-white mb-4">Calendario</h3>
                <div className="flex mb-6 bg-neutral-900 p-1 rounded-lg border border-neutral-800 w-fit">
                  <button className="px-6 py-1.5 bg-yellow-400 text-black text-sm font-medium rounded-md">Google</button>
                  <button className="px-6 py-1.5 text-neutral-400 text-sm font-medium hover:text-white" disabled>Outlook</button>
                </div>

                {agent.User?.googleRefreshToken ? (
                  <div className="space-y-4">
                    <span className="text-xs text-neutral-300 font-medium mb-1 block">Cuenta de Google Conectada</span>
                    <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-emerald-500 text-white flex items-center justify-center rounded text-xs font-bold">G</div>
                        <span className="text-sm text-neutral-200">{agent.User.email || "Google Calendar"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => {
                            if (confirm("¿Estás seguro de que deseas desvincular tu cuenta de Google?")) {
                              await disconnectGoogle(agent.userId);
                              router.refresh();
                            }
                          }}
                          className="text-xs text-red-400 hover:text-red-300 font-medium bg-red-500/10 hover:bg-red-500/20 px-3 py-1 rounded transition-colors"
                        >
                          Desvincular
                        </button>
                        <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full font-medium">Vinculado</span>
                      </div>
                    </div>

                    <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg flex items-center justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white text-sm">Gestionar calendario</span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">Permíteme gestionar los eventos de tu calendario de Google</p>
                      </div>
                      <span className="flex items-center gap-1 text-xs text-emerald-500 font-medium bg-emerald-500/10 px-2 py-1 rounded">
                        <ShieldCheck className="w-3 h-3" /> Autorizado
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded flex items-center justify-center bg-yellow-400 text-black">
                        <ShieldCheck className="w-3 h-3" />
                      </div>
                      <span className="text-sm text-neutral-300 font-medium">Tomar notas durante mis reuniones</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 py-4">
                    <p className="text-sm text-neutral-400 leading-relaxed">
                      Conecta tu cuenta de Google para permitir que tu Asistente Ejecutiva consulte tu agenda, cree eventos y cancele citas de forma real en tu Google Calendar.
                    </p>
                    <button
                      onClick={() => {
                        window.location.href = `/api/auth/google?userId=${agent.userId}`
                      }}
                      className="px-6 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold text-sm rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-yellow-400/10 active:scale-95"
                    >
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.414 0-6.19-2.77-6.19-6.185 0-3.414 2.776-6.184 6.19-6.184 1.543 0 2.943.567 4.028 1.498l3.11-3.113C19.262 2.68 15.967 1.5 12.24 1.5 6.29 1.5 1.5 6.293 1.5 12.24s4.79 10.74 10.74 10.74c6.208 0 10.32-4.364 10.32-10.5 0-.709-.063-1.4-.188-2.195H12.24z"/>
                      </svg>
                      Conectar Google Calendar
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}



          {/* RECEPTIONIST TABS */}
          {activeTab === "experience" && (
            <div className="space-y-6">
              <div className="border-b border-neutral-800 pb-4">
                <h3 className="text-lg font-medium text-white mb-2">Experience</h3>
                <p className="text-sm text-neutral-500 mb-6">¿Qué tan experimentada quieres que sea?</p>
                
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-neutral-800 hover:border-neutral-700 transition-colors cursor-pointer">
                    <h4 className="text-base font-medium text-white mb-1">15 llamadas/mes</h4>
                    <p className="text-sm text-neutral-500">Gratis</p>
                  </div>
                  
                  <div className="p-4 rounded-xl border border-yellow-400 bg-yellow-400/5 transition-colors cursor-pointer relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-yellow-400 text-black text-[10px] font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                      <Zap className="w-3 h-3" /> MÁS POPULAR
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-base font-medium text-white mb-1">300 llamadas/mes</h4>
                        <p className="text-sm text-neutral-500">$29/mes</p>
                      </div>
                      <div className="text-yellow-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-neutral-800 hover:border-neutral-700 transition-colors cursor-pointer">
                    <h4 className="text-base font-medium text-white mb-1">1,000 llamadas/mes</h4>
                    <p className="text-sm text-neutral-500">$69/mes</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "instructions" && (
            <div className="space-y-6">
              <div className="border-b border-neutral-800 pb-4">
                <h3 className="text-lg font-medium text-white mb-6">Instructions</h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">Primer saludo</label>
                    <p className="text-xs text-neutral-500 mb-2">¿Qué debo decir al contestar el teléfono?</p>
                    <Input defaultValue="Hola ¿Cómo estás? Soy Patty de AACOM, gracias por contactarnos ¿Cómo te puedo ayudar?" className="bg-neutral-900 border-neutral-800 text-neutral-200" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">Instrucciones generales</label>
                    <p className="text-xs text-neutral-500 mb-2">¿Cómo debo manejar la conversación?</p>
                    <Textarea 
                      className="h-40 bg-neutral-900 border-neutral-800 text-red-400 font-mono text-sm"
                      defaultValue={`- Tu nombre es Patty. Tono amistoso, Respuestas cortas pero muy claras, hazlo sentir muy natural como una platica casual con un amigo, siempre amable y nunca estricta.\nPronuncia el nombre de la empresa como "Aacom" (con acento en la primera A).\n- Espacia un poco más tus respuestas cuando estés tomando notas o revisando información; no contestes de inmediato en menos de un segundo para que se sienta real.\n- Si te hacen una pregunta capciosa o donde no tienes respuesta, solo haz una pequeña y sencilla broma y no caigas en el juego. Si insiste pídele de manera amable seriedad para continuar con la llamada.\n\nIdentidad y Propósito: Eres Patty, la recepcionista virtual de nuestra firma de consultoría`}
                    />
                    <div className="text-right text-xs text-neutral-500 mt-1">4285 / 3000</div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">Sonido ambiente</label>
                    <p className="text-xs text-neutral-500 mb-2">¿Qué sonido ambiente debo usar?</p>
                    <select className="w-full bg-neutral-900 border border-neutral-800 rounded-md p-2 text-sm text-neutral-200 focus:outline-none">
                      <option>Call Center</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">Número de prueba</label>
                    <p className="text-xs text-neutral-500 mb-2">¿Desde qué número recibiré las llamadas de prueba?</p>
                    <div className="flex">
                      <div className="flex-shrink-0 bg-neutral-900 border border-neutral-800 border-r-0 rounded-l-md px-3 flex items-center justify-center">
                        <span className="text-lg">🇲🇽</span>
                        <svg className="w-3 h-3 text-neutral-500 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                      <Input defaultValue="+52 55 1501 5502" className="rounded-l-none bg-neutral-900 border-neutral-800 text-neutral-200" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "skills" && (
            <div className="space-y-6">
              <div className="border-b border-neutral-800 pb-4">
                <h3 className="text-lg font-medium text-white mb-6">Skills</h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">Condiciones para terminar la llamada</label>
                    <p className="text-xs text-neutral-500 mb-4">¿Bajo qué condiciones debo terminar la llamada?</p>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Input defaultValue="cuando el otro interlocutor se despide y dice bye, ciao, adios o algo parecido" className="bg-neutral-900 border-neutral-800 text-neutral-200" />
                        <button className="p-2 text-neutral-500 hover:text-white"><X className="w-4 h-4" /></button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input defaultValue="Cuando parezca spam" className="bg-neutral-900 border-neutral-800 text-neutral-200" />
                        <button className="p-2 text-neutral-500 hover:text-white"><X className="w-4 h-4" /></button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input defaultValue="Cuando la llamada pierda seriedad y se vuelva de broma o se note que ya no hay interes" className="bg-neutral-900 border-neutral-800 text-neutral-200" />
                        <button className="p-2 text-neutral-500 hover:text-white"><X className="w-4 h-4" /></button>
                      </div>
                      
                      <Button variant="outline" className="w-full bg-transparent border-dashed border-neutral-700 text-neutral-400 hover:bg-neutral-900 hover:text-white mt-2">
                        Añadir condición
                      </Button>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-neutral-800/50">
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-medium text-neutral-300">Transferencia de llamadas</label>
                      <Switch checked={true} />
                    </div>
                    
                    <div className="flex gap-4 mb-4">
                      <label className="flex items-center gap-2 text-sm text-neutral-200">
                        <input type="radio" name="transfer" className="text-yellow-400 focus:ring-yellow-400/20" defaultChecked />
                        Resumir en privado
                      </label>
                      <label className="flex items-center gap-2 text-sm text-neutral-400">
                        <input type="radio" name="transfer" className="text-yellow-400 focus:ring-yellow-400/20" />
                        Transferir inmediatamente
                      </label>
                    </div>

                    <div className="flex bg-neutral-900 p-1 rounded-lg border border-neutral-800 mb-4">
                      <button className="flex-1 py-1.5 bg-yellow-400 text-black text-sm font-medium rounded-md">Único</button>
                      <button className="flex-1 py-1.5 text-neutral-400 text-sm font-medium hover:text-white">Múltiple</button>
                    </div>

                    <div className="flex">
                      <div className="flex-shrink-0 bg-neutral-900 border border-neutral-800 border-r-0 rounded-l-md px-3 flex items-center justify-center">
                        <span className="text-lg">🇲🇽</span>
                        <svg className="w-3 h-3 text-neutral-500 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                      <Input defaultValue="+52 55 1501 5502" className="rounded-l-none bg-neutral-900 border-neutral-800 text-neutral-200" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isReceptionist && activeTab === "calendar" && (
            <div className="space-y-6">
              <div className="border-b border-neutral-800 pb-4">
                <h3 className="text-lg font-medium text-white mb-2">Calendar</h3>
                
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h4 className="text-sm font-medium text-neutral-200">Calendario</h4>
                    <p className="text-xs text-neutral-500">¿Debo agendar citas en tu calendario?</p>
                  </div>
                  <Switch checked={true} />
                </div>

                <div className="flex gap-2 mb-6">
                  <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#1A1A1A] border border-neutral-700 rounded-lg text-sm text-white relative">
                    <div className="w-4 h-4 bg-white rounded flex items-center justify-center text-blue-500 text-[10px] font-bold">G</div>
                    Google
                    <div className="absolute right-3 w-4 h-4 rounded-full border-4 border-yellow-400"></div>
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#1A1A1A] border border-neutral-800 rounded-lg text-sm text-neutral-400 hover:text-white transition-colors relative">
                    <div className="w-4 h-4 bg-blue-600 rounded flex items-center justify-center text-white text-[10px] font-bold">M</div>
                    Microsoft
                    <div className="absolute right-3 w-4 h-4 rounded-full border-2 border-neutral-700"></div>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-red-400 mb-1">* Cuenta de Google</label>
                    <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-blue-500 text-white flex items-center justify-center rounded text-xs font-bold">G</div>
                        <span className="text-sm text-neutral-200">enrique.ahumada@aacommx.com</span>
                      </div>
                      <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>

                  <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white text-sm">G Gestionar calendario</span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">Permiteme agendar eventos en tu calendario</p>
                    </div>
                    <span className="flex items-center gap-1 text-xs text-emerald-500 font-medium border border-emerald-500/20 px-3 py-1.5 rounded-full">
                      <ShieldCheck className="w-3 h-3" /> Authorized
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-red-400 mb-1">* Elige tu calendario</label>
                    <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg flex items-center justify-between">
                      <span className="text-sm text-neutral-200">enrique.ahumada@aacommx.com</span>
                      <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

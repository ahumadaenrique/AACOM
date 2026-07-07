"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { MessageSquare, LayoutDashboard, Brain, Bot, Menu, ArrowLeft } from "lucide-react"
import { AgentAvatar } from "@/components/AgentAvatar"
import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

interface Agent {
  id: string
  name: string
  type: string
}

export function AgentsSidebar({ agents }: { agents: Agent[] }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const navItems = [
    {
      label: "Chats de Agentes",
      href: "/agents",
      icon: Bot,
      isActive: pathname === "/agents" || (pathname.startsWith("/agents/") && !pathname.includes("/workspace")),
    },
    {
      label: "Identidad corporativa",
      href: "/agents/workspace/identity",
      icon: LayoutDashboard,
      isActive: pathname.startsWith("/agents/workspace/identity"),
    },
    {
      label: "Base de conocimientos",
      href: "/agents/workspace/knowledge",
      icon: Brain,
      isActive: pathname.startsWith("/agents/workspace/knowledge"),
    },
  ]

  const getRoleDisplayName = (type: string) => {
    switch (type) {
      case 'EXECUTIVE_ASSISTANT': return 'Asistente Ejecutiva';
      case 'SOCIAL_MEDIA_MANAGER': return 'Social Media Manager';
      case 'RECEPTIONIST': return 'Recepcionista (Voz)';
      default: return type.replace(/_/g, ' ').toLowerCase();
    }
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0A0A0A] border-r border-neutral-800 text-neutral-200">
      {/* Logo Area */}
      <div className="h-16 flex items-center gap-2 px-4 border-b border-neutral-800 shrink-0">
        <Link href="/" className="p-1.5 hover:bg-neutral-800 rounded-md transition-colors text-neutral-400 hover:text-white">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center text-xs text-white">AA</div>
          AACOM
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="py-4 flex flex-col gap-1 px-2 shrink-0">
        {navItems.map((item) => {
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                item.isActive 
                  ? "bg-indigo-600/20 text-indigo-200 border border-indigo-500/20" 
                  : "text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200 border border-transparent"
              }`}
            >
              <item.icon className={`w-5 h-5 shrink-0 ${item.isActive ? "text-indigo-400" : "text-neutral-400 group-hover:text-neutral-200"}`} />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Separator */}
      <div className="px-4 py-2 shrink-0">
        <div className="h-px bg-neutral-800 w-full"></div>
        <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider mt-3 mb-1">Chats Activos</p>
      </div>

      {/* Active Chats List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1 pb-4">
        {agents.map((agent) => {
          const isActive = pathname.startsWith(`/agents/${agent.id}`)
          return (
            <Link
              key={agent.id}
              href={`/agents/${agent.id}/chat`}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                isActive 
                  ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700/50' 
                  : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200 border border-transparent'
              }`}
            >
              <AgentAvatar type={agent.type} name={agent.name} className="w-8 h-8 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold truncate text-neutral-200">{agent.name}</div>
                <div className="text-[10px] text-neutral-500 truncate capitalize">
                  {getRoleDisplayName(agent.type)}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 h-full shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Top Header with Hamburger Toggle */}
      <div className="md:hidden flex h-14 items-center justify-between border-b border-neutral-800 bg-[#0A0A0A] px-4 shrink-0 w-full text-white">
        <div className="flex items-center gap-2">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-neutral-400 hover:text-white">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 bg-[#0A0A0A] border-r border-neutral-800">
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <span className="font-bold text-sm tracking-tight">AACOM IA</span>
        </div>
      </div>
    </>
  )
}

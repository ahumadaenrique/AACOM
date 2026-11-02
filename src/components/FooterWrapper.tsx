"use client"

import { usePathname } from "next/navigation"

export function FooterWrapper() {
  const pathname = usePathname()

  // Ocultar el footer en simuladores de IA y en las pantallas públicas de talleres TIPS (sala móvil y proyector)
  if (
    pathname?.startsWith('/agents') ||
    pathname?.startsWith('/tips/sala') ||
    pathname?.startsWith('/tips/proyector')
  ) {
    return null
  }

  return (
    <footer className="py-4 bg-slate-50 dark:bg-zinc-950 border-t border-slate-200 dark:border-zinc-800 text-center z-50 print:hidden">
      <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">
        Plataforma impulsada por <span className="text-indigo-600 font-bold dark:text-indigo-400">aacomsoft</span> · Tecnología para Agentes y Promotorías de Seguros
      </p>
    </footer>
  )
}

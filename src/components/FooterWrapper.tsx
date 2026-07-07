"use client"

import { usePathname } from "next/navigation"

export function FooterWrapper() {
  const pathname = usePathname()

  // Hide the footer in the AI agents module to prevent vertical scrolling and slide issues
  if (pathname?.startsWith('/agents')) {
    return null
  }

  return (
    <footer className="py-4 bg-slate-50 dark:bg-zinc-950 border-t border-slate-200 dark:border-zinc-800 text-center z-50">
      <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">
        Este es un producto desarrollado por <span className="text-indigo-600 font-bold dark:text-indigo-400">AACOMSoft</span> una empresa de Grupo AACOM
      </p>
    </footer>
  )
}

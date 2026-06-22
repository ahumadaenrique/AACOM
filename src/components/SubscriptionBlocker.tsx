"use client"

import { usePathname } from "next/navigation"
import { Wallet } from "lucide-react"

export function SubscriptionBlocker({ 
    isActive, 
    isSuperAdmin, 
    children 
}: { 
    isActive: boolean;
    isSuperAdmin: boolean;
    children: React.ReactNode;
}) {
    const pathname = usePathname()

    // Si la suscripción está activa, o si el usuario es el SUPER ADMIN general, dejamos pasar
    if (isActive || isSuperAdmin) {
        return <>{children}</>
    }

    // Rutas permitidas incluso cuando están inactivos (para que puedan pagar)
    if (pathname?.startsWith('/admin/suscripcion') || pathname?.startsWith('/admin/agencia')) {
        return <>{children}</>
    }

    // Pantalla de Bloqueo
    return (
        <div className="flex flex-1 flex-col items-center justify-center text-center p-8 mt-12 bg-white rounded-3xl border border-red-100 shadow-sm max-w-2xl mx-auto w-full">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                <Wallet className="h-10 w-10 text-red-400" />
            </div>
            <h2 className="text-3xl font-black text-slate-800 mb-2">Suscripción Inactiva</h2>
            <p className="text-slate-500 mb-8 max-w-md mx-auto leading-relaxed">
                El servicio SaaS para esta agencia se encuentra suspendido por falta de pago o porque su vigencia ha expirado. 
            </p>
            <p className="text-sm font-medium text-slate-600 bg-slate-50 py-3 px-6 rounded-xl border border-slate-100">
                Ve al menú superior derecho (haciendo clic en tu perfil) y selecciona <br/><span className="font-bold text-indigo-600">"Suscripción y Pagos"</span> o <span className="font-bold text-indigo-600">"Mi Membresía"</span> para reactivar tu servicio de inmediato.
            </p>
        </div>
    )
}

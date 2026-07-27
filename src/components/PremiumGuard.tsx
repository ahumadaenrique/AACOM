"use client"

import React, { useState } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, Lock, ArrowRight, CheckCircle2 } from "lucide-react"

interface PremiumGuardProps {
    userRole?: string | null;
    children: React.ReactNode;
    moduleName: string;
}

export default function PremiumGuard({ userRole, children, moduleName }: PremiumGuardProps) {
    const [loadingCheckout, setLoadingCheckout] = useState(false);

    const handleUpgradeClick = async () => {
        setLoadingCheckout(true);
        try {
            const res = await fetch("/api/checkout/upgrade-agent", { method: "POST" });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert("Error al iniciar el pago.");
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión");
        } finally {
            setLoadingCheckout(false);
        }
    };

    if (userRole !== 'AGENTE_LITE') {
        return <>{children}</>;
    }

    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 animate-in fade-in duration-500">
            <Card className="max-w-2xl w-full border-2 border-amber-200 bg-gradient-to-br from-white to-amber-50/50 shadow-xl overflow-hidden relative">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-orange-400/10 rounded-full blur-3xl" />
                
                <CardContent className="p-8 relative z-10">
                    <div className="flex flex-col items-center text-center space-y-6">
                        <div className="h-20 w-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30 rotate-3 transform hover:rotate-6 transition-transform duration-300">
                            <Lock className="h-10 w-10 text-white" />
                        </div>
                        
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                                Módulo Exclusivo <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">Premium</span>
                            </h2>
                            <p className="text-slate-600 text-lg max-w-lg mx-auto">
                                El módulo de <span className="font-bold text-slate-800">{moduleName}</span> no está incluido en tu plan Agente Limitado.
                            </p>
                        </div>

                        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 w-full text-left space-y-4 border border-white/40 shadow-sm">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-amber-500" />
                                Desbloquea todo el potencial de AACOM
                            </h3>
                            <ul className="space-y-3">
                                {[
                                    "Acceso ilimitado al Cotizador 3.0",
                                    "Gestión de Cartera y Renovaciones",
                                    "Newsletters automatizados (Email y WhatsApp)",
                                    "Módulo de Diagnóstico de Necesidades (ADN)",
                                    "Generación de Propuestas de Valor (PEA)"
                                ].map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                                        <span className="text-slate-600 text-sm font-medium">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="w-full pt-4">
                            <Button 
                                onClick={handleUpgradeClick}
                                disabled={loadingCheckout}
                                className="w-full h-14 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black text-lg shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {loadingCheckout ? (
                                    <span className="flex items-center gap-2">
                                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Procesando...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        Hacer Upgrade a Cuenta Premium
                                        <ArrowRight className="h-5 w-5" />
                                    </span>
                                )}
                            </Button>
                            <p className="text-xs text-slate-400 mt-4 text-center font-medium">
                                Al hacer upgrade pagarás tu propia suscripción independientemente de tu agencia. Tu agencia ya no podrá suspender ni eliminar tu cuenta.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

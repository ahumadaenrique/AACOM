"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, CreditCard, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function InvitePage({ params }: { params: { agencyId: string } }) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        // Check for success or canceled in URL
        const query = new URLSearchParams(window.location.search);
        if (query.get("success")) {
            toast({
                title: "¡Pago exitoso!",
                description: "Tu cuenta ha sido creada y enlazada a la agencia. Ya puedes iniciar sesión.",
            });
            setTimeout(() => router.push('/'), 3000);
        }
        if (query.get("canceled")) {
            toast({
                variant: "destructive",
                title: "Pago cancelado",
                description: "No se realizó ningún cargo. Puedes intentarlo de nuevo cuando estés listo.",
            });
        }
    }, [router, toast]);

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ agencyId: params.agencyId, name, email })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Ocurrió un error.");

            if (data.url) {
                window.location.href = data.url; // Redirect to Stripe
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message,
            });
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 mb-4 shadow-sm">
                        <Building2 className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Únete a la Agencia</h1>
                    <p className="text-slate-500 dark:text-zinc-400 mt-2">Activa tu licencia personal de AACOM para acceder a todas las herramientas profesionales.</p>
                </div>

                <Card className="shadow-xl border-slate-200 dark:border-zinc-800">
                    <CardHeader className="bg-slate-50 dark:bg-zinc-900/50 border-b border-slate-100 dark:border-zinc-800 rounded-t-xl">
                        <CardTitle className="flex items-center justify-between">
                            <span>Suscripción Mensual</span>
                            <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">$299<span className="text-sm font-medium text-slate-500">/mes</span></span>
                        </CardTitle>
                        <CardDescription>
                            Cancela en cualquier momento. Sin plazos forzosos.
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubscribe}>
                        <CardContent className="pt-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300">Nombre Completo</label>
                                <Input 
                                    placeholder="Ej. Juan Pérez" 
                                    required 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="bg-white dark:bg-zinc-900"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300">Correo Electrónico (Tu cuenta)</label>
                                <Input 
                                    type="email" 
                                    placeholder="juan@ejemplo.com" 
                                    required 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="bg-white dark:bg-zinc-900"
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4 bg-slate-50 dark:bg-zinc-900/50 rounded-b-xl pt-6">
                            <Button 
                                type="submit" 
                                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold h-12 text-lg shadow-md transition-all hover:shadow-lg"
                                disabled={loading}
                            >
                                {loading ? "Redirigiendo..." : (
                                    <>
                                        <CreditCard className="w-5 h-5 mr-2" />
                                        Pagar y Activar Cuenta
                                    </>
                                )}
                            </Button>
                            <div className="flex items-center justify-center text-xs text-slate-500 gap-1">
                                <ShieldCheck className="w-4 h-4 text-green-500" />
                                Pagos encriptados y procesados de forma segura por Stripe.
                            </div>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}

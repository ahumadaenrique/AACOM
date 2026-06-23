"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LifeBuoy, Send, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function SupportPage() {
    const [subject, setSubject] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/support", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subject, description })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error al enviar el ticket");

            setSuccess(true);
            toast({
                title: "Ticket Enviado",
                description: "Hemos recibido tu solicitud y la atenderemos lo antes posible.",
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message,
            });
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh]">
                <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
                <h2 className="text-2xl font-bold text-slate-800 dark:text-zinc-200">¡Ticket Registrado!</h2>
                <p className="text-slate-500 mt-2 max-w-md text-center">Nuestro equipo de soporte técnico ha sido notificado y se pondrá en contacto contigo muy pronto.</p>
                <Button className="mt-6" onClick={() => { setSuccess(false); setSubject(""); setDescription(""); }}>
                    Enviar otro ticket
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-4 md:p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                    <LifeBuoy className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Centro de Ayuda y Soporte</h1>
                    <p className="text-slate-500 dark:text-zinc-400">¿Tienes algún problema con la plataforma? Levanta un ticket aquí.</p>
                </div>
            </div>

            <Card className="border-slate-200 dark:border-zinc-800 shadow-sm">
                <form onSubmit={handleSubmit}>
                    <CardHeader>
                        <CardTitle>Levantar Nuevo Ticket</CardTitle>
                        <CardDescription>Describe el problema con el mayor detalle posible para que podamos ayudarte rápido.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300">Asunto del Problema</label>
                            <Input 
                                placeholder="Ej. Error al guardar actividad en Mi Cartera" 
                                required 
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300">Descripción detallada</label>
                            <Textarea 
                                placeholder="Explícanos paso a paso qué estabas haciendo cuando ocurrió el error..." 
                                className="min-h-[150px]"
                                required 
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="bg-slate-50 dark:bg-zinc-900/50 flex justify-end p-4 rounded-b-xl border-t border-slate-100 dark:border-zinc-800">
                        <Button 
                            type="submit" 
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                        >
                            {loading ? "Enviando..." : (
                                <>
                                    <Send className="w-4 h-4 mr-2" />
                                    Enviar Ticket
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}

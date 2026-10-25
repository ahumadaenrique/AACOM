"use client";

import React, { useState, useRef, useEffect } from "react";
import {
    Send,
    Loader2,
    Sparkles,
    RotateCcw,
    CheckCircle2,
    Bot,
    Copy,
    Check,
    Briefcase,
    FileText,
    MessageSquarePlus,
    Mic,
    MicOff,
    ShieldCheck,
    ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatMessage {
    role: "user" | "model";
    parts: { text: string }[];
}

interface AssistantClientProps {
    agencyName?: string;
    userName?: string;
    isAdmin?: boolean;
    activeDocs?: any[];
    policiesCount?: number;
}

export default function AssistantClient({
    agencyName = "AACOM",
    userName = "Agente"
}: AssistantClientProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
    const [isListening, setIsListening] = useState(false);

    const chatEndRef = useRef<HTMLDivElement | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const recognitionRef = useRef<any>(null);

    const firstName = userName.trim().split(" ")[0] || "Agente";

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    // Auto-resize textarea height
    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
    }, [input]);

    const sendPrompt = async (promptText: string) => {
        const trimmed = promptText.trim();
        if (!trimmed || loading) return;

        setErrorMsg("");
        setInput("");

        const userMsg: ChatMessage = {
            role: "user",
            parts: [{ text: trimmed }]
        };

        const historyForApi = [...messages];
        setMessages(prev => [...prev, userMsg]);
        setLoading(true);

        try {
            const response = await fetch("/api/assistant", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: historyForApi, prompt: trimmed })
            });

            if (!response.ok) {
                const text = await response.text();
                setErrorMsg(text || "No se pudo conectar con el Copiloto IA.");
                setLoading(false);
                return;
            }

            const reader = response.body?.getReader();
            if (!reader) {
                setLoading(false);
                return;
            }

            const decoder = new TextDecoder();
            let accumulatedText = "";

            setLoading(false);
            setMessages(prev => [...prev, { role: "model", parts: [{ text: "" }] }]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split("\n");

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        const dataStr = line.slice(6).trim();
                        if (!dataStr || dataStr === "[DONE]") continue;

                        try {
                            const data = JSON.parse(dataStr);
                            const parts = data.candidates?.[0]?.content?.parts || [];
                            const textPart = parts
                                .filter((p: any) => !p?.thought && typeof p?.text === "string")
                                .map((p: any) => p.text)
                                .join("");
                            if (textPart) {
                                accumulatedText += textPart;

                                setMessages(prev => {
                                    const newMsgs = [...prev];
                                    const lastMsg = newMsgs[newMsgs.length - 1];
                                    if (lastMsg && lastMsg.role === "model") {
                                        lastMsg.parts[0].text = accumulatedText;
                                    }
                                    return newMsgs;
                                });
                            }
                        } catch {
                            // Ignore partial JSON chunk errors during SSE streaming
                        }
                    }
                }
            }
        } catch (err: any) {
            console.error("Error in assistant chat:", err);
            setErrorMsg(err.message || "Error al generar la respuesta de la IA.");
            setLoading(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        await sendPrompt(input);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendPrompt(input);
        }
    };

    const handleCopyMessage = async (text: string, idx: number) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedIdx(idx);
            setTimeout(() => setCopiedIdx(null), 2500);
        } catch {
            // Fallback
        }
    };

    const handleResetChat = () => {
        setMessages([]);
        setErrorMsg("");
        setInput("");
    };

    const toggleVoiceDictation = () => {
        if (typeof window === "undefined") return;
        const SpeechRecognition =
            (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert("Tu navegador no soporta dictado por voz. Te recomendamos usar Chrome o Safari.");
            return;
        }

        if (isListening && recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = "es-MX";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);
        recognition.onresult = (event: any) => {
            const transcript = event.results?.[0]?.[0]?.transcript || "";
            if (transcript) {
                setInput(prev => (prev ? `${prev} ${transcript}` : transcript));
            }
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    const quickActionCards = [
        {
            icon: Briefcase,
            badge: "Cartera en Vivo",
            title: "Mi Cartera y Renovaciones",
            description: "Consulta pólizas próximas a vencer y clientes con mayor prima.",
            colorClass: "text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border-teal-200/70 dark:border-teal-900/50",
            prompt: "¿Qué pólizas de mi cartera están próximas a renovar y quiénes son mis 5 clientes con mayor prima anual?"
        },
        {
            icon: FileText,
            badge: "Normativa y Procesos",
            title: "Lineamientos y Suscripción",
            description: "Políticas de emisión, renovación, conservación y productos.",
            colorClass: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200/70 dark:border-indigo-900/50",
            prompt: "¿Cuáles son las políticas de renovación, conservación y lineamientos comerciales más importantes que debo tener presentes?"
        },
        {
            icon: MessageSquarePlus,
            badge: "Comunicación Comercial",
            title: "Redactar WhatsApp a Cliente",
            description: "Textos ejecutivos listos para seguimiento, cobro o renovación.",
            colorClass: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/70 dark:border-emerald-900/50",
            prompt: "Ayúdame a redactar un mensaje de WhatsApp cálido, ejecutivo y persuasivo para avisarle a un cliente que su póliza está próxima a renovar y agendar una breve llamada de revisión."
        }
    ];

    const followUpChips = [
        "📊 ¿Qué renovaciones tengo este mes?",
        "💬 Redacta versión corta para WhatsApp",
        "📋 Explícamelo paso a paso",
        "💡 Dame argumentos para el cliente"
    ];

    // Render structured markdown cleanly (headings, bullets, bold)
    const renderFormattedText = (text: string) => {
        const lines = text.split("\n");
        return lines.map((line, lIdx) => {
            const trimmed = line.trim();
            if (!trimmed) {
                return <div key={lIdx} className="h-2" />;
            }

            const renderInlineBold = (str: string) => {
                if (!str.includes("**")) return str;
                const parts = str.split("**");
                return parts.map((part, pIdx) =>
                    pIdx % 2 === 1 ? (
                        <strong key={pIdx} className="font-bold text-slate-900 dark:text-white">
                            {part}
                        </strong>
                    ) : (
                        part
                    )
                );
            };

            if (trimmed.startsWith("### ")) {
                return (
                    <h4 key={lIdx} className="text-sm font-black text-slate-900 dark:text-zinc-100 mt-3 mb-1">
                        {renderInlineBold(trimmed.slice(4))}
                    </h4>
                );
            }
            if (trimmed.startsWith("## ") || trimmed.startsWith("# ")) {
                const cleanHeader = trimmed.replace(/^#+\s*/, "");
                return (
                    <h3 key={lIdx} className="text-base font-black text-slate-900 dark:text-zinc-100 mt-3 mb-1">
                        {renderInlineBold(cleanHeader)}
                    </h3>
                );
            }

            if (trimmed.startsWith("* ") || trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
                return (
                    <div key={lIdx} className="flex items-start gap-2 pl-1 py-0.5">
                        <span className="text-teal-600 dark:text-teal-400 font-black mt-0.5">•</span>
                        <span className="flex-1">{renderInlineBold(trimmed.slice(2))}</span>
                    </div>
                );
            }

            const numberedMatch = trimmed.match(/^(\d+\.)\s+(.*)$/);
            if (numberedMatch) {
                return (
                    <div key={lIdx} className="flex items-start gap-2 pl-1 py-0.5">
                        <span className="text-teal-700 dark:text-teal-400 font-extrabold shrink-0">
                            {numberedMatch[1]}
                        </span>
                        <span className="flex-1">{renderInlineBold(numberedMatch[2])}</span>
                    </div>
                );
            }

            return (
                <p key={lIdx} className="leading-relaxed">
                    {renderInlineBold(line)}
                </p>
            );
        });
    };

    return (
        <div className="flex flex-col w-full max-w-4xl mx-auto px-2 sm:px-4 md:px-0 py-1 md:py-2 h-[calc(100dvh-5.5rem)] md:h-[calc(100dvh-6rem)]">
            {/* CLEAN MINIMALIST HEADER */}
            <div className="flex items-center justify-between gap-3 pb-3 px-1 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-teal-600 via-teal-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-teal-600/20 shrink-0">
                        <Bot className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-zinc-100 truncate">
                                Asistente {agencyName}
                            </h1>
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                En línea
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">
                            Resuelve dudas sobre lineamientos, productos y comunicación con clientes al instante
                        </p>
                    </div>
                </div>

                {messages.length > 0 && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleResetChat}
                        className="h-8 px-3 rounded-xl text-xs font-bold text-slate-600 hover:text-red-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 shrink-0"
                        title="Iniciar nueva conversación"
                    >
                        <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                        <span>Nueva consulta</span>
                    </Button>
                )}
            </div>

            {/* MAIN WORKSPACE CONTAINER */}
            <div className="flex-1 min-h-0 bg-white dark:bg-zinc-950 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-sm flex flex-col overflow-hidden">
                {messages.length === 0 ? (
                    /* CLEAN, BALANCED WELCOME SCREEN */
                    <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8 flex flex-col items-center justify-center">
                        <div className="max-w-3xl mx-auto w-full space-y-6">
                            {/* Hero Greeting */}
                            <div className="text-center space-y-2">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-teal-500/10 via-indigo-500/10 to-purple-500/10 border border-teal-500/20 text-teal-700 dark:text-teal-300 text-xs font-extrabold">
                                    <Sparkles className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                                    Asistente Inteligente
                                </div>
                                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight">
                                    ¡Hola, {firstName}! ¿En qué te apoyo hoy?
                                </h2>
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 max-w-md mx-auto">
                                    Selecciona una opción rápida o escribe tu consulta directamente abajo:
                                </p>
                            </div>

                            {/* 3 Clean Action Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                                {quickActionCards.map((card, idx) => {
                                    const IconComponent = card.icon;
                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            disabled={loading}
                                            onClick={() => sendPrompt(card.prompt)}
                                            className="group text-left rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 hover:bg-white dark:bg-zinc-900/50 dark:hover:bg-zinc-900 p-4 transition-all duration-200 hover:shadow-md hover:border-teal-400/70 dark:hover:border-teal-600/60 flex items-start gap-3.5 cursor-pointer"
                                        >
                                            <div className={`h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${card.colorClass}`}>
                                                <IconComponent className="h-5 w-5" />
                                            </div>
                                            <div className="min-w-0 flex-1 space-y-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                                                        {card.badge}
                                                    </span>
                                                    <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                                </div>
                                                <h3 className="text-sm font-extrabold text-slate-800 dark:text-zinc-100 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">
                                                    {card.title}
                                                </h3>
                                                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                                                    {card.description}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ACTIVE CONVERSATION STREAM */
                    <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-5">
                        {messages.map((msg, idx) => {
                            const isUser = msg.role === "user";
                            const text = msg.parts[0]?.text || "";

                            return (
                                <div
                                    key={idx}
                                    className={`flex items-start gap-3 w-full ${isUser ? "justify-end" : "justify-start"}`}
                                >
                                    {!isUser && (
                                        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-teal-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                                            <Bot className="h-4 w-4" />
                                        </div>
                                    )}

                                    <div
                                        className={`max-w-[88%] sm:max-w-[78%] rounded-2xl px-4 py-3.5 shadow-xs text-sm ${
                                            isUser
                                                ? "bg-teal-600 text-white font-medium rounded-tr-xs"
                                                : "bg-slate-50 dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 rounded-tl-xs border border-slate-200/70 dark:border-zinc-800"
                                        }`}
                                    >
                                        <div className="space-y-1.5 break-words">
                                            {isUser ? (
                                                <p className="whitespace-pre-wrap leading-relaxed">{text}</p>
                                            ) : (
                                                renderFormattedText(text)
                                            )}
                                        </div>

                                        {/* Action footer on AI messages */}
                                        {!isUser && text.length > 0 && (
                                            <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-zinc-800 flex items-center justify-between gap-2">
                                                <span className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                                                    <CheckCircle2 className="h-3 w-3 text-teal-600" />
                                                    Asistente {agencyName}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopyMessage(text, idx)}
                                                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-teal-600 dark:text-zinc-400 dark:hover:text-teal-400 px-2 py-1 rounded-lg hover:bg-white dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                                                >
                                                    {copiedIdx === idx ? (
                                                        <>
                                                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                                                            <span className="text-emerald-600">Copiado</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy className="h-3.5 w-3.5" />
                                                            <span>Copiar respuesta</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Loading indicator */}
                        {loading && (
                            <div className="flex items-start gap-3 justify-start w-full">
                                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-teal-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                    <Bot className="h-4 w-4" />
                                </div>
                                <div className="bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 rounded-2xl rounded-tl-xs px-4 py-3 border border-slate-200/70 dark:border-zinc-800 flex items-center gap-2.5">
                                    <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                                    <span className="text-xs font-bold animate-pulse">
                                        Analizando tu consulta...
                                    </span>
                                </div>
                            </div>
                        )}

                        {errorMsg && (
                            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl p-3.5 text-xs font-bold text-red-600 dark:text-red-400 text-center max-w-lg mx-auto">
                                {errorMsg}
                            </div>
                        )}

                        <div ref={chatEndRef} />
                    </div>
                )}

                {/* FOLLOW-UP QUICK CHIPS WHEN IN CONVERSATION */}
                {messages.length > 0 && !loading && (
                    <div className="px-3 sm:px-5 pt-2 pb-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-t border-slate-100 dark:border-zinc-900 bg-slate-50/40 dark:bg-zinc-900/20 shrink-0">
                        {followUpChips.map((chip, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => sendPrompt(chip)}
                                className="shrink-0 px-3 py-1 rounded-full text-xs font-bold bg-white dark:bg-zinc-900 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-slate-600 hover:text-teal-700 dark:text-zinc-300 border border-slate-200/80 dark:border-zinc-800 transition-colors cursor-pointer"
                            >
                                {chip}
                            </button>
                        ))}
                    </div>
                )}

                {/* SMART BOTTOM INPUT BAR */}
                <form
                    onSubmit={handleSendMessage}
                    className="p-3 sm:p-4 border-t border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/40 shrink-0"
                >
                    <div className="flex items-end gap-2 bg-white dark:bg-zinc-900 border border-slate-300/80 dark:border-zinc-700 focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-500/20 rounded-2xl px-3 py-2 shadow-xs transition-all">
                        <textarea
                            ref={textareaRef}
                            rows={1}
                            placeholder="Escribe tu duda sobre lineamientos, productos o pide redactar un mensaje..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={loading}
                            className="flex-1 bg-transparent resize-none max-h-36 py-1 px-1 text-sm font-medium focus:outline-none text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 leading-relaxed"
                        />

                        <button
                            type="button"
                            onClick={toggleVoiceDictation}
                            disabled={loading}
                            className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                                isListening
                                    ? "bg-red-500 text-white animate-pulse shadow-sm"
                                    : "text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-zinc-800"
                            }`}
                            title={isListening ? "Detener dictado por voz" : "Dictar pregunta por voz"}
                        >
                            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                        </button>

                        <Button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl h-9 px-3.5 shrink-0 flex items-center justify-center gap-1.5 font-bold text-xs shadow-sm transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
                        >
                            <Send className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Enviar</span>
                        </Button>
                    </div>

                    <div className="mt-1.5 px-1 flex items-center justify-between text-[11px] text-slate-400 dark:text-zinc-500">
                        <span className="flex items-center gap-1 truncate">
                            <ShieldCheck className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                            <span>
                                Responde únicamente con los lineamientos y documentos que la dirección de <strong>{agencyName}</strong> ha cargado.
                            </span>
                        </span>
                        <span className="hidden md:inline shrink-0 ml-2">
                            Enter para enviar • Shift + Enter nueva línea
                        </span>
                    </div>
                </form>
            </div>
        </div>
    );
}

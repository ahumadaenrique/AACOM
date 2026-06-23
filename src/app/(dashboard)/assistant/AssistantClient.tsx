"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
    MessageSquare, 
    Send, 
    Loader2, 
    Sparkles, 
    Trash2, 
    BookOpen,
    HelpCircle,
    CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatMessage {
    role: "user" | "model";
    parts: { text: string }[];
}

export default function AssistantPage({ agencyName = "AACOM" }: { agencyName?: string }) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const chatEndRef = useRef<HTMLDivElement | null>(null);

    // Dynamic automatic scroll to bottom of chat
    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = input.trim();
        if (!trimmed || loading) return;

        setErrorMsg("");
        setInput("");
        
        // Add user message to history
        const userMsg: ChatMessage = {
            role: "user",
            parts: [{ text: trimmed }]
        };

        setMessages(prev => [...prev, userMsg]);
        setLoading(true);

        try {
            const historyForApi = messages;
            const response = await fetch("/api/assistant", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: historyForApi, prompt: trimmed })
            });

            if (!response.ok) {
                const text = await response.text();
                setErrorMsg(text || "No se pudo conectar con el Asistente.");
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

            // Remove loading spinner and inject empty model message container
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
                            const textPart = data.candidates?.[0]?.content?.parts?.[0]?.text;
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
                        } catch (e) {
                            // ignore partial chunk JSON parsing errors
                        }
                    }
                }
            }

        } catch (err: any) {
            console.error("Error in chat page:", err);
            setErrorMsg(err.message || "Error al generar la respuesta de la IA.");
            setLoading(false);
        }
    };

    const handleQuickQuestion = (question: string) => {
        setInput(question);
    };

    const handleClearChat = () => {
        if (confirm("¿Estás seguro de que deseas limpiar la conversación actual?")) {
            setMessages([]);
            setErrorMsg("");
        }
    };

    const suggestedQuestions = [
        "¿Cuáles son las políticas de renovación?",
        `¿Cómo funciona el cuaderno de bonos de ${agencyName}?`,
        "¿Dónde descargo mis reportes de comisiones?"
    ];

    return (
        <div className="flex flex-col gap-6 w-full max-w-lg mx-auto py-2 md:max-w-5xl md:px-0 h-[83vh] md:h-[85vh]">
            {/* HEADER AREA */}
            <div className="flex items-center justify-between px-4 md:px-0 shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                            Asistente {agencyName}
                            <Sparkles className="h-6 w-6 text-indigo-500 animate-pulse" />
                        </h1>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                        Resuelve dudas sobre lineamientos comerciales, bonos y condiciones generales al instante.
                    </p>
                </div>

                {messages.length > 0 && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleClearChat}
                        className="text-slate-400 hover:text-red-500 rounded-full h-8 w-8 hover:bg-slate-100 dark:hover:bg-zinc-800"
                        title="Limpiar Conversación"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* CHAT INTERACTIVE BODY */}
            <div className="flex-1 min-h-0 bg-card rounded-3xl border border-slate-200/60 dark:border-zinc-800/80 shadow-md flex flex-col overflow-hidden relative">
                {messages.length === 0 ? (
                    /* WELCOME SCREEN */
                    <div className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col items-center justify-center text-center gap-6">
                        <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-pink-500 to-indigo-600 flex items-center justify-center text-white shadow-lg animate-pulse">
                            <MessageSquare className="h-8 w-8" />
                        </div>

                        <div className="max-w-md space-y-2">
                            <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                                ¡Hola! Soy tu Copiloto {agencyName}.
                            </p>
                            <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
                                Estoy entrenado con las directivas oficiales de la promotoría. Puedes preguntarme detalles de productos, bonos de Insignia Life o reglas comerciales.
                            </p>
                        </div>

                        {/* Quick Questions Grid */}
                        <div className="w-full max-w-lg space-y-2.5 mt-2">
                            <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider flex items-center justify-center gap-1">
                                <HelpCircle className="h-3 w-3 text-indigo-500" /> Preguntas Sugeridas
                            </span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {suggestedQuestions.map((q, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleQuickQuestion(q)}
                                        className="text-left bg-slate-50/50 hover:bg-indigo-50/40 dark:bg-zinc-900/30 dark:hover:bg-indigo-950/15 border border-slate-100 dark:border-zinc-800 rounded-2xl p-3 text-[11px] font-bold text-slate-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all hover:scale-[1.01] hover:shadow-sm"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Compliance Warning banner */}
                        <div className="bg-slate-50 dark:bg-zinc-900/25 border rounded-2xl p-3 max-w-md flex items-start gap-2 text-[10px] text-slate-500 text-left font-medium leading-relaxed">
                            <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                            <span>
                                <strong>Nota de Seguridad:</strong> Respondo únicamente con los documentos y lineamientos que el equipo directivo ha cargado en mi base de conocimientos para evitar alucinaciones.
                            </span>
                        </div>
                    </div>
                ) : (
                    /* CHAT MESSAGE LIST */
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                        {messages.map((msg, idx) => {
                            const isUser = msg.role === "user";
                            const text = msg.parts[0]?.text || "";
                            
                            return (
                                <div 
                                    key={idx} 
                                    className={`flex ${isUser ? "justify-end" : "justify-start"} w-full`}
                                >
                                    <div 
                                        className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 shadow-sm text-xs leading-relaxed ${
                                            isUser 
                                                ? "bg-indigo-600 text-white font-semibold rounded-tr-none" 
                                                : "bg-slate-100 dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 rounded-tl-none border border-slate-200/30 dark:border-zinc-800"
                                        }`}
                                    >
                                        {/* Simple custom markdown renderer inside bubbles */}
                                        <div className="space-y-2 whitespace-pre-wrap font-medium">
                                            {text.split("\n").map((line, lIdx) => {
                                                const trimmed = line.trim();
                                                // Handle bullet points
                                                if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
                                                    return (
                                                        <li key={lIdx} className="ml-3 list-disc">
                                                            {trimmed.substring(2)}
                                                        </li>
                                                    );
                                                }
                                                // Handle bold text inline
                                                if (trimmed.includes("**")) {
                                                    const parts = line.split("**");
                                                    return (
                                                        <p key={lIdx}>
                                                            {parts.map((part, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="font-extrabold">{part}</strong> : part)}
                                                        </p>
                                                    );
                                                }
                                                return <p key={lIdx}>{line}</p>;
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* IA Generating response loading indicator */}
                        {loading && (
                            <div className="flex justify-start w-full">
                                <div className="bg-slate-100 dark:bg-zinc-900 text-slate-500 rounded-2xl rounded-tl-none px-4 py-3 border border-slate-200/30 dark:border-zinc-800 flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-pink-500" />
                                    <span className="text-[10px] font-black uppercase tracking-wider animate-pulse">Asistente experta pensando...</span>
                                </div>
                            </div>
                        )}

                        {errorMsg && (
                            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl p-4 text-xs font-semibold text-red-600 dark:text-red-400 text-center max-w-lg mx-auto">
                                {errorMsg}
                            </div>
                        )}

                        <div ref={chatEndRef} />
                    </div>
                )}

                {/* BOTTOM CHAT INPUT CONTAINER */}
                <form 
                    onSubmit={handleSendMessage}
                    className="p-4 border-t border-slate-200/60 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/10 shrink-0"
                >
                    <div className="flex items-center gap-2">
                        <input 
                            type="text"
                            placeholder="Haz una pregunta sobre lineamientos, comisiones..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={loading}
                            className="flex-1 bg-card border border-slate-200 dark:border-zinc-800 rounded-2xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 shadow-inner text-slate-800 dark:text-zinc-200 placeholder-slate-400"
                        />
                        <Button 
                            type="submit" 
                            disabled={loading || !input.trim()}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-10 w-10 shrink-0 flex items-center justify-center p-0 shadow-md hover:shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}



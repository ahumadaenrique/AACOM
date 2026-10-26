"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Sparkles,
    Eye,
    Home,
    ClipboardCheck,
    Wallet,
    Bot,
    HeartPulse
} from "lucide-react";

export function StitchPreviewBanner() {
    const pathname = usePathname() || "/";
    const [mode, setMode] = useState<"stitch" | "current">("stitch");

    useEffect(() => {
        if (typeof document !== "undefined") {
            document.documentElement.setAttribute("data-stitch-mode", mode);
        }
    }, [mode]);

    const isDiagnosticoPage = pathname.includes("stitch-diagnostico");
    const isExcludedFromBottomBar =
        pathname.startsWith("/login") ||
        pathname.startsWith("/inicio") ||
        pathname.startsWith("/registro") ||
        pathname.startsWith("/forgot-password") ||
        pathname.startsWith("/reset-password") ||
        pathname.startsWith("/presentacion") ||
        pathname.startsWith("/print") ||
        pathname.startsWith("/tips/sala") ||
        pathname.startsWith("/tips/proyector") ||
        pathname.startsWith("/tips/join") ||
        pathname.startsWith("/vendedor") ||
        pathname.startsWith("/demo") ||
        pathname.startsWith("/privacidad") ||
        pathname.startsWith("/terminos") ||
        pathname.startsWith("/reembolso");

    return (
        <>
            {/* GLOBAL STITCH DESIGN SYSTEM STYLING */}
            {mode === "stitch" && (
                <style
                    dangerouslySetInnerHTML={{
                        __html: `
                        /* 1. Clean Glass Top Header (replaces heavy dark gradient) */
                        html[data-stitch-mode="stitch"] header.sticky.top-0 {
                            background-image: none !important;
                            background-color: rgba(255, 255, 255, 0.92) !important;
                            backdrop-filter: blur(12px) !important;
                            border-bottom: 1px solid rgba(226, 232, 240, 0.85) !important;
                            box-shadow: 0 1px 2px 0 rgba(15, 23, 42, 0.03) !important;
                        }
                        .dark html[data-stitch-mode="stitch"] header.sticky.top-0 {
                            background-color: rgba(9, 9, 11, 0.92) !important;
                            border-bottom: 1px solid rgba(39, 39, 42, 0.85) !important;
                        }

                        /* 2. Calibrate Navigation Bar Icons (Monochrome Slate -> Single Brand Accent on Hover/Active) */
                        html[data-stitch-mode="stitch"] header nav a svg,
                        html[data-stitch-mode="stitch"] header nav button svg {
                            color: #64748b !important;
                            transition: color 0.15s ease !important;
                        }
                        html[data-stitch-mode="stitch"] header nav a:hover svg,
                        html[data-stitch-mode="stitch"] header nav button:hover svg,
                        html[data-stitch-mode="stitch"] header nav a.text-primary svg,
                        html[data-stitch-mode="stitch"] header nav button.text-primary svg {
                            color: hsl(var(--primary)) !important;
                        }

                        /* 3. Alabaster Fintech Canvas & Tabular Financial Numerals */
                        html[data-stitch-mode="stitch"] body {
                            background-color: #F8FAFC !important;
                            font-variant-numeric: tabular-nums;
                        }
                        .dark html[data-stitch-mode="stitch"] body {
                            background-color: #09090B !important;
                        }

                        /* 4. Single-Gutter Mobile Rule (< 768px): Remove double nested padding & add bottom safe space for Bottom Tab Bar */
                        @media (max-width: 767px) {
                            html[data-stitch-mode="stitch"] main {
                                padding-left: 0.875rem !important;
                                padding-right: 0.875rem !important;
                                padding-top: 0.875rem !important;
                                padding-bottom: 5.5rem !important;
                            }
                            html[data-stitch-mode="stitch"] main > div > .p-4,
                            html[data-stitch-mode="stitch"] main > .p-4 {
                                padding-left: 0 !important;
                                padding-right: 0 !important;
                            }
                            /* Prevent iOS Safari auto-zoom on inputs */
                            html[data-stitch-mode="stitch"] input,
                            html[data-stitch-mode="stitch"] select,
                            html[data-stitch-mode="stitch"] textarea {
                                font-size: 16px !important;
                            }
                        }
                    `
                    }}
                />
            )}

            {/* SHOW COMPARISON BAR ONLY WHEN VISITING THE DIAGNOSTIC ROUTE */}
            {isDiagnosticoPage && (
                <div className="sticky top-0 z-[100] w-full bg-slate-900 text-white border-b border-slate-800 px-3 sm:px-6 py-2 shadow-md">
                    <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-teal-500/20 text-teal-300 border border-teal-500/30 shrink-0">
                                <Sparkles className="h-3 w-3 text-teal-400" />
                                SISTEMA DE DISEÑO GOOGLE STITCH
                            </span>
                        </div>

                        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
                            <div className="inline-flex rounded-xl bg-slate-800 p-0.5 border border-slate-700">
                                <button
                                    type="button"
                                    onClick={() => setMode("stitch")}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                                        mode === "stitch"
                                            ? "bg-teal-500 text-slate-950 shadow-xs"
                                            : "text-slate-300 hover:text-white"
                                    }`}
                                >
                                    <Sparkles className="h-3 w-3" />
                                    <span>Diseño Stitch Activo</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode("current")}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                                        mode === "current"
                                            ? "bg-amber-400 text-slate-950 shadow-xs"
                                            : "text-slate-300 hover:text-white"
                                    }`}
                                >
                                    <Eye className="h-3 w-3" />
                                    <span>Comparar Anterior</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* NATIVE MOBILE BOTTOM TAB BAR FOR iOS & ANDROID (< 768px) */}
            {mode === "stitch" && !isExcludedFromBottomBar && !isDiagnosticoPage && (
                <nav
                    aria-label="Navegación rápida móvil"
                    className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-slate-200/90 dark:border-zinc-800 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] grid grid-cols-5 gap-1 shadow-[0_-4px_20px_rgba(15,23,42,0.06)] print:hidden"
                >
                    {[
                        { href: "/", label: "Inicio", icon: Home, match: (p: string) => p === "/" },
                        {
                            href: "/activity",
                            label: "25 Pts",
                            icon: ClipboardCheck,
                            match: (p: string) => p.startsWith("/activity")
                        },
                        {
                            href: "/cartera",
                            label: "Cartera",
                            icon: Wallet,
                            match: (p: string) => p.startsWith("/cartera")
                        },
                        {
                            href: "/adn",
                            label: "ADN",
                            icon: HeartPulse,
                            match: (p: string) => p.startsWith("/adn")
                        },
                        {
                            href: "/assistant",
                            label: "Copiloto IA",
                            icon: Bot,
                            match: (p: string) => p.startsWith("/assistant")
                        }
                    ].map((tab) => {
                        const Icon = tab.icon;
                        const active = tab.match(pathname);
                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className={`flex flex-col items-center justify-center min-h-[44px] py-1 rounded-xl transition-colors ${
                                    active
                                        ? "text-teal-600 dark:text-teal-400 font-extrabold"
                                        : "text-slate-500 dark:text-zinc-400 font-semibold hover:text-slate-900"
                                }`}
                            >
                                <Icon className={`h-5 w-5 ${active ? "stroke-[2.5px]" : "stroke-[2px]"}`} />
                                <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-full px-1">
                                    {tab.label}
                                </span>
                            </Link>
                        );
                    })}
                </nav>
            )}
        </>
    );
}

"use client";

import React, { useState, useEffect } from "react";
import { getMonthlyAdnRankings } from "@/app/actions";
import { resolveImageUrl } from "@/lib/utils";
import { 
    Trophy, 
    Sparkles, 
    Award, 
    TrendingUp, 
    Loader2, 
    ZoomIn, 
    X, 
    ArrowUpRight,
    Megaphone,
    User
} from "lucide-react";

interface UserRank {
    user: {
        id: string;
        name: string;
        email: string;
        image: string | null; // base64
    };
    count: number;
}

interface RankingAd {
    id: string;
    imageUrl: string;
    linkUrl: string | null;
    createdAt: Date | string;
}

export default function RankingPage() {
    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth());
    const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
    
    const [rankings, setRankings] = useState<UserRank[]>([]);
    const [campaignAd, setCampaignAd] = useState<RankingAd | null>(null);
    const [agencyName, setAgencyName] = useState<string>("la Agencia");
    const [loading, setLoading] = useState(true);
    const [selectedAd, setSelectedAd] = useState<RankingAd | null>(null);

    const loadRankings = async () => {
        try {
            setLoading(true);
            const res = await getMonthlyAdnRankings(selectedMonth, selectedYear);
            if (res.success) {
                setRankings(res.rankings as any);
                setCampaignAd(res.rankingAd as any);
                if (res.agencyName) setAgencyName(res.agencyName);
            }
        } catch (err) {
            console.error("Error loading rankings:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRankings();
    }, [selectedMonth, selectedYear]);

    // Get initials for profile picture fallback
    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();
    };

    // Dynamic styles for Top 3 leaders
    const getPodiumClass = (index: number) => {
        switch (index) {
            case 0: // 1st Place
                return {
                    borderClass: "border-amber-400 dark:border-amber-500 shadow-amber-100 dark:shadow-amber-950/20 bg-amber-50/20 dark:bg-amber-950/10",
                    badgeClass: "bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-amber-200/50",
                    iconColor: "text-amber-500",
                    avatarRing: "ring-amber-400",
                    badgeText: "🥇 1er Lugar"
                };
            case 1: // 2nd Place
                return {
                    borderClass: "border-slate-300 dark:border-zinc-700 shadow-slate-100 dark:shadow-zinc-900 bg-slate-50/20 dark:bg-zinc-900/10",
                    badgeClass: "bg-gradient-to-r from-slate-400 to-slate-500 text-white shadow-slate-200/50",
                    iconColor: "text-slate-400",
                    avatarRing: "ring-slate-300",
                    badgeText: "🥈 2do Lugar"
                };
            case 2: // 3rd Place
                return {
                    borderClass: "border-amber-600 dark:border-amber-700 shadow-amber-900/10 bg-amber-900/5 dark:bg-amber-950/5",
                    badgeClass: "bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-amber-800/30",
                    iconColor: "text-amber-700",
                    avatarRing: "ring-amber-600",
                    badgeText: "🥉 3er Lugar"
                };
            default:
                return {
                    borderClass: "border-slate-100 dark:border-zinc-800 bg-card",
                    badgeClass: "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300",
                    iconColor: "text-slate-400",
                    avatarRing: "ring-slate-100 dark:ring-zinc-800",
                    badgeText: `${index + 1}° Lugar`
                };
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="h-12 w-12 text-teal-600 animate-spin" />
                <p className="text-sm text-muted-foreground font-semibold">Cargando rankings de agentes...</p>
            </div>
        );
    }

    const months = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    // Separate Top 3 from the rest (Top 10 lists)
    const topThree = rankings.slice(0, 3);
    const topRest = rankings.slice(3, 10);

    return (
        <div className="flex flex-col gap-8 w-full max-w-lg mx-auto py-2 md:max-w-6xl md:px-0">
            {/* HEADER */}
            <div className="flex flex-col gap-1.5 px-4 md:px-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100">
                        Ranking de Agentes
                    </h1>
                    <div className="flex items-center gap-2">
                        <select 
                            value={selectedMonth} 
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            className="bg-primary/10 dark:bg-primary/5 border border-primary/20 dark:border-primary/90 text-primary dark:text-primary text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-wider outline-none focus:ring-2 focus:ring-primary transition-all cursor-pointer"
                        >
                            {months.map((m, i) => (
                                <option key={i} value={i}>{m}</option>
                            ))}
                        </select>
                        
                        <select 
                            value={selectedYear} 
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="bg-primary/10 dark:bg-primary/5 border border-primary/20 dark:border-primary/90 text-primary dark:text-primary text-xs font-black px-3 py-1.5 rounded-full outline-none focus:ring-2 focus:ring-primary transition-all cursor-pointer"
                        >
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5 text-primary" />
                    Líderes de la promotoria ordenados por la cantidad de diagnósticos de ADN completados en {months[selectedMonth].toLowerCase()} del {selectedYear}.
                </p>
            </div>

            {/* LEADER PODIUM (TOP 3) - GRID */}
            {topThree.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4 md:px-0">
                    {topThree.map((item, idx) => {
                        const style = getPodiumClass(idx);
                        
                        return (
                            <div 
                                key={item.user.id}
                                className={`rounded-2xl border-2 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden transition-all duration-300 hover:scale-[1.02] shadow-lg ${style.borderClass}`}
                            >
                                {/* Floating Medal Badge */}
                                <span className={`absolute top-4 left-4 text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${style.badgeClass}`}>
                                    {style.badgeText}
                                </span>

                                {/* Crown for 1st Place */}
                                {idx === 0 && (
                                    <div className="absolute top-3 right-4 transform rotate-12 text-amber-500 animate-bounce">
                                        <Sparkles className="h-5 w-5" />
                                    </div>
                                )}

                                {/* Profile Photo or Fallback */}
                                <div className="relative mb-4 mt-2">
                                    <div className={`h-24 w-24 rounded-full overflow-hidden shadow-inner ring-4 ${style.avatarRing} flex items-center justify-center bg-slate-50 dark:bg-zinc-950`}>
                                        {item.user.image ? (
                                            <img 
                                                src={resolveImageUrl(item.user.image)} 
                                                alt={item.user.name} 
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="h-full w-full bg-gradient-to-tr from-primary/80 to-primary flex items-center justify-center text-white text-3xl font-black">
                                                {getInitials(item.user.name)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-1.5 -right-1.5 h-7 w-7 rounded-full bg-primary text-white flex items-center justify-center shadow-md border border-white font-extrabold text-xs">
                                        {item.count}
                                    </div>
                                </div>

                                {/* Agent Details */}
                                <div className="space-y-1">
                                    <h3 className="text-sm font-black text-slate-800 dark:text-zinc-100 line-clamp-1">
                                        {item.user.name}
                                    </h3>
                                    <p className="text-[10px] text-muted-foreground truncate max-w-[180px]">
                                        {item.user.email}
                                    </p>
                                </div>

                                <div className="mt-4 pt-3 border-t w-full border-slate-100 dark:border-zinc-800/80 flex items-center justify-center gap-1.5 text-xs text-muted-foreground font-bold">
                                    <Trophy className={`h-4 w-4 ${style.iconColor}`} />
                                    <span>{item.count} {item.count === 1 ? 'ADN Completado' : 'ADNs Completados'}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="py-12 bg-card rounded-2xl border text-center text-muted-foreground">
                    No se registran diagnósticos de ADN cargados este mes todavía.
                </div>
            )}

            {/* LEADERBOARD (4TH TO 10TH PLACE) */}
            {topRest.length > 0 && (
                <div className="bg-card rounded-2xl border shadow-md p-6 overflow-hidden">
                    <h2 className="text-sm font-black text-slate-700 dark:text-zinc-300 uppercase tracking-widest border-b pb-2 mb-4">
                        Tabla de Clasificación General
                    </h2>

                    <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                        {topRest.map((item, idx) => {
                            const index = idx + 3; // Offset by 3 for top three
                            const style = getPodiumClass(index);
                            
                            return (
                                <div 
                                    key={item.user.id}
                                    className="py-3.5 flex items-center justify-between gap-4 group hover:bg-slate-50/30 dark:hover:bg-zinc-900/10 px-2 rounded-xl transition-colors"
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        {/* Position Number */}
                                        <span className="text-sm font-black text-slate-400 w-6 text-center">
                                            {index + 1}
                                        </span>

                                        {/* Avatar mini */}
                                        <div className="h-10 w-10 rounded-full overflow-hidden shrink-0 border bg-slate-50 dark:bg-zinc-950 flex items-center justify-center ring-2 ring-transparent group-hover:ring-teal-500/20 transition-all">
                                            {item.user.image ? (
                                                <img 
                                                    src={resolveImageUrl(item.user.image)} 
                                                    alt={item.user.name} 
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="h-full w-full bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center justify-center text-xs font-black">
                                                    {getInitials(item.user.name)}
                                                </div>
                                            )}
                                        </div>

                                        <div className="min-w-0">
                                            <p className="text-xs font-black text-slate-800 dark:text-zinc-200 truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                                                {item.user.name}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground truncate">
                                                {item.user.email}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-black uppercase text-muted-foreground">
                                            {item.count} {item.count === 1 ? 'ADN' : 'ADNs'}
                                        </span>
                                        <div className="h-7 w-7 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-600 dark:text-zinc-400 font-extrabold text-xs">
                                            {item.count}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* INCENTIVE CAMPAIGN BANNER CONTAINER (RANKING_AD) */}
            {campaignAd && (
                <div className="mt-4 space-y-4 px-4 md:px-0">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800">
                        <Megaphone className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                        <h2 className="text-base font-black text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                            Campaña de Incentivos {agencyName}
                        </h2>
                    </div>

                    <div 
                        onClick={() => setSelectedAd(campaignAd)}
                        className="relative w-full h-48 md:h-64 rounded-2xl overflow-hidden border border-slate-200/60 dark:border-zinc-800/80 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
                    >
                        {/* Blurred Background flyer */}
                        <div 
                            className="absolute inset-0 bg-cover bg-center blur-md scale-105 opacity-20 pointer-events-none select-none"
                            style={{ backgroundImage: `url(${campaignAd.imageUrl})` }}
                        />
                        
                        {/* Sharp flyer */}
                        <div className="w-full h-full flex items-center justify-center relative bg-slate-50 dark:bg-zinc-950">
                            <img 
                                src={campaignAd.imageUrl} 
                                alt="Campaña de Incentivos" 
                                className="max-w-full max-h-full object-contain relative z-10 transition-transform duration-500 group-hover:scale-[1.02]"
                            />

                            {/* Dark Overlay on Hover */}
                            <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-2 z-20">
                                <div className="h-10 w-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                    <ZoomIn className="h-5 w-5" />
                                </div>
                                <span className="text-[10px] text-white font-bold uppercase tracking-wider">Ampliar Campaña</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* FULL SCREEN LIGHTBOX MODAL FOR CAMPAIGN BANNER */}
            {selectedAd && (
                <div 
                    onClick={() => setSelectedAd(null)}
                    className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-6 md:p-10 animate-in fade-in duration-300"
                >
                    {/* Close Button */}
                    <button 
                        onClick={() => setSelectedAd(null)}
                        className="absolute top-4 right-4 z-55 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-all duration-200 shadow-md"
                        title="Cerrar (Esc)"
                    >
                        <X className="h-6 w-6" />
                    </button>

                    {/* Flyer Container */}
                    <div 
                        onClick={(e) => e.stopPropagation()} 
                        className="relative max-w-full max-h-[78vh] flex items-center justify-center z-50 rounded-lg overflow-hidden border border-white/10 shadow-2xl bg-zinc-900/50"
                    >
                        <img 
                            src={selectedAd.imageUrl} 
                            alt="Campaña de Incentivo Ampliada" 
                            className="max-w-[95vw] max-h-[76vh] md:max-h-[78vh] object-contain select-none"
                        />
                    </div>

                    {/* Campaign Action bar */}
                    <div 
                        onClick={(e) => e.stopPropagation()}
                        className="mt-6 flex flex-col sm:flex-row items-center gap-4 z-50 w-full max-w-xl text-center bg-zinc-900/80 border border-white/10 backdrop-blur-lg p-4 rounded-2xl shadow-xl text-white"
                    >
                        <div className="flex-1 text-left">
                            <span className="text-[9px] bg-primary text-white font-extrabold px-2 py-0.5 rounded tracking-widest uppercase block w-fit mb-1">
                                Campaña de Incentivos
                            </span>
                            <p className="text-xs text-zinc-300 truncate">
                                Meta: Impulsar la prospección y entrega de pólizas.
                            </p>
                        </div>
                        
                        <div className="flex gap-3 w-full sm:w-auto shrink-0">
                            {selectedAd.linkUrl && (
                                <a 
                                    href={selectedAd.linkUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-md hover:shadow-primary/20 transition-all duration-200"
                                >
                                    <ArrowUpRight className="h-4 w-4" /> Ver Enlace Asociado
                                </a>
                            )}
                            <button 
                                onClick={() => setSelectedAd(null)}
                                className="flex-1 sm:flex-none bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 hover:text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors duration-200"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

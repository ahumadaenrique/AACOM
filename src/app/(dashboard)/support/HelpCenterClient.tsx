"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  MANUAL_CHAPTERS,
  GLOSSARY_ITEMS,
  ManualChapter,
  ManualSubsection,
  ManualFigure,
  ManualTable,
  ManualStepGroup
} from "./manualData";
import { ManualMockupPreview } from "./ManualMockupPreview";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen,
  Compass,
  Home,
  Newspaper,
  ClipboardCheck,
  Target,
  Wallet,
  Users,
  UserCheck,
  Award,
  Network,
  Sparkles,
  Bot,
  Settings,
  Building2,
  LifeBuoy,
  Search,
  X,
  ZoomIn,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  Download,
  Lightbulb,
  Info,
  CheckCircle2,
  Send,
  ImageIcon,
  Layers,
  BookMarked,
  Clock,
  ArrowUpRight,
  Filter
} from "lucide-react";

const CHAPTER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
  Compass,
  Home,
  Newspaper,
  ClipboardCheck,
  Target,
  Wallet,
  Users,
  UserCheck,
  Award,
  Network,
  Sparkles,
  Bot,
  Settings,
  Building2,
  LifeBuoy
};

interface SearchResultItem {
  chapterId: string;
  chapterNumber: string;
  chapterTitle: string;
  subsectionId?: string;
  subsectionNumber?: string;
  subsectionTitle?: string;
  snippet: string;
  matchType: "Capítulo" | "Subsección" | "Paso a paso" | "Pantalla";
  roleBadge: "Todos" | "Agente" | "Admin";
}

interface UserTicket {
  id: string;
  subject: string;
  description: string;
  contactPhone: string | null;
  status: string;
  imageUrl: string | null;
  createdAt: string;
}

export function HelpCenterClient({ defaultTab = "manual" }: { defaultTab?: "manual" | "glosario" | "ticket" }) {
  const searchParams = useSearchParams();
  const initialTabParam = searchParams?.get("tab");
  const initialChapterParam = searchParams?.get("chapter");

  const [activeTab, setActiveTab] = useState<"manual" | "glosario" | "ticket">(
    initialTabParam === "ticket"
      ? "ticket"
      : initialTabParam === "glosario"
      ? "glosario"
      : defaultTab
  );

  const [activeChapterId, setActiveChapterId] = useState<string>(
    initialChapterParam && MANUAL_CHAPTERS.some((c) => c.id === initialChapterParam)
      ? initialChapterParam
      : MANUAL_CHAPTERS[0].id
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "Agente" | "Admin">("ALL");
  const [glossaryCategory, setGlossaryCategory] = useState<string>("Todos");
  const [glossarySearch, setGlossarySearch] = useState<string>("");

  // Lightbox state for figures
  const [lightboxFigure, setLightboxFigure] = useState<{ src: string; caption: string; number?: number } | null>(null);

  // Ticket Form State
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loadingTicket, setLoadingTicket] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState(false);
  const [myTickets, setMyTickets] = useState<UserTicket[]>([]);
  const [loadingMyTickets, setLoadingMyTickets] = useState(false);
  const { toast } = useToast();

  // Sync URL query params if changed externally
  useEffect(() => {
    if (initialTabParam === "ticket") setActiveTab("ticket");
    else if (initialTabParam === "glosario") setActiveTab("glosario");
    if (initialChapterParam && MANUAL_CHAPTERS.some((c) => c.id === initialChapterParam)) {
      setActiveChapterId(initialChapterParam);
    }
  }, [initialTabParam, initialChapterParam]);

  // Keyboard shortcut Ctrl+K / Cmd+K for search and Esc for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const input = document.getElementById("help-center-search-input");
        input?.focus();
      }
      if (e.key === "Escape" && lightboxFigure) {
        setLightboxFigure(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxFigure]);

  const fetchMyTickets = useCallback(async () => {
    setLoadingMyTickets(true);
    try {
      const res = await fetch("/api/support");
      if (res.ok) {
        const data = await res.json();
        setMyTickets(data.tickets || []);
      }
    } catch {
      // silent
    } finally {
      setLoadingMyTickets(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "ticket") {
      fetchMyTickets();
    }
  }, [activeTab, fetchMyTickets]);

  const filteredChapters = useMemo(() => {
    if (roleFilter === "ALL") return MANUAL_CHAPTERS;
    if (roleFilter === "Agente") {
      return MANUAL_CHAPTERS.filter((c) => c.roleBadge === "Todos" || c.roleBadge === "Agente");
    }
    return MANUAL_CHAPTERS;
  }, [roleFilter]);

  const activeChapter = useMemo(() => {
    return MANUAL_CHAPTERS.find((c) => c.id === activeChapterId) || MANUAL_CHAPTERS[0];
  }, [activeChapterId]);

  const currentChapterIndex = useMemo(() => {
    return filteredChapters.findIndex((c) => c.id === activeChapter.id);
  }, [filteredChapters, activeChapter.id]);

  const prevChapter = currentChapterIndex > 0 ? filteredChapters[currentChapterIndex - 1] : null;
  const nextChapter =
    currentChapterIndex >= 0 && currentChapterIndex < filteredChapters.length - 1
      ? filteredChapters[currentChapterIndex + 1]
      : null;

  // Full-text search across chapters, subsections, screenElements, steps, tables, tips
  const searchResults = useMemo<SearchResultItem[]>(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    const results: SearchResultItem[] = [];

    for (const ch of MANUAL_CHAPTERS) {
      if (roleFilter === "Agente" && ch.roleBadge === "Admin") continue;

      const chTextPool = [
        ch.title,
        ch.subtitle,
        ch.purpose || "",
        ...(ch.introParagraphs || []),
        ...(ch.howToReach || []),
        ...(ch.screenElements?.flatMap((g) => g.items.map((i) => `${i.label || ""} ${i.text}`)) || []),
        ...(ch.stepGroups?.flatMap((sg) => [sg.title, ...sg.steps]) || []),
        ...(ch.tips?.map((t) => t.text) || [])
      ].join(" ");

      if (chTextPool.toLowerCase().includes(q)) {
        const idx = chTextPool.toLowerCase().indexOf(q);
        const start = Math.max(0, idx - 50);
        const end = Math.min(chTextPool.length, idx + 130);
        results.push({
          chapterId: ch.id,
          chapterNumber: ch.number,
          chapterTitle: ch.title,
          snippet: (start > 0 ? "..." : "") + chTextPool.slice(start, end) + (end < chTextPool.length ? "..." : ""),
          matchType: "Capítulo",
          roleBadge: ch.roleBadge
        });
      }

      for (const sub of ch.subsections || []) {
        const subTextPool = [
          sub.title,
          sub.purpose || "",
          ...(sub.description || []),
          ...(sub.howToReach || []),
          ...(sub.screenElements?.flatMap((g) => g.items.map((i) => `${i.label || ""} ${i.text}`)) || []),
          ...(sub.stepGroups?.flatMap((sg) => [sg.title, ...sg.steps]) || []),
          ...(sub.tables?.flatMap((t) => t.rows.flat()) || []),
          ...(sub.tips?.map((t) => t.text) || [])
        ].join(" ");

        if (subTextPool.toLowerCase().includes(q)) {
          const idx = subTextPool.toLowerCase().indexOf(q);
          const start = Math.max(0, idx - 50);
          const end = Math.min(subTextPool.length, idx + 130);
          results.push({
            chapterId: ch.id,
            chapterNumber: ch.number,
            chapterTitle: ch.title,
            subsectionId: sub.id,
            subsectionNumber: sub.number,
            subsectionTitle: sub.title,
            snippet: (start > 0 ? "..." : "") + subTextPool.slice(start, end) + (end < subTextPool.length ? "..." : ""),
            matchType: "Subsección",
            roleBadge: sub.roleBadge || ch.roleBadge
          });
        }
      }
    }

    return results;
  }, [searchQuery, roleFilter]);

  const matchingGlossary = useMemo(() => {
    const q = (activeTab === "glosario" ? glossarySearch : searchQuery).trim().toLowerCase();
    return GLOSSARY_ITEMS.filter((item) => {
      const matchesCat = glossaryCategory === "Todos" || item.category === glossaryCategory;
      const matchesQuery =
        !q || item.term.toLowerCase().includes(q) || item.meaning.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [activeTab, glossarySearch, searchQuery, glossaryCategory]);

  const navigateToSection = (chapterId: string, subsectionId?: string) => {
    setActiveTab("manual");
    setActiveChapterId(chapterId);
    setSearchQuery("");
    setTimeout(() => {
      if (subsectionId) {
        const el = document.getElementById(subsectionId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 80);
  };

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingTicket(true);

    try {
      const formData = new FormData();
      formData.append("subject", subject);
      formData.append("description", description);
      formData.append("contactPhone", contactPhone);
      if (file) {
        formData.append("file", file);
      }

      const res = await fetch("/api/support", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar el ticket");

      setTicketSuccess(true);
      fetchMyTickets();
      toast({
        title: "Ticket Enviado",
        description: "Hemos recibido tu solicitud y la atenderemos lo antes posible."
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    } finally {
      setLoadingTicket(false);
    }
  };

  const renderFigures = (figures?: ManualFigure[]) => {
    if (!figures || figures.length === 0) return null;
    return (
      <div className="space-y-5 my-5">
        {figures.map((fig, idx) => (
          <div key={idx} className="space-y-2">
            {fig.src ? (
              <div
                onClick={() => setLightboxFigure({ src: fig.src!, caption: fig.caption, number: fig.number })}
                className="group relative rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-100/70 dark:bg-zinc-900 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-zoom-in"
              >
                <div className="bg-slate-900/95 text-white px-4 py-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-slate-300 ml-1">
                      {fig.number ? `Pantalla · Figura ${fig.number}` : "Captura de Pantalla"}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] text-teal-300 font-semibold group-hover:underline">
                    <ZoomIn className="w-3.5 h-3.5" /> Clic para ampliar
                  </span>
                </div>
                <div className="p-2 md:p-4 flex justify-center bg-slate-50 dark:bg-zinc-950">
                  <img
                    src={fig.src}
                    alt={fig.caption}
                    className={`rounded-lg object-contain transition-transform duration-300 group-hover:scale-[1.01] ${
                      fig.number === 1 ? "max-h-[380px]" : "w-full max-h-[540px]"
                    }`}
                    loading="lazy"
                  />
                </div>
              </div>
            ) : fig.mockup ? (
              <ManualMockupPreview type={fig.mockup} />
            ) : null}
            <p className="text-xs text-center text-slate-500 dark:text-zinc-400 italic px-2">{fig.caption}</p>
          </div>
        ))}
      </div>
    );
  };

  const renderTables = (tables?: ManualTable[]) => {
    if (!tables || tables.length === 0) return null;
    return (
      <div className="space-y-4 my-4">
        {tables.map((t, idx) => (
          <div
            key={idx}
            className="overflow-x-auto rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm"
          >
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-teal-700 text-white">
                  {t.headers.map((h, i) => (
                    <th key={i} className="py-3 px-4 font-bold text-xs uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-zinc-800 bg-white dark:bg-zinc-950">
                {t.rows.map((r, rIdx) => (
                  <tr
                    key={rIdx}
                    className="hover:bg-slate-50/80 dark:hover:bg-zinc-900/50 transition-colors"
                  >
                    {r.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        className={`py-3 px-4 text-slate-700 dark:text-zinc-300 ${
                          cIdx === 0 ? "font-bold text-slate-900 dark:text-white whitespace-nowrap" : ""
                        }`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    );
  };

  const renderScreenElements = (
    groups?: { groupTitle?: string; items: { label?: string; text: string }[] }[]
  ) => {
    if (!groups || groups.length === 0) return null;
    return (
      <div className="space-y-4 my-4">
        {groups.map((g, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/50 p-4 md:p-5"
          >
            {g.groupTitle && (
              <h4 className="text-sm font-bold text-teal-800 dark:text-teal-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                {g.groupTitle}
              </h4>
            )}
            <ul className="space-y-2.5 text-sm text-slate-700 dark:text-zinc-300">
              {g.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-600 dark:bg-teal-400 mt-2 shrink-0" />
                  <span>
                    {item.label && (
                      <strong className="text-slate-900 dark:text-white font-bold">{item.label}: </strong>
                    )}
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  };

  const renderStepGroups = (stepGroups?: ManualStepGroup[]) => {
    if (!stepGroups || stepGroups.length === 0) return null;
    return (
      <div className="space-y-4 my-4">
        {stepGroups.map((sg, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-teal-200/80 dark:border-teal-900/50 bg-gradient-to-br from-teal-50/50 via-white to-emerald-50/30 dark:from-teal-950/20 dark:via-zinc-950 dark:to-emerald-950/10 p-4 md:p-5 shadow-sm"
          >
            <h4 className="text-sm font-extrabold text-teal-800 dark:text-teal-300 mb-3.5 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              {sg.title}
            </h4>
            <ol className="space-y-2.5">
              {sg.steps.map((step, sIdx) => (
                <li key={sIdx} className="flex items-start gap-3 text-sm text-slate-700 dark:text-zinc-300">
                  <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    {sIdx + 1}
                  </span>
                  <span className="leading-relaxed pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    );
  };

  const renderTips = (tips?: { type: "CONSEJO" | "NOTA"; text: string }[]) => {
    if (!tips || tips.length === 0) return null;
    return (
      <div className="space-y-3 my-4">
        {tips.map((tip, idx) => (
          <div
            key={idx}
            className={`rounded-xl p-4 border-l-4 flex items-start gap-3 ${
              tip.type === "CONSEJO"
                ? "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-600 text-emerald-950 dark:text-emerald-200"
                : "bg-slate-100/80 dark:bg-zinc-900 border-slate-500 text-slate-800 dark:text-zinc-200"
            }`}
          >
            {tip.type === "CONSEJO" ? (
              <Lightbulb className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-5 h-5 text-slate-600 dark:text-zinc-400 shrink-0 mt-0.5" />
            )}
            <div className="text-sm leading-relaxed">
              <span className="text-[11px] font-black uppercase tracking-wider block mb-0.5">
                {tip.type}
              </span>
              {tip.text}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const ActiveIcon = CHAPTER_ICONS[activeChapter.iconName] || BookOpen;

  return (
    <div className="max-w-7xl mx-auto pb-20 space-y-6">
      {/* HERO & SEARCH BANNER */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-teal-900 to-emerald-900 text-white p-6 md:p-8 shadow-xl relative overflow-hidden border border-teal-700/40">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-teal-400/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-200 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" /> Manual Oficial · Versión 1.0 · Octubre 2026
            </div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight">
              Centro de Ayuda y Orientación aacomsoft
            </h1>
            <p className="text-teal-100/90 text-sm md:text-base leading-relaxed">
              Guías paso a paso, pantallas interactivas, glosario asegurador y soporte técnico para promotorías y agentes de seguros.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              href="/manual/Manual-de-Usuario-aacomsoft.pdf"
              download="Manual-de-Usuario-aacomsoft.pdf"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs md:text-sm border border-white/20 backdrop-blur-sm transition-all"
            >
              <Download className="w-4 h-4 text-teal-300" />
              Descargar Manual PDF
            </a>
            <button
              type="button"
              onClick={() => setActiveTab("ticket")}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all shadow-md ${
                activeTab === "ticket"
                  ? "bg-amber-400 text-slate-950"
                  : "bg-white text-teal-950 hover:bg-teal-50"
              }`}
            >
              <LifeBuoy className="w-4 h-4 text-teal-700" />
              Levantar Ticket / Soporte
            </button>
          </div>
        </div>

        {/* GLOBAL SEARCH BAR & MAIN NAVIGATION TABS */}
        <div className="relative z-10 mt-6 pt-6 border-t border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-2xl">
            <Search className="w-5 h-5 text-teal-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="help-center-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activeTab === "ticket" && e.target.value.trim()) {
                  setActiveTab("manual");
                }
              }}
              placeholder="Buscar guías, pantallas, botones, columnas o términos (ej. 25 puntos, ADN, UDI, TIPS, póliza)..."
              className="w-full pl-11 pr-20 py-3 rounded-xl bg-slate-950/60 border border-teal-400/30 text-white placeholder:text-teal-200/60 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded-md flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Limpiar
              </button>
            ) : (
              <span className="hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono bg-white/10 text-teal-200 px-2 py-1 rounded border border-white/10">
                Ctrl + K
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950/50 p-1.5 rounded-xl border border-white/10 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab("manual")}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === "manual"
                  ? "bg-teal-600 text-white shadow"
                  : "text-teal-100 hover:bg-white/10"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Guías y Pantallas (17)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("glosario")}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === "glosario"
                  ? "bg-teal-600 text-white shadow"
                  : "text-teal-100 hover:bg-white/10"
              }`}
            >
              <BookMarked className="w-4 h-4" />
              Glosario ({GLOSSARY_ITEMS.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("ticket")}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === "ticket"
                  ? "bg-teal-600 text-white shadow"
                  : "text-teal-100 hover:bg-white/10"
              }`}
            >
              <LifeBuoy className="w-4 h-4" />
              Tickets de Soporte
            </button>
          </div>
        </div>
      </div>

      {/* LIVE SEARCH RESULTS OVERLAY / PANEL */}
      {searchQuery.trim() !== "" && activeTab === "manual" && (
        <Card className="border-teal-500/40 shadow-lg overflow-hidden">
          <div className="bg-teal-50/80 dark:bg-teal-950/30 px-6 py-4 border-b border-teal-200/60 dark:border-teal-900/50 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-teal-600" />
                Resultados de búsqueda para «{searchQuery}»
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Se encontraron {searchResults.length} secciones en el manual y {matchingGlossary.length} términos en el glosario.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setSearchQuery("")}>
              Cerrar búsqueda
            </Button>
          </div>
          <CardContent className="p-6 space-y-6">
            {searchResults.length === 0 && matchingGlossary.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
                  No encontramos coincidencias exactas para «{searchQuery}».
                </p>
                <p className="text-xs text-slate-500">
                  Prueba con palabras como: <strong>póliza, recibos, ADN, TIPS, UDI, Cédula, 25 puntos, referidores, cotizador</strong>.
                </p>
              </div>
            ) : (
              <>
                {searchResults.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {searchResults.map((res, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => navigateToSection(res.chapterId, res.subsectionId)}
                        className="text-left p-4 rounded-xl border border-slate-200 dark:border-zinc-800 hover:border-teal-500 dark:hover:border-teal-500 bg-white dark:bg-zinc-950 hover:shadow-md transition-all group"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-bold text-teal-700 dark:text-teal-400">
                            Cap. {res.chapterNumber}. {res.chapterTitle}
                            {res.subsectionNumber ? ` › ${res.subsectionNumber} ${res.subsectionTitle}` : ""}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                            {res.roleBadge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                          {res.snippet}
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                {matchingGlossary.length > 0 && (
                  <div className="pt-4 border-t border-slate-200 dark:border-zinc-800">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                      Términos del Glosario relacionados ({matchingGlossary.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {matchingGlossary.map((g, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <strong className="text-teal-700 dark:text-teal-400 font-black">{g.term}</strong>
                            <span className="text-[10px] text-slate-400">{g.category}</span>
                          </div>
                          <p className="text-slate-600 dark:text-zinc-400">{g.meaning}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 1: MANUAL INTERACTIVO Y GUÍAS */}
      {activeTab === "manual" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT SIDEBAR: TABLE OF CONTENTS */}
          <aside className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-20 space-y-4">
            <Card className="border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
              <div className="p-3.5 bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                  Índice del Manual
                </span>
                <div className="flex items-center gap-1 bg-white dark:bg-zinc-950 p-0.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-[10px] font-bold">
                  {(["ALL", "Agente", "Admin"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRoleFilter(r)}
                      className={`px-2 py-1 rounded-md transition-colors ${
                        roleFilter === r
                          ? "bg-teal-600 text-white"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200"
                      }`}
                    >
                      {r === "ALL" ? "Todos" : r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="max-h-[68vh] overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-900 p-2 space-y-1">
                {filteredChapters.map((ch) => {
                  const Icon = CHAPTER_ICONS[ch.iconName] || BookOpen;
                  const isSelected = ch.id === activeChapter.id;
                  return (
                    <div key={ch.id} className="pt-1 first:pt-0">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveChapterId(ch.id);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between gap-2 transition-all text-xs ${
                          isSelected
                            ? "bg-teal-600 text-white font-bold shadow-sm"
                            : "text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-900 font-medium"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              isSelected ? "text-white" : "text-teal-600 dark:text-teal-400"
                            }`}
                          />
                          <span className="truncate">
                            {ch.number}. {ch.title}
                          </span>
                        </div>
                        {ch.roleBadge === "Admin" && (
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase shrink-0 ${
                              isSelected
                                ? "bg-white/20 text-white"
                                : "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300"
                            }`}
                          >
                            Admin
                          </span>
                        )}
                      </button>

                      {/* Subsections tree when chapter is active */}
                      {isSelected && ch.subsections && ch.subsections.length > 0 && (
                        <div className="ml-5 mt-1.5 pl-3 border-l-2 border-teal-500/40 space-y-1 py-1">
                          {ch.subsections.map((sub) => (
                            <a
                              key={sub.id}
                              href={`#${sub.id}`}
                              className="block text-[11px] py-1 px-2 rounded-lg text-slate-600 dark:text-zinc-400 hover:text-teal-700 dark:hover:text-teal-300 hover:bg-teal-50/60 dark:hover:bg-teal-950/30 font-medium truncate"
                            >
                              {sub.number} {sub.title}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Direct button to Chapter 17 Glosario */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab("glosario")}
                    className="w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between gap-2 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-900"
                  >
                    <div className="flex items-center gap-2.5">
                      <BookMarked className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      <span>17. Glosario de Términos</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            </Card>
          </aside>

          {/* RIGHT CONTENT AREA: ACTIVE CHAPTER */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-6">
            <Card className="border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
              {/* Chapter Header */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 md:p-8 border-b border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-black">
                      Capítulo {activeChapter.number} de 17
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        activeChapter.roleBadge === "Admin"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-400/30"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                      }`}
                    >
                      Rol: {activeChapter.roleBadge === "Admin" ? "Administrador de Promotoría" : "Agentes y Administradores"}
                    </span>
                  </div>

                  {activeChapter.quickLink && (
                    <Link
                      href={activeChapter.quickLink}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs transition-all shadow"
                    >
                      Ir a {activeChapter.title}
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3.5 rounded-2xl bg-white/10 text-teal-300 shrink-0 hidden sm:flex">
                    <ActiveIcon className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight">
                      {activeChapter.number}. {activeChapter.title}
                    </h2>
                    <p className="text-slate-300 text-sm md:text-base mt-1">{activeChapter.subtitle}</p>
                    {activeChapter.quickPath && (
                      <div className="mt-3 inline-flex items-center gap-2 text-xs text-teal-300 bg-white/5 px-3 py-1 rounded-lg border border-white/10">
                        <Compass className="w-3.5 h-3.5" />
                        <span>Ruta en plataforma: <strong>{activeChapter.quickPath}</strong></span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <CardContent className="p-6 md:p-8 space-y-8">
                {/* Chapter-level Purpose & HowToReach */}
                {(activeChapter.purpose || (activeChapter.howToReach && activeChapter.howToReach.length > 0)) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeChapter.purpose && (
                      <div className="p-4 rounded-xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200/70 dark:border-teal-900/50">
                        <h3 className="text-xs font-black uppercase tracking-wider text-teal-800 dark:text-teal-400 mb-1.5">
                          ¿Para qué sirve?
                        </h3>
                        <p className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed">
                          {activeChapter.purpose}
                        </p>
                      </div>
                    )}
                    {activeChapter.howToReach && activeChapter.howToReach.length > 0 && (
                      <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-900/50">
                        <h3 className="text-xs font-black uppercase tracking-wider text-blue-800 dark:text-blue-400 mb-1.5">
                          ¿Cómo llegar?
                        </h3>
                        <ol className="list-decimal pl-4 space-y-1 text-sm text-slate-700 dark:text-zinc-300">
                          {activeChapter.howToReach.map((h, i) => (
                            <li key={i}>{h}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                )}

                {/* Chapter Intro Paragraphs */}
                {activeChapter.introParagraphs && activeChapter.introParagraphs.length > 0 && (
                  <div className="space-y-3 text-sm md:text-base text-slate-700 dark:text-zinc-300 leading-relaxed">
                    {activeChapter.introParagraphs.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                )}

                {/* Chapter Figures */}
                {renderFigures(activeChapter.figures)}

                {/* Chapter Screen Elements */}
                {renderScreenElements(activeChapter.screenElements)}

                {/* Chapter Tables */}
                {renderTables(activeChapter.tables)}

                {/* Chapter Step Groups */}
                {renderStepGroups(activeChapter.stepGroups)}

                {/* Chapter Tips */}
                {renderTips(activeChapter.tips)}

                {/* Chapter Subsections */}
                {activeChapter.subsections && activeChapter.subsections.length > 0 && (
                  <div className="space-y-10 pt-2">
                    {activeChapter.subsections.map((sub: ManualSubsection) => (
                      <section
                        key={sub.id}
                        id={sub.id}
                        className="scroll-mt-24 pt-6 border-t border-slate-200 dark:border-zinc-800 first:border-t-0 first:pt-0 space-y-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                            <span className="px-2.5 py-0.5 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 text-sm font-black">
                              {sub.number}
                            </span>
                            {sub.title}
                          </h3>
                          {sub.quickLink && (
                            <Link
                              href={sub.quickLink}
                              className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline"
                            >
                              Abrir pantalla en vivo <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          )}
                        </div>

                        {(sub.purpose || (sub.howToReach && sub.howToReach.length > 0)) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {sub.purpose && (
                              <div className="p-3.5 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-900/40">
                                <span className="text-[11px] font-black uppercase tracking-wider text-teal-800 dark:text-teal-400 block mb-1">
                                  Para qué sirve
                                </span>
                                <p className="text-sm text-slate-700 dark:text-zinc-300">{sub.purpose}</p>
                              </div>
                            )}
                            {sub.howToReach && sub.howToReach.length > 0 && (
                              <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40">
                                <span className="text-[11px] font-black uppercase tracking-wider text-blue-800 dark:text-blue-400 block mb-1">
                                  Cómo llegar
                                </span>
                                <ol className="list-decimal pl-4 space-y-1 text-sm text-slate-700 dark:text-zinc-300">
                                  {sub.howToReach.map((s, idx) => (
                                    <li key={idx}>{s}</li>
                                  ))}
                                </ol>
                              </div>
                            )}
                          </div>
                        )}

                        {sub.description && sub.description.length > 0 && (
                          <div className="space-y-2.5 text-sm text-slate-700 dark:text-zinc-300 leading-relaxed">
                            {sub.description.map((d, idx) => (
                              <p key={idx}>{d}</p>
                            ))}
                          </div>
                        )}

                        {renderFigures(sub.figures)}
                        {renderScreenElements(sub.screenElements)}
                        {renderTables(sub.tables)}
                        {renderStepGroups(sub.stepGroups)}
                        {renderTips(sub.tips)}
                      </section>
                    ))}
                  </div>
                )}
              </CardContent>

              {/* Prev / Next Chapter Footer Navigation */}
              <CardFooter className="bg-slate-50 dark:bg-zinc-900/60 p-6 border-t border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                {prevChapter ? (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveChapterId(prevChapter.id);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-teal-500 transition-all text-left"
                  >
                    <ChevronLeft className="w-5 h-5 text-teal-600 shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Capítulo anterior</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                        {prevChapter.number}. {prevChapter.title}
                      </span>
                    </div>
                  </button>
                ) : (
                  <div />
                )}

                {nextChapter ? (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveChapterId(nextChapter.id);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="flex items-center justify-end gap-3 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-teal-500 transition-all text-right"
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Siguiente capítulo</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                        {nextChapter.number}. {nextChapter.title}
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-teal-600 shrink-0" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("glosario");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="flex items-center justify-end gap-3 p-3 rounded-xl border border-teal-200 bg-teal-50/70 dark:bg-teal-950/30 hover:border-teal-500 transition-all text-right"
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase text-teal-600 block">Capítulo 17</span>
                      <span className="text-xs font-bold text-teal-900 dark:text-teal-200">
                        Explorar Glosario Oficial →
                      </span>
                    </div>
                  </button>
                )}
              </CardFooter>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: GLOSARIO INTERACTIVO (CAPÍTULO 17) */}
      {activeTab === "glosario" && (
        <Card className="border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="bg-slate-900 text-white p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-teal-400 block mb-1">
                Capítulo 17 del Manual
              </span>
              <h2 className="text-2xl font-black">Glosario Oficial aacomsoft</h2>
              <p className="text-sm text-slate-300 mt-1">
                Definiciones de siglas, módulos, coberturas e indicadores clave de la plataforma.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {["Todos", "Módulos", "Seguros y Coberturas", "Métricas y Procesos", "Tecnología"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setGlossaryCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    glossaryCategory === cat
                      ? "bg-teal-500 text-slate-950"
                      : "bg-white/10 text-slate-200 hover:bg-white/20"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <CardContent className="p-6 space-y-6">
            <div className="max-w-md relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={glossarySearch}
                onChange={(e) => setGlossarySearch(e.target.value)}
                placeholder="Filtrar término en el glosario (ej. PEA, Blindaje, UDI)..."
                className="pl-9"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matchingGlossary.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-teal-500/50 transition-all flex flex-col justify-between gap-3 shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-base font-black text-teal-700 dark:text-teal-400">
                        {item.term}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">
                      {item.meaning}
                    </p>
                  </div>

                  {item.relatedChapterId && (
                    <button
                      type="button"
                      onClick={() => navigateToSection(item.relatedChapterId!)}
                      className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline inline-flex items-center gap-1 self-start"
                    >
                      Ver capítulo relacionado <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: TICKETS DE SOPORTE Y DESARROLLOS A LA MEDIDA (CAPÍTULO 16) */}
      {activeTab === "ticket" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7">
            {ticketSuccess ? (
              <Card className="border-emerald-200 dark:border-emerald-900 shadow-sm p-8 text-center space-y-4">
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">¡Ticket Registrado!</h2>
                <p className="text-sm text-slate-600 dark:text-zinc-400 max-w-md mx-auto">
                  Nuestro equipo de soporte técnico de aacomsoft ha sido notificado y dará seguimiento a tu solicitud.
                </p>
                <Button
                  onClick={() => {
                    setTicketSuccess(false);
                    setSubject("");
                    setDescription("");
                    setContactPhone("");
                    setFile(null);
                  }}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  Levantar otro ticket
                </Button>
              </Card>
            ) : (
              <Card className="border-slate-200 dark:border-zinc-800 shadow-sm">
                <form onSubmit={handleTicketSubmit}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <LifeBuoy className="w-5 h-5 text-teal-600" />
                      Levantar Nuevo Ticket
                    </CardTitle>
                    <CardDescription>
                      Reporta un problema técnico o solicita una cotización de desarrollo a la medida para tu promotoría.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
                        Asunto del Problema o Solicitud *
                      </label>
                      <Input
                        placeholder="Ej. Duda sobre importación de Excel en Mi Cartera / Cotizar módulo especial"
                        required
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
                        Descripción detallada *
                      </label>
                      <Textarea
                        placeholder="Describe qué hacías, en qué pantalla estabas y qué mensaje apareció..."
                        className="min-h-[150px]"
                        required
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        onPaste={(e) => {
                          const items = e.clipboardData?.items;
                          if (!items) return;
                          for (let i = 0; i < items.length; i++) {
                            if (items[i].type.indexOf("image") !== -1) {
                              const blob = items[i].getAsFile();
                              if (blob) setFile(blob);
                            }
                          }
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-teal-600" /> Adjuntar Captura de Pantalla (Opcional)
                      </label>

                      {file ? (
                        <div className="relative inline-block mt-2 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 bg-slate-50 dark:bg-zinc-900 w-fit">
                          <img
                            src={URL.createObjectURL(file)}
                            alt="Preview"
                            className="h-32 object-contain rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => setFile(null)}
                            className="absolute -top-3 -right-3 bg-rose-500 text-white rounded-full p-1.5 shadow hover:bg-rose-600 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="mt-2">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="cursor-pointer"
                          />
                          <p className="text-xs text-slate-500 mt-2">
                            💡 <strong>Consejo:</strong> Puedes tomar una captura de pantalla y pegarla directamente con{" "}
                            <strong>Ctrl + V</strong> en el cuadro de descripción.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
                        Número de Contacto (WhatsApp / Teléfono) *
                      </label>
                      <Input
                        type="tel"
                        placeholder="Ej. 55 1234 5678"
                        required
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="bg-slate-50 dark:bg-zinc-900/50 flex justify-end p-4 rounded-b-xl border-t border-slate-100 dark:border-zinc-800">
                    <Button
                      type="submit"
                      disabled={loadingTicket}
                      className="bg-teal-600 hover:bg-teal-700 text-white font-bold"
                    >
                      {loadingTicket ? (
                        "Enviando..."
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Enviar Ticket
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            )}
          </div>

          {/* MIS TICKETS LIST */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="border-slate-200 dark:border-zinc-800 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-600" />
                  Mis Tickets Recientes
                </CardTitle>
                <CardDescription className="text-xs">
                  Historial y estado de tus solicitudes enviadas a soporte.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {loadingMyTickets ? (
                  <p className="text-xs text-slate-500 py-4 text-center">Cargando tus tickets...</p>
                ) : myTickets.length === 0 ? (
                  <div className="p-6 rounded-xl bg-slate-50 dark:bg-zinc-900 text-center space-y-1">
                    <p className="text-xs font-semibold text-slate-600 dark:text-zinc-300">
                      Aún no has levantado tickets
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Cuando envíes una solicitud aparecerá aquí con su estatus.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                    {myTickets.map((t) => (
                      <div
                        key={t.id}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">{t.subject}</h4>
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase shrink-0 ${
                              t.status === "OPEN"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            }`}
                          >
                            {t.status === "OPEN" ? "En Revisión" : "Resuelto"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2">{t.description}</p>
                        <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                          <span>{new Date(t.createdAt).toLocaleDateString("es-MX")}</span>
                          {t.imageUrl && (
                            <a
                              href={t.imageUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-teal-600 hover:underline font-semibold"
                            >
                              Ver captura adjunta
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL FOR FULL-SCREEN SCREENSHOTS */}
      {lightboxFigure && (
        <div
          onClick={() => setLightboxFigure(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-6xl w-full bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl"
          >
            <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4">
              <p className="text-xs md:text-sm font-bold text-white truncate">{lightboxFigure.caption}</p>
              <button
                type="button"
                onClick={() => setLightboxFigure(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center max-h-[82vh] overflow-auto bg-black">
              <img
                src={lightboxFigure.src}
                alt={lightboxFigure.caption}
                className="max-h-[76vh] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

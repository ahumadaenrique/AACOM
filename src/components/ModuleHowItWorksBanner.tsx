"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Play,
  X,
  Sparkles,
  CheckCircle2,
  Clock,
  BookOpen,
  ChevronUp,
  Film,
} from "lucide-react";
import {
  getManualVideoForPathname,
  ManualVideoItem,
} from "@/lib/manualVideosCatalog";

export function ModuleHowItWorksBanner() {
  const pathname = usePathname() || "/";
  const video = getManualVideoForPathname(pathname);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (!video) return;
    try {
      const saved = localStorage.getItem(`aacomsoft_asi_funciono_min_${video.key}`);
      setIsMinimized(saved === "1");
    } catch {
      setIsMinimized(false);
    }
  }, [video]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isModalOpen]);

  if (!video) return null;

  const toggleMinimize = (min: boolean) => {
    setIsMinimized(min);
    try {
      localStorage.setItem(`aacomsoft_asi_funciono_min_${video.key}`, min ? "1" : "0");
    } catch {
      // ignore storage errors
    }
  };

  return (
    <>
      {isMinimized ? (
        <div className="flex justify-end -mb-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/90 dark:bg-zinc-900 border border-teal-500/30 px-3 py-1 text-xs text-white shadow-sm hover:border-teal-400 transition-all">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 font-bold text-teal-300 hover:text-teal-200"
            >
              <Play className="w-3.5 h-3.5 fill-teal-400 text-teal-400" />
              <span>Así funciono</span>
              <span className="text-[10px] font-mono text-slate-300 bg-white/10 px-1.5 py-0.5 rounded-full">
                {video.duration}
              </span>
            </button>
            <button
              type="button"
              onClick={() => toggleMinimize(false)}
              title="Mostrar barra de ayuda del módulo"
              className="text-slate-400 hover:text-white pl-1 border-l border-white/10"
            >
              <ChevronUp className="w-3.5 h-3.5 rotate-180" />
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-teal-950 text-white px-4 py-2.5 shadow-sm border border-teal-500/25 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 hover:bg-teal-500/30 border border-teal-400/40 text-teal-300 text-xs font-black tracking-wide shrink-0 transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-teal-300 text-teal-300" />
              Así funciono
            </button>

            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-white truncate">
                {video.shortModuleTitle}
                <span className="hidden md:inline font-normal text-slate-300 ml-2">
                  — {video.subtitle}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs transition-all shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-slate-950" />
              Ver video ({video.duration})
            </button>

            <Link
              href={`/support?tab=aprende&video=${video.key}`}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold transition-all"
            >
              <Film className="w-3.5 h-3.5 text-teal-300" />
              Aprende tú mismo
            </Link>

            <button
              type="button"
              onClick={() => toggleMinimize(true)}
              title="Compactar aviso"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {isModalOpen && (
        <ManualVideoCinemaModal
          video={video}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}

export function ManualVideoCinemaModal({
  video,
  onClose,
}: {
  video: ManualVideoItem;
  onClose: () => void;
}) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-w-5xl w-full bg-slate-950 rounded-3xl border border-teal-500/30 overflow-hidden shadow-2xl my-auto"
      >
        {/* Top Bar */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-slate-900 to-teal-950 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="px-2.5 py-1 rounded-lg bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-black shrink-0">
              🎬 Así funciono · Ep. {video.episodeNumber}
            </span>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-black text-white truncate">
                {video.title}
              </h3>
              <p className="text-xs text-slate-400 truncate hidden sm:block">
                {video.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline-flex items-center gap-1 text-xs font-mono bg-white/10 text-teal-300 px-2.5 py-1 rounded-lg">
              <Clock className="w-3.5 h-3.5" />
              {video.duration}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Native HTML5 Video Player streamed from Vercel Blob */}
        <div className="bg-black aspect-video w-full relative flex items-center justify-center">
          <video
            key={video.videoUrl}
            src={video.videoUrl}
            poster={video.posterUrl}
            controls
            autoPlay
            playsInline
            preload="metadata"
            className="w-full h-full object-contain max-h-[68vh]"
          />
        </div>

        {/* Highlights & Quick Actions Footer */}
        <div className="p-5 bg-slate-900/95 border-t border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="text-[11px] font-black uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Lo que aprenderás en este video:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
              {video.highlights.map((h, i) => (
                <div
                  key={i}
                  className="text-xs text-slate-300 flex items-start gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {video.manualChapterIds[0] && (
              <Link
                href={`/support?tab=manual&chapter=${video.manualChapterIds[0]}`}
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all"
              >
                <BookOpen className="w-3.5 h-3.5 text-teal-300" />
                Leer guía paso a paso
              </Link>
            )}
            <Link
              href="/support?tab=aprende"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black transition-all"
            >
              <Film className="w-3.5 h-3.5" />
              Ver todos en «Aprende tú mismo»
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

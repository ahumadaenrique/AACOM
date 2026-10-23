"use client";

import { useState, useMemo } from "react";
import { 
  Play, 
  Search, 
  Plus, 
  Youtube, 
  Sparkles, 
  Film, 
  Clock, 
  Filter, 
  Share2, 
  CheckCircle2, 
  ShieldCheck, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  X, 
  ExternalLink,
  BookOpen,
  GraduationCap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { extractYouTubeId, getYouTubeEmbedUrl, getYouTubeThumbnail } from "@/lib/youtube";
import { createAcademyVideo, updateAcademyVideo, deleteAcademyVideo } from "./actions";

interface VideoItem {
  id: string;
  title: string;
  description: string | null;
  youtubeUrl: string;
  youtubeId: string;
  thumbnailUrl: string | null;
  category: string;
  duration: string | null;
  order: number;
  active: boolean;
  isAacomOfficial: boolean;
  agencyId: string;
  isFromCurrentAgency: boolean;
  createdAt: Date | string;
  createdBy?: { id: string; name: string | null; email: string | null } | null;
  agency?: { id: string; name: string; slug: string } | null;
}

interface Props {
  initialVideos: VideoItem[];
  canManage: boolean;
  isSuperAdmin: boolean;
  userAgencyId: string;
  agencyName: string;
  hasSharedAacomVideos: boolean;
}

export function AcademyVideosClient({
  initialVideos,
  canManage,
  isSuperAdmin,
  userAgencyId,
  agencyName,
  hasSharedAacomVideos,
}: Props) {
  const [videos, setVideos] = useState<VideoItem[]>(initialVideos);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [agencyTab, setAgencyTab] = useState<"ALL" | "MINE" | "AACOM">("ALL");

  // Cinema Player Modal
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);

  // Upload / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState("");
  const [formYoutubeUrl, setFormYoutubeUrl] = useState("");
  const [formCategory, setFormCategory] = useState("Ventas");
  const [formDuration, setFormDuration] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formThumbnailUrl, setFormThumbnailUrl] = useState("");
  const [formIsOfficial, setFormIsOfficial] = useState(false);

  // Live YouTube preview during upload
  const detectedYoutubeId = useMemo(() => {
    return extractYouTubeId(formYoutubeUrl);
  }, [formYoutubeUrl]);

  // Dynamic categories
  const categories = useMemo(() => {
    const defaultCats = ["Ventas", "Objeciones", "Prospección", "Productos", "Cierres", "Herramientas"];
    const found = Array.from(new Set(videos.map(v => v.category).filter(Boolean)));
    const merged = Array.from(new Set([...defaultCats, ...found]));
    return merged;
  }, [videos]);

  // Filtered list
  const filteredVideos = useMemo(() => {
    return videos.filter((video) => {
      // Search filter
      const matchesSearch =
        !searchTerm ||
        video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (video.description && video.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        video.category.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // Category filter
      if (selectedCategory !== "ALL" && video.category !== selectedCategory) {
        return false;
      }

      // Agency source filter
      if (agencyTab === "MINE" && !video.isFromCurrentAgency) {
        return false;
      }
      if (agencyTab === "AACOM" && !video.isAacomOfficial) {
        return false;
      }

      return true;
    });
  }, [videos, searchTerm, selectedCategory, agencyTab]);

  const handleOpenCreateModal = () => {
    setEditingVideo(null);
    setFormTitle("");
    setFormYoutubeUrl("");
    setFormCategory("Ventas");
    setFormDuration("");
    setFormDescription("");
    setFormThumbnailUrl("");
    setFormIsOfficial(isSuperAdmin || userAgencyId === "aacom");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (video: VideoItem) => {
    setEditingVideo(video);
    setFormTitle(video.title);
    setFormYoutubeUrl(video.youtubeUrl);
    setFormCategory(video.category || "General");
    setFormDuration(video.duration || "");
    setFormDescription(video.description || "");
    setFormThumbnailUrl(video.thumbnailUrl || "");
    setFormIsOfficial(video.isAacomOfficial);
    setIsModalOpen(true);
  };

  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert("Por favor ingresa un título para el video.");
      return;
    }

    if (!detectedYoutubeId) {
      alert("⚠️ Enlace no válido: Debes ingresar un enlace válido de YouTube (ej. https://www.youtube.com/watch?v=... o https://youtu.be/...).");
      return;
    }

    try {
      setSaving(true);
      if (editingVideo) {
        const res = await updateAcademyVideo(editingVideo.id, {
          title: formTitle,
          youtubeUrl: formYoutubeUrl,
          category: formCategory,
          duration: formDuration,
          description: formDescription,
          thumbnailUrl: formThumbnailUrl || undefined,
          isAacomOfficial: formIsOfficial,
        });
        if (res.success && res.video) {
          setVideos((prev) =>
            prev.map((v) =>
              v.id === editingVideo.id
                ? {
                    ...v,
                    title: res.video.title,
                    youtubeUrl: res.video.youtubeUrl,
                    youtubeId: res.video.youtubeId,
                    thumbnailUrl: res.video.thumbnailUrl,
                    category: res.video.category,
                    duration: res.video.duration,
                    description: res.video.description,
                    isAacomOfficial: res.video.isAacomOfficial,
                  }
                : v
            )
          );
        }
      } else {
        const res = await createAcademyVideo({
          title: formTitle,
          youtubeUrl: formYoutubeUrl,
          category: formCategory,
          duration: formDuration,
          description: formDescription,
          thumbnailUrl: formThumbnailUrl || undefined,
          isAacomOfficial: formIsOfficial,
        });
        if (res.success && res.video) {
          const newVid: VideoItem = {
            ...res.video,
            isFromCurrentAgency: true,
            agency: { id: userAgencyId, name: agencyName, slug: "" },
            createdBy: null,
          };
          setVideos((prev) => [newVid, ...prev]);
        }
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert("Error al guardar video: " + (err.message || "Error"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el video "${title}"?`)) {
      return;
    }

    try {
      setDeletingId(id);
      await deleteAcademyVideo(id);
      setVideos((prev) => prev.filter((v) => v.id !== id));
      if (activeVideo?.id === id) {
        setActiveVideo(null);
      }
    } catch (err: any) {
      alert("Error al eliminar video: " + (err.message || "Error"));
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (video: VideoItem) => {
    try {
      const nextActive = !video.active;
      await updateAcademyVideo(video.id, { active: nextActive });
      setVideos((prev) =>
        prev.map((v) => (v.id === video.id ? { ...v, active: nextActive } : v))
      );
    } catch (err: any) {
      alert("Error al cambiar estado del video: " + (err.message || "Error"));
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 px-4 md:px-6">
      {/* Top Banner / Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-600 via-rose-700 to-indigo-900 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute -right-8 -top-8 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md text-white border border-white/30">
                <Youtube className="w-4 h-4 text-red-300" />
                Videos & Capacitación
              </span>
              <span className="text-xs text-white/80 font-semibold">
                • {agencyName}
              </span>
            </div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white flex items-center gap-2">
              E-Learning
            </h1>
            <p className="text-sm md:text-base text-white/90 max-w-2xl font-medium">
              Videos oficiales, cápsulas de capacitación y mejores prácticas para el éxito de tus asesores.
            </p>
          </div>

          {canManage && (
            <div className="flex-shrink-0">
              <Button
                onClick={handleOpenCreateModal}
                className="bg-white text-rose-700 hover:bg-rose-50 font-black shadow-lg hover:shadow-xl transition-all h-11 px-5 rounded-2xl flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Subir Video (YouTube)
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Control Bar: Search & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título, tema o palabras clave..."
            className="pl-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sm focus:ring-rose-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Agency Source Filter (Only shown if agency has shared AACOM videos) */}
        {hasSharedAacomVideos && userAgencyId !== "aacom" && (
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => setAgencyTab("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                agencyTab === "ALL"
                  ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Todos ({videos.length})
            </button>
            <button
              onClick={() => setAgencyTab("MINE")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                agencyTab === "MINE"
                  ? "bg-white dark:bg-slate-900 text-rose-600 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              {agencyName} ({videos.filter((v) => v.isFromCurrentAgency).length})
            </button>
            <button
              onClick={() => setAgencyTab("AACOM")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                agencyTab === "AACOM"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              Biblioteca Compartida ({videos.filter((v) => v.isAacomOfficial).length})
            </button>
          </div>
        )}
      </div>

      {/* Category Pills (YouTube Chips Style) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedCategory("ALL")}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            selectedCategory === "ALL"
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow"
              : "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          Todo el Contenido
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Videos Grid */}
      {filteredVideos.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Film className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">
            No se encontraron videos
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            {searchTerm || selectedCategory !== "ALL"
              ? "Prueba cambiando los filtros o el término de búsqueda."
              : "Aún no se han subido videos a esta sección. Como administrador puedes subir los primeros tutoriales de YouTube."}
          </p>
          {canManage && (
            <Button
              onClick={handleOpenCreateModal}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" /> Subir Primer Video
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredVideos.map((video) => {
            const thumb = video.thumbnailUrl || getYouTubeThumbnail(video.youtubeId, "hq");
            const canEditThis = canManage && (isSuperAdmin || video.isFromCurrentAgency);

            return (
              <div
                key={video.id}
                className="group flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* 16:9 Thumbnail Container */}
                <div
                  onClick={() => setActiveVideo(video)}
                  className="relative aspect-video w-full bg-slate-900 cursor-pointer overflow-hidden"
                >
                  <img
                    src={thumb}
                    alt=""
                    aria-hidden="true"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      const img = e.currentTarget;
                      const current = img.src || "";
                      if (!current.includes("i.ytimg.com")) {
                        img.src = `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`;
                      } else if (!current.includes("mqdefault")) {
                        img.src = `https://i.ytimg.com/vi/${video.youtubeId}/mqdefault.jpg`;
                      } else if (!current.includes("img.youtube.com")) {
                        img.src = `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;
                      } else {
                        // Si YouTube no tiene miniatura, ocultar limpiamente la imagen rota para evitar textos desbordados
                        img.style.display = "none";
                      }
                    }}
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-60 group-hover:opacity-80 transition-opacity" />

                  {/* Play Button Icon on Hover */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-red-600 transition-all duration-300">
                      <Play className="w-5 h-5 fill-white translate-x-0.5" />
                    </div>
                  </div>

                  {/* Duration Badge */}
                  {video.duration && (
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-[11px] font-black text-white flex items-center gap-1 shadow">
                      <Clock className="w-3 h-3 text-slate-300" />
                      {video.duration}
                    </div>
                  )}

                  {/* Category Pill */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-black uppercase tracking-wider text-white border border-white/20">
                    {video.category}
                  </div>

                  {/* AACOM Official Badge */}
                  {video.isAacomOfficial && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-indigo-600/90 backdrop-blur-md text-[10px] font-black text-white flex items-center gap-1 shadow">
                      <ShieldCheck className="w-3 h-3" />
                      Contenido Compartido
                    </div>
                  )}

                  {/* Inactive Banner */}
                  {!video.active && (
                    <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center">
                      <span className="px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-lg shadow">
                        Video Oculto
                      </span>
                    </div>
                  )}
                </div>

                {/* Video Info Body */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        onClick={() => setActiveVideo(video)}
                        className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 cursor-pointer hover:text-rose-600 dark:hover:text-rose-400 transition-colors leading-snug"
                        title={video.title}
                      >
                        {video.title}
                      </h3>

                      {canEditThis && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-slate-400 hover:text-slate-600 -mr-1"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem
                              onClick={() => handleOpenEditModal(video)}
                              className="cursor-pointer text-xs"
                            >
                              <Edit3 className="w-3.5 h-3.5 mr-2 text-indigo-600" />
                              Editar Video
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleActive(video)}
                              className="cursor-pointer text-xs"
                            >
                              {video.active ? (
                                <>
                                  <EyeOff className="w-3.5 h-3.5 mr-2 text-amber-600" />
                                  Ocultar Video
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3.5 h-3.5 mr-2 text-emerald-600" />
                                  Publicar Video
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(video.id, video.title)}
                              className="cursor-pointer text-xs text-red-600 focus:text-red-600 focus:bg-red-50"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>

                    {video.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {video.description}
                      </p>
                    )}
                  </div>

                  {/* Channel / Promotoría Footer */}
                  <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-600 dark:text-slate-400 truncate">
                      {video.agency?.name || agencyName}
                    </span>
                    <button
                      onClick={() => setActiveVideo(video)}
                      className="text-rose-600 font-bold hover:underline flex items-center gap-1 shrink-0"
                    >
                      Ver video <Play className="w-2.5 h-2.5 fill-rose-600" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CINEMA VIDEO MODAL (Interactive Player) */}
      <Dialog
        open={Boolean(activeVideo)}
        onOpenChange={(open) => !open && setActiveVideo(null)}
      >
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-slate-950 border-slate-800 text-white rounded-3xl">
          {activeVideo && (
            <div>
              {/* Responsive 16:9 Video Embed */}
              <div className="relative aspect-video w-full bg-black">
                <iframe
                  src={getYouTubeEmbedUrl(activeVideo.youtubeId)}
                  title={activeVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>

              {/* Video Details in Modal */}
              <div className="p-6 space-y-4 max-h-60 overflow-y-auto">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-rose-600 text-white font-bold border-0">
                      {activeVideo.category}
                    </Badge>
                    {activeVideo.isAacomOfficial && (
                      <Badge className="bg-indigo-600 text-white font-bold border-0 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Contenido Compartido
                      </Badge>
                    )}
                    {activeVideo.duration && (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {activeVideo.duration}
                      </span>
                    )}
                  </div>

                  <a
                    href={activeVideo.youtubeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    Ver en YouTube <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <h2 className="text-xl md:text-2xl font-black text-white leading-tight">
                  {activeVideo.title}
                </h2>

                {activeVideo.description && (
                  <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {activeVideo.description}
                  </p>
                )}

                <div className="pt-2 text-xs text-slate-500 flex items-center gap-2">
                  <span>Promotoría: {activeVideo.agency?.name || agencyName}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* UPLOAD / EDIT VIDEO MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Youtube className="w-6 h-6 text-red-600" />
              {editingVideo ? "Editar Video de E-Learning" : "Subir Nuevo Video a E-Learning"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Por políticas de almacenamiento, todos los videos deben provenir de tu canal de YouTube (públicos u ocultos/unlisted).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveVideo} className="space-y-4 pt-2">
            {/* YouTube URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Enlace de YouTube <span className="text-rose-600">*</span>
              </label>
              <Input
                value={formYoutubeUrl}
                onChange={(e) => setFormYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... o https://youtu.be/..."
                required
                className="h-10 rounded-xl text-sm"
              />
              <span className="text-[11px] text-slate-400 block">
                Soporta videos normales, ocultos (unlisted) y Shorts.
              </span>
            </div>

            {/* Live YouTube Preview Card */}
            {detectedYoutubeId ? (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-3">
                <img
                  src={getYouTubeThumbnail(detectedYoutubeId, "hq")}
                  alt="Vista previa"
                  referrerPolicy="no-referrer"
                  className="w-20 aspect-video object-cover rounded-lg shadow-sm"
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (!img.src.includes("img.youtube.com")) {
                      img.src = `https://img.youtube.com/vi/${detectedYoutubeId}/hqdefault.jpg`;
                    }
                  }}
                />
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> ID detectado: {detectedYoutubeId}
                  </span>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-300 truncate mt-0.5">
                    Miniatura oficial de YouTube lista para importar
                  </p>
                </div>
              </div>
            ) : formYoutubeUrl.trim().length > 5 ? (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl text-[11px] text-rose-600 font-medium">
                ⚠️ Enlace no reconocido. Asegúrate de que sea un enlace válido de YouTube.
              </div>
            ) : null}

            {/* Video Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Título Llamativo del Video <span className="text-rose-600">*</span>
              </label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Ej. Cómo Rebatir 'No Tengo Dinero' en 3 Pasos"
                required
                className="h-10 rounded-xl text-sm font-semibold"
              />
            </div>

            {/* Category & Duration */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Categoría / Módulo
                </label>
                <Input
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  placeholder="Ej. Ventas, Objeciones..."
                  list="category-suggestions"
                  className="h-10 rounded-xl text-sm"
                />
                <datalist id="category-suggestions">
                  {categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Duración Estimada
                </label>
                <Input
                  value={formDuration}
                  onChange={(e) => setFormDuration(e.target.value)}
                  placeholder="Ej. 12:45 o 15 min"
                  className="h-10 rounded-xl text-sm"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Descripción / Notas Clave (Opcional)
              </label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={3}
                placeholder="Explica brevemente los aprendizajes clave de este video..."
                className="w-full text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* Super Admin / AACOM Official Flag */}
            {(isSuperAdmin || userAgencyId === "aacom") && (
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-2xl flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    Contenido Compartido con Otras Agencias
                  </span>
                  <p className="text-[10px] text-indigo-600 dark:text-indigo-400">
                    Si se marca, estará disponible en la biblioteca compartida para las promotorías autorizadas.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formIsOfficial}
                  onChange={(e) => setFormIsOfficial(e.target.checked)}
                  className="h-5 w-5 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>
            )}

            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving || !detectedYoutubeId}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl"
              >
                {saving ? "Guardando..." : editingVideo ? "Actualizar Video" : "Publicar Video"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

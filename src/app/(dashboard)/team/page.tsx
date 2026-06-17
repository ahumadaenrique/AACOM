"use client";

import React, { useState, useEffect } from "react";
import { getTeamDirectory, updateUserProfileDetails, getCurrentUser } from "@/app/actions";
import { resolveImageUrl } from "@/lib/utils";
import {
    Search,
    Mail,
    Phone,
    Calendar,
    Users,
    Instagram,
    Facebook,
    Linkedin,
    Twitter,
    BookOpen,
    Smile,
    Shield,
    X,
    Loader2,
    Edit3,
    Check,
    Briefcase,
    Sparkles,
    Cake
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface UserProfile {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    image: string | null;
    birthDate: string | null;
    role: string;
    active: boolean;
    instagram: string | null;
    facebook: string | null;
    linkedin: string | null;
    twitter: string | null;
    insurances: string | null;
    favoriteBook: string | null;
    hobby: string | null;
}

export default function TeamDirectoryPage() {
    const [team, setTeam] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [currentUser, setCurrentUser] = useState<{ id: string; name: string | null; email: string; role: string } | null>(null);
    
    // Edit Form State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<{
        name: string;
        email: string;
        phone: string;
        birthDate: string;
        image: string;
        instagram: string;
        facebook: string;
        linkedin: string;
        twitter: string;
        insurances: string;
        favoriteBook: string;
        hobby: string;
    }>({
        name: "",
        email: "",
        phone: "",
        birthDate: "",
        image: "",
        instagram: "",
        facebook: "",
        linkedin: "",
        twitter: "",
        insurances: "",
        favoriteBook: "",
        hobby: ""
    });
    
    const [updating, setUpdating] = useState(false);
    const [formMsg, setFormMsg] = useState("");

    const loadData = async () => {
        try {
            setLoading(true);
            const teamRes = await getTeamDirectory();
            const userRes = await getCurrentUser();
            
            if (teamRes.success && teamRes.users) {
                setTeam(teamRes.users as any);
            }
            if (userRes.success && userRes.user) {
                setCurrentUser(userRes.user);
            }
        } catch (err) {
            console.error("Error loading team data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const openUserProfile = (user: UserProfile) => {
        setSelectedUser(user);
        setIsEditing(false);
        setFormMsg("");
        
        // Extract birthDate in YYYY-MM-DD for form input
        let bDateStr = "";
        if (user.birthDate) {
            try {
                bDateStr = new Date(user.birthDate).toISOString().split("T")[0];
            } catch (e) {
                console.error(e);
            }
        }

        setEditForm({
            name: user.name || "",
            email: user.email || "",
            phone: user.phone || "",
            birthDate: bDateStr,
            image: user.image || "",
            instagram: user.instagram || "",
            facebook: user.facebook || "",
            linkedin: user.linkedin || "",
            twitter: user.twitter || "",
            insurances: user.insurances || "",
            favoriteBook: user.favoriteBook || "",
            hobby: user.hobby || ""
        });
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;
        
        try {
            setUpdating(true);
            setFormMsg("Guardando cambios...");
            
            const payload: any = {
                instagram: editForm.instagram,
                facebook: editForm.facebook,
                linkedin: editForm.linkedin,
                twitter: editForm.twitter,
                insurances: editForm.insurances,
                favoriteBook: editForm.favoriteBook,
                hobby: editForm.hobby
            };

            // Only send administrative fields if admin
            if ((currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN')) {
                payload.name = editForm.name;
                payload.email = editForm.email;
                payload.phone = editForm.phone;
                payload.image = editForm.image;
                payload.birthDate = editForm.birthDate || null;
            }

            const res = await updateUserProfileDetails(selectedUser.id, payload);
            
            // Protección contra respuestas vacías (ej: cuando Vercel corta la petición por límite de tamaño)
            if (!res) {
                setFormMsg("Error: La imagen es demasiado pesada para el servidor o la conexión falló.");
                setUpdating(false);
                return;
            }

            if (res.success && res.user) {
                setFormMsg("¡Guardado con éxito!");
                
                // Update local lists
                setTeam(prev => prev.map(u => u.id === selectedUser.id ? { ...u, ...res.user } as UserProfile : u));
                setSelectedUser({ ...selectedUser, ...res.user } as UserProfile);
                setIsEditing(false);
            } else {
                setFormMsg(res.message || "Error al actualizar perfil");
            }
        } catch (err: any) {
            console.error(err);
            setFormMsg(err.message || "Error en el servidor");
        } finally {
            setUpdating(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert("La imagen excede los 2 MB de tamaño permitido.");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            setEditForm(prev => ({ ...prev, image: base64 }));
        };
        reader.readAsDataURL(file);
    };

    // Filter team list
    const filteredTeam = team.filter(user => {
        const query = search.toLowerCase();
        const nameMatch = (user.name || "").toLowerCase().includes(query);
        const emailMatch = user.email.toLowerCase().includes(query);
        const insuranceMatch = (user.insurances || "").toLowerCase().includes(query);
        return nameMatch || emailMatch || insuranceMatch;
    });

    const getInitials = (name: string | null, email: string) => {
        const display = name || email.split("@")[0];
        return display
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();
    };

    // Parse Birthday to format "02 de junio"
    const formatBirthday = (dateStr: string | null) => {
        if (!dateStr) return "No registrado";
        try {
            const date = new Date(dateStr);
            // Ignore timezones, display as saved
            const localDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
            return localDate.toLocaleDateString("es-MX", { day: "numeric", month: "long" });
        } catch (e) {
            return "No registrado";
        }
    };

    // Check if it is birthday today
    const isBirthdayToday = (dateStr: string | null) => {
        if (!dateStr) return false;
        try {
            const date = new Date(dateStr);
            const today = new Date();
            return date.getUTCDate() === today.getDate() && date.getUTCMonth() === today.getMonth();
        } catch (e) {
            return false;
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="h-12 w-12 text-teal-600 animate-spin" />
                <p className="text-sm text-muted-foreground font-semibold">Cargando directorio del Equipo AACOM...</p>
            </div>
        );
    }

    const isAuthorizedToEdit = selectedUser && (
        (currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN') || currentUser?.id === selectedUser.id
    );

    return (
        <div className="flex flex-col gap-8 w-full max-w-lg mx-auto py-4 md:max-w-6xl md:px-0">
            {/* HEADER AREA */}
            <div className="flex flex-col gap-2 px-4 md:px-0">
                <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100">
                        Equipo AACOM
                    </h1>
                    <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider dark:bg-indigo-900/40 dark:text-indigo-400">
                        Directorio
                    </span>
                </div>
                <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-indigo-500" />
                    Conoce e interactúa con el equipo de promotores, agentes y staff de AACOM Seguros.
                </p>
            </div>

            {/* SEARCH AREA */}
            <div className="px-4 md:px-0">
                <div className="relative w-full md:max-w-md">
                    <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input 
                        type="text"
                        placeholder="Buscar por nombre, correo o aseguradora..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-card border border-slate-200 dark:border-zinc-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 shadow-sm text-slate-800 dark:text-zinc-200 placeholder-slate-400 transition-all"
                    />
                </div>
            </div>

            {/* TEAM DIRECTORY GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 px-4 md:px-0">
                {filteredTeam.length > 0 ? (
                    filteredTeam.map((user) => {
                        const isBirthday = isBirthdayToday(user.birthDate);
                        const resolvedImg = resolveImageUrl(user.image);
                        
                        return (
                            <div 
                                key={user.id}
                                onClick={() => openUserProfile(user)}
                                className={`group rounded-2xl border bg-card hover:bg-slate-50/40 dark:hover:bg-zinc-900/10 p-5 flex flex-col items-center text-center cursor-pointer transition-all duration-300 hover:scale-[1.02] shadow-md relative overflow-hidden ${
                                    isBirthday ? "border-yellow-400 dark:border-yellow-600 shadow-yellow-100 dark:shadow-yellow-950/15" : "border-slate-100 dark:border-zinc-800/80"
                                }`}
                            >
                                {/* Birthday Flag */}
                                {isBirthday && (
                                    <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm uppercase tracking-wider animate-pulse">
                                        <Cake className="h-3 w-3" /> Hoy Cumple
                                    </div>
                                )}

                                {/* User Image */}
                                <div className="relative mt-2 mb-4">
                                    <div className={`h-20 w-20 rounded-full overflow-hidden shrink-0 border-2 bg-slate-50 dark:bg-zinc-950 flex items-center justify-center transition-all ${
                                        isBirthday ? "border-yellow-400 ring-2 ring-yellow-400/20" : "border-slate-100 dark:border-zinc-800"
                                    }`}>
                                        {user.image ? (
                                            <img 
                                                src={resolvedImg} 
                                                alt={user.name || "Agente"} 
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="h-full w-full bg-gradient-to-tr from-indigo-500 to-teal-600 text-white text-2xl font-black flex items-center justify-center">
                                                {getInitials(user.name, user.email)}
                                            </div>
                                        )}
                                    </div>
                                    <div className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center shadow border border-white ${
                                        (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') ? 'bg-amber-500 text-white' : 'bg-teal-600 text-white'
                                    }`} title={user.role}>
                                        <Shield className="h-3 w-3" />
                                    </div>
                                </div>

                                {/* User Details */}
                                <div className="space-y-1.5 w-full">
                                    <h3 className="text-sm font-black text-slate-800 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                                        {user.name || user.email.split("@")[0]}
                                    </h3>
                                    <span className={`inline-block text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                                        (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400' : 'bg-teal-100 text-teal-800 dark:bg-teal-950/30 dark:text-teal-400'
                                    }`}>
                                        {user.role}
                                    </span>

                                    <div className="pt-2 flex flex-col gap-1 text-[11px] text-slate-500 dark:text-zinc-400 font-semibold items-center justify-center">
                                        <span className="flex items-center gap-1.5 hover:text-indigo-600 truncate max-w-full">
                                            <Mail className="h-3 w-3 shrink-0" />
                                            <span className="truncate">{user.email}</span>
                                        </span>
                                        {user.phone && (
                                            <span className="flex items-center gap-1.5 hover:text-indigo-600">
                                                <Phone className="h-3 w-3 shrink-0" />
                                                <span>{user.phone}</span>
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Insurance list abbreviated */}
                                {user.insurances && (
                                    <div className="mt-4 pt-3 border-t w-full border-slate-100 dark:border-zinc-800/80 flex flex-wrap items-center justify-center gap-1">
                                        {user.insurances.split(",").slice(0, 3).map((ins, idx) => (
                                            <span 
                                                key={idx}
                                                className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide truncate max-w-[70px]"
                                            >
                                                {ins.trim()}
                                            </span>
                                        ))}
                                        {user.insurances.split(",").length > 3 && (
                                            <span className="text-[8px] text-indigo-500 font-extrabold">+{user.insurances.split(",").length - 3}</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="col-span-full py-12 bg-card rounded-2xl border text-center text-muted-foreground font-semibold text-xs shadow-inner">
                        No se encontraron integrantes que coincidan con tu búsqueda.
                    </div>
                )}
            </div>

            {/* MODAL / DRAWER DETAIL INMERSIVO */}
            {selectedUser && (
                <div 
                    onClick={() => setSelectedUser(null)}
                    className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-300 overflow-y-auto"
                >
                    <div 
                        onClick={(e) => e.stopPropagation()}
                        className="bg-card w-full max-w-2xl rounded-3xl border border-slate-200/50 dark:border-zinc-800 shadow-2xl relative overflow-hidden my-auto"
                    >
                        {/* Close Modal Button */}
                        <button 
                            onClick={() => setSelectedUser(null)}
                            className="absolute top-4 right-4 z-10 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 p-2 rounded-full transition-colors shadow-sm"
                            title="Cerrar"
                        >
                            <X className="h-4 w-4" />
                        </button>

                        <form onSubmit={handleSaveProfile}>
                            {/* Modal Header */}
                            <div className="bg-gradient-to-r from-indigo-50/50 via-slate-50/30 to-teal-50/40 dark:from-indigo-950/15 dark:to-teal-950/10 px-6 pt-8 pb-6 border-b border-slate-100 dark:border-zinc-800/80 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                                {/* Profile Picture inside modal */}
                                <div className="relative">
                                    <div className="h-24 w-24 rounded-full overflow-hidden shrink-0 border-4 border-white dark:border-zinc-900 shadow-lg flex items-center justify-center bg-slate-50 dark:bg-zinc-950">
                                        {editForm.image ? (
                                            <img 
                                                src={resolveImageUrl(editForm.image)} 
                                                alt="Preview" 
                                                className="h-full w-full object-cover"
                                            />
                                        ) : selectedUser.image ? (
                                            <img 
                                                src={resolveImageUrl(selectedUser.image)} 
                                                alt={selectedUser.name || "Agente"} 
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="h-full w-full bg-gradient-to-tr from-indigo-500 to-teal-600 text-white text-3xl font-black flex items-center justify-center">
                                                {getInitials(selectedUser.name, selectedUser.email)}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Upload Button overlay only if Admin is editing */}
                                    {isEditing && (currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN') && (
                                        <label className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center text-[8px] font-black text-white uppercase tracking-wider cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                                            <span>Subir</span>
                                            <span>Foto</span>
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                onChange={handleImageChange}
                                                className="hidden" 
                                            />
                                        </label>
                                    )}
                                </div>

                                <div className="flex-1 space-y-1.5">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
                                        {isEditing && (currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN') ? (
                                            <input 
                                                type="text" 
                                                value={editForm.name} 
                                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                className="bg-background border border-slate-300 dark:border-zinc-700 rounded-lg px-2 py-1 text-sm font-black w-full sm:max-w-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                                required
                                            />
                                        ) : (
                                            <h2 className="text-xl font-black text-slate-800 dark:text-zinc-100 flex items-center gap-1.5 justify-center sm:justify-start">
                                                {selectedUser.name || selectedUser.email.split("@")[0]}
                                                {isBirthdayToday(selectedUser.birthDate) && (
                                                    <span className="text-lg animate-bounce">🎂</span>
                                                )}
                                            </h2>
                                        )}
                                        <span className={`w-fit mx-auto sm:mx-0 text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                                            selected(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400' : 'bg-teal-100 text-teal-800 dark:bg-teal-950/30 dark:text-teal-400'
                                        }`}>
                                            {selectedUser.role}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5 justify-center sm:justify-start">
                                        <Briefcase className="h-3.5 w-3.5 text-indigo-500" />
                                        Miembro de AACOM Seguros
                                    </p>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 space-y-6 max-h-[50vh] overflow-y-auto">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* CORE INFO */}
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-black text-slate-700 dark:text-zinc-300 uppercase tracking-wider border-b pb-1.5 flex items-center gap-1.5">
                                            <Mail className="h-3.5 w-3.5 text-indigo-500" /> Información de Contacto
                                        </h3>
                                        
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">Correo Electrónico</label>
                                                {isEditing && (currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN') ? (
                                                    <input 
                                                        type="email" 
                                                        value={editForm.email} 
                                                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                                        className="bg-background border border-slate-300 dark:border-zinc-700 rounded-lg px-2 py-1 text-xs font-semibold w-full focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                                        required
                                                    />
                                                ) : (
                                                    <a href={`mailto:${selectedUser.email}`} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline block break-all">
                                                        {selectedUser.email}
                                                    </a>
                                                )}
                                            </div>

                                            <div>
                                                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">Número Telefónico</label>
                                                {isEditing && (currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN') ? (
                                                    <input 
                                                        type="text" 
                                                        value={editForm.phone} 
                                                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                                        className="bg-background border border-slate-300 dark:border-zinc-700 rounded-lg px-2 py-1 text-xs font-semibold w-full focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                                        placeholder="Ej: +52 55 1234 5678"
                                                    />
                                                ) : (
                                                    selectedUser.phone ? (
                                                        <a href={`tel:${selectedUser.phone}`} className="text-xs font-bold text-slate-700 dark:text-zinc-200 hover:underline block">
                                                            {selectedUser.phone}
                                                        </a>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 dark:text-zinc-500 italic block">No registrado</span>
                                                    )
                                                )}
                                            </div>

                                            <div>
                                                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">Cumpleaños</label>
                                                {isEditing && (currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN') ? (
                                                    <input 
                                                        type="date" 
                                                        value={editForm.birthDate} 
                                                        onChange={(e) => setEditForm({ ...editForm, birthDate: e.target.value })}
                                                        className="bg-background border border-slate-300 dark:border-zinc-700 rounded-lg px-2 py-1 text-xs font-semibold w-full focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                                    />
                                                ) : (
                                                    <span className="text-xs font-bold text-slate-700 dark:text-zinc-200 flex items-center gap-1.5">
                                                        <Calendar className="h-3.5 w-3.5 text-teal-600" />
                                                        {formatBirthday(selectedUser.birthDate)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* SOCIAL NETWORKS */}
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-black text-slate-700 dark:text-zinc-300 uppercase tracking-wider border-b pb-1.5 flex items-center gap-1.5">
                                            <Instagram className="h-3.5 w-3.5 text-indigo-500" /> Redes Sociales
                                        </h3>

                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5 flex items-center gap-1">
                                                    <Instagram className="h-3 w-3 text-pink-500" /> Instagram
                                                </label>
                                                {isEditing ? (
                                                    <input 
                                                        type="text" 
                                                        value={editForm.instagram} 
                                                        onChange={(e) => setEditForm({ ...editForm, instagram: e.target.value })}
                                                        placeholder="Enlace o @usuario"
                                                        className="bg-background border border-slate-300 dark:border-zinc-700 rounded-lg px-2 py-1 text-xs font-semibold w-full focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                                    />
                                                ) : (
                                                    selectedUser.instagram ? (
                                                        <a href={selectedUser.instagram.startsWith("http") ? selectedUser.instagram : `https://instagram.com/${selectedUser.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                                                            Instagram <Sparkles className="h-3 w-3" />
                                                        </a>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 dark:text-zinc-500 italic block">No configurado</span>
                                                    )
                                                )}
                                            </div>

                                            <div>
                                                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5 flex items-center gap-1">
                                                    <Facebook className="h-3 w-3 text-blue-600" /> Facebook
                                                </label>
                                                {isEditing ? (
                                                    <input 
                                                        type="text" 
                                                        value={editForm.facebook} 
                                                        onChange={(e) => setEditForm({ ...editForm, facebook: e.target.value })}
                                                        placeholder="Enlace de perfil"
                                                        className="bg-background border border-slate-300 dark:border-zinc-700 rounded-lg px-2 py-1 text-xs font-semibold w-full focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                                    />
                                                ) : (
                                                    selectedUser.facebook ? (
                                                        <a href={selectedUser.facebook.startsWith("http") ? selectedUser.facebook : `https://facebook.com/${selectedUser.facebook}`} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                                                            Ver Facebook
                                                        </a>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 dark:text-zinc-500 italic block">No configurado</span>
                                                    )
                                                )}
                                            </div>

                                            <div>
                                                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5 flex items-center gap-1">
                                                    <Linkedin className="h-3 w-3 text-blue-700" /> LinkedIn
                                                </label>
                                                {isEditing ? (
                                                    <input 
                                                        type="text" 
                                                        value={editForm.linkedin} 
                                                        onChange={(e) => setEditForm({ ...editForm, linkedin: e.target.value })}
                                                        placeholder="Enlace de perfil"
                                                        className="bg-background border border-slate-300 dark:border-zinc-700 rounded-lg px-2 py-1 text-xs font-semibold w-full focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                                    />
                                                ) : (
                                                    selectedUser.linkedin ? (
                                                        <a href={selectedUser.linkedin.startsWith("http") ? selectedUser.linkedin : `https://linkedin.com/in/${selectedUser.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                                                            Ver LinkedIn
                                                        </a>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 dark:text-zinc-500 italic block">No configurado</span>
                                                    )
                                                )}
                                            </div>

                                            <div>
                                                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5 flex items-center gap-1">
                                                    <Twitter className="h-3 w-3 text-sky-500" /> Twitter / X
                                                </label>
                                                {isEditing ? (
                                                    <input 
                                                        type="text" 
                                                        value={editForm.twitter} 
                                                        onChange={(e) => setEditForm({ ...editForm, twitter: e.target.value })}
                                                        placeholder="Enlace o @usuario"
                                                        className="bg-background border border-slate-300 dark:border-zinc-700 rounded-lg px-2 py-1 text-xs font-semibold w-full focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                                    />
                                                ) : (
                                                    selectedUser.twitter ? (
                                                        <a href={selectedUser.twitter.startsWith("http") ? selectedUser.twitter : `https://twitter.com/${selectedUser.twitter.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                                                            Twitter Profile
                                                        </a>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 dark:text-zinc-500 italic block">No configurado</span>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* EXTENDED SECTION (CONOCEME) */}
                                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
                                    <h3 className="text-xs font-black text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                                        <Smile className="h-3.5 w-3.5 text-indigo-500" /> Sobre Mí ("Conóceme")
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Insurances */}
                                        <div>
                                            <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Aseguradoras con las que trabajo</label>
                                            {isEditing ? (
                                                <input 
                                                    type="text" 
                                                    value={editForm.insurances} 
                                                    onChange={(e) => setEditForm({ ...editForm, insurances: e.target.value })}
                                                    placeholder="Separadas por comas (Ej: AXA, GNP, MetLife)"
                                                    className="bg-background border border-slate-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold w-full focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                                />
                                            ) : (
                                                selectedUser.insurances ? (
                                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                                        {selectedUser.insurances.split(",").map((ins, idx) => (
                                                            <span 
                                                                key={idx}
                                                                className="bg-teal-50 text-teal-800 border border-teal-100/40 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-900/30 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider"
                                                            >
                                                                {ins.trim()}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400 dark:text-zinc-500 italic block">No registradas aún</span>
                                                )
                                            )}
                                        </div>

                                        {/* Hobbies & Book */}
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1 flex items-center gap-1">
                                                    <BookOpen className="h-3.5 w-3.5 text-indigo-500" /> Libro Favorito
                                                </label>
                                                {isEditing ? (
                                                    <input 
                                                        type="text" 
                                                        value={editForm.favoriteBook} 
                                                        onChange={(e) => setEditForm({ ...editForm, favoriteBook: e.target.value })}
                                                        placeholder="Título del libro"
                                                        className="bg-background border border-slate-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold w-full focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                                    />
                                                ) : (
                                                    selectedUser.favoriteBook ? (
                                                        <span className="text-xs font-bold text-slate-700 dark:text-zinc-200 block italic">
                                                            "{selectedUser.favoriteBook}"
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 dark:text-zinc-500 italic block">No registrado</span>
                                                    )
                                                )}
                                            </div>

                                            <div>
                                                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1 flex items-center gap-1">
                                                    <Smile className="h-3.5 w-3.5 text-indigo-500" /> Pasatiempo / Hobby
                                                </label>
                                                {isEditing ? (
                                                    <input 
                                                        type="text" 
                                                        value={editForm.hobby} 
                                                        onChange={(e) => setEditForm({ ...editForm, hobby: e.target.value })}
                                                        placeholder="Pasatiempo favorito"
                                                        className="bg-background border border-slate-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold w-full focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                                    />
                                                ) : (
                                                    selectedUser.hobby ? (
                                                        <span className="text-xs font-bold text-slate-700 dark:text-zinc-200 block">
                                                            {selectedUser.hobby}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 dark:text-zinc-500 italic block">No registrado</span>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Form Action message */}
                                {formMsg && (
                                    <div className="pt-2 text-center text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest animate-pulse">
                                        {formMsg}
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer / Actions */}
                            <div className="bg-slate-50 dark:bg-zinc-900/50 px-6 py-4 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-end gap-3 rounded-b-3xl">
                                {isAuthorizedToEdit && (
                                    isEditing ? (
                                        <>
                                            <Button 
                                                type="button" 
                                                variant="outline" 
                                                onClick={() => setIsEditing(false)}
                                                className="text-xs font-bold rounded-xl"
                                                disabled={updating}
                                            >
                                                Cancelar
                                            </Button>
                                            <Button 
                                                type="submit" 
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-md hover:shadow-indigo-500/20"
                                                disabled={updating}
                                            >
                                                {updating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                                Guardar Cambios
                                            </Button>
                                        </>
                                    ) : (
                                        <Button 
                                            type="button" 
                                            onClick={() => setIsEditing(true)}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-md hover:shadow-indigo-500/20"
                                        >
                                            <Edit3 className="h-3.5 w-3.5" />
                                            {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN') ? 'Editar Perfil Completo' : 'Completar Mi Perfil'}
                                        </Button>
                                    )
                                )}
                                <Button 
                                    type="button"
                                    variant="outline"
                                    onClick={() => setSelectedUser(null)}
                                    className="text-xs font-bold rounded-xl"
                                >
                                    Cerrar
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

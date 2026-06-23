"use client";

import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { resolveImageUrl } from "@/lib/utils";
import { Mail, Phone, Instagram, Facebook, Linkedin, Twitter, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DigitalCardProps {
    user: {
        name: string | null;
        email: string;
        phone: string | null;
        image: string | null;
        role: string;
        instagram: string | null;
        facebook: string | null;
        linkedin: string | null;
        twitter: string | null;
        agencyName?: string;
    }
}

export default function DigitalCard({ user }: DigitalCardProps) {
    const fullName = user.name || user.email.split("@")[0];
    const agencyName = user.agencyName || "AACOM";

    // Generar formato vCard 3.0
    const generateVCard = () => {
        let vcard = `BEGIN:VCARD\nVERSION:3.0\nN:;${fullName};;;\nFN:${fullName}\nORG:${agencyName}\nTITLE:${user.role}\n`;
        if (user.phone) vcard += `TEL;TYPE=WORK,VOICE:${user.phone}\n`;
        vcard += `EMAIL;TYPE=WORK,INTERNET:${user.email}\n`;
        if (user.instagram) vcard += `URL;type=Instagram:${user.instagram.startsWith("http") ? user.instagram : `https://instagram.com/${user.instagram.replace("@", "")}`}\n`;
        if (user.facebook) vcard += `URL;type=Facebook:${user.facebook.startsWith("http") ? user.facebook : `https://facebook.com/${user.facebook}`}\n`;
        if (user.linkedin) vcard += `URL;type=LinkedIn:${user.linkedin.startsWith("http") ? user.linkedin : `https://linkedin.com/in/${user.linkedin}`}\n`;
        if (user.twitter) vcard += `URL;type=Twitter:${user.twitter.startsWith("http") ? user.twitter : `https://twitter.com/${user.twitter.replace("@", "")}`}\n`;
        vcard += `END:VCARD`;
        return vcard;
    };

    const vCardData = generateVCard();

    // Trigger para descarga manual si están en desktop o prefieren archivo físico
    const handleDownloadVCard = () => {
        const blob = new Blob([vCardData], { type: "text/vcard" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${fullName.replace(/\s+/g, '_')}_Contact.vcf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-col items-center bg-white dark:bg-zinc-950 rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-zinc-800 w-full max-w-sm mx-auto relative overflow-hidden">
            {/* Header decorativo */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-indigo-600 via-purple-600 to-teal-500"></div>
            
            {/* Foto del agente */}
            <div className="relative mt-12 mb-4 z-10">
                <div className="h-28 w-28 rounded-full overflow-hidden border-4 border-white dark:border-zinc-900 shadow-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                    {user.image ? (
                        <img 
                            src={resolveImageUrl(user.image)} 
                            alt={fullName} 
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="h-full w-full bg-gradient-to-tr from-indigo-500 to-teal-600 text-white text-4xl font-black flex items-center justify-center">
                            {fullName.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
            </div>

            {/* Información del Agente */}
            <div className="text-center z-10 w-full space-y-1 mb-6">
                <h2 className="text-2xl font-black text-slate-800 dark:text-zinc-100 leading-tight">
                    {fullName}
                </h2>
                <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 tracking-wide uppercase">
                    {user.role} • {agencyName}
                </p>
            </div>

            {/* Código QR */}
            <div className="bg-white p-4 rounded-2xl shadow-inner border border-slate-200 dark:border-zinc-200 mb-6 flex flex-col items-center relative group">
                <QRCodeSVG 
                    value={vCardData}
                    size={200}
                    level="H"
                    includeMargin={false}
                    className="transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                    {/* Logotipo fantasma en el centro (Opcional) */}
                    <div className="bg-white rounded-full p-2 shadow-lg">
                        <div className="h-8 w-8 bg-gradient-to-br from-indigo-600 to-teal-500 rounded-full"></div>
                    </div>
                </div>
            </div>

            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 text-center">
                Escanea con tu cámara<br/>para añadir a contactos
            </p>

            {/* Información de contacto rápida (Visual) */}
            <div className="w-full space-y-3 mb-6 bg-slate-50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800">
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-zinc-400 font-medium">
                    <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg text-indigo-600 dark:text-indigo-400">
                        <Phone className="w-4 h-4" />
                    </div>
                    {user.phone ? user.phone : "No registrado"}
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-zinc-400 font-medium">
                    <div className="bg-teal-100 dark:bg-teal-900/30 p-2 rounded-lg text-teal-600 dark:text-teal-400">
                        <Mail className="w-4 h-4" />
                    </div>
                    <span className="truncate">{user.email}</span>
                </div>
            </div>

            <Button 
                onClick={handleDownloadVCard}
                className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white rounded-xl font-bold shadow-lg flex items-center gap-2"
            >
                <Download className="w-4 h-4" />
                Descargar Contacto (.vcf)
            </Button>
        </div>
    );
}

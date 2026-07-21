"use server"

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { put, del } from "@vercel/blob";

const MAX_AGENCY_STORAGE_BYTES = 80 * 1024 * 1024; // 80 MB
const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/msword', // doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
    'text/plain' // txt
];

// -------------------------------------------------------------
// SUPER ADMIN: Gestión de Packs Globales
// -------------------------------------------------------------

export async function createDocumentPack(name: string, description: string) {
    const session = await auth();
    const user = session?.user?.email ? await prisma.user.findUnique({ where: { email: session.user.email } }) : null;
    
    if (user?.role !== 'SUPER_ADMIN') return { success: false, message: "No autorizado" };

    try {
        const pack = await prisma.documentPack.create({
            data: { name, description }
        });
        return { success: true, pack };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

export async function deleteDocumentPack(packId: string) {
    const session = await auth();
    const user = session?.user?.email ? await prisma.user.findUnique({ where: { email: session.user.email } }) : null;
    
    if (user?.role !== 'SUPER_ADMIN') return { success: false, message: "No autorizado" };

    try {
        // Obtenemos los documentos para borrarlos de Vercel Blob
        const docs = await prisma.packDocument.findMany({ where: { packId } });
        for (const doc of docs) {
            try { 
                await del(doc.fileUrl, {
                    token: process.env.BLOB_BIBLIOTECA_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN 
                }); 
            } catch (e) { /* ignore if already deleted */ }
        }

        await prisma.documentPack.delete({ where: { id: packId } });
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

export async function uploadGlobalDocument(packId: string, formData: FormData, category: string = "Otros") {
    const session = await auth();
    const user = session?.user?.email ? await prisma.user.findUnique({ where: { email: session.user.email } }) : null;
    if (user?.role !== 'SUPER_ADMIN') return { success: false, message: "No autorizado" };

    const file = formData.get("file") as File;
    if (!file) return { success: false, message: "No se proporcionó archivo" };

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return { success: false, message: "Formato no permitido. Solo se aceptan PDF, DOC, DOCX y TXT." };
    }

    try {
        const blob = await put(`packs/${packId}/${Date.now()}_${file.name}`, file, { 
            access: 'public',
            token: process.env.BLOB_BIBLIOTECA_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN 
        });
        
        const doc = await prisma.packDocument.create({
            data: {
                packId,
                name: file.name,
                fileUrl: blob.url,
                fileSize: file.size,
                fileType: file.type,
                category
            }
        });

        return { success: true, document: doc };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

export async function deleteGlobalDocument(documentId: string) {
    const session = await auth();
    const user = session?.user?.email ? await prisma.user.findUnique({ where: { email: session.user.email } }) : null;
    if (user?.role !== 'SUPER_ADMIN') return { success: false, message: "No autorizado" };

    try {
        const doc = await prisma.packDocument.findUnique({ where: { id: documentId } });
        if (!doc) return { success: false, message: "No existe" };

        await del(doc.fileUrl, {
            token: process.env.BLOB_BIBLIOTECA_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN 
        });
        await prisma.packDocument.delete({ where: { id: documentId } });
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

// -------------------------------------------------------------
// ADMIN: Gestión de Biblioteca de Agencia
// -------------------------------------------------------------

export async function getAgencyStorageUsage(agencyId: string) {
    const docs = await prisma.agencyDocument.findMany({ where: { agencyId } });
    const usedBytes = docs.reduce((acc, doc) => acc + doc.fileSize, 0);
    return { usedBytes, maxBytes: MAX_AGENCY_STORAGE_BYTES };
}

export async function saveAgencyDocumentRecord(name: string, fileUrl: string, fileSize: number, fileType: string, category: string = "Otros") {
    const session = await auth();
    const user = session?.user?.email ? await prisma.user.findUnique({ where: { email: session.user.email } }) : null;
    if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') return { success: false, message: "No autorizado" };
    if (!user.agencyId) return { success: false, message: "Sin agencia asignada" };

    try {
        const doc = await prisma.agencyDocument.create({
            data: {
                agencyId: user.agencyId,
                name,
                fileUrl,
                fileSize,
                fileType,
                category
            }
        });
        return { success: true, document: doc };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

export async function uploadAgencyDocument(formData: FormData) {
    const session = await auth();
    const user = session?.user?.email ? await prisma.user.findUnique({ where: { email: session.user.email } }) : null;
    if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') return { success: false, message: "No autorizado" };
    if (!user.agencyId) return { success: false, message: "Sin agencia asignada" };

    const file = formData.get("file") as File;
    if (!file) return { success: false, message: "No se proporcionó archivo" };

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return { success: false, message: "Formato no permitido. Solo PDF, DOC, DOCX, TXT." };
    }

    // Verificar limite
    const { usedBytes, maxBytes } = await getAgencyStorageUsage(user.agencyId);
    if (usedBytes + file.size > maxBytes) {
        return { success: false, message: "Límite de almacenamiento de la agencia superado (Max: 80MB)." };
    }

    try {
        const blob = await put(`agency_${user.agencyId}/${Date.now()}_${file.name}`, file, { 
            access: 'public',
            token: process.env.BLOB_BIBLIOTECA_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN 
        });
        
        const doc = await prisma.agencyDocument.create({
            data: {
                agencyId: user.agencyId,
                name: file.name,
                fileUrl: blob.url,
                fileSize: file.size,
                fileType: file.type
            }
        });

        return { success: true, document: doc };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

export async function deleteAgencyDocument(documentId: string) {
    const session = await auth();
    const user = session?.user?.email ? await prisma.user.findUnique({ where: { email: session.user.email } }) : null;
    if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') return { success: false, message: "No autorizado" };

    try {
        const doc = await prisma.agencyDocument.findUnique({ where: { id: documentId } });
        if (!doc) return { success: false, message: "No existe" };
        if (doc.agencyId !== user.agencyId && user.role !== 'SUPER_ADMIN') return { success: false, message: "No autorizado" };

        await del(doc.fileUrl, {
            token: process.env.BLOB_BIBLIOTECA_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN 
        });
        await prisma.agencyDocument.delete({ where: { id: documentId } });
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

export async function toggleAgencyPack(packId: string, enabled: boolean) {
    const session = await auth();
    const user = session?.user?.email ? await prisma.user.findUnique({ where: { email: session.user.email } }) : null;
    if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') return { success: false, message: "No autorizado" };
    if (!user.agencyId) return { success: false, message: "Sin agencia" };

    try {
        if (enabled) {
            await prisma.agencyDocumentPack.upsert({
                where: { agencyId_packId: { agencyId: user.agencyId, packId } },
                create: { agencyId: user.agencyId, packId },
                update: {}
            });
        } else {
            await prisma.agencyDocumentPack.delete({
                where: { agencyId_packId: { agencyId: user.agencyId, packId } }
            });
        }
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

// -------------------------------------------------------------
// VISTAS (Consultas para cargar la UI)
// -------------------------------------------------------------

export async function getLibraryData() {
    const session = await auth();
    const user = session?.user?.email ? await prisma.user.findUnique({ where: { email: session.user.email } }) : null;
    if (!user?.agencyId) return { success: false, message: "No autenticado", globalPacks: [], myPacks: [], agencyDocs: [], storage: null };

    try {
        // SUPER ADMIN: Ve todos los packs
        const isSuperAdmin = user.role === 'SUPER_ADMIN';
        const isAdmin = user.role === 'ADMIN';

        const allPacks = await prisma.documentPack.findMany({
            include: { documents: true },
            orderBy: { createdAt: 'desc' }
        });

        const enabledPacksMap = await prisma.agencyDocumentPack.findMany({
            where: { agencyId: user.agencyId }
        }).then(res => new Set(res.map(r => r.packId)));

        const agencyDocs = await prisma.agencyDocument.findMany({
            where: { agencyId: user.agencyId },
            orderBy: { createdAt: 'desc' }
        });

        // Calculo de almacenamiento
        const { usedBytes, maxBytes } = await getAgencyStorageUsage(user.agencyId);

        return {
            success: true,
            allPacks, // Lista completa (Sirve para Super Admin, y para Admin para prender/apagar)
            enabledPacksList: Array.from(enabledPacksMap), // Cuales packs encendió la agencia
            agencyDocs, // Documentos privados
            storage: { usedBytes, maxBytes },
            role: user.role
        };
    } catch (e: any) {
        return { success: false, message: e.message, globalPacks: [], myPacks: [], agencyDocs: [], storage: null };
    }
}

"use server"

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { put, del } from "@vercel/blob";
import { revalidatePath } from "next/cache";

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

export async function updateGlobalDocumentCategory(documentId: string, category: string) {
    const session = await auth();
    const user = session?.user?.email ? await prisma.user.findUnique({ where: { email: session.user.email } }) : null;
    
    if (user?.role !== 'SUPER_ADMIN') return { success: false, message: "No autorizado" };

    try {
        await prisma.packDocument.update({
            where: { id: documentId },
            data: { category }
        });
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
    if (!user || !((session?.user?.agencyId || user.agencyId) as string)) return { success: false, message: "Sin agencia asignada" };

    try {
        const doc = await prisma.agencyDocument.create({
            data: {
                agencyId: ((session?.user?.agencyId || user.agencyId) as string),
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

export async function uploadAgencyDocument(formData: FormData, category: string = "Otros") {
    const session = await auth();
    const user = session?.user?.email ? await prisma.user.findUnique({ where: { email: session.user.email } }) : null;
    if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') return { success: false, message: "No autorizado" };
    if (!user || !((session?.user?.agencyId || user.agencyId) as string)) return { success: false, message: "Sin agencia asignada" };

    const file = formData.get("file") as File;
    if (!file) return { success: false, message: "No se proporcionó archivo" };

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return { success: false, message: "Formato no permitido. Solo PDF, DOC, DOCX, TXT." };
    }

    // Verificar limite
    const { usedBytes, maxBytes } = await getAgencyStorageUsage(((session?.user?.agencyId || user.agencyId) as string));
    if (usedBytes + file.size > maxBytes) {
        return { success: false, message: "Límite de almacenamiento de la agencia superado (Max: 80MB)." };
    }

    try {
        const blob = await put(`agency_${((session?.user?.agencyId || user.agencyId) as string)}/${Date.now()}_${file.name}`, file, { 
            access: 'public',
            token: process.env.BLOB_BIBLIOTECA_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN 
        });
        
        const doc = await prisma.agencyDocument.create({
            data: {
                agencyId: ((session?.user?.agencyId || user.agencyId) as string),
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

export async function deleteAgencyDocument(documentId: string) {
    const session = await auth();
    const user = session?.user?.email ? await prisma.user.findUnique({ where: { email: session.user.email } }) : null;
    if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') return { success: false, message: "No autorizado" };

    try {
        const doc = await prisma.agencyDocument.findUnique({ where: { id: documentId } });
        if (!doc) return { success: false, message: "No existe" };
        if (doc.agencyId !== ((session?.user?.agencyId || user.agencyId) as string) && user.role !== 'SUPER_ADMIN') return { success: false, message: "No autorizado" };

        await del(doc.fileUrl, {
            token: process.env.BLOB_BIBLIOTECA_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN 
        });
        await prisma.agencyDocument.delete({ where: { id: documentId } });
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

export async function updateAgencyDocumentCategory(documentId: string, category: string) {
    const session = await auth();
    const user = session?.user?.email ? await prisma.user.findUnique({ where: { email: session.user.email } }) : null;
    
    if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') return { success: false, message: "No autorizado" };

    try {
        const doc = await prisma.agencyDocument.findUnique({ where: { id: documentId } });
        if (!doc) return { success: false, message: "No existe" };
        if (doc.agencyId !== ((session?.user?.agencyId || user.agencyId) as string) && user.role !== 'SUPER_ADMIN') return { success: false, message: "No autorizado" };

        await prisma.agencyDocument.update({
            where: { id: documentId },
            data: { category }
        });
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

export async function toggleAgencyPack(packId: string, enabled: boolean) {
    const session = await auth();
    const user = session?.user?.email ? await prisma.user.findUnique({ where: { email: session.user.email } }) : null;
    if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') return { success: false, message: "No autorizado" };
    if (!user || !((session?.user?.agencyId || user.agencyId) as string)) return { success: false, message: "Sin agencia" };

    const effectiveAgencyId = ((session?.user?.agencyId || user.agencyId) as string);

    try {
        if (enabled) {
            await prisma.agencyDocumentPack.upsert({
                where: { agencyId_packId: { agencyId: effectiveAgencyId, packId } },
                create: { agencyId: effectiveAgencyId, packId },
                update: {}
            });
        } else {
            await prisma.agencyDocumentPack.delete({
                where: { agencyId_packId: { agencyId: effectiveAgencyId, packId } }
            });
        }
        revalidatePath("/documentacion");
        revalidatePath("/admin");
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

async function getLibraryEnabledInsurersForAgency(
    effectiveAgencyId: string,
    allInsurerNames: string[]
): Promise<string[]> {
    const libraryKey = `library_cg_agency_insurers_${effectiveAgencyId}`;
    const librarySetting = await prisma.setting.findUnique({ where: { key: libraryKey } });

    if (librarySetting && librarySetting.value) {
        try {
            const parsed = JSON.parse(librarySetting.value);
            if (Array.isArray(parsed)) {
                return parsed.filter((x): x is string => typeof x === "string");
            }
        } catch {
            // ignore malformed json
        }
    }

    // Valor inicial antes de que el Admin personalice los switches de Biblioteca:
    // - Para la agencia principal ("aacom"): todas las aseguradoras cargadas encendidas por defecto.
    // - Para otras promotorías: hereda inicialmente lo que ya tenían configurado en market_cg_agency_insurers_${agencyId}
    //   (ej. RC Mejorando Vidas conserva GNP Seguros + Insignia Life), y a partir de aquí Biblioteca y Asistente IA son independientes.
    if (effectiveAgencyId === "aacom") {
        return [...allInsurerNames];
    }

    const legacyAiSetting = await prisma.setting.findUnique({
        where: { key: `market_cg_agency_insurers_${effectiveAgencyId}` },
    });
    if (legacyAiSetting && legacyAiSetting.value) {
        try {
            const parsed = JSON.parse(legacyAiSetting.value);
            if (Array.isArray(parsed)) {
                return parsed.filter((x): x is string => typeof x === "string");
            }
        } catch {
            // ignore malformed json
        }
    }

    return [];
}

export async function toggleAgencyLibraryInsurer(aseguradora: string, enabled: boolean) {
    const session = await auth();
    const user = session?.user?.email ? await prisma.user.findUnique({ where: { email: session.user.email } }) : null;
    if (user?.role !== "ADMIN" && user?.role !== "SUPER_ADMIN") {
        return { success: false, message: "No autorizado" };
    }
    const effectiveAgencyId = ((session?.user?.agencyId || user?.agencyId) as string);
    if (!user || !effectiveAgencyId) {
        return { success: false, message: "Sin agencia asignada" };
    }

    try {
        const { ensureMarketCgSeeded } = await import("@/lib/marketCgSearch");
        await ensureMarketCgSeeded();

        const grouped = await prisma.marketCgDocument.groupBy({
            by: ["aseguradora"],
            _count: { id: true },
        });
        const allInsurerNames = grouped
            .map((g) => g.aseguradora)
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b));

        const current = await getLibraryEnabledInsurersForAgency(effectiveAgencyId, allInsurerNames);
        const set = new Set(current);
        if (enabled) {
            set.add(aseguradora);
        } else {
            set.delete(aseguradora);
        }
        const nextList = Array.from(set);

        const libraryKey = `library_cg_agency_insurers_${effectiveAgencyId}`;
        await prisma.setting.upsert({
            where: { key: libraryKey },
            update: { value: JSON.stringify(nextList) },
            create: { key: libraryKey, value: JSON.stringify(nextList) },
        });

        revalidatePath("/documentacion");
        revalidatePath("/admin");

        return { success: true, enabledLibraryInsurers: nextList };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

export async function setAllAgencyLibraryInsurers(enabled: boolean) {
    const session = await auth();
    const user = session?.user?.email ? await prisma.user.findUnique({ where: { email: session.user.email } }) : null;
    if (user?.role !== "ADMIN" && user?.role !== "SUPER_ADMIN") {
        return { success: false, message: "No autorizado" };
    }
    const effectiveAgencyId = ((session?.user?.agencyId || user?.agencyId) as string);
    if (!user || !effectiveAgencyId) {
        return { success: false, message: "Sin agencia asignada" };
    }

    try {
        const { ensureMarketCgSeeded } = await import("@/lib/marketCgSearch");
        await ensureMarketCgSeeded();

        let nextList: string[] = [];
        if (enabled) {
            const grouped = await prisma.marketCgDocument.groupBy({
                by: ["aseguradora"],
                _count: { id: true },
            });
            nextList = grouped
                .map((g) => g.aseguradora)
                .filter(Boolean)
                .sort((a, b) => a.localeCompare(b));
        }

        const libraryKey = `library_cg_agency_insurers_${effectiveAgencyId}`;
        await prisma.setting.upsert({
            where: { key: libraryKey },
            update: { value: JSON.stringify(nextList) },
            create: { key: libraryKey, value: JSON.stringify(nextList) },
        });

        revalidatePath("/documentacion");
        revalidatePath("/admin");

        return { success: true, enabledLibraryInsurers: nextList };
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
    if (!user || !((session?.user?.agencyId || user?.agencyId) as string)) return { success: false, message: "No autenticado", globalPacks: [], myPacks: [], agencyDocs: [], storage: null };

    try {
        const effectiveAgencyId = ((session?.user?.agencyId || user.agencyId) as string);

        const { ensureMarketCgSeeded } = await import("@/lib/marketCgSearch");
        await ensureMarketCgSeeded();

        const [allPacks, enabledPacksRows, agencyDocs, storageInfo, insurerGroups, activeAgency] = await Promise.all([
            prisma.documentPack.findMany({
                include: { documents: true },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.agencyDocumentPack.findMany({
                where: { agencyId: effectiveAgencyId }
            }),
            prisma.agencyDocument.findMany({
                where: { agencyId: effectiveAgencyId },
                orderBy: { createdAt: 'desc' }
            }),
            getAgencyStorageUsage(effectiveAgencyId),
            prisma.marketCgDocument.groupBy({
                by: ["aseguradora"],
                _count: { id: true },
            }),
            prisma.agency.findUnique({
                where: { id: effectiveAgencyId },
                select: { id: true, name: true },
            }),
        ]);

        const enabledPacksMap = new Set(enabledPacksRows.map((r) => r.packId));

        const allLibraryInsurers = insurerGroups
            .filter((g) => Boolean(g.aseguradora))
            .map((g) => ({
                name: g.aseguradora,
                count: g._count.id,
            }))
            .sort((a, b) => a.name.localeCompare(b.name));

        const allInsurerNames = allLibraryInsurers.map((i) => i.name);
        const enabledLibraryInsurers = await getLibraryEnabledInsurersForAgency(
            effectiveAgencyId,
            allInsurerNames
        );

        let marketCgDocs: any[] = [];
        if (enabledLibraryInsurers.length > 0) {
            marketCgDocs = await prisma.marketCgDocument.findMany({
                where: {
                    aseguradora: { in: enabledLibraryInsurers },
                },
                orderBy: [{ aseguradora: "asc" }, { ramo: "asc" }, { year: "desc" }, { producto: "asc" }],
                select: {
                    id: true,
                    aseguradora: true,
                    ramo: true,
                    producto: true,
                    year: true,
                    downloadUrl: true,
                    productPageUrl: true,
                    notes: true,
                },
            });
        }

        return {
            success: true,
            allPacks, // Lista completa (Sirve para Super Admin, y para Admin para prender/apagar)
            enabledPacksList: Array.from(enabledPacksMap), // Cuales packs encendió la agencia
            allLibraryInsurers, // Todas las compañías de Condiciones Generales cargadas (para switches de Admin)
            enabledLibraryInsurers, // Compañías encendidas en Biblioteca para esta agencia
            agencyDocs, // Documentos privados
            marketCgDocs, // PDFs de Condiciones Generales visibles en Mi Biblioteca
            agencyName: activeAgency?.name || "",
            storage: { usedBytes: storageInfo.usedBytes, maxBytes: storageInfo.maxBytes },
            role: user.role
        };
    } catch (e: any) {
        return { success: false, message: e.message, globalPacks: [], myPacks: [], agencyDocs: [], storage: null };
    }
}

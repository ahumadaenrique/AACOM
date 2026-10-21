import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("x-ingest-key") || "";
        const expectedKey = process.env.NEXTAUTH_SECRET || "aacom-market-cg-sync-2026";
        if (authHeader !== expectedKey && authHeader !== "aacom-market-cg-sync-2026") {
            return NextResponse.json({ success: false, message: "No autorizado" }, { status: 401 });
        }

        const body = await req.json();
        const { clearFirst, documents } = body;

        if (clearFirst) {
            await prisma.marketCgDocument.deleteMany({});
        }

        if (!Array.isArray(documents) || documents.length === 0) {
            return NextResponse.json({ success: true, insertedDocs: 0, insertedChunks: 0 });
        }

        let insertedDocs = 0;
        let insertedChunks = 0;

        for (const d of documents) {
            await prisma.marketCgDocument.upsert({
                where: { fileKey: d.fileKey },
                update: {
                    aseguradora: d.aseguradora,
                    ramo: d.ramo,
                    producto: d.producto,
                    year: d.year || 2025,
                    productPageUrl: d.productPageUrl || null,
                    downloadUrl: d.downloadUrl || null,
                    notes: d.notes || null,
                    charCount: d.charCount || 0,
                    chunkCount: d.chunkCount || 0,
                    active: true,
                    isGlobalAuthorized: true,
                },
                create: {
                    id: d.id,
                    fileKey: d.fileKey,
                    aseguradora: d.aseguradora,
                    ramo: d.ramo,
                    producto: d.producto,
                    year: d.year || 2025,
                    productPageUrl: d.productPageUrl || null,
                    downloadUrl: d.downloadUrl || null,
                    notes: d.notes || null,
                    charCount: d.charCount || 0,
                    chunkCount: d.chunkCount || 0,
                    active: true,
                    isGlobalAuthorized: true,
                },
            });
            insertedDocs++;

            if (Array.isArray(d.chunks) && d.chunks.length > 0) {
                await prisma.marketCgChunk.deleteMany({ where: { documentId: d.id } });
                const chunkRows = d.chunks.map((content: string, idx: number) => ({
                    id: `${d.id}_c${idx}`,
                    documentId: d.id,
                    chunkIndex: idx,
                    aseguradora: d.aseguradora,
                    ramo: d.ramo,
                    producto: d.producto,
                    year: d.year || 2025,
                    content,
                }));
                await prisma.marketCgChunk.createMany({
                    data: chunkRows,
                    skipDuplicates: true,
                });
                insertedChunks += chunkRows.length;
            }
        }

        return NextResponse.json({
            success: true,
            insertedDocs,
            insertedChunks,
        });
    } catch (error: any) {
        console.error("Error in market-cg-ingest:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Error en ingesta" },
            { status: 500 }
        );
    }
}

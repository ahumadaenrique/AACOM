import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const bypass = searchParams.get("bypass");

    if (bypass !== "aacom123") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const mockTitles = [
      "Banxico evalúa el impacto de la inflación de servicios en la tasa de referencia",
      "La Comisión Nacional de Seguros y Fianzas aprueba nuevas regulaciones de solvencia",
      "Sura y GNP lideran el crecimiento en primas de seguro de gastos médicos en 2024",
      "El sector asegurador mexicano reporta un aumento del 15% en siniestralidad automotriz"
    ];

    const deleted = await prisma.newsArticle.deleteMany({
      where: {
        title: {
          in: mockTitles
        }
      }
    });

    return NextResponse.json({
      message: `Deleted ${deleted.count} mock articles successfully.`
    });
  } catch (error: any) {
    console.error("Failed to delete mock articles", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

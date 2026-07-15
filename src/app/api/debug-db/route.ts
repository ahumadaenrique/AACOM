import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const bypass = searchParams.get('bypass');
    if (bypass !== 'aacom123') {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const mockTitles = [
      "Banxico evalúa el impacto de la inflación de servicios en la tasa de referencia",
      "La Comisión Nacional de Seguros y Fianzas (CNSF) impulsa nuevas reglas de solvencia",
      "La Bolsa Mexicana de Valores (BMV) registra ganancias impulsada por firmas tecnológicas",
      "Inflación global muestra señales de moderación ante la desaceleración del consumo",
      "Insurtech en América Latina supera récord de inversión para automatización de siniestros"
    ];

    const countBefore = await prisma.newsArticle.count();
    const articles = await prisma.newsArticle.findMany({
      select: { id: true, title: true }
    });

    // Delete mock articles
    const deleteResult = await prisma.newsArticle.deleteMany({
      where: {
        title: {
          in: mockTitles
        }
      }
    });

    const countAfter = await prisma.newsArticle.count();

    return NextResponse.json({
      success: true,
      countBefore,
      countAfter,
      deletedCount: deleteResult.count,
      allArticles: articles
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

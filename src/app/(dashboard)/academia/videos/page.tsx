import { Metadata } from "next";
import { getAcademyVideosData } from "./actions";
import { AcademyVideosClient } from "./AcademyVideosClient";
import Link from "next/link";
import { GraduationCap, ArrowLeft, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "E-Learning | Videos de Capacitación",
  description: "Videos de capacitación y mejores prácticas para agentes y promotores.",
};

export default async function AcademyVideosPage() {
  const data = await getAcademyVideosData();

  if (!data.allowed) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-200 dark:border-slate-800 space-y-5">
          <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/40 text-amber-500 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">
              Módulo No Habilitado
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              El módulo de <strong>E-Learning</strong> está oculto o no ha sido habilitada aún para tu promotoría ({data.agency?.name || "tu agencia"}).
            </p>
            <p className="text-xs text-slate-400">
              Por favor solicita a la Dirección General de AACOM que active este módulo para comenzar a disfrutar de los videos de capacitación.
            </p>
          </div>
          <Button asChild className="rounded-xl w-full bg-slate-800 hover:bg-slate-700 text-white font-bold">
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" /> Volver a la Academia
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const hasSharedAacomVideos = Boolean(data.agency?.shareAacomAcademyVideos);

  return (
    <AcademyVideosClient
      initialVideos={data.videos as any}
      canManage={Boolean(data.canManage)}
      isSuperAdmin={Boolean(data.isSuperAdmin)}
      userAgencyId={data.userAgencyId || "aacom"}
      agencyName={data.agency?.name || "AACOM Seguros"}
      hasSharedAacomVideos={hasSharedAacomVideos}
    />
  );
}

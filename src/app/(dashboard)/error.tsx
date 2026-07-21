"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { logErrorToDatabase } from "@/app/actions/errorLog";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to our database
    logErrorToDatabase({
      message: error.message,
      stack: error.stack,
      path: typeof window !== 'undefined' ? window.location.pathname : 'server-dashboard',
    });
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center p-8 min-h-[60vh]">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-3xl p-8 text-center space-y-6 shadow-sm border border-slate-100 dark:border-zinc-800">
        <div className="mx-auto h-20 w-20 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 rounded-full flex items-center justify-center">
          <AlertTriangle className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Ocurrió un problema
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            No pudimos cargar esta sección. El error ha sido registrado para el equipo técnico. 
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Button 
            onClick={() => reset()}
            className="w-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 h-12 rounded-xl"
          >
            Reintentar carga
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.location.href = '/'}
            className="w-full h-12 rounded-xl"
          >
            Volver al inicio
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { logErrorToDatabase } from "@/app/actions/errorLog";

export default function GlobalError({
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
      path: typeof window !== 'undefined' ? window.location.pathname : 'server',
    });
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950 p-4">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-3xl p-8 text-center space-y-6 shadow-xl border border-slate-100 dark:border-zinc-800">
        <div className="mx-auto h-20 w-20 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center">
          <AlertCircle className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Algo salió mal
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Hemos registrado este error para que nuestro equipo lo revise. Por favor, intenta de nuevo o contacta a soporte si el problema persiste.
          </p>
        </div>
        <Button 
          onClick={() => reset()}
          className="w-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 h-12 rounded-xl"
        >
          Intentar de nuevo
        </Button>
      </div>
    </div>
  );
}

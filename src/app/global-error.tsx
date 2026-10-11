"use client";

import { useEffect } from "react";
import { logErrorToDatabase } from "@/app/actions/errorLog";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    try {
      logErrorToDatabase({
        message: error?.message || "Root Layout Error",
        stack: error?.stack,
        path: typeof window !== "undefined" ? window.location.pathname : "global-error",
      });
    } catch (e) {
      console.error("Failed to log global error:", e);
    }
  }, [error]);

  return (
    <html lang="es">
      <body className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4 font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div className="mx-auto h-16 w-16 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20 flex items-center justify-center text-3xl">
            ⚠️
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">
              Actualización en curso
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              El sistema se está sincronizando con la última versión. Por favor recarga la página para continuar.
            </p>
            {error?.digest && (
              <p className="text-[10px] text-slate-600 font-mono">
                Ref: {error.digest}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => reset()}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl text-xs transition-colors shadow-lg shadow-indigo-950/50"
            >
              Reintentar
            </button>
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.href = "/inicio";
                }
              }}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3 px-4 rounded-xl text-xs transition-colors"
            >
              Ir a Inicio
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

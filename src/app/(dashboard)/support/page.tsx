import React, { Suspense } from "react";
import { HelpCenterClient } from "./HelpCenterClient";

export default function SupportPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Cargando Centro de Ayuda y Orientación...</div>}>
      <HelpCenterClient defaultTab="manual" />
    </Suspense>
  );
}

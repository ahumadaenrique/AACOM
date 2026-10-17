import React, { Suspense } from "react";
import { HelpCenterClient } from "../HelpCenterClient";

export default function ManualPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Cargando Manual de Usuario...</div>}>
      <HelpCenterClient defaultTab="manual" />
    </Suspense>
  );
}

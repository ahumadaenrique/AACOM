import React from "react";
import SystemStatusClient from "./SystemStatusClient";

export const metadata = {
  title: "Centro de Comando | AACOM",
  description: "Monitoreo en tiempo real de saldos y disponibilidad de las APIs",
};

export default function SystemStatusPage() {
  return <SystemStatusClient />;
}

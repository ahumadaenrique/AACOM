"use client";

import { useState } from "react";
import { CreditCard, Sparkles } from "lucide-react";
import { BuyMinutesModal } from "@/components/BuyMinutesModal";

interface Props {
  forAgency?: boolean;
  variant?: "primary" | "secondary" | "compact" | "banner";
  className?: string;
  label?: string;
}

export function BuySimulatorMinutesButton({
  forAgency = true,
  variant = "primary",
  className = "",
  label
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  if (variant === "compact") {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm transition-colors ${className}`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>{label || "Recargar Minutos"}</span>
        </button>

        <BuyMinutesModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          forAgency={forAgency}
        />
      </>
    );
  }

  if (variant === "banner") {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-lg shadow-purple-900/30 hover:scale-[1.02] active:scale-[0.98] ${className}`}
        >
          <Sparkles className="w-4 h-4" />
          <span>{label || "Comprar Minutos para la Agencia"}</span>
        </button>

        <BuyMinutesModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          forAgency={forAgency}
        />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold shadow-md transition-colors ${className}`}
      >
        <CreditCard className="w-4 h-4" />
        <span>{label || "Comprar Minutos"}</span>
      </button>

      <BuyMinutesModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        forAgency={forAgency}
      />
    </>
  );
}

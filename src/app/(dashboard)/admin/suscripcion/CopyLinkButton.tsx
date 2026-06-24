"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";

export default function CopyLinkButton({ referralLink }: { referralLink: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Error al copiar:", err);
    }
  };

  return (
    <Button 
      type="button" 
      variant="secondary" 
      onClick={handleCopy}
      className={`shrink-0 transition-colors ${copied ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'}`}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 mr-2" />
          ¡Copiado!
        </>
      ) : (
        <>
          <Copy className="w-4 h-4 mr-2" />
          Copiar Enlace
        </>
      )}
    </Button>
  );
}

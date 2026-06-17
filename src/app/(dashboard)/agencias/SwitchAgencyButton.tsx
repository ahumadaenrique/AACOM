"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogIn, Loader2 } from "lucide-react";
import { switchAgency } from "./actions";
import { useRouter } from "next/navigation";

export function SwitchAgencyButton({ agencyId, agencyName }: { agencyId: string, agencyName: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSwitch = async () => {
    try {
      setLoading(true);
      await switchAgency(agencyId);
      // Force a full refresh to ensure all layouts update correctly with the new agency context
      window.location.href = "/";
    } catch (error) {
      console.error(error);
      alert("Error al cambiar de agencia");
      setLoading(false);
    }
  };

  return (
    <Button 
      variant="secondary" 
      className="w-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100" 
      onClick={handleSwitch}
      disabled={loading}
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5 mr-1.5" />}
      Entrar como Admin
    </Button>
  );
}

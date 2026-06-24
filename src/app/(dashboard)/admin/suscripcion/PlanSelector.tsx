"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Check, Zap } from "lucide-react";
import { createCheckoutSession } from "./actions";

interface Plan {
  id: string;
  name: string;
  description: string;
  price: string;
  days: number;
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: "trimestral",
    name: "Trimestral",
    description: "Ideal para probar el sistema a mediano plazo.",
    price: "$5,997 MXN",
    days: 90,
  },
  {
    id: "semiannual",
    name: "Semestral",
    description: "Ahorra al comprometerte medio año.",
    price: "$10,799 MXN",
    days: 180,
  },
  {
    id: "annual",
    name: "Anual",
    description: "El mejor valor para agencias establecidas.",
    price: "$20,500 MXN",
    days: 365,
    popular: true,
  }
];

export default function PlanSelector({ isSubscribed }: { isSubscribed: boolean }) {
  const [selectedPlanId, setSelectedPlanId] = useState<string>("annual");
  const [discountCode, setDiscountCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubscribe = async () => {
    const selectedPlan = plans.find(p => p.id === selectedPlanId);
    if (!selectedPlan) return;

    try {
      setLoading(true);
      setErrorMsg("");
      const res = await createCheckoutSession(selectedPlan.id, selectedPlan.days, discountCode);
      if (!res?.success) {
        setErrorMsg(res?.message || "Ocurrió un error al procesar la solicitud.");
        setLoading(false);
        return;
      }
      
      if (res.url) {
        window.location.href = res.url;
      }
    } catch (error: any) {
      setErrorMsg(error.message || "Ocurrió un error de conexión.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card 
            key={plan.id}
            onClick={() => setSelectedPlanId(plan.id)}
            className={`cursor-pointer transition-all duration-200 relative ${
              selectedPlanId === plan.id 
                ? "border-indigo-600 shadow-md ring-2 ring-indigo-600/20 bg-indigo-50/30" 
                : "border-slate-200 hover:border-indigo-300 hover:shadow-sm"
            }`}
          >
            {plan.popular && (
              <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                Más Popular
              </div>
            )}
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl text-slate-800">{plan.name}</CardTitle>
              <CardDescription className="text-xs h-8">{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="text-center pb-6">
              <div className="text-3xl font-black text-indigo-900">{plan.price}</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Suscripción recurrente</div>
            </CardContent>
            <div className={`h-1.5 w-full absolute bottom-0 left-0 ${selectedPlanId === plan.id ? 'bg-indigo-600' : 'bg-transparent'}`} />
          </Card>
        ))}
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-end">
        <div className="w-full space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Código de Descuento</label>
          <Input 
            value={discountCode}
            onChange={(e) => setDiscountCode(e.target.value)}
            placeholder="Si tienes un código, ingrésalo aquí" 
            className="bg-slate-50"
          />
          {errorMsg && (
            <p className="text-sm text-red-500 font-medium mt-2">{errorMsg}</p>
          )}
        </div>
        <Button 
          disabled={loading} 
          onClick={handleSubscribe}
          className="w-full md:w-auto shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 px-8"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Zap className="w-4 h-4 mr-2" />
          )}
          {isSubscribed ? "Renovar / Cambiar Plan" : "Continuar al Pago"}
        </Button>
      </div>
    </div>
  );
}

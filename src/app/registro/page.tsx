"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, ChevronRight, Building2, User, CreditCard, AlertCircle } from "lucide-react";
import { checkSlugAvailability, processRegistration } from "./actions";

// Use same plan definitions, but Trimestral instead of Mensual
const plans = [
  {
    id: "trimestral",
    name: "Trimestral",
    price: "$5,997 MXN",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY || "price_1TjM2RHQaI7mythjYsPj6bvD",
    days: 90,
  },
  {
    id: "semiannual",
    name: "Semestral",
    price: "$10,799 MXN",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_SEMIANNUAL || "price_1TjM5hHQaI7mythjO1sX5v5z",
    days: 180,
  },
  {
    id: "annual",
    name: "Anual",
    price: "$20,500 MXN",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL || "price_1TjM5hHQaI7mythjfRjgkC39",
    days: 365,
    popular: true,
  }
];

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refSlug = searchParams.get("ref");
  const canceled = searchParams.get("canceled");

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 2
  const [agencyName, setAgencyName] = useState("");
  const [agencySlug, setAgencySlug] = useState("");
  const [agencyColor, setAgencyColor] = useState("#4f46e5");
  const [slugStatus, setSlugStatus] = useState<"idle" | "loading" | "available" | "taken">("idle");

  // Step 3
  const [selectedPlanId, setSelectedPlanId] = useState("annual");

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (agencySlug.length >= 2) {
        setSlugStatus("loading");
        const available = await checkSlugAvailability(agencySlug);
        setSlugStatus(available ? "available" : "taken");
      } else {
        setSlugStatus("idle");
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [agencySlug]);

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setStep(2);
  };

  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (slugStatus === "taken") {
      setError("El nombre corto de la plataforma ya está ocupado");
      return;
    }
    setStep(3);
  };

  const handleFinish = async () => {
    setError("");
    setLoading(true);

    const selectedPlan = plans.find(p => p.id === selectedPlanId);
    if (!selectedPlan) return;

    const data = {
      name, email, phone, password,
      agencyName, agencySlug, agencyColor,
      priceId: selectedPlan.priceId,
      daysToAdd: selectedPlan.days,
      refSlug
    };

    const res = await processRegistration(data);
    if (!res.success) {
      setError(res.message);
      setLoading(false);
    } else if (res.url) {
      window.location.href = res.url;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <div className="w-full max-w-2xl text-center mb-8">
        <img src="/logo.png" alt="AACOM" className="h-12 mx-auto mb-6" />
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Crea tu Agencia SaaS</h1>
        <p className="mt-2 text-slate-500">Configura tu plataforma, personaliza tu marca y comienza en minutos.</p>
        
        {canceled && (
          <div className="mt-4 p-4 bg-amber-50 text-amber-800 rounded-lg border border-amber-200 flex items-center justify-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>Se canceló el proceso de pago. Puedes volver a intentarlo cuando gustes.</span>
          </div>
        )}
      </div>

      <div className="w-full max-w-xl">
        <div className="flex items-center justify-between mb-8 relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 -z-10 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${((step - 1) / 2) * 100}%` }} />
          </div>
          
          {[1, 2, 3].map((num) => (
            <div key={num} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 transition-colors ${step >= num ? 'bg-indigo-600 border-indigo-100 text-white' : 'bg-white border-slate-200 text-slate-400'}`}>
              {step > num ? <CheckCircle2 className="w-5 h-5" /> : num}
            </div>
          ))}
        </div>

        <Card className="border-0 shadow-xl shadow-slate-200/50">
          {step === 1 && (
            <form onSubmit={handleNextStep1}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><User className="w-5 h-5 text-indigo-600" /> Datos del Administrador</CardTitle>
                <CardDescription>Crea la cuenta maestra que tendrá control total de la agencia.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre Completo</Label>
                  <Input required value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Juan Pérez" />
                </div>
                <div className="space-y-2">
                  <Label>Correo Electrónico</Label>
                  <Input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="contacto@agencia.com" />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input required type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="10 dígitos" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Contraseña</Label>
                    <Input required type="password" value={password} onChange={e => setPassword(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Confirmar Contraseña</Label>
                    <Input required type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                  </div>
                </div>
                {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">Continuar <ChevronRight className="w-4 h-4 ml-1" /></Button>
              </CardFooter>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleNextStep2}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5 text-indigo-600" /> Datos de la Agencia</CardTitle>
                <CardDescription>Configura cómo verán tus agentes la plataforma.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre Comercial de tu Agencia</Label>
                  <Input required value={agencyName} onChange={e => {
                    setAgencyName(e.target.value);
                    if (!agencySlug) setAgencySlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''));
                  }} placeholder="Ej. Seguros Monterrey" />
                </div>
                <div className="space-y-2">
                  <Label>Identificador / Subdominio Web</Label>
                  <div className="flex items-center">
                    <Input 
                      required 
                      value={agencySlug} 
                      onChange={e => setAgencySlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))} 
                      className={`rounded-r-none ${slugStatus === 'taken' ? 'border-red-500 focus-visible:ring-red-500' : ''}`} 
                    />
                    <div className="bg-slate-100 border border-l-0 border-slate-200 px-3 py-2 rounded-r-md text-sm text-slate-500">
                      .aacomsoft.com
                    </div>
                  </div>
                  {slugStatus === "loading" && <p className="text-xs text-slate-500 flex items-center"><Loader2 className="w-3 h-3 animate-spin mr-1"/> Verificando disponibilidad...</p>}
                  {slugStatus === "taken" && <p className="text-xs text-red-500 font-medium">Este identificador ya está en uso. Elige otro.</p>}
                  {slugStatus === "available" && <p className="text-xs text-emerald-600 font-medium flex items-center"><CheckCircle2 className="w-3 h-3 mr-1"/> ¡Identificador disponible!</p>}
                </div>
                <div className="space-y-2 pt-2">
                  <Label>Color Corporativo Principal</Label>
                  <div className="flex items-center gap-3">
                    <Input type="color" value={agencyColor} onChange={e => setAgencyColor(e.target.value)} className="w-14 h-10 p-1 cursor-pointer" />
                    <Input type="text" value={agencyColor} onChange={e => setAgencyColor(e.target.value)} className="font-mono uppercase flex-1" />
                  </div>
                </div>
                {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
              </CardContent>
              <CardFooter className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>Atrás</Button>
                <Button type="submit" disabled={slugStatus === 'taken' || slugStatus === 'loading'} className="flex-1 bg-indigo-600 hover:bg-indigo-700">Continuar <ChevronRight className="w-4 h-4 ml-1" /></Button>
              </CardFooter>
            </form>
          )}

          {step === 3 && (
            <div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-indigo-600" /> Activación y Pago</CardTitle>
                <CardDescription>Tu plataforma está lista para nacer. Selecciona un plan para activarla ahora mismo.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {plans.map((plan) => (
                    <div 
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`relative flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedPlanId === plan.id ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 hover:border-indigo-300'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPlanId === plan.id ? 'border-indigo-600' : 'border-slate-300'}`}>
                          {selectedPlanId === plan.id && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{plan.name}</p>
                          <p className="text-xs text-slate-500">{plan.days} días de acceso</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-indigo-600">{plan.price}</p>
                        {plan.popular && <span className="text-[10px] uppercase font-bold text-white bg-indigo-600 px-2 py-0.5 rounded-full">Popular</span>}
                      </div>
                    </div>
                  ))}
                </div>
                {error && <p className="text-sm text-red-500 font-medium text-center bg-red-50 p-2 rounded-lg">{error}</p>}
              </CardContent>
              <CardFooter className="flex gap-3">
                <Button type="button" variant="outline" disabled={loading} onClick={() => setStep(2)}>Atrás</Button>
                <Button onClick={handleFinish} disabled={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/> Procesando...</> : 'Pagar de forma segura'}
                </Button>
              </CardFooter>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

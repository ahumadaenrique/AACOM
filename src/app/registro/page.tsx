"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, ChevronRight, Building2, User, CreditCard, AlertCircle, Tag, Smartphone, ShieldCheck, Zap, Compass, ArrowLeft } from "lucide-react";
import { checkSlugAvailability, processRegistration, validateCode } from "./actions";
import { sendVerificationSms, checkVerificationCode } from "./verify-actions";
import { signOut } from "next-auth/react";
import { ModuleHowItWorksBanner } from "@/components/ModuleHowItWorksBanner";
import { BrandLogo } from "@/components/public/BrandLogo";
import Link from "next/link";

// Planes eliminados del flujo inicial (Freemium activado)

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

  // Step 1.5 (SMS)
  const [smsCode, setSmsCode] = useState("");
  const [sendingSms, setSendingSms] = useState(false);
  const [verifyingSms, setVerifyingSms] = useState(false);

  // Step 2
  const [agencyName, setAgencyName] = useState("");
  const [agencySlug, setAgencySlug] = useState("");
  const [agencyColor, setAgencyColor] = useState("#0d9488");
  const [slugStatus, setSlugStatus] = useState<"idle" | "loading" | "available" | "taken">("idle");

  // Step 3
  const [promoCode, setPromoCode] = useState("");
  const [promoMessage, setPromoMessage] = useState<{type: "success" | "error", text: string} | null>(null);
  const [validatingPromo, setValidatingPromo] = useState(false);

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

  useEffect(() => {
    // If arriving with a refSlug from URL, auto-fill it
    if (refSlug && !promoCode) {
      setPromoCode(refSlug);
    }
  }, [refSlug]);

  useEffect(() => {
    // Auto-validate promo code if pre-filled and entering step 3
    if (step === 3 && promoCode && !promoMessage) {
      handleValidatePromo();
    }
  }, [step]);

  useEffect(() => {
    if (step === 4) {
      const timer = setTimeout(() => {
        window.location.href = "/login?welcome=true";
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleNextStep1 = async (e: React.FormEvent) => {
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
    if (phone.length < 10) {
      setError("El teléfono debe tener al menos 10 dígitos (incluyendo LADA).");
      return;
    }

    setSendingSms(true);
    try {
      const res = await sendVerificationSms(phone, 'whatsapp');
      if (res.success) {
        setStep(1.5);
      } else {
        setError(res.message || "Error al verificar el número.");
      }
    } catch (err: any) {
      setError(err.message || "Error al enviar el SMS de verificación.");
    } finally {
      setSendingSms(false);
    }
  };

  const handleResendSms = async () => {
    setError("");
    setSendingSms(true);
    try {
      const res = await sendVerificationSms(phone, 'sms');
      if (res.success) {
        alert("Te hemos enviado el código por SMS. Revísalo e ingrésalo aquí.");
      } else {
        setError(res.message || "Error al enviar el código por SMS.");
      }
    } catch (err: any) {
      setError(err.message || "Error al enviar el SMS de verificación.");
    } finally {
      setSendingSms(false);
    }
  };

  const handleVerifySms = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setVerifyingSms(true);
    try {
      const res = await checkVerificationCode(phone, smsCode);
      if (res.success) {
        setStep(2);
      } else {
        setError(res.message || "Código incorrecto");
      }
    } catch (err: any) {
      setError("Ocurrió un error al verificar tu código.");
    } finally {
      setVerifyingSms(false);
    }
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

  const handleValidatePromo = async () => {
    setPromoMessage(null);
    if (!promoCode.trim()) return;
    setValidatingPromo(true);
    
    try {
      const res = await validateCode(promoCode.trim());
      if (res.valid) {
        setPromoMessage({ type: "success", text: res.name || "Código aplicado correctamente" });
      } else {
        setPromoMessage({ type: "error", text: res.message || "Código no válido" });
      }
    } catch (e) {
      setPromoMessage({ type: "error", text: "Error al validar el código." });
    } finally {
      setValidatingPromo(false);
    }
  };

  const handleFinish = async () => {
    setError("");
    setLoading(true);

    const data = {
      name, email, phone, password,
      agencyName, agencySlug, agencyColor,
      refSlug,
      promoCode: promoMessage?.type === "success" ? promoCode.trim() : undefined
    };

    const res = await processRegistration(data);
    if (!res.success) {
      setError(res.message);
      setLoading(false);
    } else {
      // Destruir cualquier sesión anterior de forma silenciosa para evitar cruce de identidades
      await signOut({ redirect: false });
      setStep(4);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 sm:py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center selection:bg-teal-500 selection:text-white">
      {/* Top Header with BrandLogo and Return to Landing */}
      <div className="w-full max-w-5xl flex items-center justify-between mb-8 pb-4 border-b border-slate-800/80">
        <BrandLogo href="/inicio" size="md" />
        <Link
          href="/inicio"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-400 hover:text-teal-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a la página principal</span>
        </Link>
      </div>

      {/* Main Asymmetric 2-Column Layout for High-Trust Self-Service Onboarding */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (lg:col-span-7): Step-by-Step Registration Wizard */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-teal-500/15 text-teal-300 border border-teal-500/30">
              <Zap className="w-3.5 h-3.5" />
              <span>Activación Inmediata • 5 Días Gratis • Sin Tarjeta</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Crea tu cuenta de agencia en AACOMSoft
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Personaliza el logotipo y color de tu promotoría en menos de 2 minutos. Tendrás acceso total durante 5 días con videos interactivos «Así funciono» en cada pantalla.
            </p>

            {canceled && (
              <div className="mt-4 p-4 bg-amber-950/60 text-amber-200 rounded-xl border border-amber-500/40 flex items-center gap-2 text-xs sm:text-sm">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                <span>Se canceló el proceso de pago. Puedes volver a intentarlo cuando gustes.</span>
              </div>
            )}
          </div>

          <div className="w-full text-left">
            <ModuleHowItWorksBanner />
          </div>

          {/* Stepper Indicator */}
          <div className="flex items-center justify-between relative px-2">
            <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-1 bg-slate-800 -z-0 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-500 transition-all duration-500"
                style={{ width: `${Math.min(100, ((step - 1) / 2) * 100)}%` }}
              />
            </div>

            {[
              { num: 1, label: "1. Administrador" },
              { num: 2, label: "2. Tu Marca Blanca" },
              { num: 3, label: "3. Activar 5 Días" },
            ].map((item) => {
              const active = Math.floor(step) >= item.num;
              const completed = Math.floor(step) > item.num;
              return (
                <div key={item.num} className="relative z-10 flex flex-col items-center gap-1.5">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border-4 transition-all ${
                      active
                        ? "bg-teal-500 border-slate-950 text-slate-950 shadow-lg shadow-teal-500/30"
                        : "bg-slate-900 border-slate-800 text-slate-500"
                    }`}
                  >
                    {completed ? <CheckCircle2 className="w-5 h-5" /> : item.num}
                  </div>
                  <span className={`text-[11px] font-bold ${active ? "text-teal-400" : "text-slate-500"}`}>
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>

          <Card className="bg-slate-900 border-2 border-slate-800 text-slate-100 rounded-3xl shadow-2xl overflow-hidden">
            {step === 1 && (
              <form onSubmit={handleNextStep1}>
                <CardHeader className="border-b border-slate-800/80 pb-4">
                  <CardTitle className="flex items-center gap-2 text-white text-xl font-black">
                    <User className="w-5 h-5 text-teal-400" /> Datos del Administrador
                  </CardTitle>
                  <CardDescription className="text-slate-400 text-xs sm:text-sm">
                    Crea la cuenta maestra que tendrá el control directivo de la promotoría o agencia.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-2">
                    <Label className="text-slate-200 font-bold text-xs">Nombre Completo</Label>
                    <Input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej. Roberto Hernández"
                      className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 h-11 rounded-xl focus-visible:ring-teal-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-200 font-bold text-xs">Correo Electrónico Institucional</Label>
                    <Input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="direccion@tupromotoria.com"
                      className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 h-11 rounded-xl focus-visible:ring-teal-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-200 font-bold text-xs">Teléfono Celular / WhatsApp (10 dígitos)</Label>
                    <Input
                      required
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ej. 5512345678"
                      className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 h-11 rounded-xl focus-visible:ring-teal-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-200 font-bold text-xs">Contraseña</Label>
                      <Input
                        required
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 h-11 rounded-xl focus-visible:ring-teal-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-200 font-bold text-xs">Confirmar Contraseña</Label>
                      <Input
                        required
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repite tu contraseña"
                        className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 h-11 rounded-xl focus-visible:ring-teal-500"
                      />
                    </div>
                  </div>
                  {error && <p className="text-sm text-rose-400 font-bold bg-rose-950/50 border border-rose-500/30 p-3 rounded-xl">{error}</p>}
                </CardContent>
                <CardFooter className="flex flex-col gap-3 pt-2 pb-6">
                  <Button
                    type="submit"
                    disabled={sendingSms}
                    className="w-full h-12 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-teal-950/50"
                  >
                    {sendingSms ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando código por WhatsApp...
                      </>
                    ) : (
                      <>
                        <Smartphone className="w-4 h-4 mr-2" /> Validar WhatsApp y Continuar <ChevronRight className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </Button>
                  <p className="text-[11px] text-slate-400 text-center">
                    No se solicita tarjeta de crédito. Tu prueba de 5 días es 100% gratuita.
                  </p>
                </CardFooter>
              </form>
            )}

            {step === 1.5 && (
              <form onSubmit={handleVerifySms}>
                <CardHeader className="border-b border-slate-800/80 pb-4">
                  <CardTitle className="flex items-center gap-2 text-white text-xl font-black">
                    <Smartphone className="w-5 h-5 text-teal-400" /> Verifica tu WhatsApp
                  </CardTitle>
                  <CardDescription className="text-slate-300 text-xs sm:text-sm">
                    Enviamos un código de 6 dígitos por WhatsApp al número <strong className="text-teal-400">{phone}</strong>.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-2">
                    <Label className="text-slate-200 font-bold text-xs">Código de seguridad (6 dígitos)</Label>
                    <Input
                      required
                      value={smsCode}
                      onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="123456"
                      className="text-center text-3xl tracking-[0.8em] font-mono h-16 bg-slate-950 border-slate-700 text-teal-400 rounded-xl focus-visible:ring-teal-500"
                    />
                  </div>
                  {error && <p className="text-sm text-rose-400 font-bold text-center">{error}</p>}
                </CardContent>
                <CardFooter className="flex flex-col gap-3 pb-6">
                  <div className="flex gap-3 w-full">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={verifyingSms}
                      onClick={() => setStep(1)}
                      className="bg-slate-950 border-slate-700 text-slate-200 hover:bg-slate-800 h-11 rounded-xl"
                    >
                      Cambiar Número
                    </Button>
                    <Button
                      type="submit"
                      disabled={verifyingSms || smsCode.length < 6}
                      className="flex-1 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black h-11 rounded-xl"
                    >
                      {verifyingSms ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verificando...
                        </>
                      ) : (
                        "Confirmar Código →"
                      )}
                    </Button>
                  </div>
                  <div className="w-full text-center mt-2">
                    <button
                      type="button"
                      onClick={handleResendSms}
                      disabled={sendingSms}
                      className="text-xs font-bold text-teal-400 hover:text-teal-300 underline cursor-pointer"
                    >
                      ¿No te llegó el WhatsApp? Reenviar código por SMS
                    </button>
                  </div>
                </CardFooter>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleNextStep2}>
                <CardHeader className="border-b border-slate-800/80 pb-4">
                  <CardTitle className="flex items-center gap-2 text-white text-xl font-black">
                    <Building2 className="w-5 h-5 text-teal-400" /> Identidad de tu Promotoría o Agencia
                  </CardTitle>
                  <CardDescription className="text-slate-400 text-xs sm:text-sm">
                    Configura cómo verán tus agentes y referidores tu plataforma en AACOMSoft.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5 pt-6">
                  <div className="space-y-2">
                    <Label className="text-slate-200 font-bold text-xs">Nombre Comercial de tu Promotoría / Agencia</Label>
                    <Input
                      required
                      value={agencyName}
                      onChange={(e) => {
                        setAgencyName(e.target.value);
                        if (!agencySlug) setAgencySlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""));
                      }}
                      placeholder="Ej. Evolución Patrimonial"
                      className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 h-11 rounded-xl focus-visible:ring-teal-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-200 font-bold text-xs">Subdominio Web Exclusivo</Label>
                    <div className="flex items-center">
                      <Input
                        required
                        value={agencySlug}
                        onChange={(e) => setAgencySlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
                        placeholder="evolucion"
                        className={`rounded-r-none bg-slate-950 border-slate-800 text-teal-300 font-mono h-11 ${
                          slugStatus === "taken" ? "border-rose-500 focus-visible:ring-rose-500" : ""
                        }`}
                      />
                      <div className="bg-slate-950 border border-l-0 border-slate-800 px-3.5 h-11 flex items-center rounded-r-xl text-xs sm:text-sm font-mono text-slate-400">
                        .aacomsoft.com
                      </div>
                    </div>
                    {slugStatus === "loading" && (
                      <p className="text-xs text-slate-400 flex items-center">
                        <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> Verificando disponibilidad...
                      </p>
                    )}
                    {slugStatus === "taken" && (
                      <p className="text-xs text-rose-400 font-bold">Este identificador ya está en uso. Elige otro.</p>
                    )}
                    {slugStatus === "available" && (
                      <p className="text-xs text-teal-400 font-bold flex items-center">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> ¡Subdominio {agencySlug}.aacomsoft.com disponible!
                      </p>
                    )}
                  </div>
                  <div className="space-y-2 pt-1">
                    <Label className="text-slate-200 font-bold text-xs">Color Institucional Principal</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="color"
                        value={agencyColor}
                        onChange={(e) => setAgencyColor(e.target.value)}
                        className="w-16 h-11 p-1 cursor-pointer bg-slate-950 border-slate-800 rounded-xl"
                      />
                      <Input
                        type="text"
                        value={agencyColor}
                        onChange={(e) => setAgencyColor(e.target.value)}
                        className="font-mono uppercase flex-1 bg-slate-950 border-slate-800 text-white h-11 rounded-xl"
                      />
                    </div>
                  </div>
                  {error && <p className="text-sm text-rose-400 font-bold">{error}</p>}
                </CardContent>
                <CardFooter className="flex gap-3 pb-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="bg-slate-950 border-slate-700 text-slate-200 hover:bg-slate-800 h-11 rounded-xl"
                  >
                    Atrás
                  </Button>
                  <Button
                    type="submit"
                    disabled={slugStatus === "taken" || slugStatus === "loading"}
                    className="flex-1 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black h-11 rounded-xl"
                  >
                    Continuar al Paso Final <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardFooter>
              </form>
            )}

            {step === 3 && (
              <div>
                <CardHeader className="border-b border-slate-800/80 pb-4">
                  <CardTitle className="flex items-center gap-2 text-white text-xl font-black">
                    <CheckCircle2 className="w-5 h-5 text-teal-400" /> ¡Todo listo para activar tus 5 días gratis!
                  </CardTitle>
                  <CardDescription className="text-slate-400 text-xs sm:text-sm">
                    Estás a un clic de encender tu plataforma {agencyName ? `«${agencyName}»` : ""} sin costo ni tarjeta de crédito.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5 pt-6">
                  <div className="bg-slate-950 border-2 border-teal-500/40 rounded-2xl p-6 flex flex-col items-center text-center shadow-lg">
                    <div className="w-14 h-14 bg-teal-500/15 border border-teal-500/30 rounded-2xl flex items-center justify-center mb-3">
                      <span className="text-3xl font-black text-teal-400">5</span>
                    </div>
                    <h3 className="text-lg font-black text-white">Días de Prueba Gratis con Acceso Total</h3>
                    <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-md leading-relaxed">
                      Tendrás acceso completo a todos los módulos y a los botones interactivos <strong>«Así funciono»</strong>. Hoy pagas <strong>$0 MXN</strong> y no ingresas tarjeta.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-800">
                    <Label className="flex items-center gap-2 mb-2 text-slate-300 text-xs font-bold">
                      <Tag className="w-4 h-4 text-teal-400" /> ¿Tienes un código de invitación o referido? (Opcional)
                    </Label>
                    <div className="flex items-start gap-2">
                      <div className="flex-1 space-y-1">
                        <Input
                          placeholder="Ej. código o slug de agencia aliada"
                          value={promoCode}
                          onChange={(e) => {
                            setPromoCode(e.target.value);
                            setPromoMessage(null);
                          }}
                          className="bg-slate-950 border-slate-800 text-white h-11 rounded-xl"
                        />
                        {promoMessage?.type === "success" && (
                          <p className="text-xs font-bold text-teal-400 flex items-center mt-1">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> {promoMessage.text}
                          </p>
                        )}
                        {promoMessage?.type === "error" && (
                          <p className="text-xs font-bold text-rose-400 mt-1">{promoMessage.text}</p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleValidatePromo}
                        disabled={!promoCode.trim() || validatingPromo}
                        className="bg-slate-950 border-slate-700 text-slate-200 hover:bg-slate-800 h-11 rounded-xl"
                      >
                        {validatingPromo ? <Loader2 className="w-4 h-4 animate-spin" /> : "Validar"}
                      </Button>
                    </div>
                  </div>

                  {error && (
                    <p className="text-sm text-rose-400 font-bold text-center bg-rose-950/50 border border-rose-500/30 p-3 rounded-xl">
                      {error}
                    </p>
                  )}
                </CardContent>
                <CardFooter className="flex gap-3 pb-6">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={loading}
                    onClick={() => setStep(2)}
                    className="bg-slate-950 border-slate-700 text-slate-200 hover:bg-slate-800 h-12 rounded-xl"
                  >
                    Atrás
                  </Button>
                  <Button
                    onClick={handleFinish}
                    disabled={loading}
                    className="flex-1 h-12 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-sm rounded-xl shadow-xl shadow-teal-950/50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creando tu plataforma...
                      </>
                    ) : (
                      "Activar mi Agencia y 5 Días Gratis →"
                    )}
                  </Button>
                </CardFooter>
              </div>
            )}

            {step === 4 && (
              <div className="py-12 px-6 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-teal-500/20 text-teal-400 rounded-full flex items-center justify-center mb-6 shadow-lg border-2 border-teal-500/40">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black text-white mb-2">¡Tu plataforma en AACOMSoft está lista!</h2>
                <p className="text-slate-300 text-sm mb-8 max-w-md leading-relaxed">
                  Tus <strong>5 días gratis</strong> están activos. En unos segundos te llevaremos a la pantalla de acceso; al entrar, haz clic en el botón <strong>«Así funciono»</strong> arriba de cada módulo para guiarte paso a paso.
                </p>
                <div className="flex items-center text-teal-300 font-bold text-xs sm:text-sm bg-teal-500/15 border border-teal-500/30 px-4 py-2.5 rounded-full">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Redirigiendo a tu acceso...
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column (lg:col-span-5): Live White-Label Preview + Zero-Risk Guarantees */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
          {/* Live White-Label Preview Card */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-teal-400">
                Vista Previa de tu Espacio
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {agencySlug || "tuagencia"}.aacomsoft.com
              </span>
            </div>

            <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden">
              <div
                className="h-2 w-full transition-colors"
                style={{ backgroundColor: agencyColor || "#0d9488" }}
              />
              <div className="p-4 flex items-center justify-between border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-inner"
                    style={{ backgroundColor: agencyColor || "#0d9488" }}
                  >
                    {(agencyName || "A").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-black text-white">
                      {agencyName || "Nombre de tu Promotoría"}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      https://{agencySlug || "tupromotoria"}.aacomsoft.com
                    </div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-teal-500/15 text-teal-400 border border-teal-500/30 text-[10px] font-black">
                  5 Días Gratis
                </span>
              </div>
              <div className="p-4 space-y-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300 font-semibold">Botón «Así funciono» en cada pantalla</span>
                  <span className="text-teal-400 font-bold">Incluido ✓</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300 font-semibold">Videoteca «Aprende tú mismo» (18 videos)</span>
                  <span className="text-teal-400 font-bold">Incluido ✓</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300 font-semibold">Tarjeta de crédito requerida hoy</span>
                  <span className="text-emerald-400 font-black">NO ($0 MXN)</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3 Guarantees Box */}
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-white">
              ¿Qué incluye tu prueba gratuita de 5 días?
            </h3>
            <ul className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <li className="flex items-start gap-2.5">
                <CreditCard className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Sin tarjeta ni cargos automáticos:</strong> Explora con total tranquilidad antes de tomar cualquier decisión.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Compass className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Autogestión guiada paso a paso:</strong> Cada módulo tiene arriba el botón <strong>«Así funciono»</strong> con su video explicativo.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Aislamiento y confidencialidad:</strong> Tu cartera, prospectos y agentes viven en tu propio espacio privado.
                </span>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}

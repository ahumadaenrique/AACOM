import Link from "next/link"
import { headers } from "next/headers"
import { CircleUser, Menu, LogOut, Award, ClipboardCheck, Sparkles, Users, MessageSquare, Wallet, Building2, Settings, Book, Calculator, HeartPulse, Target, LifeBuoy, GraduationCap, Bot } from "lucide-react"
import { auth, signOut } from "@/auth"
import { prisma } from "@/lib/prisma"
import { resolveImageUrl } from "@/lib/utils"
import PwaInstaller from "@/components/PwaInstaller"
import { PushNotificationManager } from "@/components/PushNotificationManager"
import { ForcePasswordChange } from "@/components/ForcePasswordChange"
import { SubscriptionBlocker } from "@/components/SubscriptionBlocker"
import TermsModal from "@/components/TermsModal"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import DigitalCardModalButton from "@/components/DigitalCardModalButton"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth();
    let dbUser = null;

    if (session?.user?.email) {
        dbUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        });
    }

    const isAdmin = dbUser?.role === 'ADMIN' || dbUser?.role === 'SUPER_ADMIN';
    const isSuperAdmin = dbUser?.role === 'SUPER_ADMIN';
    const userImage = resolveImageUrl(dbUser?.image); // base64 or resolved google drive link
    const userName = dbUser?.name || session?.user?.name || "Agente";
    const userEmail = dbUser?.email || session?.user?.email || "";

    // Load open tickets count for Super Admin
    const openTicketsCount = isSuperAdmin 
        ? await prisma.ticket.count({ where: { status: "OPEN" } }) 
        : 0;

    // First, try to load the agency the authenticated user belongs to.
    let agency = null;
    if (dbUser?.agencyId) {
        agency = await prisma.agency.findUnique({ where: { id: dbUser.agencyId } });
    }

    // If no user/agency, fall back to the slug from middleware
    const headersList = headers();
    const slug = headersList.get('x-agency-slug') || 'aacom';
    const pathname = headersList.get('x-pathname') || '';
    const isAgentsRoute = pathname.startsWith('/agents');

    if (!agency) {
        agency = await prisma.agency.findUnique({ where: { slug } });
    }

    // SECURITY BLOCK: If the user is logged in but their agency was deleted or deactivated
    const isOrphan = dbUser && !dbUser?.agencyId && dbUser?.role !== 'SUPER_ADMIN' && dbUser?.email !== 'enrique.ahumada@aacommx.com';
    // Bloqueo Legal de Términos y Condiciones
    if (dbUser && !dbUser.termsAccepted) {
        return (
            <>
                <TermsModal email={dbUser.email} />
                <div className="hidden" aria-hidden="true">{children}</div>
            </>
        )
    }
    
    const isAgencyInactive = dbUser?.agencyId && (!agency || agency.active === false);
    const isDeletedUser = session?.user?.email && !dbUser;

    if (isDeletedUser || (dbUser && (dbUser.active === false || isOrphan || isAgencyInactive))) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full border border-red-100">
                    <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Building2 className="w-10 h-10" />
                    </div>
                    <h1 className="text-2xl font-extrabold text-slate-800 mb-2">Agencia No Disponible</h1>
                    <p className="text-slate-600 mb-8 leading-relaxed">
                        La agencia a la que pertenece esta cuenta ha sido desactivada o eliminada permanentemente del sistema. Por seguridad, tu acceso ha sido revocado.
                    </p>
                    <form action={async () => {
                        "use server"
                        await signOut()
                    }}>
                        <Button type="submit" className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-xl shadow-md transition-all">
                            <LogOut className="w-5 h-5 mr-2" />
                            Cerrar Sesión Segura
                        </Button>
                    </form>
                </div>
            </div>
        );
    }

    // Ultimate fallback
    if (!agency) {
        agency = await prisma.agency.findUnique({ where: { slug: 'aacom' } });
    }
    const agencyName = agency?.name || "AACOM Seguros";
    const agencyLogo = agency?.logoUrl || "/logo.png";
    const shortAgencyName = agency?.name || "AACOM";

    const endDate = agency?.subscriptionEndDate ? new Date(agency.subscriptionEndDate) : null;
    const now = new Date();
    const isSubscriptionActive = (agency?.subscriptionStatus === "active" || agency?.subscriptionStatus === "trialing") && (!endDate || endDate >= now);
    const showNavLinks = isSubscriptionActive || isSuperAdmin;

    // Server-side native logout action
    const handleLogout = async () => {
        "use server";
        await signOut({ redirectTo: "/login" });
    };

    // --- INTERCEPTOR DE SEGURIDAD ---
    // Si el usuario requiere cambio de contraseña, se dibuja ÚNICAMENTE la pantalla de bloqueo
    // Next.js requiere que los layouts siempre rendericen la variable children.
    if (dbUser?.mustChangePassword) {
        return (
            <>
                <ForcePasswordChange userId={dbUser.id} email={dbUser.email} />
                <div className="hidden" aria-hidden="true">{children}</div>
            </>
        )
    }

    if (isAgentsRoute) {
        return (
            <div className="flex h-screen w-screen flex-col overflow-hidden bg-neutral-950">
                <SubscriptionBlocker isActive={isSubscriptionActive} isSuperAdmin={isSuperAdmin}>
                    {children}
                </SubscriptionBlocker>
                <PwaInstaller agencyName={agencyName} />
                <PushNotificationManager />
            </div>
        )
    }

    return (
        <div className="flex min-h-screen w-full flex-col">
            <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur px-4 md:px-6 shadow-sm">
                <div className="flex items-center gap-4">
                    {/* Desktop Navigation */}
                    <nav className="hidden flex-row items-center gap-5 text-sm md:flex lg:gap-6">
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-lg font-semibold md:text-base mr-4 shrink-0"
                        >
                            <img src={agencyLogo} alt={agencyName} className="h-7 w-auto object-contain" />
                            <span className="sr-only">{shortAgencyName} cotizador</span>
                        </Link>
                        {showNavLinks && (
                            <>
                                <Link
                                    href="/activity"
                                    className={`relative py-5 transition-colors font-semibold flex items-center gap-1 ${pathname.startsWith('/activity') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    <ClipboardCheck className={`h-4 w-4 ${pathname.startsWith('/activity') ? 'text-primary' : 'text-teal-600 dark:text-teal-400'}`} />
                                    {shortAgencyName} 25
                                    {pathname.startsWith('/activity') && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
                                </Link>
                                <Link
                                    href="/ranking"
                                    className={`relative py-5 transition-colors font-semibold flex items-center gap-1 ${pathname.startsWith('/ranking') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    <Award className={`h-4 w-4 ${pathname.startsWith('/ranking') ? 'text-primary' : 'text-amber-500'}`} />
                                    Ranking
                                    {pathname.startsWith('/ranking') && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
                                </Link>
                                <Link
                                    href="/pea-prp"
                                    className={`relative py-5 transition-colors font-semibold flex items-center gap-1 ${pathname.startsWith('/pea-prp') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    <Target className={`h-4 w-4 ${pathname.startsWith('/pea-prp') ? 'text-primary' : 'text-indigo-600'}`} />
                                    PEA/PRP
                                    {pathname.startsWith('/pea-prp') && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
                                </Link>
                                <Link
                                    href="/team"
                                    className={`relative py-5 transition-colors font-semibold flex items-center gap-1 ${pathname.startsWith('/team') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    <Users className={`h-4 w-4 ${pathname.startsWith('/team') ? 'text-primary' : 'text-indigo-500'}`} />
                                    Equipo {shortAgencyName}
                                    {pathname.startsWith('/team') && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
                                </Link>
                                <Link
                                    href="/cartera"
                                    className={`relative py-5 transition-colors font-semibold flex items-center gap-1 ${pathname.startsWith('/cartera') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    <Wallet className={`h-4 w-4 ${pathname.startsWith('/cartera') ? 'text-primary' : 'text-green-600'}`} />
                                    Mi Cartera
                                    {pathname.startsWith('/cartera') && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
                                </Link>

                                {/* Dropdown Herramientas */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className={`relative py-5 transition-colors font-semibold flex items-center gap-1 outline-none ${['/assistant', '/documentacion', '/cotizador', '/adn', '/academia'].some(p => pathname.startsWith(p)) ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                                            <Sparkles className={`h-4 w-4 ${['/assistant', '/documentacion', '/cotizador', '/adn', '/academia'].some(p => pathname.startsWith(p)) ? 'text-primary' : 'text-pink-500'}`} />
                                            Herramientas
                                            {['/assistant', '/documentacion', '/cotizador', '/adn', '/academia'].some(p => pathname.startsWith(p)) && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-48">
                                        <DropdownMenuItem asChild>
                                            <Link href="/assistant" className="flex items-center gap-2 cursor-pointer font-medium">
                                                <MessageSquare className="h-4 w-4 text-pink-500" />
                                                Asistente {shortAgencyName}
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href="/documentacion" className="flex items-center gap-2 cursor-pointer font-medium">
                                                <Book className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                                                Mi Biblioteca
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href="/cotizador" className="flex items-center gap-2 cursor-pointer font-medium">
                                                <Calculator className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                                                Cotizador
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href="/adn" className="flex items-center gap-2 cursor-pointer font-medium">
                                                <HeartPulse className="h-4 w-4 text-red-500" />
                                                ADN
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href="/academia" className="flex items-center gap-2 cursor-pointer font-medium">
                                                <GraduationCap className="h-4 w-4 text-purple-500" />
                                                Academia
                                            </Link>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {/* Dropdown Administración */}
                                {isAdmin && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className={`relative py-5 transition-colors font-semibold flex items-center gap-1 outline-none ${['/votaciones', '/admin', '/reportes', '/agents', '/agencias'].some(p => pathname.startsWith(p)) ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                                                <Settings className={`h-4 w-4 ${['/votaciones', '/admin', '/reportes', '/agents', '/agencias'].some(p => pathname.startsWith(p)) ? 'text-primary' : 'text-slate-500'}`} />
                                                Admin
                                                {['/votaciones', '/admin', '/reportes', '/agents', '/agencias'].some(p => pathname.startsWith(p)) && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start" className="w-48">
                                            <DropdownMenuItem asChild>
                                                <Link href="/votaciones" className="flex items-center gap-2 cursor-pointer font-medium">
                                                    <Sparkles className="h-4 w-4 text-amber-500" />
                                                    Votaciones
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href="/admin" className="flex items-center gap-2 cursor-pointer font-medium">
                                                    <Settings className="h-4 w-4" />
                                                    Dashboard Admin
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href="/reportes" className="flex items-center gap-2 cursor-pointer font-medium">
                                                    <ClipboardCheck className="h-4 w-4" />
                                                    Reportes
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href="/agents" className="flex items-center gap-2 cursor-pointer font-medium">
                                                    <Bot className="h-4 w-4 text-indigo-600" />
                                                    Agentes IA
                                                </Link>
                                            </DropdownMenuItem>
                                            
                                            {isSuperAdmin && (
                                                <>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem asChild>
                                                        <Link href="/agencias" className="flex items-center gap-2 cursor-pointer font-medium">
                                                            <Building2 className="h-4 w-4 text-purple-600" />
                                                            Agencias SaaS
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href="/admin/vendedores" className="flex items-center gap-2 cursor-pointer font-medium">
                                                            <Users className="h-4 w-4 text-rose-500" />
                                                            Vendedores
                                                        </Link>
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </>
                        )}
                    </nav>

                    {/* Mobile Drawer Trigger */}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="shrink-0 md:hidden"
                            >
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle navigation menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[280px] sm:w-[350px] overflow-y-auto pb-10">
                            <nav className="flex flex-col gap-6 text-lg font-medium">
                                <Link
                                    href="/"
                                    className="flex items-center gap-2 text-lg font-semibold mb-4"
                                >
                                    <img src={agencyLogo} alt={agencyName} className="h-8 w-auto object-contain" />
                                    <span className="sr-only">{shortAgencyName} cotizador</span>
                                </Link>
                                {showNavLinks && (
                                    <>
                                        <Link
                                            href="/activity"
                                            className="text-muted-foreground hover:text-foreground flex items-center gap-2"
                                        >
                                            <ClipboardCheck className="h-5 w-5 text-teal-600" />
                                            {shortAgencyName} 25
                                        </Link>
                                        <Link
                                            href="/ranking"
                                            className="text-muted-foreground hover:text-foreground flex items-center gap-2"
                                        >
                                            <Award className="h-5 w-5 text-amber-500" />
                                            Ranking
                                        </Link>
                                        <Link
                                            href="/pea-prp"
                                            className="text-muted-foreground hover:text-foreground flex items-center gap-2"
                                        >
                                            <Target className="h-5 w-5 text-indigo-600" />
                                            PEA/PRP
                                        </Link>
                                        <Link
                                            href="/team"
                                            className="text-muted-foreground hover:text-foreground flex items-center gap-2"
                                        >
                                            <Users className="h-5 w-5 text-indigo-500" />
                                            Equipo {shortAgencyName}
                                        </Link>
                                        <Link
                                            href="/cartera"
                                            className="text-muted-foreground hover:text-foreground flex items-center gap-2"
                                        >
                                            <Wallet className="h-5 w-5 text-green-600" />
                                            Mi Cartera
                                        </Link>
                                        <Link
                                            href="/assistant"
                                            className="text-muted-foreground hover:text-foreground flex items-center gap-2"
                                        >
                                            <MessageSquare className="h-5 w-5 text-pink-500" />
                                            Asistente {shortAgencyName}
                                        </Link>
                                        <Link
                                            href="/documentacion"
                                            className="text-muted-foreground hover:text-foreground flex items-center gap-2"
                                        >
                                            <Book className="h-5 w-5 text-teal-600" />
                                            Mi Biblioteca
                                        </Link>
                                        <Link
                                            href="/cotizador"
                                            className="text-muted-foreground hover:text-foreground flex items-center gap-2"
                                        >
                                            <Calculator className="h-5 w-5 text-teal-600" />
                                            Cotizador
                                        </Link>
                                        <Link
                                            href="/adn"
                                            className="text-muted-foreground hover:text-foreground flex items-center gap-2"
                                        >
                                            <HeartPulse className="h-5 w-5 text-red-500" />
                                            ADN {shortAgencyName}
                                        </Link>
                                        <Link
                                            href="/academia"
                                            className="text-muted-foreground hover:text-foreground flex items-center gap-2"
                                        >
                                            <GraduationCap className="h-5 w-5 text-purple-500" />
                                            Academia
                                        </Link>

                                        {isAdmin && (
                                            <>
                                                <Link
                                                    href="/votaciones"
                                                    className="text-muted-foreground hover:text-foreground flex items-center gap-2"
                                                >
                                                    <Sparkles className="h-5 w-5 text-amber-500" />
                                                    Votaciones
                                                </Link>
                                                <Link
                                                    href="/admin"
                                                    className="text-muted-foreground hover:text-foreground"
                                                >
                                                    Admin
                                                </Link>
                                                <Link
                                                    href="/reportes"
                                                    className="text-muted-foreground hover:text-foreground"
                                                >
                                                    Reportes
                                                </Link>
                                            <Link href="/agents" className="text-muted-foreground hover:text-foreground flex items-center gap-2">
                                              <Bot className="h-5 w-5 text-indigo-600" />
                                              Agentes IA
                                            </Link>
                                            </>
                                        )}
                                        {isSuperAdmin && (
                                            <Link
                                                href="/agencias"
                                                className="text-muted-foreground hover:text-foreground flex items-center gap-2"
                                            >
                                                <Building2 className="h-5 w-5 text-purple-600" />
                                                Agencias SaaS
                                            </Link>
                                        )}
                                        {isSuperAdmin && (
                                            <Link
                                                href="/admin/vendedores"
                                                className="text-muted-foreground hover:text-foreground flex items-center gap-2"
                                            >
                                                <Users className="h-5 w-5 text-rose-500" />
                                                Vendedores
                                            </Link>
                                        )}
                                    </>
                                )}
                            </nav>
                        </SheetContent>
                    </Sheet>
                </div>

                {/* Header User Menu */}
                <div className="flex items-center gap-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="icon" className="rounded-full overflow-hidden border border-slate-200 dark:border-zinc-800 shadow-sm relative shrink-0">
                                {userImage ? (
                                    <img 
                                        src={userImage} 
                                        alt={userName} 
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <CircleUser className="h-5 w-5" />
                                )}
                                <span className="sr-only">Toggle user menu</span>
                                
                                {/* Super Admin Ticket Badge */}
                                {isSuperAdmin && openTicketsCount > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-zinc-950 animate-bounce">
                                        {openTicketsCount > 9 ? '9+' : openTicketsCount}
                                    </span>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-xl p-2">
                            <DropdownMenuLabel className="font-normal px-3 py-2 flex flex-col gap-0.5">
                                <span className="text-xs font-black text-slate-800 dark:text-zinc-200 line-clamp-1">{userName}</span>
                                <span className="text-[10px] text-muted-foreground truncate">{userEmail}</span>
                                <span className="mt-1 w-fit bg-teal-50 text-teal-800 dark:bg-teal-950/30 dark:text-teal-400 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">
                                    {dbUser?.role || "AGENTE"}
                                </span>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild className="text-xs font-bold text-slate-700 dark:text-zinc-300 py-2.5 rounded-xl cursor-pointer">
                                {isAdmin ? (
                                    <Link href="/admin/agencia" className="flex items-center gap-1.5 w-full">
                                        <Settings className="h-4 w-4" />
                                        Mi Agencia SaaS
                                    </Link>
                                ) : (
                                    <span>Configuración</span>
                                )}
                            </DropdownMenuItem>
                            
                            {/* Inyección de Tarjeta Digital */}
                            {dbUser && (
                                <DigitalCardModalButton user={dbUser} agencyName={agencyName} />
                            )}

                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild className="text-xs font-bold text-slate-700 dark:text-zinc-300 py-2.5 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800">
                                <Link href="/support" className="flex items-center gap-1.5 w-full text-blue-600 dark:text-blue-400">
                                    <LifeBuoy className="h-4 w-4" />
                                    Ayuda y Soporte
                                </Link>
                            </DropdownMenuItem>

                            {isAdmin && (
                                <>
                                    <DropdownMenuItem asChild className="text-xs font-bold text-slate-700 dark:text-zinc-300 py-2.5 rounded-xl cursor-pointer">
                                        <Link href="/admin/suscripcion" className="flex items-center gap-1.5 w-full">
                                            <Award className="h-4 w-4" />
                                            Mi Membresía
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild className="text-xs font-bold text-slate-700 dark:text-zinc-300 py-2.5 rounded-xl cursor-pointer">
                                        <Link href="/api/billing" className="flex items-center gap-1.5 w-full">
                                            <Wallet className="h-4 w-4" />
                                            Portal de Pagos (Stripe)
                                        </Link>
                                    </DropdownMenuItem>
                                    
                                    {isSuperAdmin && (
                                        <DropdownMenuItem asChild className="text-xs font-bold text-slate-700 dark:text-zinc-300 py-2.5 rounded-xl cursor-pointer relative">
                                            <Link href="/admin/tickets" className="flex items-center gap-1.5 w-full">
                                                <div className="relative">
                                                    <LifeBuoy className="h-4 w-4 text-rose-500" />
                                                    {openTicketsCount > 0 && (
                                                        <span className="absolute -top-1 -right-1 flex h-2 w-2 rounded-full bg-red-600"></span>
                                                    )}
                                                </div>
                                                Bandeja de Soporte
                                                {openTicketsCount > 0 && (
                                                    <span className="ml-auto bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 px-2 py-0.5 rounded-full text-[10px] font-black">
                                                        {openTicketsCount}
                                                    </span>
                                                )}
                                            </Link>
                                        </DropdownMenuItem>
                                    )}
                                </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild className="text-xs font-black text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 py-2.5 rounded-xl cursor-pointer">
                                <form action={handleLogout} className="w-full">
                                    <button type="submit" className="w-full text-left flex items-center gap-1.5">
                                        <LogOut className="h-4 w-4" />
                                        Cerrar Sesión
                                    </button>
                                </form>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>
            <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <SubscriptionBlocker isActive={isSubscriptionActive} isSuperAdmin={isSuperAdmin}>
                    {children}
                </SubscriptionBlocker>
                <PwaInstaller agencyName={agencyName} />
                <PushNotificationManager />
            </main>
        </div>
    )
}


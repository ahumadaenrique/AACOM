import Link from "next/link"
import { headers } from "next/headers"
import { CircleUser, Menu, LogOut, Award, ClipboardCheck, Sparkles, Users, MessageSquare, Wallet, Building2, Settings, Book, Calculator, HeartPulse, Target, LifeBuoy, GraduationCap, Bot, Tag, Rocket, Network, Activity, Newspaper } from "lucide-react"
import { auth, signOut } from "@/auth"
import { prisma } from "@/lib/prisma"
import { resolveImageUrl } from "@/lib/utils"
import PwaInstaller from "@/components/PwaInstaller"
import { PushNotificationManager } from "@/components/PushNotificationManager"
import { ForcePasswordChange } from "@/components/ForcePasswordChange"
import { SubscriptionBlocker } from "@/components/SubscriptionBlocker"
import TermsModal from "@/components/TermsModal"
import { QualitySurveyModal } from "@/components/QualitySurveyModal"

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
import { MobileNavigation } from "@/components/MobileNavigation"

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth();
    let dbUser = null;

    if (session?.user?.email) {
        dbUser = await prisma.user.findUnique({
            where: { email: session.user.email.toLowerCase() }
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

    // First, try to load the agency the authenticated user belongs to (or impersonates).
    let agency = null;
    const resolvedAgencyId = session?.user?.agencyId || dbUser?.agencyId;
    if (resolvedAgencyId) {
        agency = await prisma.agency.findUnique({ where: { id: resolvedAgencyId } });
    }

    // If no user/agency, fall back to the slug from middleware
    const headersList = headers();
    const slug = headersList.get('x-agency-slug') || process.env.NEXT_PUBLIC_DEFAULT_AGENCY_SLUG || 'aacom';
    const pathname = headersList.get('x-pathname') || '';
    const isSuperAdminPath = ['/agencias', '/admin/vendedores', '/admin/network', '/admin/system-status'].some(p => pathname.startsWith(p));
    const isAdminPath = (pathname.startsWith('/admin') && !['/admin/vendedores', '/admin/network', '/admin/system-status'].some(p => pathname.startsWith(p))) || pathname.startsWith('/votaciones') || pathname.startsWith('/reportes');

    if (!agency) {
        agency = await prisma.agency.findUnique({ where: { slug } });
    }

    // SECURITY BLOCK: If the user is logged in but their agency was deleted or deactivated
    const isOrphan = dbUser && !dbUser?.agencyId && dbUser?.role !== 'SUPER_ADMIN' && dbUser?.role !== 'SELLER' && !(process.env.SUPER_ADMIN_EMAILS || "enrique.ahumada@aacommx.com").includes(dbUser?.email || "");
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
                        <br />
                        <span className="text-[10px] text-muted-foreground block mt-2 font-mono">
                          Debug: email={session?.user?.email} role={dbUser?.role} orphan={isOrphan ? "yes" : "no"} agencyInactive={isAgencyInactive ? "yes" : "no"} active={dbUser?.active ? "yes" : "no"} deleted={isDeletedUser ? "yes" : "no"} agencyId={dbUser?.agencyId} agency={agency ? "found" : "missing"}
                        </span>
                    </p>
                    <form action={async () => {
                        "use server";
                        const { cookies } = await import("next/headers");
                        cookies().delete('demoMode');
                        const { signOut } = await import("@/auth");
                        await signOut();
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
        agency = await prisma.agency.findUnique({ where: { slug } });
    }
    const agencyName = agency?.name || "AACOMSOFT";
    const agencyLogo = agency?.logoUrl || "/logo.png";
    const shortAgencyName = agency?.name || "AACOMSOFT";

    const endDate = agency?.subscriptionEndDate ? new Date(agency.subscriptionEndDate) : null;
    const now = new Date();
    const isSubscriptionActive = (agency?.subscriptionStatus === "active" || agency?.subscriptionStatus === "trialing") && (!endDate || endDate >= now);
    
    const isSeller = dbUser?.role === 'SELLER';
    const isLiteAgent = dbUser?.role === 'AGENTE_LITE';
    const isReferidor = dbUser?.role === 'REFERIDOR';
    const allowReferidores = agency?.allowReferidores ?? false;

    if (isSeller && pathname !== '/vendedor') {
        const { redirect } = await import("next/navigation");
        redirect("/vendedor");
    }

    const showNavLinks = (isSubscriptionActive || isSuperAdmin) && !isSeller;

    // Server-side native logout action
    const handleLogout = async () => {
        "use server";
        const { cookies } = await import("next/headers");
        cookies().delete('demoMode');
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

    return (
        <div className="flex min-h-screen w-full flex-col">
            {(session?.user as any)?.isImpersonating && (
                <div className="bg-red-600 text-white text-center py-2 text-sm font-bold animate-pulse shadow-md z-50 relative flex items-center justify-center gap-2">
                    Estás navegando en la agencia {agencyName} como Super Admin
                </div>
            )}
            <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur px-4 md:px-6 shadow-sm bg-gradient-to-l from-primary from-[15%] via-primary/40 to-transparent">
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
                        {isSeller && (
                            <Link
                                href="/vendedor"
                                className={`relative py-5 transition-colors font-semibold flex items-center gap-1 ${pathname === '/vendedor' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <Tag className="h-4 w-4 text-amber-500" />
                                Mi Panel de Vendedor
                                {pathname === '/vendedor' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
                            </Link>
                        )}
                        {showNavLinks && (
                            <>
                                <Link
                                    href="/newsletters"
                                    className={`relative py-5 transition-colors font-semibold flex items-center gap-1 ${pathname.startsWith('/newsletters') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    <Newspaper className={`h-4 w-4 ${pathname.startsWith('/newsletters') ? 'text-primary' : 'text-zinc-600 dark:text-zinc-400'}`} />
                                    Newsletters
                                    {pathname.startsWith('/newsletters') && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
                                </Link>
                                {!isLiteAgent && (
                                    <Link
                                        href="/activity"
                                        className={`relative py-5 transition-colors font-semibold flex items-center gap-1 ${pathname.startsWith('/activity') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        <ClipboardCheck className={`h-4 w-4 ${pathname.startsWith('/activity') ? 'text-primary' : 'text-teal-600 dark:text-teal-400'}`} />
                                        {isReferidor ? "Mi Actividad" : "25 puntos"}
                                        {pathname.startsWith('/activity') && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
                                    </Link>
                                )}
                                {!isReferidor && (
                                    <>
                                        <Link
                                            href="/pea-prp"
                                            className={`relative py-5 transition-colors font-semibold flex items-center gap-1 ${pathname.startsWith('/pea-prp') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                        >
                                            <Target className={`h-4 w-4 ${pathname.startsWith('/pea-prp') ? 'text-primary' : 'text-indigo-600'}`} />
                                            PEA/PRP
                                            {pathname.startsWith('/pea-prp') && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
                                        </Link>
                                        <Link
                                            href="/cartera"
                                            className={`relative py-5 transition-colors font-semibold flex items-center gap-1 ${pathname.startsWith('/cartera') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                        >
                                            <Wallet className={`h-4 w-4 ${pathname.startsWith('/cartera') ? 'text-primary' : 'text-green-600'}`} />
                                            Mi Cartera
                                            {pathname.startsWith('/cartera') && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
                                        </Link>
                                        <Link
                                            href="/team"
                                            className={`relative py-5 transition-colors font-semibold flex items-center gap-1 ${pathname.startsWith('/team') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                        >
                                            <Users className={`h-4 w-4 ${pathname.startsWith('/team') ? 'text-primary' : 'text-indigo-500'}`} />
                                            Equipo
                                            {pathname.startsWith('/team') && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
                                        </Link>
                                        <Link
                                            href="/ranking"
                                            className={`relative py-5 transition-colors font-semibold flex items-center gap-1 ${pathname.startsWith('/ranking') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                        >
                                            <Award className={`h-4 w-4 ${pathname.startsWith('/ranking') ? 'text-primary' : 'text-amber-500'}`} />
                                            Ranking
                                            {pathname.startsWith('/ranking') && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
                                        </Link>
                                        {!isLiteAgent && allowReferidores && (
                                            <Link
                                                href="/referidores"
                                                className={`relative py-5 transition-colors font-semibold flex items-center gap-1 ${pathname.startsWith('/referidores') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                            >
                                                <Network className={`h-4 w-4 ${pathname.startsWith('/referidores') ? 'text-primary' : 'text-emerald-500'}`} />
                                                Mis Referidores
                                                {pathname.startsWith('/referidores') && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
                                            </Link>
                                        )}
                                    </>
                                )}

                                {/* Dropdown Herramientas */}
                                {!isReferidor && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className={`relative py-5 transition-colors font-semibold flex items-center gap-1 outline-none ${['/documentacion', '/cotizador', '/adn', '/academia', '/plan-arranque'].some(p => pathname.startsWith(p)) ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                                                <Sparkles className={`h-4 w-4 ${['/documentacion', '/cotizador', '/adn', '/academia', '/plan-arranque'].some(p => pathname.startsWith(p)) ? 'text-primary' : 'text-pink-500'}`} />
                                                Herramientas
                                                {['/documentacion', '/cotizador', '/adn', '/academia', '/plan-arranque'].some(p => pathname.startsWith(p)) && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start" className="w-48">
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
                                                <Link href="/plan-arranque" className="flex items-center gap-2 cursor-pointer font-medium">
                                                    <Rocket className="h-4 w-4 text-orange-500" />
                                                    Plan de Arranque
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
                                )}

                                {/* Dropdown Inteligencia Artificial Avanzada */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className={`relative py-5 transition-colors font-semibold flex items-center gap-1 outline-none ${['/assistant', '/agents'].some(p => pathname.startsWith(p)) ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                                            <Bot className={`h-4 w-4 ${['/assistant', '/agents'].some(p => pathname.startsWith(p)) ? 'text-primary' : 'text-indigo-500'}`} />
                                            Inteligencia Artificial Avanzada
                                            {['/assistant', '/agents'].some(p => pathname.startsWith(p)) && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-52">
                                        <DropdownMenuItem asChild>
                                            <Link href="/assistant" className="flex items-center gap-2 cursor-pointer font-medium">
                                                <MessageSquare className="h-4 w-4 text-pink-500" />
                                                Asistente {shortAgencyName}
                                            </Link>
                                        </DropdownMenuItem>
                                        {!isLiteAgent && !isReferidor && (
                                            <DropdownMenuItem asChild>
                                                <a href="/agents" className="flex items-center gap-2 cursor-pointer font-medium">
                                                    <Bot className="h-4 w-4 text-indigo-600" />
                                                    Agentes IA
                                                </a>
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {/* Dropdown Administración */}
                                {isAdmin && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className={`relative py-5 transition-colors font-semibold flex items-center gap-1 outline-none ${isAdminPath ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                                                <Settings className={`h-4 w-4 ${isAdminPath ? 'text-primary' : 'text-slate-500'}`} />
                                                Admin
                                                {isAdminPath && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start" className="w-48">
                                            <DropdownMenuItem asChild>
                                                <Link href="/admin/referidores" className="flex items-center gap-2 cursor-pointer font-medium">
                                                    <Users className="h-4 w-4 text-teal-600" />
                                                    Referidores
                                                </Link>
                                            </DropdownMenuItem>
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
                                                <Link href="/admin/plan-arranque" className="flex items-center gap-2 cursor-pointer font-medium">
                                                    <Rocket className="h-4 w-4 text-orange-500" />
                                                    Admin P. Arranque
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href="/reportes" className="flex items-center gap-2 cursor-pointer font-medium">
                                                    <ClipboardCheck className="h-4 w-4" />
                                                    Reportes
                                                </Link>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}

                                {/* Dropdown Super Admin */}
                                {isSuperAdmin && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className={`relative py-5 transition-colors font-semibold flex items-center gap-1 outline-none ${isSuperAdminPath ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                                                <CircleUser className={`h-4 w-4 ${isSuperAdminPath ? 'text-primary' : 'text-rose-500'}`} />
                                                Super Admin
                                                {isSuperAdminPath && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start" className="w-52">
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
                                            <DropdownMenuItem asChild>
                                                <Link href="/admin/network" className="flex items-center gap-2 cursor-pointer font-medium">
                                                    <Network className="h-4 w-4 text-indigo-600" />
                                                    Red Multinivel
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href="/admin/system-status" className="flex items-center gap-2 cursor-pointer font-medium">
                                                    <Activity className="h-4 w-4 text-blue-600" />
                                                    Estado de APIs
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href="/admin?tab=votaciones" className="flex items-center gap-2 cursor-pointer font-medium">
                                                    <Sparkles className="h-4 w-4 text-amber-500" />
                                                    Control de Votaciones
                                                </Link>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </>
                        )}
                    </nav>

                    {/* Mobile Drawer Trigger */}
                    <MobileNavigation>
                            <nav className="flex flex-col gap-6 text-lg font-medium">
                                <Link
                                    href="/"
                                    className="flex items-center gap-2 text-lg font-semibold mb-4"
                                >
                                    <img src={agencyLogo} alt={agencyName} className="h-8 w-auto object-contain" />
                                    <span className="sr-only">{shortAgencyName} cotizador</span>
                                </Link>
                                {isSeller && (
                                    <Link
                                        href="/vendedor"
                                        className="text-muted-foreground hover:text-foreground flex items-center gap-2"
                                    >
                                        <Tag className="h-5 w-5 text-amber-500" />
                                        Mi Panel de Vendedor
                                    </Link>
                                )}
                                {showNavLinks && (
                                     <>
                                         {/* Root Links */}
                                         <Link
                                             href="/newsletters"
                                             className="text-muted-foreground hover:text-foreground flex items-center gap-2"
                                         >
                                             <Newspaper className="h-5 w-5 text-zinc-500" />
                                             Newsletters
                                         </Link>
                                         {!isLiteAgent && (
                                             <Link
                                                 href="/activity"
                                                 className="text-muted-foreground hover:text-foreground flex items-center gap-2"
                                             >
                                                 <ClipboardCheck className="h-5 w-5 text-teal-600" />
                                                 {isReferidor ? "Mi Actividad" : "25 puntos"}
                                             </Link>
                                         )}
                                         {!isReferidor && (
                                             <>
                                                 <Link
                                                     href="/pea-prp"
                                                     className="text-muted-foreground hover:text-foreground flex items-center gap-2"
                                                 >
                                                     <Target className="h-5 w-5 text-indigo-600" />
                                                     PEA/PRP
                                                 </Link>
                                                 <Link
                                                     href="/cartera"
                                                     className="text-muted-foreground hover:text-foreground flex items-center gap-2"
                                                 >
                                                     <Wallet className="h-5 w-5 text-green-600" />
                                                     Mi Cartera
                                                 </Link>
                                                 <Link
                                                     href="/team"
                                                     className="text-muted-foreground hover:text-foreground flex items-center gap-2"
                                                 >
                                                     <Users className="h-5 w-5 text-indigo-500" />
                                                     Equipo
                                                 </Link>
                                                 <Link
                                                     href="/ranking"
                                                     className="text-muted-foreground hover:text-foreground flex items-center gap-2"
                                                 >
                                                     <Award className="h-5 w-5 text-amber-500" />
                                                     Ranking
                                                 </Link>
                                                 {!isLiteAgent && allowReferidores && (
                                                     <Link
                                                         href="/referidores"
                                                         className="text-muted-foreground hover:text-foreground flex items-center gap-2"
                                                     >
                                                         <Network className="h-5 w-5 text-emerald-500" />
                                                         Mis Referidores
                                                     </Link>
                                                 )}
                                             </>
                                         )}

                                         {/* Herramientas Section */}
                                         {!isReferidor && (
                                             <div className="space-y-2.5">
                                             <div className="text-[10px] font-mono tracking-wider text-zinc-400 uppercase pt-2">Herramientas</div>
                                             <div className="pl-3 space-y-2.5 border-l border-zinc-200 dark:border-zinc-800">
                                                 <Link href="/documentacion" className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-2">
                                                     <Book className="h-4.5 w-4.5 text-teal-600" />
                                                     Mi Biblioteca
                                                 </Link>
                                                 <Link href="/cotizador" className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-2">
                                                     <Calculator className="h-4.5 w-4.5 text-teal-600" />
                                                     Cotizador
                                                 </Link>
                                                 <Link href="/adn" className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-2">
                                                     <HeartPulse className="h-4.5 w-4.5 text-red-500" />
                                                     ADN
                                                 </Link>
                                                 <Link href="/plan-arranque" className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-2">
                                                     <Rocket className="h-4.5 w-4.5 text-orange-500" />
                                                     Plan de Arranque
                                                 </Link>
                                                 <Link href="/academia" className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-2">
                                                     <GraduationCap className="h-4.5 w-4.5 text-purple-500" />
                                                     Academia
                                                 </Link>
                                             </div>
                                         </div>
                                         )}

                                         {/* IA Avanzada Section */}
                                         {!isLiteAgent && (
                                             <div className="space-y-2.5">
                                                 <div className="text-[10px] font-mono tracking-wider text-zinc-400 uppercase pt-2">IA Avanzada</div>
                                                 <div className="pl-3 space-y-2.5 border-l border-zinc-200 dark:border-zinc-800">
                                                     <Link href="/assistant" className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-2">
                                                         <MessageSquare className="h-4.5 w-4.5 text-pink-500" />
                                                         Asistente {shortAgencyName}
                                                     </Link>
                                                    {!isReferidor && (
                                                        <Link href="/agents" className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-2">
                                                            <Bot className="h-4.5 w-4.5 text-indigo-600" />
                                                            Agentes IA
                                                        </Link>
                                                    )}
                                                 </div>
                                             </div>
                                         )}

                                         {/* Admin Section */}
                                         {isAdmin && (
                                             <div className="space-y-2.5">
                                                 <div className="text-[10px] font-mono tracking-wider text-zinc-400 uppercase pt-2">Administración</div>
                                                 <div className="pl-3 space-y-2.5 border-l border-zinc-200 dark:border-zinc-800">
                                                     <Link href="/votaciones" className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-2">
                                                         <Sparkles className="h-4.5 w-4.5 text-amber-500" />
                                                         Votaciones
                                                     </Link>
                                                     <Link href="/admin" className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-2">
                                                         <Settings className="h-4.5 w-4.5 text-slate-500" />
                                                         Dashboard Admin
                                                     </Link>
                                                     <Link href="/admin/plan-arranque" className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-2">
                                                         <Rocket className="h-4.5 w-4.5 text-orange-500" />
                                                         Admin P. Arranque
                                                     </Link>
                                                     <Link href="/reportes" className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-2">
                                                         <ClipboardCheck className="h-4.5 w-4.5 text-slate-500" />
                                                         Reportes
                                                     </Link>
                                                 </div>
                                             </div>
                                         )}

                                         {/* Super Admin Section */}
                                         {isSuperAdmin && (
                                             <div className="space-y-2.5">
                                                 <div className="text-[10px] font-mono tracking-wider text-rose-400 uppercase pt-2">Super Administración</div>
                                                 <div className="pl-3 space-y-2.5 border-l border-rose-200 dark:border-rose-950/40">
                                                     <Link href="/agencias" className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-2">
                                                         <Building2 className="h-4.5 w-4.5 text-purple-600" />
                                                         Agencias SaaS
                                                     </Link>
                                                     <Link href="/admin/vendedores" className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-2">
                                                         <Users className="h-4.5 w-4.5 text-rose-500" />
                                                         Vendedores
                                                     </Link>
                                                     <Link href="/admin/network" className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-2">
                                                         <Network className="h-4.5 w-4.5 text-indigo-600" />
                                                         Red Multinivel
                                                     </Link>
                                                     <Link href="/admin/system-status" className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-2">
                                                         <Activity className="h-4.5 w-4.5 text-blue-600" />
                                                         Estado de APIs
                                                     </Link>
                                                     <Link href="/admin?tab=votaciones" className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-2">
                                                         <Sparkles className="h-4.5 w-4.5 text-amber-500" />
                                                         Control de Votaciones
                                                     </Link>
                                                 </div>
                                             </div>
                                         )}
                                     </>
                                )}
                            </nav>
                    </MobileNavigation>
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
                <QualitySurveyModal />
            </main>
        </div>
    )
}


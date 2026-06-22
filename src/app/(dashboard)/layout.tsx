import Link from "next/link"
import { headers } from "next/headers"
import { CircleUser, Menu, LogOut, Award, ClipboardCheck, Sparkles, Users, MessageSquare, Wallet, Building2, Settings } from "lucide-react"
import { auth, signOut } from "@/auth"
import { prisma } from "@/lib/prisma"
import { resolveImageUrl } from "@/lib/utils"
import PwaInstaller from "@/components/PwaInstaller"
import { PushNotificationManager } from "@/components/PushNotificationManager"
import { ForcePasswordChange } from "@/components/ForcePasswordChange"
import { SubscriptionBlocker } from "@/components/SubscriptionBlocker"

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

    // First, try to load the agency the authenticated user belongs to.
    let agency = null;
    if (dbUser?.agencyId) {
        agency = await prisma.agency.findUnique({ where: { id: dbUser.agencyId } });
    }

    // If no user/agency, fall back to the slug from middleware
    if (!agency) {
        const headersList = headers();
        const slug = headersList.get('x-agency-slug') || 'aacom';
        agency = await prisma.agency.findUnique({ where: { slug } });
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
    const isSubscriptionActive = agency?.subscriptionStatus === "active" && (!endDate || endDate >= now);
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
                                    className="text-muted-foreground transition-colors hover:text-foreground font-semibold flex items-center gap-1"
                                >
                                    <ClipboardCheck className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                                    {shortAgencyName} 25
                                </Link>
                                <Link
                                    href="/ranking"
                                    className="text-muted-foreground transition-colors hover:text-foreground font-semibold flex items-center gap-1"
                                >
                                    <Award className="h-4 w-4 text-amber-500" />
                                    Ranking
                                </Link>
                                <Link
                                    href="/team"
                                    className="text-muted-foreground transition-colors hover:text-foreground font-semibold flex items-center gap-1"
                                >
                                    <Users className="h-4 w-4 text-indigo-500" />
                                    Equipo {shortAgencyName}
                                </Link>
                                <Link
                                    href="/cartera"
                                    className="text-muted-foreground transition-colors hover:text-foreground font-semibold flex items-center gap-1"
                                >
                                    <Wallet className="h-4 w-4 text-green-600" />
                                    Mi Cartera
                                </Link>
                                <Link
                                    href="/assistant"
                                    className="text-muted-foreground transition-colors hover:text-foreground font-semibold flex items-center gap-1"
                                >
                                    <MessageSquare className="h-4 w-4 text-pink-500" />
                                    Asistente {shortAgencyName}
                                </Link>
                                <Link
                                    href="/cotizador"
                                    className="text-muted-foreground transition-colors hover:text-foreground font-semibold text-teal-600 dark:text-teal-400"
                                >
                                    Cotizador
                                </Link>
                                <Link
                                    href="/adn"
                                    className="text-muted-foreground transition-colors hover:text-foreground font-semibold text-teal-600 dark:text-teal-400"
                                >
                                    ADN {shortAgencyName}
                                </Link>
                                {isAdmin && (
                                    <>
                                        <Link
                                            href="/admin"
                                            className="text-muted-foreground transition-colors hover:text-foreground font-semibold"
                                        >
                                            Admin
                                        </Link>
                                        <Link
                                            href="/reportes"
                                            className="text-muted-foreground transition-colors hover:text-foreground font-semibold"
                                        >
                                            Reportes
                                        </Link>
                                    </>
                                )}
                                {isSuperAdmin && (
                                    <Link
                                        href="/agencias"
                                        className="text-muted-foreground transition-colors hover:text-foreground font-semibold flex items-center gap-1"
                                    >
                                        <Building2 className="h-4 w-4 text-purple-600" />
                                        Agencias SaaS
                                    </Link>
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
                        <SheetContent side="left" className="w-[280px]">
                            <nav className="grid gap-6 text-lg font-medium">
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
                                            href="/cotizador"
                                            className="text-muted-foreground hover:text-foreground"
                                        >
                                            Cotizador
                                        </Link>
                                        <Link
                                            href="/adn"
                                            className="text-muted-foreground hover:text-foreground"
                                        >
                                            ADN {shortAgencyName}
                                        </Link>
                                        {isAdmin && (
                                            <>
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


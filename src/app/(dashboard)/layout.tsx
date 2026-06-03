import Link from "next/link"
import { CircleUser, Menu, LogOut, Award, ClipboardCheck, Sparkles, Users, MessageSquare } from "lucide-react"
import { auth, signOut } from "@/auth"
import { prisma } from "@/lib/prisma"
import { resolveImageUrl } from "@/lib/utils"
import PwaInstaller from "@/components/PwaInstaller"
import { PushNotificationManager } from "@/components/PushNotificationManager"

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

    const isAdmin = dbUser?.role === 'ADMIN';
    const userImage = resolveImageUrl(dbUser?.image); // base64 or resolved google drive link
    const userName = dbUser?.name || session?.user?.name || "Agente";
    const userEmail = dbUser?.email || session?.user?.email || "";

    // Server-side native logout action
    const handleLogout = async () => {
        "use server";
        await signOut({ redirectTo: "/login" });
    };

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
                            <img src="/logo.png" alt="AACOM Seguros" className="h-7 w-auto object-contain" />
                            <span className="sr-only">AACOM cotizador</span>
                        </Link>
                        <Link
                            href="/activity"
                            className="text-muted-foreground transition-colors hover:text-foreground font-semibold flex items-center gap-1"
                        >
                            <ClipboardCheck className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                            AACOM 25
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
                            Equipo AACOM
                        </Link>
                        <Link
                            href="/assistant"
                            className="text-muted-foreground transition-colors hover:text-foreground font-semibold flex items-center gap-1"
                        >
                            <MessageSquare className="h-4 w-4 text-pink-500" />
                            Asistente AACOM
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
                            ADN AACOM
                        </Link>
                        {isAdmin && (
                            <a
                                href="/admin"
                                className="text-muted-foreground transition-colors hover:text-foreground font-semibold cursor-pointer"
                            >
                                Admin
                            </a>
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
                                    <img src="/logo.png" alt="AACOM Seguros" className="h-8 w-auto object-contain" />
                                    <span className="sr-only">AACOM cotizador</span>
                                </Link>
                                <Link
                                    href="/activity"
                                    className="text-muted-foreground hover:text-foreground flex items-center gap-2"
                                >
                                    <ClipboardCheck className="h-5 w-5 text-teal-600" />
                                    AACOM 25
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
                                    Equipo AACOM
                                </Link>
                                <Link
                                    href="/assistant"
                                    className="text-muted-foreground hover:text-foreground flex items-center gap-2"
                                >
                                    <MessageSquare className="h-5 w-5 text-pink-500" />
                                    Asistente AACOM
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
                                    ADN AACOM
                                </Link>
                                {isAdmin && (
                                    <a
                                        href="/admin"
                                        className="text-muted-foreground hover:text-foreground cursor-pointer"
                                    >
                                        Admin
                                    </a>
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
                            <DropdownMenuItem className="text-xs font-bold text-slate-700 dark:text-zinc-300 py-2.5 rounded-xl cursor-pointer">
                                Configuración
                            </DropdownMenuItem>
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
                {children}
                <PwaInstaller />
                <PushNotificationManager />
            </main>
        </div>
    )
}

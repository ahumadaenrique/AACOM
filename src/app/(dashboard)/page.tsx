import { prisma } from "@/lib/prisma"
import ClientHome from "./ClientHome"

export default async function HomePage() {
    const announcements = await prisma.content.findMany({
        where: {
            type: 'HOME_AD',
            active: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    })

    return (
        <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto py-4 animate-in fade-in duration-300">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-slate-100">Inicio</h1>
                    <span className="h-2.5 w-2.5 rounded-full bg-teal-500 animate-pulse" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">Bienvenido a la plataforma AACOM cotizador</p>
            </div>

            <ClientHome announcements={announcements} />
        </div>
    )
}

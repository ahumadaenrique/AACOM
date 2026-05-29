import { Card, CardContent } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"
import { ArrowUpRight, Sparkles, Megaphone } from "lucide-react"

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

    const hasAnnouncements = announcements && announcements.length > 0

    return (
        <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto py-4 animate-in fade-in duration-300">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-slate-100">Inicio</h1>
                    <span className="h-2.5 w-2.5 rounded-full bg-teal-500 animate-pulse" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">Bienvenido a la plataforma AACOM cotizador</p>
            </div>

            {hasAnnouncements ? (
                <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800">
                        <Megaphone className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                        <h2 className="text-base font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            Comunicados y Campañas Activas
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {announcements.map((ad, idx) => {
                            // If it's the very first banner and there are multiple, make it look featured
                            const isFeatured = idx === 0 && announcements.length > 1
                            const cardColSpan = isFeatured ? "col-span-1 md:col-span-2 lg:col-span-2" : "col-span-1"
                            const cardHeight = "h-64 md:h-72"
                            
                            const cardContent = (
                                <div className="relative w-full h-full group overflow-hidden bg-slate-50 dark:bg-zinc-950 flex items-center justify-center">
                                    {/* Blurred background of the image to handle different ratios gracefully */}
                                    <div 
                                        className="absolute inset-0 bg-cover bg-center blur-md scale-105 opacity-30 select-none pointer-events-none" 
                                        style={{ backgroundImage: `url(${ad.imageUrl})` }}
                                    />
                                    
                                    {/* The actual sharp image */}
                                    <img 
                                        src={ad.imageUrl} 
                                        alt="Comunicado AACOM" 
                                        className="relative z-10 max-w-full max-h-full object-contain transition-all duration-500 group-hover:scale-[1.02]" 
                                    />
                                    
                                    {/* Premium glassmorphic tag on top right if it has a click link */}
                                    {ad.linkUrl && (
                                        <div className="absolute top-4 right-4 z-20 bg-black/45 backdrop-blur-md text-white p-2 rounded-full border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow">
                                            <ArrowUpRight className="h-4.5 w-4.5" />
                                        </div>
                                    )}

                                    {/* Subtle border overlay */}
                                    <div className="absolute inset-0 border border-transparent group-hover:border-teal-500/20 rounded-xl transition-all duration-300 pointer-events-none z-30" />
                                </div>
                            )

                            if (ad.linkUrl) {
                                return (
                                    <a 
                                        key={ad.id} 
                                        href={ad.linkUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className={`${cardColSpan} ${cardHeight} block overflow-hidden rounded-xl border border-slate-200/60 dark:border-zinc-800/80 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}
                                    >
                                        {cardContent}
                                    </a>
                                )
                            }

                            return (
                                <div 
                                    key={ad.id} 
                                    className={`${cardColSpan} ${cardHeight} overflow-hidden rounded-xl border border-slate-200/60 dark:border-zinc-800/80 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300`}
                                >
                                    {cardContent}
                                </div>
                            )
                        })}
                    </div>
                </div>
            ) : (
                /* Fallback original static banners if no dynamic ones exist */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card className="col-span-1 md:col-span-2 lg:col-span-2 overflow-hidden border-0 shadow-lg relative h-64 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-center hover:scale-[1.01] hover:shadow-xl transition-all duration-300">
                        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1574&q=80')] bg-cover bg-center"></div>
                        <div className="relative z-10 text-center p-6">
                            <h2 className="text-4xl font-extrabold mb-2 tracking-tight">CAMPAÑA 2025</h2>
                            <p className="text-lg font-medium opacity-90">¡Supera tus metas y gana un viaje a Cancún!</p>
                        </div>
                    </Card>

                    <Card className="overflow-hidden border-0 shadow-md relative h-64 bg-zinc-900 text-white flex items-center justify-center hover:scale-[1.01] hover:shadow-xl transition-all duration-300">
                        <div className="text-center p-6">
                            <h3 className="text-2xl font-bold mb-2 tracking-tight">Aviso Importante</h3>
                            <p className="text-sm opacity-80">Recuerda subir tus pólizas antes del corte del viernes.</p>
                        </div>
                    </Card>

                    <Card className="col-span-1 md:col-span-3 h-48 bg-gray-50 dark:bg-zinc-900 border-dashed border-2 flex flex-col items-center justify-center text-muted-foreground rounded-xl border-slate-300/80">
                        <Sparkles className="h-6 w-6 text-slate-400 mb-2 animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Espacio para comunicados de administración</span>
                        <span className="text-[10px] text-slate-400 mt-1 text-center max-w-md px-4">Los avisos y banners mensuales subidos por el administrador se mostrarán aquí de forma dinámica.</span>
                    </Card>
                </div>
            )}
        </div>
    )
}

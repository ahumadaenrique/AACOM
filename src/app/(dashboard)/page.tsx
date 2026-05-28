import { Card, CardContent } from "@/components/ui/card"

export default function HomePage() {
    return (
        <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Inicio</h1>
                <p className="text-muted-foreground">Bienvenido a la plataforma AACOM cotizador</p>
            </div>

            {/* Communication Panel - Grid of Banners/Gifs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Placeholder for GIFs/Ads */}
                <Card className="col-span-1 md:col-span-2 lg:col-span-2 overflow-hidden border-0 shadow-lg relative h-64 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-center">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1574&q=80')] bg-cover bg-center"></div>
                    <div className="relative z-10 text-center p-6">
                        <h2 className="text-4xl font-extrabold mb-2">CAMPAÑA 2025</h2>
                        <p className="text-lg font-medium opacity-90">¡Supera tus metas y gana un viaje a Cancún!</p>
                    </div>
                </Card>

                <Card className="overflow-hidden border-0 shadow-md relative h-64 bg-zinc-900 text-white flex items-center justify-center">
                    <div className="text-center p-6">
                        <h3 className="text-2xl font-bold mb-2">Aviso Importante</h3>
                        <p className="text-sm opacity-80">Recuerda subir tus pólizas antes del corte del viernes.</p>
                    </div>
                </Card>

                <Card className="col-span-1 md:col-span-3 h-48 bg-gray-100 dark:bg-zinc-800 border-dashed border-2 flex items-center justify-center text-muted-foreground">
                    <span>Espacio para más comunicados (GIFs animados)</span>
                </Card>
            </div>
        </div>
    )
}

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
// Usamos la etiqueta estándar de HTML <label> para evitar errores de componentes faltantes


export default function PoliciesPage() {
    return (
        <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Gestión de Pólizas</h1>
                <p className="text-muted-foreground">Administra y consulta las pólizas de tu cartera.</p>
            </div>

            <Tabs defaultValue="entry" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8">
                    <TabsTrigger value="entry">Ingresar Póliza</TabsTrigger>
                    <TabsTrigger value="search">Consulta de Pólizas</TabsTrigger>
                </TabsList>

                <TabsContent value="entry">
                    <Card>
                        <CardHeader>
                            <CardTitle>Nueva Póliza</CardTitle>
                            <CardDescription>
                                Registra los datos de la nueva póliza y adjunta el PDF correspondiente.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Número de Póliza</label>
                                    <Input placeholder="Ej. POL-123456" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Fecha de Vigencia</label>
                                    <Input type="date" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Contratante</label>
                                    <Input placeholder="Nombre completo" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Asegurado</label>
                                    <Input placeholder="Nombre completo" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Forma de Pago</label>
                                    <Input placeholder="Anual, Semestral..." />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Archivo PDF</label>
                                    <Input type="file" accept=".pdf" />
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end">
                                <Button className="w-full md:w-auto">Guardar Póliza</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="search">
                    <Card>
                        <CardHeader>
                            <CardTitle>Búsqueda</CardTitle>
                            <CardDescription>
                                Encuentra pólizas por nombre, número o fecha de renovación.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col md:flex-row gap-4">
                                <Input className="flex-1" placeholder="Buscar por nombre, póliza..." />
                                <Button>Buscar</Button>
                            </div>

                            <div className="rounded-md border p-8 text-center text-muted-foreground">
                                Los resultados de la búsqueda aparecerán aquí.
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

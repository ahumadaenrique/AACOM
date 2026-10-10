import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AgencySettingsForm from "./AgencySettingsForm";

export default async function AgencySettingsPage() {
    const session = await auth();
    if (!session?.user?.email) redirect("/login");

    const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email }
    });

    if (dbUser?.role !== "ADMIN" && dbUser?.role !== "AGENCIA_ADMIN" && dbUser?.role !== "SUPER_ADMIN") {
        redirect("/"); // Unauthorized
    }

    const headersList = headers();
    let slug = headersList.get('x-agency-slug') || process.env.NEXT_PUBLIC_DEFAULT_AGENCY_SLUG || 'aacom';

    let agency = null;
    if (dbUser?.agencyId) {
        agency = await prisma.agency.findUnique({
            where: { id: dbUser.agencyId }
        });
    }

    if (!agency) {
        agency = await prisma.agency.findUnique({
            where: { slug }
        });
    }

    if (!agency) {
        return (
            <div className="flex h-full w-full items-center justify-center p-8">
                <p className="text-muted-foreground text-center">Agencia no encontrada. Por favor, asegúrate de estar asignado a una agencia en tu perfil.</p>
            </div>
        );
    }

    // Estadísticas de uso de IA de la agencia este mes
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyCalls = await prisma.roleplayCall.findMany({
        where: {
            agencyId: agency.id,
            createdAt: { gte: startOfMonth }
        },
        select: { durationSeconds: true }
    });
    const monthlySeconds = monthlyCalls.reduce((acc, c) => acc + (c.durationSeconds || 0), 0);
    const monthlyMinutes = Math.round(monthlySeconds / 60);

    return (
        <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto py-4 animate-in fade-in duration-300">
            <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-slate-100">Mi Agencia SaaS</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Personaliza la marca, el logotipo, la paleta de colores y la conexión de IA de tu plataforma.
                </p>
            </div>
            
            <AgencySettingsForm 
                id={agency.id}
                slug={agency.slug} 
                initialName={agency.name} 
                initialColor={agency.primaryColor || "#4f46e5"} 
                initialLogo={agency.logoUrl} 
                voiceSecondsBalance={agency.voiceSecondsBalance || 0}
                monthlyMinutes={monthlyMinutes}
            />
        </div>
    );
}

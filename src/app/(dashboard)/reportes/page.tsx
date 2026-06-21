import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import dynamic from "next/dynamic";

// Disable SSR for the client component to prevent Server-Side Rendering crashes
const ReportesClient = dynamic(() => import("./ReportesClient"), { ssr: false });

export async function generateMetadata() {
    const { headers } = await import("next/headers");
    const { prisma } = await import("@/lib/prisma");
    const headersList = headers();
    const slug = headersList.get('x-agency-slug') || 'aacom';
    const agency = await prisma.agency.findUnique({ where: { slug } });
    return {
        title: `Reportes Gerenciales - ${agency?.name || 'AACOM'}`
    };
}

export default async function ReportesPage() {
    const session = await auth();
    if (!session?.user?.email) {
        redirect("/login");
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
            redirect("/activity");
        }
        
        const headersList = await import("next/headers").then(m => m.headers());
        const slug = headersList.get('x-agency-slug') || 'aacom';
        let agency = await prisma.agency.findUnique({ where: { slug } });
        if (!agency) agency = await prisma.agency.findUnique({ where: { slug: 'aacom' } });
        const agencyName = agency?.name || 'AACOM Seguros';

        return <ReportesClient agencyName={agencyName} />;
    } catch (e: any) {
        if (e.message && e.message.includes('NEXT_REDIRECT')) {
            throw e;
        }
        return <div className="p-10 text-red-500 font-bold">Error en ReportesPage: {e.message || String(e)}</div>;
    }
}

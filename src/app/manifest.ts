import { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
    const headersList = headers();
    const slug = headersList.get('x-agency-slug') || 'aacom';

    let agency = await prisma.agency.findUnique({ where: { slug } });
    if (!agency) {
        agency = await prisma.agency.findUnique({ where: { slug: 'aacom' } });
    }

    const agencyName = agency?.name || "Sistema Agencias";
    const logoUrl = agency?.logoUrl || "/icons/manifest-icon-512.maskable.png";

    return {
        name: `Portal de ${agencyName}`,
        short_name: agencyName,
        description: `Aplicación de Gestión para ${agencyName}`,
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#0d9488',
        icons: [
            {
                src: logoUrl,
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any maskable'
            },
            {
                src: logoUrl,
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any maskable'
            }
        ]
    };
}

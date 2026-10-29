import { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
    const headersList = headers();
    const slug = headersList.get('x-agency-slug') || process.env.NEXT_PUBLIC_DEFAULT_AGENCY_SLUG || 'aacom';

    let agency = null;
    try {
        agency = await prisma.agency.findUnique({ where: { slug } });
    } catch (e) {
        console.warn("Could not fetch agency for dynamic manifest, using defaults:", e);
    }

    const agencyName = agency?.name || "AACOMSoft";
    const themeColor = agency?.primaryColor || "#0d9488";

    return {
        id: '/',
        name: `Portal de ${agencyName}`,
        short_name: agencyName.substring(0, 12),
        description: `Aplicación de Gestión para ${agencyName}`,
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0f172a',
        theme_color: themeColor,
        icons: [
            {
                src: '/icons/manifest-icon-192.maskable.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any'
            },
            {
                src: '/icons/manifest-icon-192.maskable.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'maskable'
            },
            {
                src: '/icons/manifest-icon-512.maskable.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any'
            },
            {
                src: '/icons/manifest-icon-512.maskable.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable'
            },
            {
                src: '/icons/apple-icon-180.png',
                sizes: '180x180',
                type: 'image/png',
                purpose: 'any'
            }
        ]
    };
}

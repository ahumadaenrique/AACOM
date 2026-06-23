import type { Metadata, Viewport } from "next";
// import { Inter } from "next/font/google"; // Can't easily import fonts without next build system verifying? It should be fine.
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

// const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
    const { headers } = await import("next/headers");
    const { prisma } = await import("@/lib/prisma");
    const headersList = headers();
    const slug = headersList.get('x-agency-slug') || 'aacom';
    let agency = await prisma.agency.findUnique({ where: { slug } });
    if (!agency) {
        agency = await prisma.agency.findUnique({ where: { slug: 'aacom' } });
    }
    const agencyName = agency?.name || "AACOM Seguros";

    return {
        title: `SYSGPYA | ${agencyName}`,
        description: "Sistema de Gestión de Promotorías y Agencias",
        appleWebApp: {
            capable: true,
            statusBarStyle: "default",
            title: agencyName,
            startupImage: [
                { url: '/icons/apple-splash-2048-2732.jpg', media: '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
                { url: '/icons/apple-splash-2732-2048.jpg', media: '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)' },
                { url: '/icons/apple-splash-1668-2388.jpg', media: '(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
                { url: '/icons/apple-splash-2388-1668.jpg', media: '(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)' },
                { url: '/icons/apple-splash-1536-2048.jpg', media: '(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
                { url: '/icons/apple-splash-2048-1536.jpg', media: '(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)' },
                { url: '/icons/apple-splash-1668-2224.jpg', media: '(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
                { url: '/icons/apple-splash-2224-1668.jpg', media: '(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)' },
                { url: '/icons/apple-splash-1620-2160.jpg', media: '(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
                { url: '/icons/apple-splash-2160-1620.jpg', media: '(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)' },
                { url: '/icons/apple-splash-1290-2796.jpg', media: '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
                { url: '/icons/apple-splash-2796-1290.jpg', media: '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)' },
                { url: '/icons/apple-splash-1179-2556.jpg', media: '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
                { url: '/icons/apple-splash-2556-1179.jpg', media: '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)' },
                { url: '/icons/apple-splash-1284-2778.jpg', media: '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
                { url: '/icons/apple-splash-2778-1284.jpg', media: '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)' },
                { url: '/icons/apple-splash-1170-2532.jpg', media: '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
                { url: '/icons/apple-splash-2532-1170.jpg', media: '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)' },
                { url: '/icons/apple-splash-1125-2436.jpg', media: '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
                { url: '/icons/apple-splash-2436-1125.jpg', media: '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)' },
                { url: '/icons/apple-splash-1242-2688.jpg', media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
                { url: '/icons/apple-splash-2688-1242.jpg', media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)' },
                { url: '/icons/apple-splash-828-1792.jpg', media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
                { url: '/icons/apple-splash-1792-828.jpg', media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)' },
                { url: '/icons/apple-splash-1242-2208.jpg', media: '(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
                { url: '/icons/apple-splash-2208-1242.jpg', media: '(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)' },
                { url: '/icons/apple-splash-750-1334.jpg', media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
                { url: '/icons/apple-splash-1334-750.jpg', media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)' },
                { url: '/icons/apple-splash-640-1136.jpg', media: '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
                { url: '/icons/apple-splash-1136-640.jpg', media: '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)' }
            ]
        }
    };
}

export const viewport: Viewport = {
    themeColor: "#0d9488",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false
};

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

function hexToHsl(hex: string) {
    hex = hex.replace(/#/g, '');
    if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return `${(h * 360).toFixed(1)} ${(s * 100).toFixed(1)}% ${(l * 100).toFixed(1)}%`;
}

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const headersList = headers();
    const slug = headersList.get('x-agency-slug') || 'aacom';

    let agency = await prisma.agency.findUnique({
        where: { slug }
    });

    if (!agency) {
        agency = await prisma.agency.findUnique({ where: { slug: 'aacom' } });
    }

    let agencyColor = null;
    try {
        if (agency?.primaryColor) {
            agencyColor = hexToHsl(agency.primaryColor);
        }
    } catch (e) {
        // Fallback si la DB no está lista o hay error
    }

    return (
        <html lang="es">
            <body className={`min-h-screen bg-background font-sans antialiased flex flex-col`}>
                {agencyColor && (
                    <style dangerouslySetInnerHTML={{ __html: `:root { --primary: ${agencyColor}; }` }} />
                )}
                <div className="flex-1 flex flex-col">
                    {children}
                </div>
                <footer className="py-4 bg-slate-50 dark:bg-zinc-950 border-t border-slate-200 dark:border-zinc-800 text-center z-50">
                    <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                        Este es un producto desarrollado por <span className="text-indigo-600 font-bold dark:text-indigo-400">AACOMSoft</span> una empresa de Grupo AACOM
                    </p>
                </footer>
                <Toaster />
                <Analytics />
                <SpeedInsights />
            </body>
        </html>
    );
}

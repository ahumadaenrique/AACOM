import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { FooterWrapper } from "@/components/FooterWrapper";
import { StitchPreviewBanner } from "@/components/StitchPreviewBanner";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function generateMetadata(): Promise<Metadata> {
    const headersList = headers();
    const slug = headersList.get('x-agency-slug') || process.env.NEXT_PUBLIC_DEFAULT_AGENCY_SLUG || 'aacom';
    let agency = null;
    try {
        agency = await prisma.agency.findUnique({ where: { slug } });
    } catch (e) {
        // Fallback during static generation or DB blip
    }
    const agencyName = agency?.name || "AACOMSoft";

    return {
        title: "AACOMSoft · Plataforma de Gestión Integral para Promotorías de Seguros",
        description: "Una promotoría eficiente con los roles necesarios en una única plataforma: dirección, reclutamiento, coaching y agentes. Actividad por puntos, Academia CNSF Cédula A y B, talleres TIPS, diagnóstico ADN, cartera e IA.",
        manifest: "/manifest.webmanifest",
        icons: {
            icon: [
                { url: "/icons/manifest-icon-192.maskable.png", sizes: "192x192", type: "image/png" },
                { url: "/icons/manifest-icon-512.maskable.png", sizes: "512x512", type: "image/png" },
            ],
            apple: [
                { url: "/icons/apple-icon-180.png", sizes: "180x180", type: "image/png" },
            ],
        },
        openGraph: {
            title: "AACOMSoft · Plataforma de Gestión Integral para Promotorías de Seguros",
            description: "Una promotoría eficiente con los roles necesarios en una única plataforma: dirección, reclutamiento, coaching y agentes. Actividad por puntos, Academia CNSF Cédula A y B, talleres TIPS, diagnóstico ADN, cartera e IA.",
            url: "https://www.aacomsoft.com",
            siteName: "AACOMSoft",
            locale: "es_MX",
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title: "AACOMSoft · Plataforma de Gestión Integral para Promotorías de Seguros",
            description: "Una promotoría eficiente con los roles necesarios en una única plataforma: dirección, reclutamiento, coaching y agentes. Actividad por puntos, Academia CNSF Cédula A y B, talleres TIPS, diagnóstico ADN, cartera e IA.",
        },
        verification: {
            google: "5kX4pRTxF91CuddNpfrYcKAN-EeTtDVfRu6KvFi69RU",
        },
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
        },
        formatDetection: {
            telephone: false,
        }
    };
}

export const viewport: Viewport = {
    themeColor: "#0d9488",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover"
};

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


export const dynamic = 'force-dynamic';

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const session = await auth();
    let agency = null;

    if (session?.user?.email) {
        const dbUser = await prisma.user.findUnique({
            where: { email: session.user.email.toLowerCase() },
            include: { agency: true }
        });
        if (dbUser?.agency) {
            agency = dbUser.agency;
        }
    }

    if (!agency) {
        const headersList = headers();
        const slug = headersList.get('x-agency-slug') || process.env.NEXT_PUBLIC_DEFAULT_AGENCY_SLUG || 'aacom';
        agency = await prisma.agency.findUnique({ where: { slug } });
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
        <html lang="es-MX" data-stitch-mode="stitch">
            <body className={`min-h-screen bg-background font-sans antialiased flex flex-col`}>
                {agencyColor && (
                    <style dangerouslySetInnerHTML={{ __html: `:root { --primary: ${agencyColor}; }` }} />
                )}
                <StitchPreviewBanner />
                <div className="flex-1 flex flex-col">
                    {children}
                </div>
                <FooterWrapper />
                <Toaster />
                <Analytics />
                <SpeedInsights />
            </body>
        </html>
    );
}

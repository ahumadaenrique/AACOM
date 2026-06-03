import type { Metadata, Viewport } from "next";
// import { Inter } from "next/font/google"; // Can't easily import fonts without next build system verifying? It should be fine.
import "./globals.css";

// const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "AACOM cotizador - CRM",
    description: "Plataforma de Desarrollo de Agentes",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "AACOM Seguros"
    }
};

export const viewport: Viewport = {
    themeColor: "#0d9488",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es">
            <body className={`min-h-screen bg-background font-sans antialiased`}>{children}</body>
        </html>
    );
}

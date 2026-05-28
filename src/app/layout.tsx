import type { Metadata } from "next";
// import { Inter } from "next/font/google"; // Can't easily import fonts without next build system verifying? It should be fine.
import "./globals.css";

// const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "AACOM cotizador - CRM",
    description: "Plataforma de Desarrollo de Agentes",
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

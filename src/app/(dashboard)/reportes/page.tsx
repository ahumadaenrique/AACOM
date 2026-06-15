import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ReportesClient from "./ReportesClient";

export const metadata = {
    title: "Reportes Gerenciales - AACOM",
};

export default async function ReportesPage() {
    const session = await auth();
    if (!session?.user?.email) {
        redirect("/login");
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    });

    if (!user || user.role !== 'ADMIN') {
        redirect("/activity");
    }

    return <ReportesClient />;
}

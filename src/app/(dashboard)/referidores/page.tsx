import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ReferidoresClient from "./ReferidoresClient";

export default async function ReferidoresPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    });

    if (dbUser?.role !== 'AGENTE' && dbUser?.role !== 'ADMIN' && dbUser?.role !== 'SUPER_ADMIN') {
        redirect("/");
    }

    return (
        <div className="flex flex-col h-full">
            <div className="border-b bg-white dark:bg-zinc-950 px-6 py-4">
                <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-zinc-100">
                    Mis Referidores
                </h1>
                <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
                    Monitorea la actividad diaria de los referidores que te han sido asignados.
                </p>
            </div>
            <div className="flex-1 p-6 overflow-auto bg-slate-50">
                <ReferidoresClient />
            </div>
        </div>
    );
}

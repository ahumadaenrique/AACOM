import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ReferidoresClient from "./ReferidoresClient";

export default async function ReferidoresPage() {
    const session = await auth();
    if (!session?.user?.id && !session?.user?.email) redirect("/login");

    const dbUser = session?.user?.id
        ? await prisma.user.findUnique({
              where: { id: session.user.id },
              select: { role: true, name: true }
          })
        : await prisma.user.findUnique({
              where: { email: session.user.email!.toLowerCase() },
              select: { role: true, name: true }
          });

    if (dbUser?.role !== "AGENTE" && dbUser?.role !== "ADMIN" && dbUser?.role !== "SUPER_ADMIN") {
        redirect("/");
    }

    return (
        <div className="flex flex-col h-full max-w-7xl mx-auto w-full">
            <div className="flex-1 p-2 md:p-4">
                <ReferidoresClient agentName={dbUser?.name || "Agente"} />
            </div>
        </div>
    );
}

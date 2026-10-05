import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AdminProduccion from "../AdminProduccion";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminProduccionPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true, email: true }
    });

    if (dbUser?.role !== "ADMIN" && dbUser?.role !== "SUPER_ADMIN") {
        redirect("/");
    }

    return (
        <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
            <AdminProduccion />
        </div>
    );
}

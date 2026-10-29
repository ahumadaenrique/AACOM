import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCorporateEmailOverview } from "./actions";
import { CorporateEmailAdminClient } from "./CorporateEmailAdminClient";

export const dynamic = "force-dynamic";

export default async function CorreosCorporativosAdminPage({
  searchParams,
}: {
  searchParams?: { agencyId?: string; activated?: string };
}) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
  });

  if (!user) {
    redirect("/login");
  }

  // Si es un agente regular, llevarlo directamente a su bandeja "📧 Mi Correo"
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    redirect("/mi-correo");
  }

  try {
    const overviewData = await getCorporateEmailOverview(searchParams?.agencyId);
    return <CorporateEmailAdminClient initialData={overviewData} />;
  } catch {
    redirect("/");
  }
}

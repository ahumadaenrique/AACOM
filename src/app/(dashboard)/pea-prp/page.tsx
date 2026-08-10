import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import PeaPrpClient from "./PeaPrpClient";
import PremiumGuard from "@/components/PremiumGuard";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Gestión de Desempeño PEA/PRP/JEP",
};

export default async function PeaPrpPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/auth/signin");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true }
  });

  if (!user) {
    redirect("/auth/signin");
  }

  return (
    <PremiumGuard userRole={user.role} moduleName="Gestión de Desempeño PEA/PRP/JEP">
      <PeaPrpClient userRole={user.role} />
    </PremiumGuard>
  );
}

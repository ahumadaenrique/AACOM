import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import PeaPrpClient from "./PeaPrpClient";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Gestión de Desempeño PEA/PRP",
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

  return <PeaPrpClient userRole={user.role} />;
}

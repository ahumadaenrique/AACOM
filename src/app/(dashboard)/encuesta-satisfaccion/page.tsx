import React from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import PremiumGuard from "@/components/PremiumGuard";
import EncuestaSatisfaccionClient from "./EncuestaSatisfaccionClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EncuestaSatisfaccionPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, name: true, email: true, role: true, agencyId: true },
  });

  if (!dbUser) {
    redirect("/login");
  }

  return (
    <PremiumGuard userRole={dbUser.role} moduleName="Encuesta de Satisfacción y Referidos">
      <EncuestaSatisfaccionClient currentUser={dbUser} />
    </PremiumGuard>
  );
}

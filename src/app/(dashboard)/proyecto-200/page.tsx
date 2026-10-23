import React from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import PremiumGuard from "@/components/PremiumGuard";
import { redirect } from "next/navigation";
import {
  getProject200DashboardData,
  getAdminProject200Analytics,
} from "./actions";
import Proyecto200Client from "./Proyecto200Client";

export const dynamic = "force-dynamic";

export default async function Proyecto200Page(props: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      agencyId: true,
      agency: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!dbUser) {
    redirect("/login");
  }

  const resolvedSearchParams = props.searchParams ? await props.searchParams : {};
  const isAdmin = dbUser.role === "ADMIN" || dbUser.role === "SUPER_ADMIN";

  const [dashboardRes, adminRes] = await Promise.all([
    getProject200DashboardData(),
    isAdmin ? getAdminProject200Analytics() : Promise.resolve(null),
  ]);

  return (
    <PremiumGuard
      userRole={dbUser.role}
      moduleName="Proyecto 200 — Prospección Inteligente y CRM"
    >
      <Proyecto200Client
        currentUser={{
          id: dbUser.id,
          name: dbUser.name || dbUser.email,
          email: dbUser.email,
          role: dbUser.role,
          agencyId: dbUser.agencyId || "aacom",
          agencyName: dbUser.agency?.name || "Promotoría Principal",
        }}
        initialData={dashboardRes}
        initialAdminData={adminRes}
        initialTab={resolvedSearchParams?.tab}
      />
    </PremiumGuard>
  );
}

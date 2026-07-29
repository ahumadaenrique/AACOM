import { getDays } from "./actions";
import { AdminPlanClient } from "./AdminPlanClient";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Admin Plan de Arranque",
};

export default async function AdminPlanPage() {
  let days: any[] = [];
  let errorMsg = null;
  let session: any = null;

  try {
    session = await auth();
    let userRole = session?.user?.role;
    
    if (session?.user?.email) {
        const dbUser = await prisma.user.findUnique({
            where: { email: session.user.email.toLowerCase() }
        });
        if (dbUser) userRole = dbUser.role;
    }

    console.log("AdminPlanPage Debug: session role=", session?.user?.role, "dbUser role=", userRole, "email=", session?.user?.email);

    // Temp removed redirect for debugging
    
    days = await getDays();
  } catch (err: any) {
    if (err.message === "NEXT_REDIRECT") {
      throw err; // Allow Next.js redirect to work
    }
    errorMsg = err.message || err.toString();
  }

  if (errorMsg) {
    return <div className="p-8 text-red-500 font-bold">Error interno: {errorMsg}</div>;
  }

  return <AdminPlanClient initialDays={days} />;
}

import { getAgentsProgress } from "./actions";
import { SeguimientoClient } from "./SeguimientoClient";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Seguimiento - Plan de Arranque",
};

export default async function SeguimientoPage() {
  let users: any[] = [];
  let totalDaysCount = 0;
  let errorMsg = null;
  let session: any = null;

  try {
    session = await auth();
    if (session?.user?.role !== "SUPER_ADMIN" && session?.user?.role !== "ADMIN") {
      redirect("/");
    }

    const res = await getAgentsProgress();
    users = res.users;
    totalDaysCount = res.totalDaysCount;
  } catch (err: any) {
    if (err.message === "NEXT_REDIRECT") {
      throw err; // Allow Next.js redirect to work
    }
    errorMsg = err.message || err.toString();
  }

  if (errorMsg) {
    return <div className="p-8 text-red-500 font-bold">Error interno: {errorMsg}</div>;
  }

  return <SeguimientoClient initialAgents={users} totalDaysCount={totalDaysCount} />;
}

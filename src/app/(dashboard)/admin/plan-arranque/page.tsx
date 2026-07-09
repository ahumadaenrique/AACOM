import { getDays } from "./actions";
import { AdminPlanClient } from "./AdminPlanClient";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Admin Plan de Arranque",
};

export default async function AdminPlanPage() {
  let days: any[] = [];
  let errorMsg = null;
  let session: any = null;

  try {
    session = await auth();
    if (session?.user?.role !== "SUPER_ADMIN" && session?.user?.role !== "ADMIN") {
      redirect("/");
    }
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

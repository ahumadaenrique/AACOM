import { getAgentCurrentDay } from "./actions";
import { AgentPlanClient } from "./AgentPlanClient";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Plan de Arranque",
};

export default async function PlanArranquePage() {
  const session = await auth();
  
  // Temporalmente solo visible para Super Admin
  if (session?.user?.role !== "SUPER_ADMIN") {
    redirect("/");
  }

  const { progress, dayData, totalDaysCount, allDays } = await getAgentCurrentDay();
  
  return (
    <AgentPlanClient 
      progress={progress} 
      dayData={dayData} 
      totalDaysCount={totalDaysCount} 
      allDays={allDays}
      userName={session?.user?.name || "Agente"} 
    />
  );
}

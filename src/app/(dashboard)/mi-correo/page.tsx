import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAgentWebmailData } from "@/app/(dashboard)/correos-corporativos/actions";
import { AgentWebmailClient } from "./AgentWebmailClient";

export const dynamic = "force-dynamic";

export default async function MiCorreoPage({
  searchParams,
}: {
  searchParams?: { mailboxId?: string; agencyId?: string };
}) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }

  try {
    const webmailData = await getAgentWebmailData({
      mailboxId: searchParams?.mailboxId,
      targetAgencyId: searchParams?.agencyId,
    });
    return <AgentWebmailClient initialData={webmailData} />;
  } catch {
    redirect("/");
  }
}

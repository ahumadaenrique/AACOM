import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import CorporateEmailClient from "./CorporateEmailClient";

export const dynamic = "force-dynamic";

export default async function CorreoCorporativoPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
    include: { agency: true },
  });

  if (!user || !user.agency) {
    redirect("/");
  }

  const agency = user.agency as any;
  const endDate = agency.subscriptionEndDate ? new Date(agency.subscriptionEndDate) : null;
  const SUBSCRIPTION_GRACE_MS = 36 * 60 * 60 * 1000;
  const isSaasActive =
    (agency.subscriptionStatus === "active" || agency.subscriptionStatus === "trialing") &&
    (!endDate || endDate.getTime() + SUBSCRIPTION_GRACE_MS >= Date.now());

  return (
    <CorporateEmailClient
      agencyName={agency.name}
      agencySlug={agency.slug}
      isSaasActive={isSaasActive}
      corporateEmailActive={Boolean(agency.corporateEmailActive)}
      corporateEmailDomain={agency.corporateEmailDomain || null}
      corporateEmailMailboxesCount={Number(agency.corporateEmailMailboxesCount || 0)}
      corporateEmailMailboxesJson={agency.corporateEmailMailboxesJson || null}
      corporateEmailEndDate={
        agency.corporateEmailEndDate ? new Date(agency.corporateEmailEndDate).toISOString() : null
      }
    />
  );
}

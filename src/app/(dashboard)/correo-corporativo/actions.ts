"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateCorporateMailboxesConfig(data: {
  domain: string;
  mailboxes: Array<{ prefix: string; roleLabel: string; quotaGb: number }>;
}) {
  const session = await auth();
  if (!session?.user?.agencyId) {
    return { success: false, message: "No autorizado" };
  }

  const cleanDomain = data.domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "");
  if (!cleanDomain || !cleanDomain.includes(".")) {
    return { success: false, message: "Ingresa un dominio válido (ej. segurosjuanperez.com)." };
  }

  await (prisma.agency as any).update({
    where: { id: session.user.agencyId },
    data: {
      corporateEmailDomain: cleanDomain,
      corporateEmailMailboxesJson: JSON.stringify(data.mailboxes),
    },
  });

  revalidatePath("/correo-corporativo");
  return { success: true };
}

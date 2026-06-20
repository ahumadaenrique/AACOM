"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateAgencySettings(
  slug: string,
  data: {
    name?: string;
    primaryColor?: string;
  }
) {
  if (!slug) throw new Error("No agency slug provided");

  const agency = await prisma.agency.update({
    where: { slug },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.primaryColor && { primaryColor: data.primaryColor }),
    },
  });

  revalidatePath("/", "layout");
  return { success: true, agency };
}

export async function uploadAgencyLogo(formData: FormData) {
  const slug = formData.get("slug") as string;
  try {
    const file = formData.get("file") as File;
    if (!file) throw new Error("No file provided");

    // Convert to base64 and store in DB (same approach as user profile images)
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    await prisma.agency.update({
      where: { slug },
      data: { logoUrl: base64 },
    });

    revalidatePath("/", "layout");
    return { success: true, logoUrl: base64 };
  } catch (error: any) {
    const msg = error?.message || String(error);
    console.error("Error uploading logo:", msg);
    return { success: false, error: msg };
  }
}

"use server";

import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
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

export async function uploadAgencyLogo(slug: string, formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) throw new Error("No file provided");

    const blob = await put(`agencies/${slug}/logo-${Date.now()}-${file.name}`, file, {
      access: "public",
    });

    const agency = await prisma.agency.update({
      where: { slug },
      data: { logoUrl: blob.url },
    });

    revalidatePath("/", "layout");
    return { success: true, logoUrl: blob.url };
  } catch (error) {
    console.error("Error uploading logo:", error);
    return { success: false, error: "Failed to upload logo" };
  }
}

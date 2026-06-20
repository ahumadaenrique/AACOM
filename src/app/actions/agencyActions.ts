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

export async function uploadAgencyLogo(formData: FormData) {
  const slug = formData.get("slug") as string;
  console.log("uploadAgencyLogo action triggered for slug:", slug);
  try {
    const file = formData.get("file") as File;
    if (!file) {
      console.log("No file found in formData");
      throw new Error("No file provided");
    }

    console.log(`File received: ${file.name}, size: ${file.size}, type: ${file.type}`);
    console.log("Starting upload to Vercel Blob...");

    // Convert file to buffer to prevent hanging on Next.js FormData File object
    const buffer = Buffer.from(await file.arrayBuffer());

    const blob = await put(`agencies/${slug}/logo-${Date.now()}-${file.name}`, buffer, {
      access: "public",
      contentType: file.type,
    });

    console.log("Upload successful, URL:", blob.url);

    const agency = await prisma.agency.update({
      where: { slug },
      data: { logoUrl: blob.url },
    });

    revalidatePath("/", "layout");
    console.log("Agency updated and layout revalidated");
    return { success: true, logoUrl: blob.url };
  } catch (error: any) {
    const msg = error?.message || String(error);
    console.error("Error uploading logo:", msg);
    return { success: false, error: msg };
  }
}

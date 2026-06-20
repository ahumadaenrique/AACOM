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
  try {
    const file = formData.get("file") as File;
    if (!file) throw new Error("No file provided");

    const token = process.env.IMAGES_BLOB_READ_WRITE_TOKEN;
    if (!token) {
      // Fallback: store as base64 in DB if token not available
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;
      await prisma.agency.update({
        where: { slug },
        data: { logoUrl: base64 },
      });
      revalidatePath("/", "layout");
      return { success: true, logoUrl: base64 };
    }

    // Upload to public Vercel Blob store (aacom-images)
    const buffer = Buffer.from(await file.arrayBuffer());
    const blob = await put(
      `agencies/${slug}/logo-${Date.now()}-${file.name}`,
      buffer,
      {
        access: "public",
        contentType: file.type,
        token,
      }
    );

    await prisma.agency.update({
      where: { slug },
      data: { logoUrl: blob.url },
    });

    revalidatePath("/", "layout");
    return { success: true, logoUrl: blob.url };
  } catch (error: any) {
    const msg = error?.message || String(error);
    console.error("Error uploading logo:", msg);
    return { success: false, error: msg };
  }
}

/**
 * Upload a user profile image to the public images Blob store.
 * Returns the public URL of the uploaded image.
 */
export async function uploadUserImage(formData: FormData): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;
    if (!file) throw new Error("No file provided");

    const token = process.env.IMAGES_BLOB_READ_WRITE_TOKEN;
    if (!token) {
      // Fallback: return base64
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;
      return { success: true, url: base64 };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const blob = await put(
      `users/${userId}/avatar-${Date.now()}-${file.name}`,
      buffer,
      {
        access: "public",
        contentType: file.type,
        token,
      }
    );

    return { success: true, url: blob.url };
  } catch (error: any) {
    const msg = error?.message || String(error);
    console.error("Error uploading user image:", msg);
    return { success: false, error: msg };
  }
}

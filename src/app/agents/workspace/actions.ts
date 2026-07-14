"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

export async function getCompanyProfile() {
  const session = await auth()
  if (!session?.user?.email) throw new Error("No autenticado")
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  })
  
  if (!user) throw new Error("Usuario no encontrado")

  const profile = await prisma.companyProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      primaryColor: user.brandColor || "#4f46e5",
      logoUrl: user.brandLogo || null
    }
  })
  
  return profile
}

export async function updateCompanyProfile(data: {
  targetAudience?: string
  websiteUrl?: string
  industry?: string
  description?: string
  primaryColor?: string
  secondaryColor?: string
  logoUrl?: string
}) {
  const session = await auth()
  if (!session?.user?.email) throw new Error("No autenticado")
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  })
  if (!user) throw new Error("Usuario no encontrado")
  
  await prisma.companyProfile.update({
    where: { userId: user.id },
    data: {
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor,
      logoUrl: data.logoUrl,
      targetAudience: data.targetAudience,
      websiteUrl: data.websiteUrl,
      industry: data.industry,
      description: data.description,
    }
  })

  // Sincronizar también con los campos legacy del User para compatibilidad
  if (data.primaryColor || data.logoUrl) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        brandColor: data.primaryColor,
        brandLogo: data.logoUrl
      }
    })
  }
  
  revalidatePath('/workspace/identity')
  return { success: true }
}

export async function disconnectGoogle(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      googleAccessToken: null,
      googleRefreshToken: null,
      googleTokenExpiry: null
    }
  })
  revalidatePath('/')
  return { success: true }
}

export async function syncDatabaseSchemaAction() {
  const { exec } = require("child_process")
  return new Promise((resolve) => {
    exec("npx prisma db push", (error: any, stdout: string, stderr: string) => {
      if (error) {
        console.error("Sync schema error:", error)
        resolve({ success: false, error: error.message || stderr })
      } else {
        console.log("Sync schema success:", stdout)
        revalidatePath("/", "layout")
        resolve({ success: true })
      }
    })
  })
}

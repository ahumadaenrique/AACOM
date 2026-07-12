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
  
  if (!user?.agencyId) throw new Error("El usuario no pertenece a ninguna agencia")
  
  let agency = await prisma.agency.findUnique({
    where: { id: user.agencyId }
  })
  
  if (!agency) throw new Error("Agencia no encontrada")

  const profile = await prisma.companyProfile.upsert({
    where: { agencyId: agency.id },
    update: {},
    create: {
      agencyId: agency.id
    }
  })
  
  return {
    ...profile,
    primaryColor: agency.primaryColor,
    secondaryColor: agency.secondaryColor,
    logoUrl: agency.logoUrl
  }
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
  const profile = await getCompanyProfile()
  
  // Guardamos los colores y logo directamente en Agency
  await prisma.agency.update({
    where: { id: profile.agencyId },
    data: {
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor,
      logoUrl: data.logoUrl
    }
  })

  // Guardamos el resto de la info en CompanyProfile
  await prisma.companyProfile.update({
    where: { agencyId: profile.agencyId },
    data: {
      targetAudience: data.targetAudience,
      websiteUrl: data.websiteUrl,
      industry: data.industry,
      description: data.description,
    }
  })
  
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

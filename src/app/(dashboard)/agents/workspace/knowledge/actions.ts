"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { writeFile } from "fs/promises"
import { join } from "path"
import { mkdir } from "fs/promises"
import { existsSync } from "fs"

export async function getKnowledgeAssets() {
  return await prisma.knowledgeAsset.findMany({
    orderBy: { createdAt: 'desc' }
  })
}

export async function createKnowledgeAsset(formData: FormData) {
  const type = formData.get("type") as string
  const title = formData.get("title") as string
  const content = formData.get("content") as string | null
  let url = formData.get("url") as string | null

  // Handle file upload
  const file = formData.get("file") as File | null
  
  if (file && file.size > 0) {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadDir = join(process.cwd(), "public", "uploads")
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Generate unique filename to avoid collisions
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const path = join(uploadDir, fileName)
    
    await writeFile(path, buffer)
    url = `/uploads/${fileName}`
  }

  await prisma.knowledgeAsset.create({
    data: {
      type,
      title,
      content,
      url
    }
  })

  revalidatePath('/workspace/knowledge')
  return { success: true }
}

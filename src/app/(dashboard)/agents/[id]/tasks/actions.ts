"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getTasks(userId: string) {
  try {
    return await prisma.task.findMany({
      where: { userId },
      orderBy: [
        { completed: 'asc' },
        { createdAt: 'desc' }
      ]
    })
  } catch (error) {
    console.error("Error fetching tasks:", error)
    return []
  }
}

export async function createTaskAction(data: {
  title: string
  description?: string
  dueDate?: string
  priority?: string
  userId: string
}) {
  try {
    // Duplicate prevention: check if a task with the same title was created in the last 10 seconds
    const tenSecondsAgo = new Date(Date.now() - 10 * 1000)
    const existingTask = await prisma.task.findFirst({
      where: {
        title: data.title.trim(),
        userId: data.userId,
        createdAt: {
          gte: tenSecondsAgo
        }
      }
    })

    if (existingTask) {
      return { success: true, task: existingTask }
    }

    const task = await prisma.task.create({
      data: {
        title: data.title.trim(),
        description: data.description || null,
        dueDate: data.dueDate || null,
        priority: data.priority || "MEDIUM",
        userId: data.userId
      }
    })
    revalidatePath(`/agents/${data.userId}/tasks`)
    return { success: true, task }
  } catch (error: any) {
    console.error("Error creating task action:", error)
    return { success: false, error: error.message || error }
  }
}

export async function toggleTaskAction(taskId: string, completed: boolean, agentId: string) {
  try {
    const task = await prisma.task.update({
      where: { id: taskId },
      data: { completed }
    })
    revalidatePath(`/agents/${agentId}/tasks`)
    return { success: true, task }
  } catch (error: any) {
    console.error("Error toggling task action:", error)
    return { success: false, error: error.message || error }
  }
}

export async function deleteTaskAction(taskId: string, agentId: string) {
  try {
    await prisma.task.delete({
      where: { id: taskId }
    })
    revalidatePath(`/agents/${agentId}/tasks`)
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting task action:", error)
    return { success: false, error: error.message || error }
  }
}

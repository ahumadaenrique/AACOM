import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import TasksListClient from "./TasksListClient"

export const revalidate = 0 // Disable cache to ensure live task synchronization

export default async function TasksPage({ params }: { params: { id: string } }) {
  // Query the agent and include its linked User profile
  const agent = await prisma.aIAgent.findUnique({
    where: { id: params.id },
    include: { User: true }
  })

  // If agent doesn't exist or is not associated to a user, return 404
  if (!agent || !agent.User) {
    notFound()
  }

  // Fetch all tasks for this user, listing uncompleted tasks first
  const tasks = await prisma.task.findMany({
    where: { userId: agent.User.id },
    orderBy: [
      { completed: 'asc' },
      { createdAt: 'desc' }
    ]
  })

  // Map dates to simple ISO strings to pass them safely across the server-client boundary
  const serializedTasks = tasks.map(task => ({
    id: task.id,
    title: task.title,
    description: task.description,
    completed: task.completed,
    dueDate: task.dueDate,
    priority: task.priority,
    userId: task.userId,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString()
  }))

  return (
    <TasksListClient 
      agentId={agent.id}
      userId={agent.User.id}
      agentName={agent.name}
      initialTasks={serializedTasks}
    />
  )
}

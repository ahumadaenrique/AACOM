import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from "@/auth"

export async function POST(request: Request) {
  const session = await auth()
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId')
    
    if (!agentId) {
      return NextResponse.json({ error: 'agentId is required' }, { status: 400 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Delete interaction logs for the specific agent ID and logged-in user only
    await prisma.interactionLog.deleteMany({
      where: { 
        aiAgentId: agentId,
        userId: dbUser.id
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error clearing chat logs:', error)
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 })
  }
}

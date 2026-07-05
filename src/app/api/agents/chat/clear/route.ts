import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId')
    
    if (!agentId) {
      return NextResponse.json({ error: 'agentId is required' }, { status: 400 })
    }

    // Delete all interaction logs for the specific agent ID
    await prisma.interactionLog.deleteMany({
      where: { aiAgentId: agentId }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error clearing chat logs:', error)
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const agentId = url.searchParams.get('agentId')

  if (!agentId) {
    return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 })
  }

  try {
    const rawLogs = await prisma.interactionLog.findMany({
      where: { aiAgentId: agentId },
      orderBy: { createdAt: 'desc' },
      take: 10
    })
    const logs = rawLogs.reverse();

    const messages = logs.map(m => {
      let toolInvocations = undefined;
      if (m.toolInvocations) {
        try {
          let parsed = typeof m.toolInvocations === 'string' 
            ? JSON.parse(m.toolInvocations) 
            : m.toolInvocations;
          
          if (Array.isArray(parsed)) {
            parsed = parsed.map(inv => {
              if (inv.state === 'result' && !inv.result) {
                inv.result = {
                  transparentUrl: "https://placehold.co/800x800/1e1e24/a3a3a3?text=Recuperado",
                  copyText: "Diseño recuperado de una sesión anterior.",
                  subtitle: "Recuperado",
                  brandPrimaryColor: "#5c6ac4",
                  industry: "General"
                };
              }
              return inv;
            });
          }
          toolInvocations = parsed;
        } catch (e) {
          console.error("Failed to parse toolInvocations", e);
        }
      }

      return {
        id: m.id,
        role: m.role,
        content: m.content,
        toolInvocations
      }
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error('History API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

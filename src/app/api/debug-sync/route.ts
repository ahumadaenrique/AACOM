import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email || session.user.email.toLowerCase() !== 'enrique.ahumada@aacommx.com') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const key = process.env.ELEVENLABS_API_KEY || "";
    const keyStatus = key 
      ? `Configurada (Longitud: ${key.length}, Comienza con: ${key.substring(0, 4)}...)` 
      : 'NO CONFIGURADA';

    const recentLogs = await prisma.interactionLog.findMany({
      where: {
        User: { email: session.user.email }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    return NextResponse.json({
      elevenLabsApiKeyStatus: keyStatus,
      recentLogs
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

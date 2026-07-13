import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email || session.user.email.toLowerCase() !== 'enrique.ahumada@aacommx.com') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' });
    }

    // Check if Enrique already has a purchase to avoid double crediting
    const existing = await prisma.voiceMinutesPurchase.findFirst({
      where: { userId: user.id }
    });

    if (existing) {
      return NextResponse.json({ 
        message: 'El saldo ya fue restaurado anteriormente.', 
        user, 
        existingPurchase: existing 
      });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 días
    
    const purchase = await prisma.voiceMinutesPurchase.create({
      data: {
        userId: user.id,
        seconds: 3600,
        secondsRemaining: 3600,
        expiresAt
      }
    });

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        voiceSecondsBalance: 3900,
        freeSecondsBalance: 300
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Saldo de 60 minutos restaurado exitosamente en producción.',
      user: updatedUser,
      purchase
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

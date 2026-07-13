import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    const dbUrl = process.env.DATABASE_URL;
    
    let user = null;
    let purchases: any[] = [];
    if (session?.user?.email) {
      user = await prisma.user.findUnique({
        where: { email: session.user.email }
      });
      if (user) {
        purchases = await prisma.voiceMinutesPurchase.findMany({
          where: { userId: user.id }
        });
      }
    }
    
    const obfuscatedDbUrl = dbUrl 
      ? dbUrl.replace(/:([^:@]+)@/, ':****@') 
      : 'NOT_SET';

    return NextResponse.json({
      sessionEmail: session?.user?.email || 'NO_SESSION',
      dbUrl: obfuscatedDbUrl,
      user,
      purchases
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}

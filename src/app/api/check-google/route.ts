import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getGoogleCalendarClient } from '@/lib/google-clients';

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

    const hasGoogleToken = !!user.googleRefreshToken;
    const hasGoogleAccessToken = !!user.googleAccessToken;

    // Query events for today (July 13, 2026)
    const dateStr = "2026-07-13";
    let googleEvents: any[] = [];
    let googleError = null;
    let fallbackLocalMeetings: any[] = [];

    // 1. Google check
    try {
      const calendar = await getGoogleCalendarClient(user.id);
      if (calendar) {
        const timeMin = `${dateStr}T00:00:00-06:00`;
        const timeMax = `${dateStr}T23:59:59-06:00`;
        
        const response = await calendar.events.list({
          calendarId: 'primary',
          timeMin: new Date(timeMin).toISOString(),
          timeMax: new Date(timeMax).toISOString(),
          singleEvents: true,
          orderBy: 'startTime'
        });
        
        googleEvents = response.data.items || [];
      } else {
        googleError = "getGoogleCalendarClient returned null (missing token or client initialization failed)";
      }
    } catch (err: any) {
      googleError = err.message || err;
    }

    // 2. Local database check
    try {
      fallbackLocalMeetings = await prisma.meeting.findMany({
        where: {
          userId: user.id,
          date: dateStr
        },
        orderBy: { time: 'asc' }
      });
    } catch (err: any) {
      console.error("Local DB query failed:", err);
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        hasGoogleToken,
        hasGoogleAccessToken,
        googleTokenExpiry: user.googleTokenExpiry
      },
      queryDate: dateStr,
      googleError,
      googleEventsCount: googleEvents.length,
      googleEvents: googleEvents.map(e => ({
        summary: e.summary,
        start: e.start,
        end: e.end,
        id: e.id
      })),
      localMeetingsCount: fallbackLocalMeetings.length,
      localMeetings: fallbackLocalMeetings
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

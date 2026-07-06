import { google } from 'googleapis'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const userId = searchParams.get('state')

  if (!code || !userId) {
    return NextResponse.json({ error: 'Code or state (userId) missing' }, { status: 400 })
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${new URL(request.url).origin}/api/auth/google/callback`
    )

    const { tokens } = await oauth2Client.getToken(code)

    await prisma.user.update({
      where: { id: userId },
      data: {
        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token || undefined,
        googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null
      }
    })

    // Redirect back to dashboard. To bypass the client cache and reload the layout, we redirect with a success flag
    return NextResponse.redirect(`${new URL(request.url).origin}/?success=google`)
  } catch (error: any) {
    console.error('Error exchanging Google OAuth code:', error)
    return NextResponse.redirect(`${new URL(request.url).origin}/?error=google`)
  }
}

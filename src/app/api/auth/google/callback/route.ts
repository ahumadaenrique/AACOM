import { google } from 'googleapis'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const stateStr = searchParams.get('state')

  if (!code || !stateStr) {
    return NextResponse.json({ error: 'Code or state missing' }, { status: 400 })
  }

  // Parse state (contains userId and originalOrigin separated by a colon)
  const colonIndex = stateStr.indexOf(':')
  let userId = stateStr
  let originalOrigin = `${new URL(request.url).origin}` // fallback

  if (colonIndex !== -1) {
    userId = stateStr.substring(0, colonIndex)
    originalOrigin = stateStr.substring(colonIndex + 1)
  }

  try {
    const urlObj = new URL(request.url)
    let redirectUri = `${urlObj.origin}/api/auth/google/callback`

    if (urlObj.hostname.endsWith('aacomsoft.com')) {
      redirectUri = 'https://www.aacomsoft.com/api/auth/google/callback'
    } else if (urlObj.hostname.endsWith('vercel.app')) {
      redirectUri = 'https://aacom-lilac.vercel.app/api/auth/google/callback'
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
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

    // Redirect back to original origin dashboard
    return NextResponse.redirect(`${originalOrigin}/agents?success=google`)
  } catch (error: any) {
    console.error('Error exchanging Google OAuth code:', error)
    return NextResponse.redirect(`${originalOrigin}/agents?error=google`)
  }
}

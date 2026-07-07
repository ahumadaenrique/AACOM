import { google } from 'googleapis'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.json({ error: 'Google OAuth credentials not configured in server' }, { status: 500 })
  }

  const urlObj = new URL(request.url)
  const originalOrigin = urlObj.origin
  let redirectUri = `${originalOrigin}/api/auth/google/callback`

  // Centralized redirect for subdomains to avoid google redirect_uri_mismatch
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

  const scopes = [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/gmail.modify'
  ]

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state: `${userId}:${originalOrigin}`,
    prompt: 'consent'
  })

  return NextResponse.redirect(url)
}

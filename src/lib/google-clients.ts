import { google as googleApi } from 'googleapis'
import { prisma } from '@/lib/prisma'

export async function getGoogleCalendarClient(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user || !user.googleRefreshToken) {
      return null
    }

    const oauth2Client = new googleApi.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    )

    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
      expiry_date: user.googleTokenExpiry?.getTime()
    })

    oauth2Client.on('tokens', async (tokens) => {
      await prisma.user.update({
        where: { id: userId },
        data: {
          googleAccessToken: tokens.access_token,
          googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null
        }
      })
    })

    return googleApi.calendar({ version: 'v3', auth: oauth2Client })
  } catch (error) {
    console.error('Error initializing Google Calendar client:', error)
    return null
  }
}

export async function getGmailClient(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user || !user.googleRefreshToken) {
      return null
    }

    const oauth2Client = new googleApi.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    )

    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
      expiry_date: user.googleTokenExpiry?.getTime()
    })

    oauth2Client.on('tokens', async (tokens) => {
      await prisma.user.update({
        where: { id: userId },
        data: {
          googleAccessToken: tokens.access_token,
          googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null
        }
      })
    })

    return googleApi.gmail({ version: 'v1', auth: oauth2Client })
  } catch (error) {
    console.error('Error initializing Gmail client:', error)
    return null
  }
}

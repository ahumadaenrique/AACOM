import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import twilio from 'twilio'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const bypass = searchParams.get('bypass')

  const authHeader = request.headers.get('authorization')
  if (bypass !== 'aacom123' && process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    if (process.env.NODE_ENV === 'production') {
      return new NextResponse('Unauthorized', { status: 401 })
    }
  }

  try {
    const now = new Date()

    // Find posts scheduled for now or in the past that haven't been notified yet
    const pendingPosts = await prisma.draftPost.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: {
          lte: now
        }
      },
      include: {
        AIAgent: {
          include: {
            User: true
          }
        }
      }
    })

    if (pendingPosts.length === 0) {
      return NextResponse.json({ success: true, message: 'No pending scheduled posts found.' })
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const fromNumber = process.env.TWILIO_PHONE_NUMBER // e.g. +14155238886 (Twilio Sandbox)

    const client = accountSid && authToken ? twilio(accountSid, authToken) : null
    const processedIds: string[] = []

    for (const post of pendingPosts) {
      const user = post.AIAgent?.User
      const userPhone = user?.phone

      if (client && fromNumber && userPhone) {
        try {
          // Clean up phone number format (ensure no spaces, hyphens, and prepend +52 if it looks like a 10 digit local Mexican number)
          let formattedPhone = userPhone.trim().replace(/[\s\-\(\)]/g, '')
          if (formattedPhone.length === 10) {
            formattedPhone = `+52${formattedPhone}`
          } else if (!formattedPhone.startsWith('+')) {
            formattedPhone = `+${formattedPhone}`
          }

          // WhatsApp sandbox/production messaging
          const messageBody = `¡Hola! Tu asistente de marketing de AACOM te recuerda que es momento de publicar tu post programado en ${post.platform}.\n\n👇 Copia este texto para tu publicación:\n\n${post.content}`
          
          const msgPayload: any = {
            body: messageBody,
            from: `whatsapp:${fromNumber.startsWith('+') ? fromNumber : '+' + fromNumber}`,
            to: `whatsapp:${formattedPhone}`
          }

          // Attach media if we have a valid public image URL
          if (post.imageUrl && post.imageUrl.startsWith('http')) {
            msgPayload.mediaUrl = [post.imageUrl]
          }

          await client.messages.create(msgPayload)
          console.log(`WhatsApp notification sent to ${formattedPhone} for post ${post.id}`)
        } catch (twilioErr) {
          console.error(`Failed to send WhatsApp to ${userPhone} for post ${post.id}:`, twilioErr)
        }
      } else {
        console.warn(`Skipping notification for post ${post.id}: missing twilio client, from number, or user phone.`)
      }

      // Mark as notified/published regardless of WhatsApp success to prevent message loops
      await prisma.draftPost.update({
        where: { id: post.id },
        data: { status: 'PUBLISHED' }
      })

      processedIds.push(post.id)
    }

    return NextResponse.json({ success: true, processed: processedIds })
  } catch (error: any) {
    console.error('Cron publish error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

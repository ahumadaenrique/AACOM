import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!dbUser || (dbUser.role !== 'ADMIN' && dbUser.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    if (!dbUser.agencyId) {
      return NextResponse.json({ error: 'Usuario sin agencia' }, { status: 400 })
    }

    const body = await req.json()
    const {
      quoterLifeCompany,
      quoterEnableVPL,
      quoterEnableVPLPPR,
      quoterEnableUniversal,
      quoterShowAccumulatedPremium
    } = body

    const updatedAgency = await prisma.agency.update({
      where: { id: dbUser.agencyId },
      data: {
        quoterLifeCompany,
        quoterEnableVPL,
        quoterEnableVPLPPR,
        quoterEnableUniversal,
        quoterShowAccumulatedPremium
      }
    })

    return NextResponse.json({ success: true, agency: updatedAgency })
  } catch (error: any) {
    console.error("Error saving quoter settings:", error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

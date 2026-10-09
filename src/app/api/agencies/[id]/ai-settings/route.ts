import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { encrypt, decrypt } from '@/lib/encryption';
import { validateElevenLabsKey, getOrProvisionAgencyAgent } from '@/lib/roleplay/elevenlabsProvisioning';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;

    // Verify permissions: Must be SUPERADMIN, or ADMIN of this specific agency
    const user = await prisma.user.findUnique({ where: { email: session.user.email! } });
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    const isSuperAdmin = user.role === 'SUPERADMIN' || user.role === 'SUPER_ADMIN';
    if (!isSuperAdmin && (user.agencyId !== id || user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'No tienes permiso para ver esta configuración' }, { status: 403 });
    }

    const agency = await prisma.agency.findUnique({ where: { id } });
    if (!agency) return NextResponse.json({ error: 'Agencia no encontrada' }, { status: 404 });

    // Return masked key if it exists
    let maskedKey = null;
    if (agency.elevenLabsApiKey) {
      try {
        const plainKey = decrypt(agency.elevenLabsApiKey);
        if (plainKey && plainKey.length > 8) {
          maskedKey = `sk-...${plainKey.substring(plainKey.length - 4)}`;
        } else {
          maskedKey = 'sk-...****';
        }
      } catch (e) {
        maskedKey = 'sk-... (Invalid/Corrupted)';
      }
    }

    return NextResponse.json({
      elevenLabsApiKey: maskedKey,
      elevenLabsVoiceId: agency.elevenLabsVoiceId || ''
    });

  } catch (error: any) {
    console.error('Error fetching AI settings:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { elevenLabsApiKey, elevenLabsVoiceId } = body;

    // Verify permissions
    const user = await prisma.user.findUnique({ where: { email: session.user.email! } });
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    const isSuperAdmin = user.role === 'SUPERADMIN' || user.role === 'SUPER_ADMIN';
    if (!isSuperAdmin && (user.agencyId !== id || user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'No tienes permiso para modificar esta configuración' }, { status: 403 });
    }

    const updateData: any = {};

    // Only update API Key if a new non-masked value is provided
    if (elevenLabsApiKey !== undefined) {
      if (elevenLabsApiKey === '') {
        // Clear the key
        updateData.elevenLabsApiKey = null;
        updateData.elevenLabsVoiceId = null;
      } else if (!elevenLabsApiKey.startsWith('sk-...')) {
        const rawKey = elevenLabsApiKey.trim();

        // 1. Validar la llave contra la API de ElevenLabs
        const validation = await validateElevenLabsKey(rawKey);
        if (!validation.valid) {
          return NextResponse.json({ 
            error: validation.error || 'La API Key de ElevenLabs no es válida. Verifica que esté copiada completa.' 
          }, { status: 400 });
        }

        // 2. Auto-aprovisionar de forma 100% plug & play el agente Conversational AI en su cuenta con marca blanca
        const targetAgency = await prisma.agency.findUnique({ where: { id }, select: { name: true } });
        const agencyName = targetAgency?.name || 'AACOM Seguros';
        const provisionedAgentId = await getOrProvisionAgencyAgent(id, rawKey, agencyName);
        if (provisionedAgentId) {
          updateData.elevenLabsVoiceId = provisionedAgentId;
        }

        // 3. Encriptar la nueva llave para almacenamiento seguro
        updateData.elevenLabsApiKey = encrypt(rawKey);
      }
    }

    if (elevenLabsVoiceId !== undefined && !updateData.elevenLabsVoiceId) {
      updateData.elevenLabsVoiceId = elevenLabsVoiceId.trim() || null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: true, message: 'No hay cambios que guardar' });
    }

    await prisma.agency.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ success: true, message: 'Configuración de IA guardada correctamente' });

  } catch (error: any) {
    console.error('Error saving AI settings:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

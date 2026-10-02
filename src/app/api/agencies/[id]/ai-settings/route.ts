import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { encrypt, decrypt } from '@/lib/encryption';

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
      } else if (!elevenLabsApiKey.startsWith('sk-...')) {
        // Encrypt the new raw key
        updateData.elevenLabsApiKey = encrypt(elevenLabsApiKey.trim());
      }
    }

    if (elevenLabsVoiceId !== undefined) {
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

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { generarEscenarioAleatorio } from '@/lib/roleplay/scenarios';
import {
  calculateLevelFromXp,
  checkAndApplyInactivityPenalty,
  DAILY_XP_CAP,
  LEVELS_CONFIG,
  BADGES_CATALOG,
  DEFAULT_BENEFITS,
  getLocalDateString
} from '@/lib/roleplay/gamification';

export async function POST(req: Request) {
  try {
    let body = {};
    try { body = await req.json(); } catch(e) {}
    const moduleId = (body as any).moduleId || 'prospeccion';

    const session = await auth();
    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado. Inicia sesión en AACOM.' }, { status: 401 });
    }

    // Resolve user ID
    let userId = session.user.id;
    if (!userId && session.user.email) {
      const u = await prisma.user.findUnique({ where: { email: session.user.email } });
      if (u) userId = u.id;
    }

    if (!userId) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const userWithAgency = await prisma.user.findUnique({
      where: { id: userId },
      include: { agency: true }
    });

    if (userWithAgency?.role !== 'SUPER_ADMIN' && userWithAgency?.agency && userWithAgency.agency.allowRoleplaySimulator === false) {
      return NextResponse.json({ error: 'El simulador de prospección telefónica no está habilitado para tu agencia.' }, { status: 403 });
    }

    const todayStr = getLocalDateString();

    // Load or create RoleplayStats
    let stats = await prisma.roleplayStats.findUnique({
      where: { userId }
    });

    if (!stats) {
      stats = await prisma.roleplayStats.create({
        data: {
          userId,
          xp: 0,
          level: 1,
          streak: 0,
          todayXp: 0,
          todayDate: todayStr,
          todayCallsCount: 0,
          totalCalls: 0,
          closedCalls: 0,
          badges: [],
          unlockedBenefits: DEFAULT_BENEFITS[1]
        }
      });
    }

    // Check penalty for missed business days
    const penaltyCheck = checkAndApplyInactivityPenalty({
      xp: stats.xp,
      lastActiveDate: stats.lastActiveDate,
      streak: stats.streak
    });

    let currentXp = penaltyCheck.newXp;
    let currentStreak = penaltyCheck.newStreak;
    let currentTodayXp = stats.todayXp;
    let currentTodayCalls = stats.todayCallsCount;

    // Reset daily counters if day changed
    if (stats.todayDate !== todayStr) {
      currentTodayXp = 0;
      currentTodayCalls = 0;
    }

    const currentLevel = calculateLevelFromXp(currentXp);

    if (penaltyCheck.penalizedDays > 0 || stats.todayDate !== todayStr || currentLevel !== stats.level) {
      stats = await prisma.roleplayStats.update({
        where: { userId },
        data: {
          xp: currentXp,
          level: currentLevel,
          streak: currentStreak,
          todayXp: currentTodayXp,
          todayDate: todayStr,
          todayCallsCount: currentTodayCalls,
          unlockedBenefits: DEFAULT_BENEFITS[currentLevel] || []
        }
      });
    }

    // White-label: Usar el nombre de la agencia del asesor si existe
    const agencyName = userWithAgency?.agency?.name?.trim() || 'AACOM Seguros';

    // Generate scenario tailored to current level, selected module, and dynamic white-label agency
    const scenario = generarEscenarioAleatorio(stats.level, moduleId, agencyName);

    // 1. Determinar motor de voz (Gemini Live vs ElevenLabs)
    const isAacom = userWithAgency?.agency?.id === 'aacom' || userWithAgency?.agency?.slug === 'aacom';
    const configuredEngine = userWithAgency?.agency?.voiceEngine;
    const isByokActive = userWithAgency?.agency?.byokActive ?? true;
    const hasAgencyByokKey = !!userWithAgency?.agency?.elevenLabsApiKey && isByokActive;
    
    let effectiveEngine: 'GEMINI_LIVE' | 'ELEVENLABS' = 'ELEVENLABS';
    if (isAacom) {
      // AACOM: el motor oficial e indiscutible es ElevenLabs con la cuenta activa de Enrique
      effectiveEngine = 'ELEVENLABS';
    } else if (configuredEngine === 'ELEVENLABS' || hasAgencyByokKey) {
      effectiveEngine = 'ELEVENLABS';
    } else if (configuredEngine === 'GEMINI_LIVE') {
      effectiveEngine = 'GEMINI_LIVE';
    } else {
      effectiveEngine = 'ELEVENLABS';
    }

    // Safety fallback: si se seleccionó Gemini Live pero no hay API Key en servidor, usar ElevenLabs
    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (effectiveEngine === 'GEMINI_LIVE' && !geminiApiKey) {
      effectiveEngine = 'ELEVENLABS';
    }

    // 2. Control de saldo de minutos para llamadas con bolsa de AACOM
    const agencyBalance = userWithAgency?.agency?.voiceSecondsBalance || 0;
    const userBalance = userWithAgency?.voiceSecondsBalance || 0;
    const isSuperAdmin = userWithAgency?.role === 'SUPER_ADMIN';

    if (effectiveEngine === 'GEMINI_LIVE' && !isSuperAdmin && agencyBalance <= 0 && userBalance <= 0) {
      return NextResponse.json({
        error: 'No cuentas con minutos disponibles en la bolsa de Academia PRO. Pide a tu promotor que active minutos o adquiera un paquete.'
      }, { status: 403 });
    }

    let signedUrl = null;
    let wsUrl = null;
    let voiceName = null;

    if (effectiveEngine === 'GEMINI_LIVE') {
      const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      if (!geminiApiKey) {
        return NextResponse.json({ error: 'Configuración de Gemini incompleta en el servidor.' }, { status: 500 });
      }

      wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${geminiApiKey}`;
      const isFemale = scenario.prospecto.genero === 'F';
      voiceName = isFemale ? 'Aoede' : 'Puck';
    } else {
      // ELEVENLABS ENGINE
      let agentId = process.env.ELEVENLABS_AGENT_ID;
      let apiKey = process.env.ELEVENLABS_API_KEY; // Fallback for SUPER_ADMIN or global testing
      
      // Check for Agency BYOK
      if (userWithAgency?.agency?.elevenLabsApiKey && isByokActive) {
        try {
          const { decrypt } = await import('@/lib/encryption');
          apiKey = decrypt(userWithAgency.agency.elevenLabsApiKey);

          if (apiKey) {
            if (userWithAgency.agency.elevenLabsVoiceId) {
              agentId = userWithAgency.agency.elevenLabsVoiceId;
            } else {
              const { getOrProvisionAgencyAgent } = await import('@/lib/roleplay/elevenlabsProvisioning');
              const provisioned = await getOrProvisionAgencyAgent(userWithAgency.agency.id, apiKey, agencyName);
              if (provisioned) {
                agentId = provisioned;
              }
            }
          }
        } catch (e) {
          console.error("Error decrypting agency BYOK:", e);
        }
      }

      if (!apiKey) {
        return NextResponse.json({ error: 'Configuración de IA incompleta. Tu API Key de ElevenLabs no está configurada o está inactiva.' }, { status: 403 });
      }

      if (!agentId) {
        return NextResponse.json({ error: 'No se pudo aprovisionar el agente conversacional en tu cuenta de ElevenLabs. Verifica los permisos de tu API Key.' }, { status: 500 });
      }

      try {
        await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
          method: 'PATCH',
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            conversation_config: {
              conversation: {
                max_duration_seconds: moduleId === 'adn' ? 1800 : moduleId === 'objeciones' ? 1500 : 600
              },
              agent: {
                prompt: {
                  prompt: scenario.systemPrompt
                },
                first_message: scenario.firstMessage,
                language: 'es',
                max_duration_seconds: moduleId === 'adn' ? 1800 : moduleId === 'objeciones' ? 1500 : 600
              },
              tts: {
                voice_id: scenario.prospecto.voiceId || 'TNuNcwk4LzbPpi1XEANc',
                model_id: 'eleven_turbo_v2_5',
                stability: 0.75,
                similarity_boost: 0.85,
                speed: 1.0,
                optimize_streaming_latency: 2
              }
            }
          })
        });

        const resp = await fetch(
          `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
          { headers: { 'xi-api-key': apiKey } }
        );
        if (resp.ok) {
          const data = await resp.json();
          signedUrl = data.signed_url;
        } else {
          console.error("ElevenLabs signed URL error:", await resp.text());
        }
      } catch (err) {
        console.error("Error fetching ElevenLabs signed URL:", err);
      }
    }

    return NextResponse.json({
      success: true,
      engine: effectiveEngine,
      scenario,
      signedUrl,
      wsUrl: effectiveEngine === 'GEMINI_LIVE' ? wsUrl : null,
      voiceName: effectiveEngine === 'GEMINI_LIVE' ? voiceName : null,
      stats: {
        xp: stats.xp,
        level: stats.level,
        levelInfo: LEVELS_CONFIG[stats.level],
        streak: stats.streak,
        todayXp: stats.todayXp,
        dailyCap: DAILY_XP_CAP,
        todayCallsCount: stats.todayCallsCount,
        totalCalls: stats.totalCalls,
        closedCalls: stats.closedCalls,
        badges: stats.badges,
        unlockedBenefits: stats.unlockedBenefits,
        penaltyApplied: penaltyCheck.penaltyXp > 0 ? penaltyCheck.penaltyXp : null
      },
      badgesCatalog: BADGES_CATALOG
    });
  } catch (error: any) {
    console.error("Error in roleplay session endpoint:", error);
    return NextResponse.json({ error: error.message || 'Error al iniciar sesión' }, { status: 500 });
  }
}

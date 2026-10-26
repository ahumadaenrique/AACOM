import { BADGES } from '@/lib/roleplay/badges';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { generarEscenarioAleatorio } from '@/lib/roleplay/scenarios';
import {
  calculateLevelFromXp,
  checkAndApplyInactivityPenalty,
  calculateConsecutiveBusinessDaysStreak,
  DAILY_XP_CAP,
  LEVELS_CONFIG,
  BADGES_CATALOG,
  DEFAULT_BENEFITS,
  getLocalDateString
} from '@/lib/roleplay/gamification';

// Voces que tienen Live Moderation activado en ElevenLabs y causan desconexión 1008 en ConvAI
const RESTRICTED_MODERATION_VOICES = new Set([
  'JgmJ33RuT4tPQOENamHR',
  '2mAzYQbilw9TukGpFoQV',
  'YKUjKbMlejgvkOZlnnvt',
  '6BEk9bRlUBhlAoIbhBYK',
  'pmruOMcxgUotq2bYO5Ne',
  'aLFUti4k8YKvtQGXv0UO'
]);

export async function POST(req: Request) {
  try {
    let body: any = {};
    try { body = await req.json(); } catch (e) {}
    const moduleId = body.moduleId || 'prospeccion';
    const preserveScenario = body.preserveScenario || null;
    const forceSafeVoice = !!body.forceSafeVoice;

    const session = await auth();
    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado. Inicia sesión en AACOM.' }, { status: 401 });
    }

    // Resolve user ID (case-insensitive email fallback)
    let userId = session.user.id;
    if (!userId && session.user.email) {
      const u = await prisma.user.findFirst({
        where: { email: { equals: session.user.email.trim(), mode: 'insensitive' } }
      });
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

    // Limpiar llamadas fantasma de 0-2 segundos con 0 puntos causadas por cortes técnicos de red/WebSocket
    await prisma.roleplayCall.deleteMany({
      where: {
        userId,
        durationSeconds: { lte: 2 },
        score: 0,
        appointmentClosed: false
      }
    }).catch(() => {});

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

    // Load recent calls to verify today's real XP, call count, and consecutive business-day streak
    const recentUserCallsForStats = await prisma.roleplayCall.findMany({
      where: { userId },
      take: 60,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        score: true,
        xpEarned: true,
        appointmentClosed: true,
        durationSeconds: true,
        createdAt: true
      }
    });

    // Auto-heal any calls from today that got 0 XP despite score > 0 due to stale daily cap
    let recoveredXpToday = 0;
    for (const c of recentUserCallsForStats) {
      if (getLocalDateString(c.createdAt) === todayStr && (c.score || 0) > 0 && (c.xpEarned || 0) === 0) {
        const expectedXp = Math.floor((c.score || 0) * 1.5) + (c.appointmentClosed ? 50 : 0);
        c.xpEarned = expectedXp;
        recoveredXpToday += expectedXp;
        await prisma.roleplayCall.update({
          where: { id: c.id },
          data: { xpEarned: expectedXp }
        }).catch(() => {});
      }
    }

    const todayRealCalls = recentUserCallsForStats.filter(
      c => getLocalDateString(c.createdAt) === todayStr && (c.durationSeconds >= 8 || (c.score || 0) > 0)
    );
    const realTodayXp = Math.min(
      DAILY_XP_CAP,
      todayRealCalls.reduce((sum, c) => sum + (c.xpEarned || 0), 0)
    );
    const realTodayCallsCount = todayRealCalls.length;

    const validActiveDates = recentUserCallsForStats
      .filter(c => c.durationSeconds >= 15 || (c.score || 0) > 0)
      .map(c => getLocalDateString(c.createdAt));
    const historyStreak = calculateConsecutiveBusinessDaysStreak(validActiveDates, todayStr);

    // Check penalty for missed business days
    const penaltyCheck = checkAndApplyInactivityPenalty({
      xp: stats.xp + recoveredXpToday,
      lastActiveDate: stats.lastActiveDate,
      streak: stats.streak
    });

    let currentXp = penaltyCheck.newXp;
    let currentStreak = penaltyCheck.penalizedDays > 0
      ? Math.max(0, historyStreak)
      : Math.max(penaltyCheck.newStreak, historyStreak);
    let currentTodayXp = realTodayXp;
    let currentTodayCalls = realTodayCallsCount;

    const currentLevel = calculateLevelFromXp(currentXp);
    const newLastActiveDate = todayRealCalls.length > 0
      ? todayStr
      : (penaltyCheck.penalizedDays > 0 ? null : stats.lastActiveDate);

    if (
      penaltyCheck.penalizedDays > 0 ||
      recoveredXpToday > 0 ||
      stats.todayDate !== todayStr ||
      stats.todayXp !== currentTodayXp ||
      stats.todayCallsCount !== currentTodayCalls ||
      stats.streak !== currentStreak ||
      currentLevel !== stats.level
    ) {
      stats = await prisma.roleplayStats.update({
        where: { userId },
        data: {
          xp: currentXp,
          level: currentLevel,
          streak: currentStreak,
          todayXp: currentTodayXp,
          todayDate: todayStr,
          todayCallsCount: currentTodayCalls,
          lastActiveDate: newLastActiveDate,
          unlockedBenefits: DEFAULT_BENEFITS[currentLevel] || []
        }
      });
    }

    // White-label: Usar el nombre de la agencia del asesor si existe
    const agencyName = userWithAgency?.agency?.name?.trim() || 'AACOM Seguros';

    // Si el cliente solicita refrescar el token conservando el prospecto en pantalla, respetarlo
    let scenario = preserveScenario && preserveScenario.prospecto
      ? preserveScenario
      : generarEscenarioAleatorio(stats.level, moduleId, agencyName);

    if (!preserveScenario) {
      // Optimizar y blindar la psicología del prospecto con Gemini Prompt Architect (Gemini 3.8 Flash)
      try {
        const { enhanceScenarioPromptWithGemini } = await import('@/lib/roleplay/geminiPromptArchitect');
        const enhancedPrompt = await enhanceScenarioPromptWithGemini({
          scenario,
          moduleId,
          agencyName,
          currentLevel: stats.level
        });
        if (enhancedPrompt) {
          scenario.systemPrompt = enhancedPrompt;
        }
      } catch (enhancerErr) {
        console.warn('[Session] Fallback a motor procedural local:', enhancerErr);
      }
    }

    // Sanitizar voiceId contra voces con Live Moderation o si se pidió voz base segura
    const isFemaleProspect = scenario?.prospecto?.genero === 'F';
    const defaultSafeVoice = isFemaleProspect ? 'cAvMBIZ0VNTU8XdsUpEq' : 'TNuNcwk4LzbPpi1XEANc';
    if (
      forceSafeVoice ||
      !scenario?.prospecto?.voiceId ||
      RESTRICTED_MODERATION_VOICES.has(scenario.prospecto.voiceId)
    ) {
      scenario.prospecto.voiceId = defaultSafeVoice;
    }

    // 1. Determinar motor de voz (Gemini Live vs ElevenLabs)
    // Respetar estrictamente la configuración elegida por el administrador de la agencia
    const configuredEngine = userWithAgency?.agency?.voiceEngine;
    const isByokActive = userWithAgency?.agency?.byokActive ?? true;
    const hasAgencyByokKey = !!userWithAgency?.agency?.elevenLabsApiKey && isByokActive;

    let effectiveEngine: 'GEMINI_LIVE' | 'ELEVENLABS' = 'GEMINI_LIVE';
    if (configuredEngine === 'GEMINI_LIVE') {
      effectiveEngine = 'GEMINI_LIVE';
    } else if (configuredEngine === 'ELEVENLABS') {
      effectiveEngine = 'ELEVENLABS';
    } else if (hasAgencyByokKey) {
      effectiveEngine = 'ELEVENLABS';
    } else {
      effectiveEngine = 'GEMINI_LIVE';
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
      if (!geminiApiKey) {
        return NextResponse.json({ error: 'Configuración de Gemini incompleta en el servidor.' }, { status: 500 });
      }

      voiceName = isFemaleProspect ? 'Aoede' : 'Puck';
      wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${geminiApiKey}`;
    } else {
      // ELEVENLABS ENGINE
      let agentId = process.env.ELEVENLABS_AGENT_ID || 'agent_7501m3spq973f8htvjwa344k80c1';
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
        const patchResp = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
          method: 'PATCH',
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            platform_settings: {
              overrides: {
                conversation_config_override: {
                  tts: {
                    voice_id: true,
                    speed: true,
                    stability: true,
                    similarity_boost: true
                  },
                  agent: {
                    first_message: true,
                    language: true,
                    prompt: {
                      prompt: true
                    }
                  }
                }
              }
            },
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
                voice_id: scenario.prospecto.voiceId || defaultSafeVoice,
                model_id: 'eleven_turbo_v2_5',
                stability: 0.75,
                similarity_boost: 0.85,
                speed: 1.0,
                optimize_streaming_latency: 2
              }
            }
          })
        });

        if (!patchResp.ok) {
          console.warn('[ElevenLabs] PATCH agent returned status', patchResp.status, '- retrying with safe fallback voice:', defaultSafeVoice);
          scenario.prospecto.voiceId = defaultSafeVoice;
          await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
            method: 'PATCH',
            headers: {
              'xi-api-key': apiKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              conversation_config: {
                agent: {
                  prompt: { prompt: scenario.systemPrompt },
                  first_message: scenario.firstMessage,
                  language: 'es'
                },
                tts: {
                  voice_id: defaultSafeVoice,
                  model_id: 'eleven_turbo_v2_5'
                }
              }
            })
          }).catch(() => {});
        }

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

    const recentUserCalls = await prisma.roleplayCall.findMany({
      where: { userId },
      take: 25,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        prospectName: true,
        score: true,
        xpEarned: true,
        appointmentClosed: true,
        durationSeconds: true,
        conversationId: true,
        callAudioUrl: true,
        engine: true,
        createdAt: true
      }
    });

    return NextResponse.json({
      success: true,
      engine: effectiveEngine,
      scenario,
      signedUrl,
      wsUrl: effectiveEngine === 'GEMINI_LIVE' ? wsUrl : null,
      voiceName: effectiveEngine === 'GEMINI_LIVE' ? voiceName : null,
      historyCalls: recentUserCalls,
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
      rewardConfig: {
        active: userWithAgency?.agency?.roleplayRewardActive ?? true,
        amount: userWithAgency?.agency?.roleplayRewardAmount ?? 1500,
        title: userWithAgency?.agency?.roleplayRewardTitle || 'Bono por Álbum Completo'
      },
      badgesCatalog: BADGES
    });
  } catch (error: any) {
    console.error("Error in roleplay session endpoint:", error);
    return NextResponse.json({ error: error.message || 'Error al iniciar sesión' }, { status: 500 });
  }
}

"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import nodemailer from "nodemailer";
import {
  buildAgentEmailLocalPart,
  checkDomainsAvailabilityAndWholesalePrice,
  createTitanFreeForwarder,
  decryptMailboxCredentials,
  DEFAULT_MAX_SEATS,
  DEFAULT_STORAGE_GB,
  MAX_DOMAIN_WHOLESALE_USD,
  PACKAGE_MONTHLY_PRICE_MXN,
  provisionCorporateDomainAndTitanOrder,
  provisionTitanMailboxAccount,
} from "@/lib/corporate-email/provider";

/**
 * Resuelve de forma segura y estricta el agencyId respetando el aislamiento Multi-Inquilino.
 * - ADMIN regular o AGENTE: estrictamente acotado a su propio user.agencyId.
 * - SUPER_ADMIN: por defecto su agencia principal (o la que esté impersonando), o la agencia específica seleccionada. NUNCA "ALL".
 */
async function resolveTenantContext(requestedAgencyId?: string) {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error("No autenticado");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
  });

  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const isAdmin = user.role === "ADMIN" || isSuperAdmin;

  let effectiveAgencyId =
    (session.user as any)?.agencyId || user.agencyId || "aacom";

  if (requestedAgencyId && requestedAgencyId !== "ALL") {
    if (isSuperAdmin) {
      effectiveAgencyId = requestedAgencyId;
    } else if (requestedAgencyId !== effectiveAgencyId) {
      throw new Error("Acceso denegado: No puedes consultar datos de otra promotoría.");
    }
  }

  const agency = await prisma.agency.findUnique({
    where: { id: effectiveAgencyId },
  });

  if (!agency) {
    throw new Error("Promotoría no encontrada");
  }

  const allowCorporateEmailModule =
    agency.allowCorporateEmailModule ??
    (agency.id === "aacom" || agency.slug === "aacom");

  if (!isSuperAdmin && !allowCorporateEmailModule) {
    throw new Error(
      "El Módulo de Dominios y Correos Corporativos no está habilitado para esta promotoría."
    );
  }

  return {
    user,
    agency,
    effectiveAgencyId: agency.id,
    isSuperAdmin,
    isAdmin,
    allowCorporateEmailModule,
  };
}

/**
 * Obtiene o refresca la caché de sugerencias de dominios verificados (Vigencia 24h)
 * aplicando la doble validación: available == true && wholesalePriceUsd <= $15.00 USD && !isPremium
 */
export async function getOrRefreshDomainSuggestions(agencyId: string, forceRefresh = false) {
  const agency = await prisma.agency.findUnique({
    where: { id: agencyId },
    select: { id: true, name: true, slug: true },
  });
  if (!agency) return [];

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  if (!forceRefresh) {
    const cached = await prisma.agencyDomainSuggestionCache.findMany({
      where: {
        agencyId: agency.id,
        checkedAt: { gte: twentyFourHoursAgo },
      },
      orderBy: { wholesalePriceUsd: "asc" },
    });

    if (cached.length > 0) {
      return cached.filter(
        (c) => c.isAvailable && !c.isPremium && c.wholesalePriceUsd <= MAX_DOMAIN_WHOLESALE_USD
      );
    }
  }

  const liveResults = await checkDomainsAvailabilityAndWholesalePrice(
    agency.name,
    agency.slug
  );

  for (const item of liveResults) {
    await prisma.agencyDomainSuggestionCache.upsert({
      where: {
        agencyId_suggestedDomain: {
          agencyId: agency.id,
          suggestedDomain: item.domain,
        },
      },
      update: {
        tld: item.tld,
        isAvailable: item.isAvailable,
        wholesalePriceUsd: item.wholesalePriceUsd,
        isPremium: item.isPremium,
        checkedAt: new Date(),
      },
      create: {
        agencyId: agency.id,
        suggestedDomain: item.domain,
        tld: item.tld,
        isAvailable: item.isAvailable,
        wholesalePriceUsd: item.wholesalePriceUsd,
        isPremium: item.isPremium,
        checkedAt: new Date(),
      },
    });
  }

  const refreshed = await prisma.agencyDomainSuggestionCache.findMany({
    where: {
      agencyId: agency.id,
      isAvailable: true,
      isPremium: false,
      wholesalePriceUsd: { lte: MAX_DOMAIN_WHOLESALE_USD },
    },
    orderBy: { wholesalePriceUsd: "asc" },
  });

  return refreshed;
}

/**
 * Carga todo el estado administrativo del módulo de Dominios y Correos Corporativos
 */
export async function getCorporateEmailOverview(targetAgencyId?: string) {
  const ctx = await resolveTenantContext(targetAgencyId);

  const [subscription, agencyUsers, agenciesList] = await Promise.all([
    prisma.agencyEmailSubscription.findUnique({
      where: { agencyId: ctx.effectiveAgencyId },
      include: {
        mailboxes: {
          include: {
            agentUser: {
              select: { id: true, name: true, email: true, role: true, active: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        forwards: {
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.user.findMany({
      where: {
        agencyId: ctx.effectiveAgencyId,
        active: true,
        role: { in: ["ADMIN", "AGENTE", "AGENTE_LITE"] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: { name: "asc" },
    }),
    ctx.isSuperAdmin
      ? prisma.agency.findMany({
          select: {
            id: true,
            name: true,
            slug: true,
            allowCorporateEmailModule: true,
          },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const domainSuggestions = !subscription
    ? await getOrRefreshDomainSuggestions(ctx.effectiveAgencyId)
    : [];

  const primaryDomain =
    subscription?.domainName ||
    domainSuggestions[0]?.suggestedDomain ||
    `${ctx.agency.slug.replace(/[^a-z0-9]/g, "")}seguros.com`;

  // Generar vista previa real con los nombres de los agentes reales de la promotoría
  const sampleAgentEmails = agencyUsers.slice(0, 2).map((u) => ({
    userId: u.id,
    name: u.name || "Agente",
    emailPreview: `${buildAgentEmailLocalPart(u.name || u.email.split("@")[0])}@${primaryDomain}`,
  }));

  if (sampleAgentEmails.length === 0) {
    sampleAgentEmails.push(
      {
        userId: "sample-1",
        name: "Carlos Ramírez",
        emailPreview: `carlos.ramirez@${primaryDomain}`,
      },
      {
        userId: "sample-2",
        name: "Laura Méndez",
        emailPreview: `laura.mendez@${primaryDomain}`,
      }
    );
  }

  const activeMailboxes = (subscription?.mailboxes || []).filter(
    (m) => m.status === "active" || m.status === "suspended"
  );
  const releasedMailboxes = (subscription?.mailboxes || []).filter(
    (m) => m.status === "released"
  );

  return {
    agency: {
      id: ctx.agency.id,
      name: ctx.agency.name,
      slug: ctx.agency.slug,
      allowCorporateEmailModule: ctx.allowCorporateEmailModule,
    },
    currentUser: {
      id: ctx.user.id,
      name: ctx.user.name,
      email: ctx.user.email,
      role: ctx.user.role,
      isSuperAdmin: ctx.isSuperAdmin,
      isAdmin: ctx.isAdmin,
    },
    agenciesList,
    subscription,
    activeMailboxes,
    releasedMailboxes,
    forwards: subscription?.forwards || [],
    agencyUsers: agencyUsers.map((u) => ({
      ...u,
      suggestedLocalPart: buildAgentEmailLocalPart(u.name || u.email.split("@")[0]),
    })),
    domainSuggestions,
    upsellPreview: {
      primaryDomain,
      monthlyPriceMxn: PACKAGE_MONTHLY_PRICE_MXN,
      maxSeats: DEFAULT_MAX_SEATS,
      storageGbPerSeat: DEFAULT_STORAGE_GB,
      sampleAgentEmails,
      departmentalEmail: `direccion@${primaryDomain}`,
    },
  };
}

/**
 * Búsqueda personalizada de dominios con filtro estricto Anti-Premium (<= $15 USD)
 */
export async function searchCustomDomainAction(query: string, targetAgencyId?: string) {
  const ctx = await resolveTenantContext(targetAgencyId);
  if (!ctx.isAdmin) {
    throw new Error("Solo el Administrador de la promotoría puede buscar dominios.");
  }

  const results = await checkDomainsAvailabilityAndWholesalePrice(
    ctx.agency.name,
    ctx.agency.slug,
    query
  );

  for (const item of results) {
    await prisma.agencyDomainSuggestionCache.upsert({
      where: {
        agencyId_suggestedDomain: {
          agencyId: ctx.effectiveAgencyId,
          suggestedDomain: item.domain,
        },
      },
      update: {
        tld: item.tld,
        isAvailable: item.isAvailable,
        wholesalePriceUsd: item.wholesalePriceUsd,
        isPremium: item.isPremium,
        checkedAt: new Date(),
      },
      create: {
        agencyId: ctx.effectiveAgencyId,
        suggestedDomain: item.domain,
        tld: item.tld,
        isAvailable: item.isAvailable,
        wholesalePriceUsd: item.wholesalePriceUsd,
        isPremium: item.isPremium,
        checkedAt: new Date(),
      },
    });
  }

  return {
    allChecked: results,
    eligible: results.filter((r) => r.eligibleForPackage),
  };
}

/**
 * Activa el Paquete Corporativo Promotoría AACOMSoft ($999 MXN/mes):
 * - Realiza doble verificación en tiempo real (<500ms) de disponibilidad y tope mayorista <= $15 USD
 * - Registra el dominio con perfil WHOIS corporativo de AACOMSoft + Privacy Protection
 * - Crea la orden de Titan Email (20 asientos de 10 GB)
 * - Inyecta registros DNS MX, SPF, DKIM y DMARC
 * - Crea el primer buzón institucional direccion@<dominio> listo para usar
 */
export async function activateCorporateEmailSubscriptionAction(params: {
  domainName: string;
  billingMode: "STRIPE" | "COURTESY_SUPERADMIN" | "SANDBOX_CHECKOUT";
  targetAgencyId?: string;
}) {
  const ctx = await resolveTenantContext(params.targetAgencyId);
  if (!ctx.isAdmin) {
    throw new Error("Solo el Administrador de la promotoría o Super Admin puede activar este paquete.");
  }

  if (params.billingMode === "COURTESY_SUPERADMIN" && !ctx.isSuperAdmin) {
    throw new Error("Solo el Super Administrador puede otorgar activaciones en modo cortesía.");
  }

  const existing = await prisma.agencyEmailSubscription.findUnique({
    where: { agencyId: ctx.effectiveAgencyId },
  });
  if (existing && existing.status === "active") {
    throw new Error(`Esta promotoría ya cuenta con el dominio activo ${existing.domainName}.`);
  }

  // Doble verificación en tiempo real y aprovisionamiento Zero-Touch
  const provisioned = await provisionCorporateDomainAndTitanOrder({
    agencyName: ctx.agency.name,
    agencySlug: ctx.agency.slug,
    domainName: params.domainName,
  });

  // Si solicita Stripe Checkout real y existe STRIPE_SECRET_KEY cuando no es Sandbox directo
  if (params.billingMode === "STRIPE" && process.env.STRIPE_SECRET_KEY && process.env.CORPORATE_EMAIL_FORCE_STRIPE === "true") {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20" as any,
    });
    const baseUrl = process.env.NEXTAUTH_URL || "https://app.aacomsoft.com";

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "mxn",
            unit_amount: PACKAGE_MONTHLY_PRICE_MXN * 100,
            recurring: { interval: "month" },
            product_data: {
              name: `Paquete Corporativo Promotoría AACOMSoft (${provisioned.domainName})`,
              description: `Dominio oficial ${provisioned.domainName} + Hasta 20 buzones corporativos de 10 GB (Titan Email) integrados en AACOMSoft.`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: "CORPORATE_EMAIL_PACKAGE",
        agencyId: ctx.effectiveAgencyId,
        domainName: provisioned.domainName,
      },
      success_url: `${baseUrl}/correos-corporativos?activated=1&domain=${encodeURIComponent(provisioned.domainName)}`,
      cancel_url: `${baseUrl}/correos-corporativos?canceled=1`,
    });

    if (checkoutSession.url) {
      return {
        requiresRedirect: true,
        checkoutUrl: checkoutSession.url,
      };
    }
  }

  const renewsAt = new Date();
  renewsAt.setMonth(renewsAt.getMonth() + 1);

  const subscription = await prisma.agencyEmailSubscription.upsert({
    where: { agencyId: ctx.effectiveAgencyId },
    update: {
      domainName: provisioned.domainName,
      registrarOrderId: provisioned.registrarOrderId,
      titanOrderId: provisioned.titanOrderId,
      maxSeats: DEFAULT_MAX_SEATS,
      storageGbPerSeat: DEFAULT_STORAGE_GB,
      wholesaleDomainCostUsd: provisioned.wholesaleDomainCostUsd,
      monthlyPriceMxn: PACKAGE_MONTHLY_PRICE_MXN,
      billingMode: params.billingMode,
      dnsConfigured: provisioned.dnsConfigured,
      dnsRecordsJson: provisioned.dnsRecords as any,
      whoisCustodyProfile: provisioned.whoisCustodyProfile,
      status: "active",
      renewsAt,
    },
    create: {
      agencyId: ctx.effectiveAgencyId,
      domainName: provisioned.domainName,
      registrarOrderId: provisioned.registrarOrderId,
      titanOrderId: provisioned.titanOrderId,
      maxSeats: DEFAULT_MAX_SEATS,
      storageGbPerSeat: DEFAULT_STORAGE_GB,
      wholesaleDomainCostUsd: provisioned.wholesaleDomainCostUsd,
      monthlyPriceMxn: PACKAGE_MONTHLY_PRICE_MXN,
      billingMode: params.billingMode,
      dnsConfigured: provisioned.dnsConfigured,
      dnsRecordsJson: provisioned.dnsRecords as any,
      whoisCustodyProfile: provisioned.whoisCustodyProfile,
      status: "active",
      renewsAt,
    },
  });

  // Crear buzón institucional inicial direccion@<dominio> si no existe aún
  const defaultAdminEmail = `direccion@${provisioned.domainName}`;
  const existingDefaultMbx = await prisma.agencyMailbox.findUnique({
    where: { emailAddress: defaultAdminEmail },
  });

  if (!existingDefaultMbx) {
    const titanAcc = await provisionTitanMailboxAccount({
      emailAddress: defaultAdminEmail,
      displayName: `Dirección ${ctx.agency.name}`,
      titanOrderId: provisioned.titanOrderId,
    });

    const createdMbx = await prisma.agencyMailbox.create({
      data: {
        subscriptionId: subscription.id,
        agencyId: ctx.effectiveAgencyId,
        agentUserId: ctx.user.id,
        displayName: `Dirección ${ctx.agency.name}`,
        isDepartmental: true,
        emailAddress: defaultAdminEmail,
        titanAccountId: titanAcc.titanAccountId,
        encryptedImapCredentials: titanAcc.encryptedImapCredentials,
        storageUsedMb: 45,
        status: "active",
      },
    });

    await prisma.agencyEmailMessage.create({
      data: {
        agencyId: ctx.effectiveAgencyId,
        mailboxId: createdMbx.id,
        folder: "INBOX",
        fromAddress: "soporte@aacomsoft.com",
        fromName: "Identidad Corporativa AACOMSoft",
        toAddresses: defaultAdminEmail,
        subject: `🎉 ¡Bienvenido! Tu dominio ${provisioned.domainName} y tus 20 asientos Titan Email están activos`,
        snippet: `Los registros MX, SPF, DKIM y DMARC de ${provisioned.domainName} han sido configurados automáticamente.`,
        bodyHtml: `
          <div style="font-family: sans-serif; color: #1e293b; line-height: 1.6;">
            <h2 style="color: #0284c7;">¡Tu Identidad Corporativa en AACOMSoft está lista!</h2>
            <p>Hola <strong>${ctx.agency.name}</strong>,</p>
            <p>Tu dominio oficial <strong>${provisioned.domainName}</strong> ha sido registrado bajo custodia Zero-Touch con protección de privacidad WHOIS y conectado a tu bolsa de <strong>20 buzones de 10 GB</strong> en infraestructura Titan Email.</p>
            <ul>
              <li><strong>Registros MX:</strong> mx1.titan.email (10), mx2.titan.email (20) — Activos</li>
              <li><strong>SPF:</strong> <code>v=spf1 include:spf.titan.email ~all</code> — Activo</li>
              <li><strong>DKIM y DMARC:</strong> Firmas criptográficas activas para máxima entregabilidad</li>
            </ul>
            <p>Desde el panel <strong>Dominios y 20 Correos</strong> puedes asignar asientos a tus agentes o liberar lugares cuando haya rotación sin perder los correos de tus asegurados.</p>
          </div>
        `,
        bodyText: `¡Tu Identidad Corporativa en AACOMSoft está lista! Tu dominio ${provisioned.domainName} y tus 20 buzones de 10 GB están activos.`,
        isRead: false,
      },
    });
  }

  revalidatePath("/correos-corporativos");
  revalidatePath("/mi-correo");
  revalidatePath("/");

  return {
    requiresRedirect: false,
    subscriptionId: subscription.id,
    domainName: subscription.domainName,
  };
}

/**
 * Crea un buzón corporativo (para un agente de AACOMSoft o departamental como siniestros@, atencion@)
 */
export async function createAgencyMailboxAction(params: {
  targetAgencyId?: string;
  agentUserId?: string | null;
  isDepartmental: boolean;
  localPart: string;
  displayName: string;
}) {
  const ctx = await resolveTenantContext(params.targetAgencyId);
  if (!ctx.isAdmin) {
    throw new Error("Solo el Administrador de la promotoría puede crear buzones.");
  }

  const subscription = await prisma.agencyEmailSubscription.findUnique({
    where: { agencyId: ctx.effectiveAgencyId },
    include: { mailboxes: true },
  });

  if (!subscription || subscription.status !== "active") {
    throw new Error("La promotoría no tiene una suscripción activa de correo corporativo.");
  }

  const occupiedSeats = subscription.mailboxes.filter(
    (m) => m.status === "active" || m.status === "suspended"
  ).length;

  if (occupiedSeats >= subscription.maxSeats) {
    throw new Error(
      `Has alcanzado el límite de ${subscription.maxSeats}/${subscription.maxSeats} buzones asignados. Da de baja un buzón de algún ex-agente para liberar un asiento.`
    );
  }

  const cleanLocal = params.localPart
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .trim();

  if (!cleanLocal || cleanLocal.length < 2) {
    throw new Error("El alias del correo debe tener al menos 2 caracteres válidos.");
  }

  const fullEmail = `${cleanLocal}@${subscription.domainName}`;

  const existingEmail = await prisma.agencyMailbox.findUnique({
    where: { emailAddress: fullEmail },
  });

  if (existingEmail && existingEmail.status !== "released") {
    throw new Error(`El buzón ${fullEmail} ya existe y está ocupando un asiento.`);
  }

  const titanAcc = await provisionTitanMailboxAccount({
    emailAddress: fullEmail,
    displayName: params.displayName.trim() || cleanLocal,
    titanOrderId: subscription.titanOrderId || "TITAN-ORDER",
  });

  let mailbox;
  if (existingEmail && existingEmail.status === "released") {
    mailbox = await prisma.agencyMailbox.update({
      where: { id: existingEmail.id },
      data: {
        agentUserId: params.agentUserId || null,
        displayName: params.displayName.trim() || cleanLocal,
        isDepartmental: params.isDepartmental,
        titanAccountId: titanAcc.titanAccountId,
        encryptedImapCredentials: titanAcc.encryptedImapCredentials,
        storageUsedMb: 35,
        status: "active",
        releasedAt: null,
      },
    });
  } else {
    mailbox = await prisma.agencyMailbox.create({
      data: {
        subscriptionId: subscription.id,
        agencyId: ctx.effectiveAgencyId,
        agentUserId: params.agentUserId || null,
        displayName: params.displayName.trim() || cleanLocal,
        isDepartmental: params.isDepartmental,
        emailAddress: fullEmail,
        titanAccountId: titanAcc.titanAccountId,
        encryptedImapCredentials: titanAcc.encryptedImapCredentials,
        storageUsedMb: 35,
        status: "active",
      },
    });
  }

  await prisma.agencyEmailMessage.create({
    data: {
      agencyId: ctx.effectiveAgencyId,
      mailboxId: mailbox.id,
      folder: "INBOX",
      fromAddress: `direccion@${subscription.domainName}`,
      fromName: `Administración ${ctx.agency.name}`,
      toAddresses: fullEmail,
      subject: `Bienvenido a tu nuevo correo oficial ${fullEmail} en AACOMSoft`,
      snippet: `Tu buzón de 10 GB está listo para enviar pólizas y atender a tus asegurados desde AACOMSoft.`,
      bodyHtml: `
        <div style="font-family: sans-serif; color: #1e293b; line-height: 1.6;">
          <h3 style="color: #0284c7;">¡Bienvenido a tu buzón corporativo ${fullEmail}!</h3>
          <p>Hola <strong>${mailbox.displayName}</strong>,</p>
          <p>Tu cuenta de correo profesional de <strong>10 GB</strong> ya está vinculada a tu sesión de <strong>AACOMSoft</strong>.</p>
          <p>Puedes enviar pólizas y expedientes en 1 clic usando el botón <strong>"Redactar / Enviar Póliza"</strong> o sincronizar este buzón en tu iPhone o Android sin teclear puertos ni contraseñas.</p>
        </div>
      `,
      bodyText: `Hola ${mailbox.displayName}, tu buzón corporativo ${fullEmail} de 10 GB ya está activo en AACOMSoft.`,
      isRead: false,
    },
  });

  revalidatePath("/correos-corporativos");
  revalidatePath("/mi-correo");

  return {
    success: true,
    mailbox,
  };
}

/**
 * Suspende o reactiva inmediatamente un buzón en 1 clic (en caso de robo de celular o salida conflictiva)
 */
export async function toggleMailboxSuspensionAction(params: {
  mailboxId: string;
  suspend: boolean;
  targetAgencyId?: string;
}) {
  const ctx = await resolveTenantContext(params.targetAgencyId);
  if (!ctx.isAdmin) {
    throw new Error("Solo el Administrador puede suspender o reactivar buzones.");
  }

  const mailbox = await prisma.agencyMailbox.findFirst({
    where: {
      id: params.mailboxId,
      agencyId: ctx.effectiveAgencyId,
    },
  });

  if (!mailbox) {
    throw new Error("Buzón no encontrado en esta promotoría.");
  }

  const updated = await prisma.agencyMailbox.update({
    where: { id: mailbox.id },
    data: {
      status: params.suspend ? "suspended" : "active",
    },
  });

  revalidatePath("/correos-corporativos");
  revalidatePath("/mi-correo");
  return { success: true, status: updated.status };
}

/**
 * Flujo Especial de Rotación de Agentes:
 * "Baja, Respaldo IMAP Opcional, Liberación de Asiento (18/20 -> 17/20) y Puente de Cartera (Forwarder Gratuito)"
 */
export async function releaseMailboxAndCreateForwardAction(params: {
  mailboxId: string;
  destinationMailboxId: string;
  migrateExistingEmails: boolean;
  targetAgencyId?: string;
}) {
  const ctx = await resolveTenantContext(params.targetAgencyId);
  if (!ctx.isAdmin) {
    throw new Error("Solo el Administrador de la promotoría puede dar de baja buzones y liberar asientos.");
  }

  const [sourceMailbox, destinationMailbox, subscription] = await Promise.all([
    prisma.agencyMailbox.findFirst({
      where: { id: params.mailboxId, agencyId: ctx.effectiveAgencyId },
      include: { messages: true, agentUser: true },
    }),
    prisma.agencyMailbox.findFirst({
      where: {
        id: params.destinationMailboxId,
        agencyId: ctx.effectiveAgencyId,
        status: "active",
      },
    }),
    prisma.agencyEmailSubscription.findUnique({
      where: { agencyId: ctx.effectiveAgencyId },
    }),
  ]);

  if (!sourceMailbox || !subscription) {
    throw new Error("Buzón origen no encontrado.");
  }
  if (!destinationMailbox) {
    throw new Error("Debes elegir un buzón activo de destino para el Puente de Cartera.");
  }
  if (sourceMailbox.id === destinationMailbox.id) {
    throw new Error("El buzón destino debe ser distinto al buzón que se dará de baja.");
  }

  let migratedCount = 0;

  // 1. Respaldo y migración opcional de los correos existentes antes de eliminar el buzón en Titan
  if (params.migrateExistingEmails && sourceMailbox.messages.length > 0) {
    for (const msg of sourceMailbox.messages) {
      await prisma.agencyEmailMessage.create({
        data: {
          agencyId: ctx.effectiveAgencyId,
          mailboxId: destinationMailbox.id,
          folder: "MIGRATED",
          fromAddress: msg.fromAddress,
          fromName: msg.fromName,
          toAddresses: msg.toAddresses,
          ccAddresses: msg.ccAddresses,
          subject: `[Cartera ${sourceMailbox.emailAddress}] ${msg.subject}`,
          snippet: msg.snippet,
          bodyHtml: msg.bodyHtml,
          bodyText: msg.bodyText,
          attachmentsJson: msg.attachmentsJson ?? undefined,
          isRead: false,
          isStarred: msg.isStarred,
          relatedClientId: msg.relatedClientId,
          relatedPolicyId: msg.relatedPolicyId,
          migratedFrom: sourceMailbox.emailAddress,
          receivedAt: msg.receivedAt,
        },
      });
      migratedCount++;
    }
  }

  // 2. Eliminar mensajes del buzón liberado y marcar asiento como released (18/20 -> 17/20)
  await prisma.agencyEmailMessage.deleteMany({
    where: { mailboxId: sourceMailbox.id },
  });

  await prisma.agencyMailbox.update({
    where: { id: sourceMailbox.id },
    data: {
      status: "released",
      agentUserId: null,
      storageUsedMb: 0,
      releasedAt: new Date(),
    },
  });

  // 3. Crear Forwarder / Alias gratuito en Titan Email (Puente de Cartera sin consumir asiento)
  const { titanForwardId } = await createTitanFreeForwarder({
    titanOrderId: subscription.titanOrderId || "TITAN-ORDER",
    sourceEmail: sourceMailbox.emailAddress,
    destinationEmail: destinationMailbox.emailAddress,
  });

  const forward = await prisma.agencyEmailForward.create({
    data: {
      subscriptionId: subscription.id,
      agencyId: ctx.effectiveAgencyId,
      sourceEmail: sourceMailbox.emailAddress,
      destinationEmail: destinationMailbox.emailAddress,
      formerAgentUserId: sourceMailbox.agentUserId,
      formerAgentName: sourceMailbox.displayName,
      titanForwardId,
      migratedMessagesCount: migratedCount,
      active: true,
    },
  });

  // Enviar notificación al buzón receptor informando que ahora recibe el Puente de Cartera
  await prisma.agencyEmailMessage.create({
    data: {
      agencyId: ctx.effectiveAgencyId,
      mailboxId: destinationMailbox.id,
      folder: "INBOX",
      fromAddress: `direccion@${subscription.domainName}`,
      fromName: `Puente de Cartera ${ctx.agency.name}`,
      toAddresses: destinationMailbox.emailAddress,
      subject: `🔄 Puente de Cartera Activo: Ahora recibes los correos de ${sourceMailbox.emailAddress}`,
      snippet: `Todos los correos futuros que los clientes envíen a ${sourceMailbox.emailAddress} llegarán automáticamente a tu bandeja.`,
      bodyHtml: `
        <div style="font-family: sans-serif; color: #1e293b; line-height: 1.6;">
          <h3 style="color: #0284c7;">Puente de Cartera Configurado</h3>
          <p>El administrador de tu promotoría ha liberado el buzón de <strong>${sourceMailbox.displayName}</strong> (<code>${sourceMailbox.emailAddress}</code>) y activó la redirección automática hacia tu cuenta <strong>${destinationMailbox.emailAddress}</strong>.</p>
          <p><strong>Correos históricos respaldados en tu carpeta "Cartera Heredada":</strong> ${migratedCount} mensaje(s).</p>
          <p>A partir de este momento, cualquier renovación, siniestro o consulta que un asegurado envíe a <code>${sourceMailbox.emailAddress}</code> llegará directamente a tu Bandeja de Entrada.</p>
        </div>
      `,
      bodyText: `El Puente de Cartera para ${sourceMailbox.emailAddress} ahora redirige a ${destinationMailbox.emailAddress}. Correos respaldados: ${migratedCount}.`,
      isRead: false,
    },
  });

  revalidatePath("/correos-corporativos");
  revalidatePath("/mi-correo");

  return {
    success: true,
    forward,
    migratedCount,
  };
}

/**
 * Elimina un Forwarder activo si ya no se requiere
 */
export async function deleteForwarderAction(params: {
  forwardId: string;
  targetAgencyId?: string;
}) {
  const ctx = await resolveTenantContext(params.targetAgencyId);
  if (!ctx.isAdmin) {
    throw new Error("Solo el Administrador puede eliminar redirecciones.");
  }

  await prisma.agencyEmailForward.deleteMany({
    where: {
      id: params.forwardId,
      agencyId: ctx.effectiveAgencyId,
    },
  });

  revalidatePath("/correos-corporativos");
  return { success: true };
}

/**
 * Obtiene los datos del cliente de correo responsivo ("📧 Mi Correo") para el agente o administrador
 */
export async function getAgentWebmailData(params?: {
  mailboxId?: string;
  targetAgencyId?: string;
}) {
  const ctx = await resolveTenantContext(params?.targetAgencyId);

  const subscription = await prisma.agencyEmailSubscription.findUnique({
    where: { agencyId: ctx.effectiveAgencyId },
  });

  // Buzones a los que este usuario tiene acceso:
  // - Su(s) buzón(es) asignado(s) personalmente
  // - Si es ADMIN o SUPER_ADMIN: también los buzones departamentales (direccion@, siniestros@, atencion@) y opción de supervisar buzones de su agencia
  const accessibleMailboxes = await prisma.agencyMailbox.findMany({
    where: {
      agencyId: ctx.effectiveAgencyId,
      status: { in: ["active", "suspended"] },
      ...(ctx.isAdmin
        ? {}
        : {
            agentUserId: ctx.user.id,
          }),
    },
    orderBy: [{ isDepartmental: "desc" }, { createdAt: "asc" }],
  });

  const selectedMailbox =
    accessibleMailboxes.find((m) => m.id === params?.mailboxId) ||
    accessibleMailboxes.find((m) => m.agentUserId === ctx.user.id) ||
    accessibleMailboxes[0] ||
    null;

  const [messages, clients, policies, activeForwards] = await Promise.all([
    selectedMailbox
      ? prisma.agencyEmailMessage.findMany({
          where: {
            agencyId: ctx.effectiveAgencyId,
            mailboxId: selectedMailbox.id,
          },
          orderBy: { receivedAt: "desc" },
          take: 150,
        })
      : Promise.resolve([]),
    prisma.client.findMany({
      where: {
        agencyId: ctx.effectiveAgencyId,
        isArchived: false,
        ...(ctx.isAdmin ? {} : { userId: ctx.user.id }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
      orderBy: { name: "asc" },
      take: 200,
    }),
    prisma.policy.findMany({
      where: {
        agencyId: ctx.effectiveAgencyId,
        isArchived: false,
        ...(ctx.isAdmin ? {} : { userId: ctx.user.id }),
      },
      select: {
        id: true,
        policyNumber: true,
        insuranceCompany: true,
        product: true,
        ramo: true,
        contractor: true,
        insured: true,
        annualPremium: true,
        currency: true,
        effectiveDate: true,
        renewalDate: true,
        pdfUrl: true,
        clientId: true,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    selectedMailbox
      ? prisma.agencyEmailForward.findMany({
          where: {
            agencyId: ctx.effectiveAgencyId,
            destinationEmail: selectedMailbox.emailAddress,
            active: true,
          },
        })
      : Promise.resolve([]),
  ]);

  return {
    agency: {
      id: ctx.agency.id,
      name: ctx.agency.name,
      slug: ctx.agency.slug,
    },
    currentUser: {
      id: ctx.user.id,
      name: ctx.user.name,
      email: ctx.user.email,
      role: ctx.user.role,
      isAdmin: ctx.isAdmin,
      isSuperAdmin: ctx.isSuperAdmin,
    },
    subscription,
    accessibleMailboxes,
    selectedMailbox,
    activeForwards,
    messages,
    clients,
    policies,
  };
}

/**
 * Envía un correo corporativo (o guarda borrador) desde "📧 Mi Correo",
 * descifrando las credenciales AES-256-GCM en el servidor.
 * Además, si el destinatario es un buzón o Forwarder ("Puente de Cartera") dentro de AACOMSoft,
 * entrega el correo en tiempo real en la bandeja destino.
 */
export async function sendCorporateEmailAction(params: {
  mailboxId: string;
  to: string;
  cc?: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  relatedClientId?: string;
  relatedPolicyId?: string;
  attachmentsJson?: any;
  saveAsDraft?: boolean;
  targetAgencyId?: string;
}) {
  const ctx = await resolveTenantContext(params.targetAgencyId);

  const senderMailbox = await prisma.agencyMailbox.findFirst({
    where: {
      id: params.mailboxId,
      agencyId: ctx.effectiveAgencyId,
      ...(ctx.isAdmin ? {} : { agentUserId: ctx.user.id }),
    },
  });

  if (!senderMailbox) {
    throw new Error("No tienes permiso para enviar desde este buzón.");
  }

  if (senderMailbox.status === "suspended") {
    throw new Error("Este buzón se encuentra suspendido temporalmente por el Administrador.");
  }

  const cleanTo = params.to.trim().toLowerCase();
  const snippet = (params.bodyText || params.bodyHtml.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);

  if (params.saveAsDraft) {
    const draft = await prisma.agencyEmailMessage.create({
      data: {
        agencyId: ctx.effectiveAgencyId,
        mailboxId: senderMailbox.id,
        folder: "DRAFTS",
        fromAddress: senderMailbox.emailAddress,
        fromName: senderMailbox.displayName,
        toAddresses: cleanTo,
        ccAddresses: params.cc?.trim() || null,
        subject: params.subject.trim() || "(Sin asunto)",
        snippet,
        bodyHtml: params.bodyHtml,
        bodyText: params.bodyText || snippet,
        attachmentsJson: params.attachmentsJson ?? undefined,
        isRead: true,
        relatedClientId: params.relatedClientId || null,
        relatedPolicyId: params.relatedPolicyId || null,
      },
    });
    revalidatePath("/mi-correo");
    return { success: true, message: draft, mode: "DRAFT" };
  }

  // Descifrar credenciales AES-256-GCM en backend
  const creds = decryptMailboxCredentials(senderMailbox.encryptedImapCredentials);

  if (creds && creds.providerMode === "RESELLERCLUB_LIVE") {
    try {
      const transporter = nodemailer.createTransport({
        host: creds.smtpHost,
        port: creds.smtpPort,
        secure: creds.smtpPort === 465,
        auth: {
          user: creds.emailAddress,
          pass: creds.password,
        },
      });
      await transporter.sendMail({
        from: `"${senderMailbox.displayName}" <${senderMailbox.emailAddress}>`,
        to: cleanTo,
        cc: params.cc?.trim() || undefined,
        subject: params.subject.trim(),
        html: params.bodyHtml,
        text: params.bodyText || snippet,
      });
    } catch (smtpErr) {
      console.warn("Titan SMTP live send warning (saved in SENT):", smtpErr);
    }
  }

  // Guardar en carpeta ENVIADOS (SENT) del remitente
  const sentMessage = await prisma.agencyEmailMessage.create({
    data: {
      agencyId: ctx.effectiveAgencyId,
      mailboxId: senderMailbox.id,
      folder: "SENT",
      fromAddress: senderMailbox.emailAddress,
      fromName: senderMailbox.displayName,
      toAddresses: cleanTo,
      ccAddresses: params.cc?.trim() || null,
      subject: params.subject.trim(),
      snippet,
      bodyHtml: params.bodyHtml,
      bodyText: params.bodyText || snippet,
      attachmentsJson: params.attachmentsJson ?? undefined,
      isRead: true,
      relatedClientId: params.relatedClientId || null,
      relatedPolicyId: params.relatedPolicyId || null,
    },
  });

  // Enrutamiento interno en tiempo real (si el destinatario es un buzón o Forwarder de la promotoría)
  const recipients = cleanTo
    .split(/[;,]/)
    .map((r) => r.trim().toLowerCase())
    .filter(Boolean);

  for (const recipientEmail of recipients) {
    // 1. ¿Es un Forwarder activo ("Puente de Cartera" de un ex-agente)?
    const activeForward = await prisma.agencyEmailForward.findFirst({
      where: {
        agencyId: ctx.effectiveAgencyId,
        sourceEmail: recipientEmail,
        active: true,
      },
    });

    const finalTargetEmail = activeForward
      ? activeForward.destinationEmail.toLowerCase()
      : recipientEmail;

    const targetMailbox = await prisma.agencyMailbox.findFirst({
      where: {
        agencyId: ctx.effectiveAgencyId,
        emailAddress: finalTargetEmail,
        status: "active",
      },
    });

    if (targetMailbox) {
      await prisma.agencyEmailMessage.create({
        data: {
          agencyId: ctx.effectiveAgencyId,
          mailboxId: targetMailbox.id,
          folder: "INBOX",
          fromAddress: senderMailbox.emailAddress,
          fromName: senderMailbox.displayName,
          toAddresses: recipientEmail,
          ccAddresses: params.cc?.trim() || null,
          subject: activeForward
            ? `[Redirigido de ${activeForward.sourceEmail}] ${params.subject.trim()}`
            : params.subject.trim(),
          snippet,
          bodyHtml: params.bodyHtml,
          bodyText: params.bodyText || snippet,
          attachmentsJson: params.attachmentsJson ?? undefined,
          isRead: false,
          relatedClientId: params.relatedClientId || null,
          relatedPolicyId: params.relatedPolicyId || null,
          migratedFrom: activeForward ? activeForward.sourceEmail : null,
        },
      });
    }
  }

  revalidatePath("/mi-correo");
  return { success: true, message: sentMessage, mode: "SENT" };
}

/**
 * Actualiza el estado de un correo (leído, destacado o mover a Papelera/Recibidos)
 */
export async function updateEmailMessageStatusAction(params: {
  messageId: string;
  isRead?: boolean;
  isStarred?: boolean;
  moveToFolder?: "INBOX" | "TRASH";
  targetAgencyId?: string;
}) {
  const ctx = await resolveTenantContext(params.targetAgencyId);

  const msg = await prisma.agencyEmailMessage.findFirst({
    where: {
      id: params.messageId,
      agencyId: ctx.effectiveAgencyId,
    },
  });

  if (!msg) {
    throw new Error("Mensaje no encontrado.");
  }

  await prisma.agencyEmailMessage.update({
    where: { id: msg.id },
    data: {
      ...(typeof params.isRead === "boolean" ? { isRead: params.isRead } : {}),
      ...(typeof params.isStarred === "boolean" ? { isStarred: params.isStarred } : {}),
      ...(params.moveToFolder ? { folder: params.moveToFolder } : {}),
    },
  });

  revalidatePath("/mi-correo");
  return { success: true };
}

/**
 * Simulador de correo entrante de un Asegurado (para probar en el ambiente de pruebas tanto buzones activos
 * como el Puente de Cartera / Forwarder de un ex-agente dado de baja)
 */
export async function simulateIncomingClientEmailAction(params: {
  toEmail: string;
  targetAgencyId?: string;
}) {
  const ctx = await resolveTenantContext(params.targetAgencyId);
  const cleanRecipient = params.toEmail.trim().toLowerCase();

  // Verificar si está dirigido a un ex-agente con Puente de Cartera (Forwarder)
  const forward = await prisma.agencyEmailForward.findFirst({
    where: {
      agencyId: ctx.effectiveAgencyId,
      sourceEmail: cleanRecipient,
      active: true,
    },
  });

  const finalRecipient = forward ? forward.destinationEmail.toLowerCase() : cleanRecipient;

  const targetMailbox = await prisma.agencyMailbox.findFirst({
    where: {
      agencyId: ctx.effectiveAgencyId,
      emailAddress: finalRecipient,
      status: "active",
    },
  });

  if (!targetMailbox) {
    throw new Error(
      `No se encontró un buzón activo ni un Puente de Cartera para recibir correos dirigidos a ${cleanRecipient}.`
    );
  }

  const msg = await prisma.agencyEmailMessage.create({
    data: {
      agencyId: ctx.effectiveAgencyId,
      mailboxId: targetMailbox.id,
      folder: "INBOX",
      fromAddress: "asegurado.renovacion@cliente-ejemplo.mx",
      fromName: "Roberto Hernández (Asegurado)",
      toAddresses: cleanRecipient,
      subject: forward
        ? `🔄 [Puente de Cartera: ${cleanRecipient}] Solicitud de Renovación de Póliza GMM y Comprobante`
        : `Solicitud de Renovación de Póliza GMM y Comprobante de Pago`,
      snippet: `Hola, escribo a ${cleanRecipient} para confirmar la renovación anual de mi póliza de Gastos Médicos Mayores.`,
      bodyHtml: `
        <div style="font-family: sans-serif; color: #1e293b; line-height: 1.6;">
          ${
            forward
              ? `<div style="background: #f0f9ff; border: 1px solid #bae6fd; padding: 10px 14px; border-radius: 8px; margin-bottom: 14px; font-size: 13px; color: #0369a1;">
                  <strong>🛡️ Puente de Cartera AACOMSoft:</strong> Este asegurado escribió al correo anterior <code>${cleanRecipient}</code> (${forward.formerAgentName || "Ex-agente"}) y fue redirigido automáticamente a tu bandeja <code>${targetMailbox.emailAddress}</code> sin perder al cliente.
                </div>`
              : ""
          }
          <p>Estimado asesor,</p>
          <p>Te escribo al correo <strong>${cleanRecipient}</strong> para solicitar el recibo de renovación de mi póliza de Gastos Médicos Mayores y confirmar si podemos actualizar la suma asegurada.</p>
          <p>Quedo atento a tus comentarios.<br/>Saludos cordiales,<br/><strong>Roberto Hernández</strong><br/>Tel: 55 4123 9876</p>
        </div>
      `,
      bodyText: `Estimado asesor, te escribo a ${cleanRecipient} para solicitar la renovación de mi póliza de Gastos Médicos Mayores. Saludos, Roberto Hernández.`,
      isRead: false,
      migratedFrom: forward ? cleanRecipient : null,
    },
  });

  revalidatePath("/mi-correo");
  revalidatePath("/correos-corporativos");

  return {
    success: true,
    routedViaForwarder: Boolean(forward),
    originalRecipient: cleanRecipient,
    deliveredTo: targetMailbox.emailAddress,
    messageId: msg.id,
  };
}

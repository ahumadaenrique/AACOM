import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { decryptMailboxCredentials } from "@/lib/corporate-email/provider";
import crypto from "crypto";

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const mailboxId = req.nextUrl.searchParams.get("mailboxId");
    const format = req.nextUrl.searchParams.get("format") || "mobileconfig";

    if (!mailboxId) {
      return NextResponse.json({ error: "mailboxId requerido" }, { status: 400 });
    }

    const isSuperAdmin = user.role === "SUPER_ADMIN";
    const isAdmin = user.role === "ADMIN" || isSuperAdmin;
    const effectiveAgencyId = (session.user as any)?.agencyId || user.agencyId || "aacom";

    const mailbox = await prisma.agencyMailbox.findFirst({
      where: {
        id: mailboxId,
        ...(isSuperAdmin ? {} : { agencyId: effectiveAgencyId }),
        ...(isAdmin ? {} : { agentUserId: user.id }),
      },
      include: {
        agency: { select: { name: true } },
      },
    });

    if (!mailbox) {
      return NextResponse.json(
        { error: "No tienes permiso para sincronizar este buzón." },
        { status: 403 }
      );
    }

    const creds = decryptMailboxCredentials(mailbox.encryptedImapCredentials);
    if (!creds) {
      return NextResponse.json(
        { error: "No fue posible descifrar las credenciales del buzón." },
        { status: 500 }
      );
    }

    if (format === "json") {
      return NextResponse.json({
        emailAddress: creds.emailAddress,
        displayName: mailbox.displayName,
        password: creds.password,
        imapHost: creds.imapHost,
        imapPort: creds.imapPort,
        smtpHost: creds.smtpHost,
        smtpPort: creds.smtpPort,
        security: "SSL/TLS",
      });
    }

    const payloadUuid = crypto.randomUUID().toUpperCase();
    const profileUuid = crypto.randomUUID().toUpperCase();
    const domain = mailbox.emailAddress.split("@")[1] || "aacomsoft.com";
    const orgName = mailbox.agency?.name || "AACOMSoft";

    const mobileconfigXml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>PayloadContent</key>
  <array>
    <dict>
      <key>EmailAccountDescription</key>
      <string>${escapeXml(`${mailbox.displayName} (${mailbox.emailAddress})`)}</string>
      <key>EmailAccountName</key>
      <string>${escapeXml(mailbox.displayName)}</string>
      <key>EmailAccountType</key>
      <string>EmailTypeIMAP</string>
      <key>EmailAddress</key>
      <string>${escapeXml(creds.emailAddress)}</string>
      <key>IncomingMailServerAuthentication</key>
      <string>EmailAuthPassword</string>
      <key>IncomingMailServerHostName</key>
      <string>${escapeXml(creds.imapHost)}</string>
      <key>IncomingMailServerPortNumber</key>
      <integer>${creds.imapPort}</integer>
      <key>IncomingMailServerUseSSL</key>
      <true/>
      <key>IncomingMailServerUsername</key>
      <string>${escapeXml(creds.emailAddress)}</string>
      <key>IncomingPassword</key>
      <string>${escapeXml(creds.password)}</string>
      <key>OutgoingMailServerAuthentication</key>
      <string>EmailAuthPassword</string>
      <key>OutgoingMailServerHostName</key>
      <string>${escapeXml(creds.smtpHost)}</string>
      <key>OutgoingMailServerPortNumber</key>
      <integer>${creds.smtpPort}</integer>
      <key>OutgoingMailServerUseSSL</key>
      <true/>
      <key>OutgoingMailServerUsername</key>
      <string>${escapeXml(creds.emailAddress)}</string>
      <key>OutgoingPasswordSameAsIncomingPassword</key>
      <true/>
      <key>PayloadDescription</key>
      <string>Configuración automática de Correo Corporativo AACOMSoft (${escapeXml(creds.emailAddress)})</string>
      <key>PayloadDisplayName</key>
      <string>Correo ${escapeXml(creds.emailAddress)}</string>
      <key>PayloadIdentifier</key>
      <string>com.aacomsoft.mail.account.${payloadUuid}</string>
      <key>PayloadOrganization</key>
      <string>${escapeXml(orgName)} via AACOMSoft</string>
      <key>PayloadType</key>
      <string>com.apple.mail.managed</string>
      <key>PayloadUUID</key>
      <string>${payloadUuid}</string>
      <key>PayloadVersion</key>
      <integer>1</integer>
      <key>PreventAppSheet</key>
      <false/>
      <key>PreventMove</key>
      <false/>
      <key>SMIMEEnabled</key>
      <false/>
    </dict>
  </array>
  <key>PayloadDescription</key>
  <string>Instala en 1 clic tu buzón corporativo ${escapeXml(creds.emailAddress)} en iPhone, iPad o Mac (operado por AACOMSoft).</string>
  <key>PayloadDisplayName</key>
  <string>Correo Corporativo ${escapeXml(domain)} (AACOMSoft)</string>
  <key>PayloadIdentifier</key>
  <string>com.aacomsoft.mail.profile.${profileUuid}</string>
  <key>PayloadOrganization</key>
  <string>${escapeXml(orgName)} — AACOMSoft</string>
  <key>PayloadRemovalDisallowed</key>
  <false/>
  <key>PayloadType</key>
  <string>Configuration</string>
  <key>PayloadUUID</key>
  <string>${profileUuid}</string>
  <key>PayloadVersion</key>
  <integer>1</integer>
</dict>
</plist>`;

    const filename = `aacomsoft-${creds.emailAddress.replace(/[^a-z0-9.-]/gi, "_")}.mobileconfig`;

    return new NextResponse(mobileconfigXml, {
      status: 200,
      headers: {
        "Content-Type": "application/x-apple-aspen-config; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Error generando perfil móvil" },
      { status: 500 }
    );
  }
}

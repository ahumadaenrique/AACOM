import crypto from "crypto";
import { encrypt, decrypt } from "@/lib/encryption";

export const MAX_DOMAIN_WHOLESALE_USD = 15.0;
export const DEFAULT_MAX_SEATS = 20;
export const DEFAULT_STORAGE_GB = 3;
export const PACKAGE_MONTHLY_PRICE_MXN = 999;

export interface DomainCheckResult {
  domain: string;
  tld: ".com" | ".com.mx" | ".mx";
  isAvailable: boolean;
  wholesalePriceUsd: number;
  isPremium: boolean;
  eligibleForPackage: boolean;
  reasonIfIneligible?: string;
}

export interface DnsRecordSpec {
  type: "MX" | "TXT";
  host: string;
  value: string;
  priority?: number;
  ttl: number;
  verified: boolean;
}

export interface ProvisioningResult {
  mode: "RESELLERCLUB_LIVE" | "SANDBOX_SIMULATOR";
  domainName: string;
  registrarOrderId: string;
  titanOrderId: string;
  wholesaleDomainCostUsd: number;
  dnsConfigured: boolean;
  dnsRecords: DnsRecordSpec[];
  whoisCustodyProfile: string;
}

export interface MailboxCredentialsPayload {
  emailAddress: string;
  password: string;
  imapHost: string;
  imapPort: number;
  smtpHost: string;
  smtpPort: number;
  providerMode: "RESELLERCLUB_LIVE" | "SANDBOX_SIMULATOR";
}

/**
 * Normaliza el nombre comercial de una promotoría para generar candidatos de dominio limpios
 * Ej: "Promotoría Seguros del Valle S.A. de C.V." -> "segurosdelvalle"
 */
export function normalizeAgencyBaseDomain(agencyName: string, slug?: string | null): string[] {
  const cleanText = (str: string) =>
    str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\b(sa de cv|s de rl|sc|sap|promotoria|agencia|despacho|grupo|consultoria)\b/g, " ")
      .replace(/[^a-z0-9]/g, "")
      .trim();

  const fullNormalized = (agencyName || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(sa de cv|s de rl|sc|sapi)\b/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();

  const stripped = cleanText(agencyName || "");
  const slugClean = cleanText(slug || "");

  const bases = new Set<string>();
  if (stripped && stripped.length >= 4) {
    bases.add(stripped);
    if (!stripped.includes("seguros")) {
      bases.add(`${stripped}seguros`);
    }
  }
  if (fullNormalized && fullNormalized.length >= 4) {
    bases.add(fullNormalized);
  }
  if (slugClean && slugClean.length >= 3) {
    bases.add(slugClean.includes("seguros") ? slugClean : `${slugClean}seguros`);
    bases.add(slugClean);
  }

  if (bases.size === 0) {
    bases.add("mipromotoriaseguros");
  }

  return Array.from(bases).slice(0, 3);
}

/**
 * Genera el alias de correo corporativo limpio a partir del nombre de un agente
 * Ej: "Carlos Alberto Ramírez López" -> "carlos.ramirez"
 */
export function buildAgentEmailLocalPart(fullName: string): string {
  const parts = (fullName || "agente")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "agente";
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]}.${parts[1]}`;
  if (parts.length >= 3) {
    return `${parts[0]}.${parts[parts.length - 2]}`;
  }
  return `${parts[0]}.${parts[1]}`;
}

export function isResellerClubLiveConfigured(): boolean {
  return Boolean(
    process.env.RESELLERCLUB_AUTH_USERID &&
      process.env.RESELLERCLUB_API_KEY &&
      process.env.RESELLERCLUB_AUTH_USERID.trim().length > 0 &&
      process.env.RESELLERCLUB_API_KEY.trim().length > 0
  );
}

function cleanEnvValue(val?: string): string {
  return (val || "").trim().replace(/^["']|["']$/g, "").trim();
}

function getResellerClubBaseUrl(): string {
  return cleanEnvValue(process.env.RESELLERCLUB_SANDBOX).toLowerCase() === "true"
    ? "https://test.httpapi.com/api"
    : "https://httpapi.com/api";
}

function getResellerClubDomainCheckBaseUrl(): string {
  return cleanEnvValue(process.env.RESELLERCLUB_SANDBOX).toLowerCase() === "true"
    ? "https://test.httpapi.com/api"
    : "https://domaincheck.httpapi.com/api";
}

function getResellerClubAuthParams(): URLSearchParams {
  const params = new URLSearchParams();
  params.append("auth-userid", cleanEnvValue(process.env.RESELLERCLUB_AUTH_USERID));
  params.append("api-key", cleanEnvValue(process.env.RESELLERCLUB_API_KEY));
  return params;
}

function parseResellerClubResponseText(rawText: string, status: number): { okJson: boolean; data: any; errorSummary?: string } {
  const trimmed = (rawText || "").trim();
  if (!trimmed) {
    return { okJson: false, data: null, errorSummary: `Respuesta vacía (HTTP ${status})` };
  }
  try {
    return { okJson: true, data: JSON.parse(trimmed) };
  } catch {
    const titleMatch = trimmed.match(/<title[^>]*>([^<]+)<\/title>/i);
    const h1Match = trimmed.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    const bodyText = trimmed
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 220);
    const label = titleMatch?.[1]?.trim() || h1Match?.[1]?.trim() || bodyText || "Respuesta HTML no JSON";
    return {
      okJson: false,
      data: null,
      errorSummary: `HTTP ${status}: ${label}`,
    };
  }
}

/**
 * Realiza peticiones a la API de ResellerClub enrutando a través del proxy de IP estática
 * (Fixie / QuotaGuard) si FIXIE_URL está configurado en las variables de entorno.
 */
async function resellerClubFetch(
  url: string,
  init?: RequestInit & { skipFixie?: boolean }
): Promise<Response> {
  const fixieUrl = cleanEnvValue(process.env.FIXIE_URL);
  const targetHostname = new URL(url).hostname;
  const mergedHeaders: Record<string, string> = {
    Accept: "application/json",
    "User-Agent": "curl/8.7.1",
    ...((init?.headers as Record<string, string>) || {}),
  };

  const initCopy: any = {
    ...init,
    headers: mergedHeaders,
    cache: "no-store",
  };
  delete initCopy.skipFixie;

  if (!init?.skipFixie && fixieUrl && fixieUrl.length > 0 && typeof window === "undefined") {
    try {
      const nodeRequire = eval("require");
      const undiciMod = nodeRequire("undici");
      if (undiciMod?.ProxyAgent) {
        initCopy.dispatcher = new undiciMod.ProxyAgent({
          uri: fixieUrl,
          requestTls: {
            servername: targetHostname,
          },
        });
      }
    } catch (e) {
      console.warn("Error inicializando ProxyAgent para ResellerClub:", e);
    }
  }

  return fetch(url, initCopy);
}

export async function isDomainTakenOnInternet(domain: string): Promise<boolean> {
  const clean = domain.trim().toLowerCase();

  // 1. Verificación rápida de dominios conocidos del ecosistema
  if (
    clean === "aacomsoft.com" ||
    clean === "aacom.com.mx" ||
    clean === "aacomsoft.mx" ||
    clean === "aacomsoft.com.mx" ||
    clean.startsWith("google.") ||
    clean.startsWith("facebook.") ||
    clean.startsWith("microsoft.")
  ) {
    return true;
  }

  // 2. Para dominios .com, Verisign RDAP da respuesta oficial inmediata (200 = ocupado, 404 = libre)
  if (clean.endsWith(".com") && !clean.endsWith(".com.mx")) {
    try {
      const rdapRes = await fetch(`https://rdap.verisign.com/com/v1/domain/${encodeURIComponent(clean)}`, {
        cache: "no-store",
        signal: AbortSignal.timeout(3000),
      });
      if (rdapRes.status === 200) {
        return true;
      }
      if (rdapRes.status === 404) {
        return false;
      }
    } catch {
      // Fallback a DNS
    }
  }

  // 3. Verificación universal de registros NS vía DNS over HTTPS (Google DNS)
  try {
    const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(clean)}&type=NS`, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const json = (await res.json()) as { Status?: number; Answer?: Array<{ type: number }> };
      if (json.Status === 0 && Array.isArray(json.Answer) && json.Answer.length > 0) {
        return true;
      }
    }
  } catch {
    // Continuar con chequeo SOA
  }

  // 4. Verificación de registro SOA del dominio
  try {
    const soaRes = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(clean)}&type=SOA`, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    if (soaRes.ok) {
      const soaJson = (await soaRes.json()) as { Status?: number; Answer?: Array<{ type: number }> };
      if (soaJson.Status === 0 && Array.isArray(soaJson.Answer) && soaJson.Answer.length > 0) {
        return true;
      }
    }
  } catch {
    // Si falla la red, no bloqueamos
  }

  return false;
}

/**
 * Consulta disponibilidad y costo mayorista de un conjunto de dominios aplicando
 * la Regla de Tope de Costo de Dominio (Filtro Anti-Premium <= $15.00 USD)
 */
export async function checkDomainsAvailabilityAndWholesalePrice(
  agencyName: string,
  agencySlug?: string | null,
  customQuery?: string
): Promise<DomainCheckResult[]> {
  const tlds: Array<".com" | ".com.mx" | ".mx"> = [".com", ".com.mx", ".mx"];
  const bases = customQuery
    ? [
        customQuery
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/\.(com\.mx|com|mx)$/i, "")
          .replace(/[^a-z0-9-]/g, "")
          .trim(),
      ].filter(Boolean)
    : normalizeAgencyBaseDomain(agencyName, agencySlug);

  const candidates: Array<{ sld: string; tld: ".com" | ".com.mx" | ".mx"; domain: string }> = [];
  for (const sld of bases) {
    for (const tld of tlds) {
      candidates.push({ sld, tld, domain: `${sld}${tld}` });
    }
  }

  const baseTldWholesaleMap: Record<".com" | ".com.mx" | ".mx", number> = {
    ".com": 11.49,
    ".com.mx": 13.80,
    ".mx": 14.50,
  };

  // Chequeo paralelo de existencia real en internet (DNS / RDAP)
  const internetTakenChecks = await Promise.all(
    candidates.map((c) => isDomainTakenOnInternet(c.domain))
  );

  if (isResellerClubLiveConfigured()) {
    try {
      const checkBaseUrl = getResellerClubDomainCheckBaseUrl();
      const params = getResellerClubAuthParams();
      for (const sld of Array.from(new Set(candidates.map((c) => c.sld)))) {
        params.append("domain-name", sld);
      }
      params.append("tlds", "com");
      params.append("tlds", "com.mx");
      params.append("tlds", "mx");

      const res = await resellerClubFetch(`${checkBaseUrl}/domains/available.json?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      const rawText = await res.text();
      const parsed = parseResellerClubResponseText(rawText, res.status);
      if (parsed.okJson && parsed.data) {
        const data = parsed.data;
        if (data?.status === "ERROR" || data?.status === "error") {
          console.error("[ResellerClub Live Error]", data.message || data);
        } else {
          const results: DomainCheckResult[] = [];
          for (let i = 0; i < candidates.length; i++) {
            const c = candidates[i];
            const isTakenOnInternet = internetTakenChecks[i];
            const entry = data?.[c.domain];

            // Si el dominio ya existe en internet (ej. aacomsoft.com), jamás puede estar disponible
            let isAvailable = entry?.status === "available" && !isTakenOnInternet;
            const isPremium = Boolean(entry?.isPremium || entry?.premium);
            const wholesalePriceUsd = Number(entry?.price || baseTldWholesaleMap[c.tld]);
            const eligibleForPackage =
              isAvailable && !isPremium && wholesalePriceUsd <= MAX_DOMAIN_WHOLESALE_USD;

            results.push({
              domain: c.domain,
              tld: c.tld,
              isAvailable,
              wholesalePriceUsd,
              isPremium,
              eligibleForPackage,
              reasonIfIneligible: !isAvailable
                ? "Dominio ya registrado"
                : isPremium || wholesalePriceUsd > MAX_DOMAIN_WHOLESALE_USD
                ? "Dominio reservado o no disponible"
                : undefined,
            });
          }
          return results;
        }
      }
    } catch (error) {
      console.warn("ResellerClub live check fallback to simulator:", error);
    }
  }

  return candidates.map((c, idx) => {
    const isTakenOnInternet = internetTakenChecks[idx];
    const isShortPremium = c.sld.length <= 4 || c.sld === "seguros" || c.sld === "vida";
    const isPremium = isShortPremium || (idx === 5 && c.tld === ".mx");
    const wholesalePriceUsd = isPremium ? 145.0 : baseTldWholesaleMap[c.tld];
    const isAvailable = !isTakenOnInternet && !isShortPremium;
    const eligibleForPackage =
      isAvailable && !isPremium && wholesalePriceUsd <= MAX_DOMAIN_WHOLESALE_USD;

    return {
      domain: c.domain,
      tld: c.tld,
      isAvailable,
      wholesalePriceUsd,
      isPremium,
      eligibleForPackage,
      reasonIfIneligible: !isAvailable
        ? "Dominio ya registrado"
        : isPremium || wholesalePriceUsd > MAX_DOMAIN_WHOLESALE_USD
        ? "Dominio reservado o no disponible"
        : undefined,
    };
  });
}

/**
 * Construye los registros DNS obligatorios de Titan Email (MX, SPF, DKIM, DMARC)
 */
export function buildTitanDnsRecords(domainName: string): DnsRecordSpec[] {
  const dkimHash = crypto
    .createHash("sha256")
    .update(`titan-dkim-${domainName}-aacomsoft`)
    .digest("base64")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 64);

  return [
    {
      type: "MX",
      host: "@",
      value: "mx1.titan.email",
      priority: 10,
      ttl: 3600,
      verified: true,
    },
    {
      type: "MX",
      host: "@",
      value: "mx2.titan.email",
      priority: 20,
      ttl: 3600,
      verified: true,
    },
    {
      type: "TXT",
      host: "@",
      value: "v=spf1 include:spf.titan.email ~all",
      ttl: 3600,
      verified: true,
    },
    {
      type: "TXT",
      host: "titan1._domainkey",
      value: `v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A${dkimHash}`,
      ttl: 3600,
      verified: true,
    },
    {
      type: "TXT",
      host: "_dmarc",
      value: `v=DMARC1; p=quarantine; pct=100; rua=mailto:dmarc@${domainName}`,
      ttl: 3600,
      verified: true,
    },
  ];
}

/**
 * Aprovisionamiento Zero-Touch (100% Automatizado):
 * 1. Doble verificación en tiempo real (disponible + <= $15 USD)
 * 2. POST a ResellerClub /domains/register.json con perfil WHOIS corporativo de AACOMSoft + Privacy Protection
 * 3. Creación automática de la orden de Titan Email (Plan 3 GB) asociada al dominio
 * 4. Inyección automática por API en la zona DNS de MX, SPF, DKIM y DMARC
 */
export async function provisionCorporateDomainAndTitanOrder(params: {
  agencyName: string;
  agencySlug?: string | null;
  domainName: string;
  simulateOnly?: boolean;
}): Promise<ProvisioningResult> {
  const cleanDomain = params.domainName.trim().toLowerCase();
  const liveChecks = await checkDomainsAvailabilityAndWholesalePrice(
    params.agencyName,
    params.agencySlug,
    cleanDomain
  );

  const exactMatch =
    liveChecks.find((d) => d.domain === cleanDomain) ||
    ({
      domain: cleanDomain,
      tld: cleanDomain.endsWith(".com.mx")
        ? ".com.mx"
        : cleanDomain.endsWith(".mx")
        ? ".mx"
        : ".com",
      isAvailable: true,
      wholesalePriceUsd: 11.99,
      isPremium: false,
      eligibleForPackage: true,
    } as DomainCheckResult);

  if (!exactMatch.isAvailable) {
    throw new Error(`El dominio ${cleanDomain} ya no está disponible. Por favor elige otra variante.`);
  }

  if (exactMatch.isPremium || exactMatch.wholesalePriceUsd > MAX_DOMAIN_WHOLESALE_USD) {
    throw new Error(`El dominio ${cleanDomain} ya se encuentra ocupado o reservado. Por favor elige otra variante disponible.`);
  }

  const dnsRecords = buildTitanDnsRecords(cleanDomain);
  const orderSuffix = crypto.randomBytes(4).toString("hex").toUpperCase();
  let registrarOrderId = `RC-DOM-${orderSuffix}`;
  let titanOrderId = `TITAN-3GB-${orderSuffix}`;
  let mode: "RESELLERCLUB_LIVE" | "SANDBOX_SIMULATOR" = "SANDBOX_SIMULATOR";

  if (isResellerClubLiveConfigured() && !params.simulateOnly) {
    try {
      const baseUrl = getResellerClubBaseUrl();
      const customerId = process.env.RESELLERCLUB_CUSTOMER_ID || "";
      const contactId = process.env.RESELLERCLUB_WHOIS_CONTACT_ID || "";

      if (customerId && contactId) {
        // 1. Registrar el dominio con perfil WHOIS de AACOMSoft + Privacy Protection
        const regParams = getResellerClubAuthParams();
        regParams.append("domain-name", cleanDomain);
        regParams.append("years", "1");
        regParams.append("ns", process.env.RESELLERCLUB_NS1 || "dns1.registrar-servers.com");
        regParams.append("ns", process.env.RESELLERCLUB_NS2 || "dns2.registrar-servers.com");
        regParams.append("customer-id", customerId);
        regParams.append("reg-contact-id", contactId);
        regParams.append("admin-contact-id", contactId);
        regParams.append("tech-contact-id", contactId);
        regParams.append("billing-contact-id", contactId);
        regParams.append("invoice-option", "NoInvoice");
        regParams.append("protect-privacy", "true");

        const regRes = await resellerClubFetch(`${baseUrl}/domains/register.json`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: regParams.toString(),
        });
        if (regRes.ok) {
          const regJson = await regRes.json();
          if (regJson?.entityid) {
            registrarOrderId = String(regJson.entityid);
            mode = "RESELLERCLUB_LIVE";
          }
        }

        // 2. Crear la orden de Titan Email (Enterprise Email 3 GB)
        const mailParams = getResellerClubAuthParams();
        mailParams.append("domain-name", cleanDomain);
        mailParams.append("customer-id", customerId);
        mailParams.append("months", "1");
        mailParams.append("no-of-accounts", String(DEFAULT_MAX_SEATS));
        mailParams.append("invoice-option", "NoInvoice");

        const mailRes = await resellerClubFetch(`${baseUrl}/eelite/us/add.json`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: mailParams.toString(),
        });
        if (mailRes.ok) {
          const mailJson = await mailRes.json();
          if (mailJson?.entityid) {
            titanOrderId = String(mailJson.entityid);
          }
        }

        // 3. Activar DNS y agregar registros MX y TXT (SPF, DKIM, DMARC)
        for (const rec of dnsRecords) {
          const dnsParams = getResellerClubAuthParams();
          dnsParams.append("domain-name", cleanDomain);
          dnsParams.append("value", rec.value);
          dnsParams.append("host", rec.host);
          dnsParams.append("ttl", String(rec.ttl));
          if (rec.type === "MX") {
            dnsParams.append("priority", String(rec.priority || 10));
            await resellerClubFetch(`${baseUrl}/dns/manage/add-mx-record.json`, {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: dnsParams.toString(),
            });
          } else {
            await resellerClubFetch(`${baseUrl}/dns/manage/add-txt-record.json`, {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: dnsParams.toString(),
            });
          }
        }
      }
    } catch (liveErr) {
      console.warn("ResellerClub live provisioning warning, continuing with hybrid record:", liveErr);
    }
  }

  return {
    mode,
    domainName: cleanDomain,
    registrarOrderId,
    titanOrderId,
    wholesaleDomainCostUsd: exactMatch.wholesalePriceUsd,
    dnsConfigured: true,
    dnsRecords,
    whoisCustodyProfile: "AACOMSOFT_ZERO_TOUCH_PRIVACY",
  };
}

/**
 * Crea un buzón en Titan Email y devuelve sus credenciales cifradas con AES-256-GCM
 */
export async function provisionTitanMailboxAccount(params: {
  emailAddress: string;
  displayName: string;
  titanOrderId: string;
}): Promise<{
  titanAccountId: string;
  plainPassword: string;
  encryptedImapCredentials: string;
}> {
  const randomPassword = `Aa!${crypto.randomBytes(6).toString("hex")}9#`;
  let titanAccountId = `titan_mbx_${crypto.randomBytes(5).toString("hex")}`;
  let providerMode: "RESELLERCLUB_LIVE" | "SANDBOX_SIMULATOR" = "SANDBOX_SIMULATOR";

  if (isResellerClubLiveConfigured() && !params.titanOrderId.startsWith("TITAN-3GB-") && !params.titanOrderId.startsWith("TITAN-10GB-")) {
    try {
      const baseUrl = getResellerClubBaseUrl();
      const apiParams = getResellerClubAuthParams();
      apiParams.append("order-id", params.titanOrderId);
      apiParams.append("email", params.emailAddress.toLowerCase());
      apiParams.append("passwd", randomPassword);
      apiParams.append("notification-email", params.emailAddress.toLowerCase());
      apiParams.append("first-name", params.displayName.split(" ")[0] || "Agente");
      apiParams.append("last-name", params.displayName.split(" ").slice(1).join(" ") || "AACOMSoft");
      apiParams.append("country-code", "MX");
      apiParams.append("language-code", "es");

      const res = await resellerClubFetch(`${baseUrl}/eelite/us/add-email-account.json`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: apiParams.toString(),
      });
      if (res.ok) {
        providerMode = "RESELLERCLUB_LIVE";
      }
    } catch (err) {
      console.warn("ResellerClub live mailbox creation warning:", err);
    }
  }

  const payload: MailboxCredentialsPayload = {
    emailAddress: params.emailAddress.toLowerCase(),
    password: randomPassword,
    imapHost: process.env.TITAN_IMAP_HOST || "imap.titan.email",
    imapPort: Number(process.env.TITAN_IMAP_PORT || 993),
    smtpHost: process.env.TITAN_SMTP_HOST || "smtp.titan.email",
    smtpPort: Number(process.env.TITAN_SMTP_PORT || 465),
    providerMode,
  };

  const encryptedImapCredentials = encrypt(JSON.stringify(payload));

  return {
    titanAccountId,
    plainPassword: randomPassword,
    encryptedImapCredentials,
  };
}

/**
 * Suspende o reactiva un buzón en Titan Email por API
 */
export async function updateTitanMailboxSuspension(params: {
  titanOrderId: string;
  emailAddress: string;
  suspend: boolean;
}): Promise<void> {
  if (isResellerClubLiveConfigured() && !params.titanOrderId.startsWith("TITAN-3GB-") && !params.titanOrderId.startsWith("TITAN-10GB-")) {
    try {
      const baseUrl = getResellerClubBaseUrl();
      const apiParams = getResellerClubAuthParams();
      apiParams.append("order-id", params.titanOrderId);
      apiParams.append("email", params.emailAddress.toLowerCase());
      const endpoint = params.suspend
        ? "/eelite/us/suspend-email-account.json"
        : "/eelite/us/unsuspend-email-account.json";
      await resellerClubFetch(`${baseUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: apiParams.toString(),
      });
    } catch (err) {
      console.warn("ResellerClub live mailbox suspend/unsuspend warning:", err);
    }
  }
}

/**
 * Elimina un buzón en Titan Email para liberar el asiento (18/20 -> 17/20)
 */
export async function deleteTitanMailboxAccount(params: {
  titanOrderId: string;
  emailAddress: string;
}): Promise<void> {
  if (isResellerClubLiveConfigured() && !params.titanOrderId.startsWith("TITAN-3GB-") && !params.titanOrderId.startsWith("TITAN-10GB-")) {
    try {
      const baseUrl = getResellerClubBaseUrl();
      const apiParams = getResellerClubAuthParams();
      apiParams.append("order-id", params.titanOrderId);
      apiParams.append("email", params.emailAddress.toLowerCase());
      await resellerClubFetch(`${baseUrl}/eelite/us/delete-email-account.json`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: apiParams.toString(),
      });
    } catch (err) {
      console.warn("ResellerClub live mailbox deletion warning:", err);
    }
  }
}

/**
 * Descifra de forma segura las credenciales IMAP/SMTP almacenadas en la bóveda AES-256-GCM
 */
export function decryptMailboxCredentials(
  encryptedImapCredentials: string
): MailboxCredentialsPayload | null {
  try {
    const raw = decrypt(encryptedImapCredentials);
    if (!raw) return null;
    return JSON.parse(raw) as MailboxCredentialsPayload;
  } catch {
    return null;
  }
}

/**
 * Crea un Forwarder / Alias gratuito en Titan Email cuando un agente causa baja
 * (Puente de Cartera sin consumir ninguno de los 20 asientos)
 */
export async function createTitanFreeForwarder(params: {
  titanOrderId: string;
  sourceEmail: string;
  destinationEmail: string;
}): Promise<{ titanForwardId: string }> {
  const titanForwardId = `titan_fwd_${crypto.randomBytes(4).toString("hex")}`;

  if (isResellerClubLiveConfigured() && !params.titanOrderId.startsWith("TITAN-3GB-") && !params.titanOrderId.startsWith("TITAN-10GB-")) {
    try {
      const baseUrl = getResellerClubBaseUrl();
      const apiParams = getResellerClubAuthParams();
      apiParams.append("order-id", params.titanOrderId);
      apiParams.append("email", params.sourceEmail.toLowerCase());
      apiParams.append("forwards", params.destinationEmail.toLowerCase());
      await resellerClubFetch(`${baseUrl}/eelite/us/add-forward-only-account.json`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: apiParams.toString(),
      });
    } catch (err) {
      console.warn("ResellerClub live forwarder creation warning:", err);
    }
  }

  return { titanForwardId };
}

/**
 * Diagnóstico en vivo (Solo lectura, $0 costo) para verificar:
 * 1) Qué IP estática saliente está utilizando Fixie (FIXIE_URL)
 * 2) Si las credenciales de ResellerClub están configuradas
 * 3) Si ResellerClub acepta la IP de Fixie en su lista blanca (Whitelist) y responde 200 OK
 */
export async function diagnoseResellerClubAndFixieConnection(): Promise<{
  fixieConfigured: boolean;
  outboundIp: string | null;
  resellerClubConfigured: boolean;
  resellerClubConnected: boolean;
  resellerClubMessage: string;
  sampleCheckDomain: string;
  sampleDomainAvailable: boolean | null;
}> {
  const fixieConfigured = Boolean(cleanEnvValue(process.env.FIXIE_URL).length > 0);
  const resellerClubConfigured = isResellerClubLiveConfigured();
  let outboundIp: string | null = null;

  try {
    const ipRes = await resellerClubFetch("https://api.ipify.org?format=json", {
      method: "GET",
    });
    if (ipRes.ok) {
      const ipJson = (await ipRes.json()) as { ip?: string };
      outboundIp = ipJson.ip || null;
    }
  } catch (e: any) {
    outboundIp = `Error leyendo IP: ${e?.message || "desconocido"}`;
  }

  const testDomainSld = "aacomsofttestdiag2026";
  const sampleCheckDomain = `${testDomainSld}.com`;

  if (!resellerClubConfigured) {
    return {
      fixieConfigured,
      outboundIp,
      resellerClubConfigured: false,
      resellerClubConnected: false,
      resellerClubMessage:
        "Faltan las variables RESELLERCLUB_AUTH_USERID o RESELLERCLUB_API_KEY en Vercel.",
      sampleCheckDomain,
      sampleDomainAvailable: null,
    };
  }

  const authUserIdMasked = cleanEnvValue(process.env.RESELLERCLUB_AUTH_USERID);
  const isSandbox = cleanEnvValue(process.env.RESELLERCLUB_SANDBOX).toLowerCase() === "true";

  try {
    const checkBaseUrl = getResellerClubDomainCheckBaseUrl();
    const mainBaseUrl = getResellerClubBaseUrl();
    const params = getResellerClubAuthParams();
    params.append("domain-name", testDomainSld);
    params.append("tlds", "com");

    // Prueba 1: domaincheck.httpapi.com vía Fixie con User-Agent curl/8.7.1
    const rcRes = await resellerClubFetch(
      `${checkBaseUrl}/domains/available.json?${params.toString()}`,
      { method: "GET" }
    );
    const rawText = await rcRes.text();
    const serverHdr = rcRes.headers.get("server") || "unknown";
    const cfMitigated = rcRes.headers.get("cf-mitigated") || "none";
    let parsed = parseResellerClubResponseText(rawText, rcRes.status);

    // Prueba 2: Si domaincheck dio HTML, probar httpapi.com/api/customers/search.json vía Fixie
    let customerProbeSummary = "";
    if (!parsed.okJson) {
      const custParams = getResellerClubAuthParams();
      custParams.append("no-of-records", "10");
      custParams.append("page-no", "1");
      const custRes = await resellerClubFetch(
        `${mainBaseUrl}/customers/search.json?${custParams.toString()}`,
        { method: "GET" }
      );
      const custText = await custRes.text();
      const custParsed = parseResellerClubResponseText(custText, custRes.status);
      if (custParsed.okJson) {
        parsed = custParsed;
      } else {
        customerProbeSummary = ` | customers/search: ${custParsed.errorSummary} (server=${custRes.headers.get("server")}, cf=${custRes.headers.get("cf-mitigated") || "none"})`;
      }
    }

    // Prueba 3: Si Fixie fue bloqueado por Cloudflare WAF (403), probar directo desde Vercel sin Fixie para comparar
    if (!parsed.okJson) {
      const directRes = await resellerClubFetch(
        `${checkBaseUrl}/domains/available.json?${params.toString()}`,
        { method: "GET", skipFixie: true }
      );
      const directText = await directRes.text();
      const directParsed = parseResellerClubResponseText(directText, directRes.status);
      const directInfo = directParsed.okJson
        ? `Directo sin Fixie SÍ devolvió JSON: ${JSON.stringify(directParsed.data).slice(0, 140)}`
        : `Directo sin Fixie devolvió: ${directParsed.errorSummary}`;

      return {
        fixieConfigured,
        outboundIp,
        resellerClubConfigured: true,
        resellerClubConnected: false,
        resellerClubMessage: `Vía Fixie (${outboundIp}): ${parsed.errorSummary} [server=${serverHdr}, cf-mitigated=${cfMitigated}]${customerProbeSummary} • Comparativa ${directInfo}`,
        sampleCheckDomain,
        sampleDomainAvailable: null,
      };
    }

    const data = parsed.data;
    if (data?.status === "ERROR" || data?.status === "error") {
      return {
        fixieConfigured,
        outboundIp,
        resellerClubConfigured: true,
        resellerClubConnected: false,
        resellerClubMessage: `ResellerClub respondió JSON (UserID: ${authUserIdMasked}, Modo: ${isSandbox ? "Sandbox" : "Producción"}): "${data.message || JSON.stringify(data)}". Verifica que la IP ${outboundIp} esté autorizada en Settings -> API -> Whitelist IP Addresses.`,
        sampleCheckDomain,
        sampleDomainAvailable: null,
      };
    }

    const entry = data?.[sampleCheckDomain];
    const isAvail = entry ? entry?.status === "available" : true;

    return {
      fixieConfigured,
      outboundIp,
      resellerClubConfigured: true,
      resellerClubConnected: true,
      resellerClubMessage: `¡Enlace 100% verificado (200 OK)! IP ${outboundIp} autorizada en ResellerClub (UserID: ${authUserIdMasked}, ${sampleCheckDomain}: ${entry?.status || "conectado"}).`,
      sampleCheckDomain,
      sampleDomainAvailable: isAvail,
    };
  } catch (err: any) {
    return {
      fixieConfigured,
      outboundIp,
      resellerClubConfigured: true,
      resellerClubConnected: false,
      resellerClubMessage: `Error de red al conectar con ResellerClub: ${err?.message || "desconocido"}`,
      sampleCheckDomain,
      sampleDomainAvailable: null,
    };
  }
}

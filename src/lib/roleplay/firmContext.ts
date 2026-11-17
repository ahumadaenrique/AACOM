export interface AgencyIdentityInput {
  id?: string | null;
  slug?: string | null;
  name?: string | null;
  accountType?: string | null;
}

export interface AdvisorFirmContext {
  displayFirmName: string;
  scenarioFirmLabel: string;
  isPrimaryAacomAgency: boolean;
  isSoloAgent: boolean;
}

/**
 * Resuelve de forma aislada (multi-tenant) el nombre comercial de la promotoría o despacho
 * del asesor para los prospectos de IA, el Master Coach evaluador y el Manual Táctico.
 */
export function resolveAdvisorFirmContext(
  agency?: AgencyIdentityInput | null
): AdvisorFirmContext {
  const idLower = (agency?.id || '').trim().toLowerCase();
  const slugLower = (agency?.slug || '').trim().toLowerCase();
  const isPrimaryAacomAgency = idLower === 'aacom' || slugLower === 'aacom';
  const isSoloAgent = agency?.accountType === 'SOLO_AGENT';
  const rawName = (agency?.name || '').trim();

  if (isPrimaryAacomAgency) {
    const isSaasLiteral = !rawName || rawName.toLowerCase() === 'aacomsoft';
    return {
      displayFirmName: isSaasLiteral ? 'Grupo AACOM' : rawName,
      scenarioFirmLabel: isSaasLiteral ? 'Grupo AACOM' : rawName,
      isPrimaryAacomAgency: true,
      isSoloAgent
    };
  }

  // Para cualquier otra promotoría o Agente Individual: jamás filtrar marcas de la agencia 'aacom'
  const hasPrimaryBrandLeak = /\b(aacom(?:soft)?|grupo\s+aacom)\b/i.test(rawName);
  const cleanName = rawName && !hasPrimaryBrandLeak ? rawName : '';

  return {
    displayFirmName: cleanName || (isSoloAgent ? 'tu despacho patrimonial' : 'tu promotoría'),
    scenarioFirmLabel: cleanName || 'la firma patrimonial',
    isPrimaryAacomAgency: false,
    isSoloAgent
  };
}

/**
 * Red de seguridad determinista para garantizar que en agencias externas el Coach jamás
 * devuelva referencias a la promotoría principal en aciertos, errores o coachTip.
 */
export function sanitizeExternalCoachText(
  text: string,
  displayFirmName: string,
  isPrimaryAacomAgency: boolean
): string {
  if (!text || isPrimaryAacomAgency) return text;
  const replacement =
    displayFirmName && !displayFirmName.startsWith('tu ')
      ? displayFirmName
      : 'tu despacho';
  return text
    .replace(/\(\s*Grupo\s+AACOM\s*\/\s*AACOM\s+Seguros\s*\/\s*AACOMSoft\s*\)/gi, `(${replacement})`)
    .replace(/\bGrupo\s+AACOM\b/gi, replacement)
    .replace(/\bAACOM\s+Seguros\b/gi, replacement)
    .replace(/\bAACOMSoft\b/gi, replacement)
    .replace(/\bAACOM\b/gi, replacement);
}

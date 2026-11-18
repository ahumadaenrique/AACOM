import { prisma } from '@/lib/prisma';
import {
  ACTIVITY_CATALOG_SETTING_PREFIX,
  getDefaultSalesActivities,
  parseAgencyActivityCatalog,
  parseAgencyEditorCatalog,
  type SalesActivityItem,
} from '@/lib/constants';

export async function getAgencyEditorCatalogById(
  agencyId?: string | null
): Promise<SalesActivityItem[]> {
  const effectiveAgencyId = (agencyId || '').trim() || 'aacom';
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: `${ACTIVITY_CATALOG_SETTING_PREFIX}${effectiveAgencyId}` },
    });
    return parseAgencyEditorCatalog(setting?.value);
  } catch (error) {
    console.error('Error loading agency editor activity catalog:', error);
    return getDefaultSalesActivities();
  }
}

export async function getAgencyActivityCatalogById(
  agencyId?: string | null
): Promise<SalesActivityItem[]> {
  const effectiveAgencyId = (agencyId || '').trim() || 'aacom';
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: `${ACTIVITY_CATALOG_SETTING_PREFIX}${effectiveAgencyId}` },
    });
    return parseAgencyActivityCatalog(setting?.value);
  } catch (error) {
    console.error('Error loading agency activity catalog:', error);
    return getDefaultSalesActivities();
  }
}

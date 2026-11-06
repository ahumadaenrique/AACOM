import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/app/actions"
import NewslettersClient from "./NewslettersClient"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function NewslettersPage() {
  const articles = await prisma.newsArticle.findMany({
    orderBy: { publishedAt: 'desc' },
    take: 30
  })

  const userRes = await getCurrentUser()
  const isSuperAdmin = Boolean(
    userRes.success && (userRes.user?.role === 'SUPER_ADMIN' || userRes.user?.role === 'ADMIN')
  )

  // Fetch current user's agency name (defaulting to lowercase aacomsoft)
  let agencyName = "aacomsoft"
  if (userRes.success && userRes.user?.agencyId) {
    const agency = await prisma.agency.findUnique({
      where: { id: userRes.user.agencyId },
      select: { name: true }
    })
    if (agency?.name) {
      agencyName = agency.name
    }
  }

  // Fetch financial indicators from Settings
  const settings = await prisma.setting.findMany({
    where: {
      key: {
        in: ["udi_default", "usd_default", "eur_default", "gbp_default"]
      }
    }
  })

  const indicators = {
    udi: settings.find(s => s.key === "udi_default")?.value || null,
    usd: settings.find(s => s.key === "usd_default")?.value || null,
    eur: settings.find(s => s.key === "eur_default")?.value || null,
    gbp: settings.find(s => s.key === "gbp_default")?.value || null
  }

  // Detect if articles are empty, older than 12 hours, or still have legacy non-structured tips
  const latestPubTime = articles[0]?.publishedAt ? new Date(articles[0].publishedAt).getTime() : 0
  const isOlderThan12h = Date.now() - latestPubTime > 12 * 60 * 60 * 1000
  const hasLegacyTips = articles.some(a => !a.advisorImpact?.includes('🎯 Ramo:'))
  const needsAutoRefresh = articles.length < 4 || isOlderThan12h || hasLegacyTips

  return (
    <NewslettersClient 
      initialArticles={articles} 
      isSuperAdmin={isSuperAdmin} 
      indicators={indicators} 
      agencyName={agencyName}
      needsAutoRefresh={needsAutoRefresh}
    />
  )
}

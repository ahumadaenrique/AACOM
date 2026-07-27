import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/app/actions"
import NewslettersClient from "./NewslettersClient"
import PremiumGuard from "@/components/PremiumGuard"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function NewslettersPage() {
  const articles = await prisma.newsArticle.findMany({
    orderBy: { publishedAt: 'desc' },
    take: 200 // Keep the feed to a fast, readable size
  })

  const userRes = await getCurrentUser()
  const isSuperAdmin = userRes.success && userRes.user?.role === 'SUPER_ADMIN'

  // Fetch current user's agency name
  let agencyName = "AACOMSOFT"
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

  return (
    <PremiumGuard userRole={userRes.user?.role} moduleName="Newsletters Automatizados">
      <NewslettersClient 
        initialArticles={articles} 
        isSuperAdmin={isSuperAdmin} 
        indicators={indicators} 
        agencyName={agencyName}
      />
    </PremiumGuard>
  )
}

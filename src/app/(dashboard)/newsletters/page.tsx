import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/app/actions"
import NewslettersClient from "./NewslettersClient"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function NewslettersPage() {
  const articles = await prisma.newsArticle.findMany({
    orderBy: { publishedAt: 'desc' },
    take: 200 // Keep the feed to a fast, readable size
  })

  const userRes = await getCurrentUser()
  const isSuperAdmin = userRes.success && userRes.user?.role === 'SUPER_ADMIN'

  return (
    <NewslettersClient initialArticles={articles} isSuperAdmin={isSuperAdmin} />
  )
}

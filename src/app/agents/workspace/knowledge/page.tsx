import { getKnowledgeAssets } from "./actions"
import KnowledgeGrid from "./KnowledgeGrid"

export const dynamic = 'force-dynamic'

export default async function KnowledgePage() {
  const assets = await getKnowledgeAssets()

  return (
    <div className="h-full overflow-y-auto bg-[#111111] px-8">
      <KnowledgeGrid initialAssets={assets} />
    </div>
  )
}

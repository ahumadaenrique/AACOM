import { ReactNode } from "react"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function AgentsLayout({ children }: { children: ReactNode }) {
  redirect("/assistant")
}

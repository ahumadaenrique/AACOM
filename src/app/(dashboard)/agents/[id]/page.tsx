import { redirect } from "next/navigation"

export default function AgentPage({ params }: { params: { id: string } }) {
  // Redirect base agent route to chat
  redirect(`/agents/${params.id}/chat`)
}

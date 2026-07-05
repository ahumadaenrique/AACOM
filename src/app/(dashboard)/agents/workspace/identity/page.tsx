import { getCompanyProfile } from "../actions"
import IdentityForm from "./IdentityForm"

export const dynamic = 'force-dynamic'

export default async function IdentityPage() {
  const profile = await getCompanyProfile()

  return (
    <div className="h-full overflow-y-auto bg-neutral-950 p-8">
      <IdentityForm initialData={profile} />
    </div>
  )
}

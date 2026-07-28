import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ReferidorDetailClient } from "./ReferidorDetailClient";

export default async function ReferidorDetailPage({ params }: { params: { id: string } }) {
    const session = await auth();
    if (!session?.user) redirect('/login');

    return (
        <div className="flex-1 w-full bg-slate-50/50">
            <div className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8 space-y-8">
                <ReferidorDetailClient referidorId={params.id} />
            </div>
        </div>
    );
}

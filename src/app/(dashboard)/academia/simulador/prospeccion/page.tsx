import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { RoleplayClient } from "@/components/roleplay/RoleplayClient";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Academia PRO | AACOM Seguros",
  description: "Entrenamiento de llamadas telefónicas y prospección en frío con inteligencia artificial conversacional."
};

export default async function SimuladorPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      image: true,
      agency: {
        select: {
          id: true,
          name: true,
          allowRoleplaySimulator: true
        }
      }
    }
  });

  if (!dbUser) {
    redirect("/login");
  }

  // Block access if the agency does not have the simulator enabled (SUPER_ADMIN always has access)
  if (dbUser.role !== 'SUPER_ADMIN' && dbUser.agency && dbUser.agency.allowRoleplaySimulator === false) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-5 shadow-2xl">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-2xl">
          📵
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">Módulo Desactivado para tu Agencia</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            El acceso al <strong>Academia PRO (Voz e IA)</strong> ha sido desactivado para tu agencia ({dbUser.agency.name}) por la administración central de AACOM.
          </p>
        </div>
        <div className="pt-2">
          <a
            href="/academia/simulador"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            ← Volver al Hub de Simulador
          </a>
        </div>
      </div>
    );
  }

  const isAdmin =
    dbUser.role === 'ADMIN' ||
    dbUser.role === 'SUPER_ADMIN';

  return (
    <div className="py-2">
      <RoleplayClient
        user={{
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          role: dbUser.role
        }}
        isAdmin={isAdmin}
      />
    </div>
  );
}

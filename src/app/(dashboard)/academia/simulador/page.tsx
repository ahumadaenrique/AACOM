import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { RoleplayClient } from "@/components/roleplay/RoleplayClient";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Simulador de Prospección IA | AACOM Seguros",
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
      image: true
    }
  });

  if (!dbUser) {
    redirect("/login");
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

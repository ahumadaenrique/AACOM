import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ResolveButton from "./ResolveButton";
import { LifeBuoy, Inbox, CheckCircle } from "lucide-react";

export const metadata = {
  title: "Bandeja de Soporte - AACOM",
};

export default async function TicketsAdminPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  // Security: Only SUPER_ADMIN can access this inbox
  if (!user || user.role !== "SUPER_ADMIN") {
    redirect("/");
  }

  const tickets = await prisma.ticket.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { name: true, email: true }
      },
      agency: {
        select: { name: true, slug: true }
      }
    }
  });

  const openTickets = tickets.filter(t => t.status === "OPEN");
  const resolvedTickets = tickets.filter(t => t.status !== "OPEN");

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <LifeBuoy className="h-8 w-8 text-rose-500" /> Bandeja de Soporte
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Administración de tickets de agencias SaaS
          </p>
        </div>
        <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 font-bold px-4 py-2 rounded-xl text-sm border border-rose-200 dark:border-rose-900/50 flex items-center gap-2 shadow-sm">
          <Inbox className="w-4 h-4" />
          {openTickets.length} Tickets Abiertos
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-black text-slate-800 dark:text-slate-200">
          Tickets Pendientes
        </h2>
        {openTickets.length === 0 ? (
          <div className="bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 rounded-3xl p-10 text-center shadow-sm">
            <div className="bg-white dark:bg-zinc-950 h-16 w-16 mx-auto rounded-full flex items-center justify-center shadow-sm border border-slate-100 dark:border-zinc-800 mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">¡Bandeja Limpia!</h3>
            <p className="text-slate-500 mt-1">No hay tickets de soporte pendientes por resolver.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {openTickets.map((ticket) => (
              <div key={ticket.id} className="bg-white dark:bg-zinc-950 border border-rose-200 dark:border-rose-950 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                        {ticket.status}
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        {ticket.createdAt.toLocaleDateString("es-MX", { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">{ticket.subject}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 whitespace-pre-wrap">{ticket.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-500 bg-slate-50 dark:bg-zinc-900 w-fit px-3 py-2 rounded-xl border border-slate-100 dark:border-zinc-800">
                      <div><span className="text-slate-400">Usuario:</span> {ticket.user.name} ({ticket.user.email})</div>
                      {ticket.agency && <div><span className="text-slate-400">Agencia:</span> {ticket.agency.name} ({ticket.agency.slug})</div>}
                    </div>
                  </div>
                  <div className="flex flex-col justify-center items-end shrink-0 pl-4 border-l border-slate-100 dark:border-zinc-800">
                    <ResolveButton ticketId={ticket.id} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {resolvedTickets.length > 0 && (
        <div className="space-y-6 pt-10">
          <h2 className="text-xl font-black text-slate-800 dark:text-slate-200">
            Historial de Tickets Resueltos
          </h2>
          <div className="grid gap-3 opacity-70">
            {resolvedTickets.map((ticket) => (
              <div key={ticket.id} className="bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                      {ticket.status}
                    </span>
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">{ticket.subject}</h3>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1">{ticket.description}</p>
                </div>
                <div className="text-xs text-slate-400 font-medium text-right shrink-0">
                  {ticket.agency?.name} • {ticket.createdAt.toLocaleDateString("es-MX")}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

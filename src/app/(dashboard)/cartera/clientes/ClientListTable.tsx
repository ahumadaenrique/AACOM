"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, FileText, Archive, Edit, Loader2, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
  computePolicyCycleInfo,
  formatDateSafe,
  calculateClientAgeInfo,
} from "../dateUtils";
import { deleteClient } from "../actions";
import ClientFormDialog from "./[id]/ClientFormDialog";

type ClientWithPolicies = any;

export default function ClientListTable({
  clients,
  isAdmin = false,
}: {
  clients: ClientWithPolicies[];
  isAdmin?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [originFilter, setOriginFilter] = useState<"ALL" | "TIPS">("ALL");
  const [clientToArchive, setClientToArchive] = useState<any | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  const tipsCount = useMemo(
    () =>
      clients.filter((c: any) =>
        String(c.notes || "").toUpperCase().includes("TIPS")
      ).length,
    [clients]
  );

  const sortedAndFiltered = useMemo(() => {
    const term = search.toLowerCase().trim();
    const result = clients.filter((c: any) => {
      const isTips = String(c.notes || "").toUpperCase().includes("TIPS");
      if (originFilter === "TIPS" && !isTips) return false;
      if (!term) return true;
      return (
        c.name.toLowerCase().includes(term) ||
        (c.email && c.email.toLowerCase().includes(term)) ||
        (c.phone && c.phone.includes(term)) ||
        (c.rfc && c.rfc.toLowerCase().includes(term)) ||
        (c.notes && c.notes.toLowerCase().includes(term))
      );
    });

    const withClosestRenewal = result.map((c: any) => {
      const activePols = (c.policies || []).filter((p: any) => {
        const cycle = computePolicyCycleInfo(p);
        return (
          cycle.computedStatus !== "CANCELADA" &&
          cycle.computedStatus !== "TERMINADA"
        );
      });

      const futureDates = activePols
        .map((p: any) => {
          const cycle = computePolicyCycleInfo(p);
          return cycle.nextEventDate ? cycle.nextEventDate.getTime() : Infinity;
        })
        .filter((t: number) => t < Infinity);

      const closestRenewal =
        futureDates.length > 0 ? Math.min(...futureDates) : Infinity;

      const totalPremium = activePols.reduce(
        (acc: number, p: any) => acc + (p.annualPremium || 0),
        0
      );

      const ageInfo = calculateClientAgeInfo(c.birthDate);
      const isTipsLead = String(c.notes || "").toUpperCase().includes("TIPS");

      return {
        ...c,
        activePoliciesCount: activePols.length,
        closestRenewal,
        totalPremium,
        ageInfo,
        isTipsLead,
      };
    });

    withClosestRenewal.sort((a: any, b: any) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "policies") {
        return b.activePoliciesCount - a.activePoliciesCount;
      }
      if (sortBy === "premium") {
        return b.totalPremium - a.totalPremium;
      }
      if (sortBy === "vigencia") {
        return a.closestRenewal - b.closestRenewal;
      }
      return 0;
    });

    return withClosestRenewal;
  }, [clients, search, sortBy, originFilter]);

  const handleArchiveClient = async () => {
    if (!clientToArchive) return;
    setIsArchiving(true);
    try {
      await deleteClient(clientToArchive.id);
      toast({
        title: "Cliente archivado",
        description: `${clientToArchive.name} fue archivado correctamente.`,
      });
      setClientToArchive(null);
      router.refresh();
    } catch (e: any) {
      toast({
        title: "Error al archivar cliente",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, correo, teléfono, RFC o TIPS..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="inline-flex rounded-lg border p-1 bg-muted/30">
            <Button
              type="button"
              size="sm"
              variant={originFilter === "ALL" ? "default" : "ghost"}
              onClick={() => setOriginFilter("ALL")}
              className="h-7 text-xs px-2.5"
            >
              Todos ({clients.length})
            </Button>
            <Button
              type="button"
              size="sm"
              variant={originFilter === "TIPS" ? "default" : "ghost"}
              onClick={() => setOriginFilter("TIPS")}
              className="h-7 text-xs px-2.5"
            >
              🎯 Prospectos TIPS ({tipsCount})
            </Button>
          </div>
        </div>
        <div className="w-full md:w-64">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue placeholder="Ordenar por..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nombre (A-Z)</SelectItem>
              <SelectItem value="vigencia">Próximo Aniversario / Renovación</SelectItem>
              <SelectItem value="premium">Mayor Prima Anual</SelectItem>
              <SelectItem value="policies">Cantidad de Pólizas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-auto max-h-[600px] border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre / Contacto</TableHead>
              {isAdmin && <TableHead>Agente</TableHead>}
              <TableHead>Cumpleaños / Edad</TableHead>
              <TableHead className="text-center">Pólizas Activas</TableHead>
              <TableHead>Próx. Aniversario</TableHead>
              <TableHead className="text-right">Prima Activa</TableHead>
              <TableHead className="text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAndFiltered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={isAdmin ? 7 : 6}
                  className="text-center h-24 text-muted-foreground"
                >
                  No se encontraron clientes para la búsqueda.
                </TableCell>
              </TableRow>
            ) : (
              sortedAndFiltered.map((client: any) => {
                const cleanPhone = (client.phone || "").replace(/\D/g, "");
                return (
                  <TableRow key={client.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Link
                          href={`/cartera/clientes/${client.id}`}
                          className="font-semibold text-primary hover:underline"
                        >
                          {client.name}
                        </Link>
                        {client.isTipsLead && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30"
                          >
                            🎯 Origen: TIPS
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground flex flex-col mt-0.5">
                        {client.email && <span>{client.email}</span>}
                        {client.phone && <span>{client.phone}</span>}
                      </div>
                    </TableCell>

                    {isAdmin && (
                      <TableCell className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                        {client.user?.name || "Sin asignar"}
                      </TableCell>
                    )}

                    <TableCell className="text-xs whitespace-nowrap">
                      <div>
                        {formatDateSafe(
                          client.birthDate,
                          "dd MMM yyyy",
                          "No registrada"
                        )}
                      </div>
                      {client.ageInfo && (
                        <div className="text-[11px] text-muted-foreground">
                          {client.ageInfo.age} años
                          {client.ageInfo.daysUntilBirthday <= 30 && (
                            <span className="ml-1 text-pink-600 dark:text-pink-400 font-medium">
                              • 🎂{" "}
                              {client.ageInfo.daysUntilBirthday === 0
                                ? "¡Hoy!"
                                : `en ${client.ageInfo.daysUntilBirthday}d`}
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="text-center">
                      <Badge
                        variant="secondary"
                        className="flex items-center w-fit mx-auto gap-1"
                      >
                        <FileText className="w-3 h-3" />
                        {client.activePoliciesCount}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-xs whitespace-nowrap">
                      {client.closestRenewal < Infinity
                        ? formatDateSafe(
                            new Date(client.closestRenewal),
                            "dd/MM/yyyy"
                          )
                        : "-"}
                    </TableCell>

                    <TableCell className="text-right font-medium whitespace-nowrap">
                      {new Intl.NumberFormat("es-MX", {
                        style: "currency",
                        currency: "MXN",
                      }).format(client.totalPremium)}
                    </TableCell>

                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {cleanPhone.length >= 10 && (
                          <a
                            href={`https://wa.me/${
                              cleanPhone.length === 10
                                ? "52" + cleanPhone
                                : cleanPhone
                            }?text=${encodeURIComponent(
                              `Hola ${client.name}, te saludo con gusto para revisar tus pólizas.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Enviar mensaje por WhatsApp"
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-emerald-600 hover:text-emerald-700"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </Button>
                          </a>
                        )}
                        <ClientFormDialog
                          client={client}
                          triggerButton={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-600 hover:text-blue-700"
                              title="Editar cliente"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          }
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-rose-600 hover:text-rose-700"
                          title="Archivar cliente"
                          onClick={() => setClientToArchive(client)}
                        >
                          <Archive className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={!!clientToArchive}
        onOpenChange={(val) => !val && setClientToArchive(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              ¿Archivar cliente {clientToArchive?.name}?
            </DialogTitle>
            <DialogDescription>
              Esta acción ocultará al cliente y sus {clientToArchive?.policies?.length || 0} póliza(s) de la cartera activa sin destruir su historial en la base de datos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setClientToArchive(null)}
              disabled={isArchiving}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleArchiveClient}
              disabled={isArchiving}
            >
              {isArchiving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Sí, Archivar Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

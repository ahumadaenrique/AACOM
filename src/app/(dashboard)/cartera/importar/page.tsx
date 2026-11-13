"use client";

import { useState } from "react";
import { uploadPoliciesLayout } from "../actions";
import * as xlsx from "xlsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  UploadCloud,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDateSafe, toDateInputValue } from "../dateUtils";
import {
  SUB_RAMOS_CATALOG,
  VIDA_OBJETIVOS_CATALOG,
  resolveImportedRowRamo,
  mapFormSelectionToPolicyFields,
  type CanonicalSubRamoKey,
  type VidaObjetivoKey,
} from "@/lib/ramosCatalog";

export default function ImportarCartera() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [showAllRows, setShowAllRows] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const normalizeExcelDate = (cellVal: any): string | null => {
    if (!cellVal) return null;
    if (cellVal instanceof Date) {
      return toDateInputValue(cellVal) || null;
    }
    if (typeof cellVal === "number") {
      const d = new Date(Math.round((cellVal - 25569) * 864e5));
      return toDateInputValue(d) || null;
    }
    const str = String(cellVal).trim();
    return str || null;
  };

  const [isDragging, setIsDragging] = useState(false);

  const processExcelFile = (uploadedFile: File) => {
    setFile(uploadedFile);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = xlsx.read(bstr, { type: "binary", cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = xlsx.utils.sheet_to_json(ws, { header: 1 });

        const rows = data.slice(1);

        const parsed = rows
          .map((row: any) => {
            const clientName = row[0] ? String(row[0]).trim() : "";
            const product = row[2] ? String(row[2]).trim() : "";
            const insuranceCompany = row[3] ? String(row[3]).trim() : "";
            const observations = row[8] ? String(row[8]).trim() : "";
            const rawRamo = row[15] ? String(row[15]).trim() : "";
            const rawObjetivo = row[16] ? String(row[16]).trim() : "";
            const resolved = resolveImportedRowRamo({
              ramo: rawRamo,
              vidaObjetivo: rawObjetivo,
              product,
              insuranceCompany,
              observations,
              contractor: clientName,
            });

            return {
              clientName,
              birthDate: normalizeExcelDate(row[1]),
              product,
              insuranceCompany,
              effectiveDate: normalizeExcelDate(row[4]),
              renewalDate: normalizeExcelDate(row[5]),
              anniversary: row[6] || null,
              annualPremium: row[7] || 0,
              observations,
              paymentMethod: row[9] ? String(row[9]).trim() : "",
              approximateCommission: row[10] || 0,
              approximateBonus: row[11] || 0,
              phone: row[12] ? String(row[12]).trim() : "",
              email: row[13] ? String(row[13]).trim() : "",
              policyNumber: row[14]
                ? String(row[14]).trim()
                : `POL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
              ramo: resolved.ramo,
              subRamo: resolved.subRamo,
              subRamoKey: resolved.classified.subRamoKey,
              vidaObjetivo: resolved.vidaObjetivo || "",
              tipoVigencia: resolved.tipoVigencia,
            };
          })
          .filter(
            (r) =>
              r.clientName &&
              !r.clientName.toLowerCase().includes("ejemplo:")
          );

        setParsedData(parsed);
        setShowAllRows(false);
      } catch {
        toast({
          title: "Error al procesar",
          description: "Asegúrate de que el archivo es un Excel válido (.xlsx)",
          variant: "destructive",
        });
      }
    };
    reader.readAsBinaryString(uploadedFile);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    processExcelFile(uploadedFile);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processExcelFile(droppedFile);
    }
  };

  const handleConfirm = async () => {
    if (parsedData.length === 0) return;
    setIsUploading(true);

    try {
      const res = await uploadPoliciesLayout(parsedData);
      if (res.error) throw new Error(res.error);
      toast({
        title: "Cartera importada exitosamente",
        description: `Se procesaron ${res.createdClients} clientes nuevos y ${res.createdPolicies} pólizas nuevas.`,
      });
      router.push("/cartera");
    } catch (err: any) {
      toast({
        title: "Error al importar",
        description: err.message || "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handlePreviewRamoChange = (
    rowIndex: number,
    nextSubRamoKey: CanonicalSubRamoKey,
    nextObjetivo?: VidaObjetivoKey | null
  ) => {
    setParsedData((prev) =>
      prev.map((item, idx) => {
        if (idx !== rowIndex) return item;
        const targetObj =
          nextSubRamoKey === "VIDA_INDIVIDUAL"
            ? ((nextObjetivo ?? (item.vidaObjetivo || "PROTECCION")) as VidaObjetivoKey)
            : null;
        const mapped = mapFormSelectionToPolicyFields(nextSubRamoKey, targetObj);
        return {
          ...item,
          subRamoKey: nextSubRamoKey,
          ramo: mapped.ramo,
          subRamo: mapped.subRamo,
          vidaObjetivo: mapped.vidaObjetivo || "",
          tipoVigencia: mapped.defaultVigencia,
        };
      })
    );
  };

  const downloadTemplate = () => {
    const wb = xlsx.utils.book_new();
    const ws_data = [
      [
        "Nombre del Cliente",
        "Fecha de Nacimiento",
        "Producto",
        "Aseguradora",
        "Inicio de Vigencia",
        "Fin de Vigencia",
        "Aniversario",
        "Prima Anual",
        "Observaciones",
        "Forma de Pago",
        "Comisión Aproximada",
        "Bono Aproximado",
        "Teléfono (Celular)",
        "Correo Electrónico",
        "Número de Póliza",
        "Ramo / Sub-ramo (Opcional)",
        "Objetivo Vida (Opcional)",
      ],
      [
        "Ejemplo: Juan Pérez García",
        "1985-05-15",
        "Temporal 20",
        "Insignia Life",
        "2024-03-01",
        "2044-03-01",
        "Marzo",
        24500,
        "Suma Asegurada $3,000,000 MXN",
        "Anual",
        0,
        0,
        "5512345678",
        "juan.perez@ejemplo.com",
        "308299",
        "Vida Individual",
        "Protección",
      ],
      [
        "Ejemplo: María López Soto",
        "1990-08-20",
        "Gastos Médicos Flex",
        "GNP Seguros",
        "2026-01-15",
        "2027-01-15",
        "Enero",
        38900,
        "Coaseguro 10%, Deducible $25,000",
        "Anual",
        0,
        0,
        "5587654321",
        "maria.lopez@ejemplo.com",
        "GMM-99210",
        "GMM Individual",
        "",
      ],
      [
        "Ejemplo: Logística del Norte SA de CV",
        "",
        "Flotilla Utilitarios (12 unidades)",
        "Quálitas",
        "2026-02-01",
        "2027-02-01",
        "Febrero",
        185000,
        "Cobertura Amplia Flotilla",
        "Semestral",
        0,
        0,
        "5511223344",
        "flota@ejemplo.com",
        "FLT-44100",
        "Autos Flotilla",
        "",
      ],
    ];
    const ws = xlsx.utils.aoa_to_sheet(ws_data);

    const wscols = ws_data[0].map((h) => ({ wch: String(h).length + 6 }));
    ws["!cols"] = wscols;

    xlsx.utils.book_append_sheet(wb, ws, "Layout Cartera");

    const catalogRows = [
      ["Columna P: Ramo / Sub-ramo (Valores Válidos)", "Columna Q: Objetivo Vida (solo si es Vida Individual)", "Notas"],
      ["Vida Individual", "Protección", "Si dejas Columna P vacía, se detecta automáticamente desde Producto"],
      ["Vida Grupo", "Ahorro", "Colectivo / Prestación empresarial de Vida"],
      ["GMM Individual", "Retiro", "También acepta PPR / Artículo 151"],
      ["GMM Colectivo", "Educación", "Gastos Médicos empresariales / PyME"],
      ["Autos Individual", "", "Vehículo particular"],
      ["Autos Flotilla", "", "Flotillas comerciales o empresariales"],
      ["Daños", "", "Hogar, Empresarial, PyME, Incendio, RC, Transporte"],
      ["Otros", "", "Cualquier otro ramo no listado"],
    ];
    const wsCatalog = xlsx.utils.aoa_to_sheet(catalogRows);
    wsCatalog["!cols"] = [{ wch: 44 }, { wch: 48 }, { wch: 58 }];
    xlsx.utils.book_append_sheet(wb, wsCatalog, "Catálogo Ramos");

    xlsx.writeFile(wb, "Layout_Cartera_Modelo.xlsx");
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-2">
        <Link href="/cartera">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Importar Cartera</h1>
          <p className="text-muted-foreground">
            Sube tu archivo de Excel para cargar masivamente a tus clientes y pólizas sin desfase de fechas.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="flex flex-col h-full border-dashed border-2">
          <CardHeader className="text-center">
            <CardTitle>Paso 1: Descarga la Plantilla</CardTitle>
            <CardDescription>
              Incluye una fila de ejemplo guía (se ignora automáticamente al importar si la dejas).
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center flex-1">
            <FileSpreadsheet className="w-16 h-16 text-green-600 mb-4" />
            <Button
              onClick={downloadTemplate}
              variant="outline"
              className="w-full max-w-xs"
            >
              Descargar Layout .xlsx
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col h-full">
          <CardHeader className="text-center">
            <CardTitle>Paso 2: Sube tu Archivo</CardTitle>
            <CardDescription>
              Arrastra tu Excel aquí o haz clic para seleccionarlo.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center flex-1">
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <CheckCircle2 className="w-12 h-12 text-primary" />
                <span className="font-medium text-sm text-center break-all">
                  {file.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {parsedData.length} registros detectados
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFile(null);
                    setParsedData([]);
                  }}
                  className="mt-2 text-destructive"
                >
                  Quitar archivo
                </Button>
              </div>
            ) : (
              <>
                <label
                  htmlFor="file-upload"
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`cursor-pointer flex flex-col items-center gap-2 w-full max-w-xs p-6 border-2 border-dashed rounded-lg transition-colors ${
                    isDragging
                      ? "border-primary bg-primary/10"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <UploadCloud className="w-12 h-12 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    Arrastra tu Excel o haz clic aquí
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Formatos .xlsx o .xls
                  </span>
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept=".xlsx, .xls"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {parsedData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vista Previa de Datos ({parsedData.length} filas)</CardTitle>
            <CardDescription>
              Verifica fechas, montos en MXN y el Ramo / Sub-ramo detectado (puedes ajustarlo aquí antes de confirmar).
            </CardDescription>
            <div className="flex flex-wrap gap-1.5 pt-2">
              {SUB_RAMOS_CATALOG.map((sr) => {
                const count = parsedData.filter((r) => r.subRamoKey === sr.key).length;
                if (count === 0) return null;
                return (
                  <span
                    key={sr.key}
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${sr.colorClass}`}
                  >
                    <span>{sr.label}:</span>
                    <span>{count}</span>
                  </span>
                );
              })}
            </div>
          </CardHeader>
          <CardContent className="overflow-auto max-h-[480px]">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted text-muted-foreground sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-3">Póliza</th>
                  <th className="px-3 py-3">Cliente</th>
                  <th className="px-3 py-3">Producto</th>
                  <th className="px-3 py-3">Ramo / Sub-ramo</th>
                  <th className="px-3 py-3">Aseguradora</th>
                  <th className="px-3 py-3">Inicio Vigencia</th>
                  <th className="px-3 py-3 text-right">Prima Anual</th>
                </tr>
              </thead>
              <tbody>
                {(showAllRows ? parsedData : parsedData.slice(0, 50)).map((row, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-3 py-2.5 font-mono text-xs">{row.policyNumber}</td>
                    <td className="px-3 py-2.5 font-medium">{row.clientName}</td>
                    <td className="px-3 py-2.5 text-xs">{row.product || "-"}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <select
                          value={row.subRamoKey || "VIDA_INDIVIDUAL"}
                          onChange={(e) =>
                            handlePreviewRamoChange(
                              i,
                              e.target.value as CanonicalSubRamoKey,
                              row.vidaObjetivo || null
                            )
                          }
                          className="h-7 text-xs font-semibold rounded-md border border-input bg-background px-2 py-0.5"
                        >
                          {SUB_RAMOS_CATALOG.map((sr) => (
                            <option key={sr.key} value={sr.key}>
                              {sr.label}
                            </option>
                          ))}
                        </select>
                        {row.subRamoKey === "VIDA_INDIVIDUAL" && (
                          <select
                            value={row.vidaObjetivo || "PROTECCION"}
                            onChange={(e) =>
                              handlePreviewRamoChange(
                                i,
                                "VIDA_INDIVIDUAL",
                                e.target.value as VidaObjetivoKey
                              )
                            }
                            className="h-7 text-[11px] font-medium rounded-md border border-input bg-muted/40 px-2 py-0.5"
                          >
                            {VIDA_OBJETIVOS_CATALOG.map((obj) => (
                              <option key={obj.key} value={obj.key}>
                                {obj.shortLabel}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-xs">{row.insuranceCompany || "-"}</td>
                    <td className="px-3 py-2.5 text-xs">
                      {formatDateSafe(row.effectiveDate, "dd/MM/yyyy", "-")}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium">
                      $
                      {Number(
                        String(row.annualPremium || 0).replace(/[^0-9.-]+/g, "")
                      ).toLocaleString("es-MX")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parsedData.length > 50 && (
              <div className="flex items-center justify-center gap-3 mt-4">
                <p className="text-xs text-muted-foreground">
                  {showAllRows
                    ? `Mostrando las ${parsedData.length} pólizas.`
                    : `Mostrando los primeros 50 registros de ${parsedData.length}.`}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAllRows((v) => !v)}
                >
                  {showAllRows ? "Ver solo 50" : `Mostrar todas (${parsedData.length})`}
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end gap-2 bg-muted/20 py-4">
            <Button variant="outline" onClick={() => router.push("/cartera")}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                `Confirmar Importación (${parsedData.length} pólizas)`
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

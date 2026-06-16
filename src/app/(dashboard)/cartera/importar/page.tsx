"use client";

import { useState } from "react";
import { uploadPoliciesLayout } from "../actions";
import * as xlsx from "xlsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadCloud, FileSpreadsheet, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

export default function ImportarCartera() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    setFile(uploadedFile);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = xlsx.read(bstr, { type: "binary", cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = xlsx.utils.sheet_to_json(ws, { header: 1 });

        // Skip header row and parse
        const headers = data[0] as string[];
        const rows = data.slice(1);

        const parsed = rows.map((row: any) => {
          return {
            clientName: row[0] || "",
            birthDate: row[1] || null,
            product: row[2] || "",
            insuranceCompany: row[3] || "",
            effectiveDate: row[4] || null,
            renewalDate: row[5] || null,
            anniversary: row[6] || null,
            annualPremium: row[7] || 0,
            observations: row[8] || "",
            paymentMethod: row[9] || "",
            approximateCommission: row[10] || 0,
            approximateBonus: row[11] || 0,
            phone: row[12] || "",
            email: row[13] || "",
            policyNumber: row[14] || `POL-${Math.random().toString(36).substring(7)}`, // Mock if empty
          };
        }).filter(r => r.clientName); // Must have client name

        setParsedData(parsed);
      } catch (err) {
        toast({
          title: "Error al procesar",
          description: "Asegúrate de que el archivo es un Excel válido (.xlsx)",
          variant: "destructive",
        });
      }
    };
    reader.readAsBinaryString(uploadedFile);
  };

  const handleConfirm = async () => {
    if (parsedData.length === 0) return;
    setIsUploading(true);

    try {
      const res = await uploadPoliciesLayout(parsedData);
      if (res.error) throw new Error(res.error);
      toast({
        title: "Cartera Importada exitosamente",
        description: `Se crearon ${res.createdClients} clientes y ${res.createdPolicies} pólizas.`,
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

  const downloadTemplate = () => {
    const wb = xlsx.utils.book_new();
    const ws_data = [
      ["Nombre del Cliente", "Fecha de Nacimiento", "Producto", "Aseguradora", "Inicio de Vigencia", "Fin de Vigencia", "Aniversario", "Prima Anual", "Observaciones", "Forma de Pago", "Comisión Aproximada", "Bono Aproximado", "Teléfono (Celular)", "Correo Electrónico", "Número de Póliza"]
    ];
    const ws = xlsx.utils.aoa_to_sheet(ws_data);

    // Ajustar anchos
    const wscols = ws_data[0].map(h => ({ wch: h.length + 5 }));
    ws['!cols'] = wscols;

    xlsx.utils.book_append_sheet(wb, ws, "Layout Cartera");
    xlsx.writeFile(wb, "Layout_Cartera_Modelo.xlsx");
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Importar Cartera</h1>
        <p className="text-muted-foreground">
          Sube tu archivo de Excel para cargar masivamente a tus clientes y pólizas.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="flex flex-col h-full border-dashed border-2">
          <CardHeader className="text-center">
            <CardTitle>Paso 1: Descarga la Plantilla</CardTitle>
            <CardDescription>
              Usa este archivo modelo para estructurar correctamente tu información antes de subirla.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center flex-1">
            <FileSpreadsheet className="w-16 h-16 text-green-600 mb-4" />
            <Button onClick={downloadTemplate} variant="outline" className="w-full max-w-xs">
              Descargar Layout .xlsx
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col h-full">
          <CardHeader className="text-center">
            <CardTitle>Paso 2: Sube tu Archivo</CardTitle>
            <CardDescription>
              Arrastra o selecciona el archivo Excel ya lleno con tu cartera.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center flex-1">
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <CheckCircle2 className="w-12 h-12 text-primary" />
                <span className="font-medium text-sm text-center break-all">{file.name}</span>
                <span className="text-xs text-muted-foreground">{parsedData.length} registros detectados</span>
                <Button variant="ghost" size="sm" onClick={() => { setFile(null); setParsedData([]); }} className="mt-2 text-destructive">
                  Quitar archivo
                </Button>
              </div>
            ) : (
              <>
                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2 w-full max-w-xs p-6 border rounded-lg hover:bg-muted/50 transition-colors">
                  <UploadCloud className="w-12 h-12 text-muted-foreground" />
                  <span className="text-sm font-medium">Click para seleccionar</span>
                  <span className="text-xs text-muted-foreground">Solo archivos .xlsx</span>
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
            <CardTitle>Vista Previa de Datos</CardTitle>
            <CardDescription>
              Verifica que la información se haya leído correctamente antes de guardarla en la base de datos.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-auto max-h-[400px]">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted text-muted-foreground sticky top-0">
                <tr>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">Aseguradora</th>
                  <th className="px-4 py-3">Prima</th>
                </tr>
              </thead>
              <tbody>
                {parsedData.slice(0, 50).map((row, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-4 py-3 font-medium">{row.clientName}</td>
                    <td className="px-4 py-3">{row.product}</td>
                    <td className="px-4 py-3">{row.insuranceCompany}</td>
                    <td className="px-4 py-3">${row.annualPremium}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parsedData.length > 50 && (
              <p className="text-xs text-center text-muted-foreground mt-4">
                Mostrando los primeros 50 registros de {parsedData.length}.
              </p>
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



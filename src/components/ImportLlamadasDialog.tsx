import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload, FileSpreadsheet, FileJson } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";

interface ImportLlamadasDialogProps {
  onSuccess: () => void;
}

export const ImportLlamadasDialog = ({ onSuccess }: ImportLlamadasDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const parseCSV = (text: string) => {
    const lines = text.split("\n").filter(line => line.trim());
    if (lines.length < 2) throw new Error("Archivo CSV vacío o inválido");

    const headers = lines[0].split(",").map(h => h.trim());
    const data = lines.slice(1).map(line => {
      const values = line.split(",").map(v => v.trim());
      const obj: any = {};
      headers.forEach((header, i) => {
        obj[header] = values[i];
      });
      return obj;
    });

    return data;
  };

  const parseExcel = async (file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      let data: any[] = [];

      if (file.name.endsWith(".json")) {
        const text = await file.text();
        data = JSON.parse(text);
      } else if (file.name.endsWith(".csv")) {
        const text = await file.text();
        data = parseCSV(text);
      } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        data = await parseExcel(file) as any[];
      } else {
        throw new Error("Formato de archivo no soportado. Use JSON, CSV o Excel.");
      }

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error("No se encontraron datos para importar");
      }

      // Validar que los datos tengan las columnas requeridas
      const requiredFields = ["paciente_cedula", "profesional_cedula", "fecha_agendada"];
      const firstItem = data[0];
      const missingFields = requiredFields.filter(field => !(field in firstItem));
      
      if (missingFields.length > 0) {
        throw new Error(`Faltan campos requeridos: ${missingFields.join(", ")}`);
      }

      // Obtener IDs de pacientes y profesionales por cédula
      const pacientesCedulas = [...new Set(data.map(d => d.paciente_cedula))];
      const profesionalesCedulas = [...new Set(data.map(d => d.profesional_cedula))];

      const { data: pacientes } = await supabase
        .from("pacientes")
        .select("id, cedula")
        .in("cedula", pacientesCedulas);

      const { data: profesionales } = await supabase
        .from("personal_salud")
        .select("id, cedula")
        .in("cedula", profesionalesCedulas);

      const pacientesMap = new Map(pacientes?.map(p => [p.cedula, p.id]));
      const profesionalesMap = new Map(profesionales?.map(p => [p.cedula, p.id]));

      // Preparar datos para inserción
      const llamadasToInsert = data
        .filter(d => {
          const hasPaciente = pacientesMap.has(d.paciente_cedula);
          const hasProfesional = profesionalesMap.has(d.profesional_cedula);
          if (!hasPaciente) {
            console.warn(`Paciente con cédula ${d.paciente_cedula} no encontrado`);
          }
          if (!hasProfesional) {
            console.warn(`Profesional con cédula ${d.profesional_cedula} no encontrado`);
          }
          return hasPaciente && hasProfesional;
        })
        .map(d => ({
          paciente_id: pacientesMap.get(d.paciente_cedula),
          profesional_id: profesionalesMap.get(d.profesional_cedula),
          fecha_agendada: d.fecha_agendada,
          motivo: d.motivo || null,
          duracion_estimada: d.duracion_estimada ? parseInt(d.duracion_estimada) : null,
          estado: d.estado || "agendada",
          notas_adicionales: d.notas_adicionales || null,
        }));

      if (llamadasToInsert.length === 0) {
        throw new Error("No se encontraron registros válidos para importar");
      }

      // Insertar en la base de datos
      const { error } = await supabase
        .from("registro_llamadas")
        .insert(llamadasToInsert);

      if (error) throw error;

      toast.success(`${llamadasToInsert.length} llamadas importadas exitosamente`);
      setOpen(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error al importar:", error);
      toast.error(error.message || "Error al importar archivo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Importar Masivo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar Llamadas Masivamente</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Seleccionar Archivo</Label>
            <Input
              type="file"
              accept=".json,.csv,.xlsx,.xls"
              onChange={handleFileUpload}
              disabled={loading}
            />
            <p className="text-sm text-muted-foreground">
              Formatos soportados: JSON, CSV, Excel (.xlsx, .xls)
            </p>
          </div>

          <div className="space-y-3 p-4 bg-muted rounded-lg">
            <h4 className="font-medium">Formato Requerido</h4>
            <p className="text-sm text-muted-foreground">
              El archivo debe contener las siguientes columnas:
            </p>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li><strong>paciente_cedula</strong>: Cédula del paciente</li>
              <li><strong>profesional_cedula</strong>: Cédula del profesional</li>
              <li><strong>fecha_agendada</strong>: Fecha y hora (formato: YYYY-MM-DD HH:MM:SS)</li>
              <li>motivo: Motivo de la llamada (opcional)</li>
              <li>duracion_estimada: Duración estimada en minutos (opcional)</li>
              <li>estado: Estado (agendada, pendiente, etc.) (opcional)</li>
              <li>notas_adicionales: Notas adicionales (opcional)</li>
            </ul>
          </div>

          <div className="flex gap-4">
            <div className="flex-1 p-3 border rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <FileJson className="h-5 w-5 text-primary" />
                <span className="font-medium text-sm">Ejemplo JSON</span>
              </div>
              <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
{`[
  {
    "paciente_cedula": "001-1234567-8",
    "profesional_cedula": "031-0123456-7",
    "fecha_agendada": "2024-12-15 10:00:00",
    "motivo": "Seguimiento mensual",
    "duracion_estimada": 15
  }
]`}
              </pre>
            </div>

            <div className="flex-1 p-3 border rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-success" />
                <span className="font-medium text-sm">Ejemplo CSV/Excel</span>
              </div>
              <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
{`paciente_cedula,profesional_cedula,fecha_agendada,motivo
001-1234567-8,031-0123456-7,2024-12-15 10:00:00,Seguimiento`}
              </pre>
            </div>
          </div>

          {loading && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">Procesando archivo...</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

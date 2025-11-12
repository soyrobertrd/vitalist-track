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

      // Detectar formato y procesar
      const firstItem = data[0];
      let llamadasToInsert: any[] = [];

      // FORMATO NOMBRE + FRECUENCIA: nombre, fecha_ultima_llamada, fecha_proxima_llamada, frecuencia_llamada
      if ("nombre" in firstItem && "frecuencia_llamada" in firstItem) {
        // Obtener todos los pacientes
        const { data: todosPacientes } = await supabase
          .from("pacientes")
          .select("id, nombre, apellido");

        const pacienteMap = new Map<string, string>();
        (todosPacientes || []).forEach((p: any) => {
          const nombreCompleto = `${p.nombre} ${p.apellido}`.toLowerCase().trim();
          pacienteMap.set(nombreCompleto, p.id);
        });

        llamadasToInsert = data
          .map((d: any) => {
            const nombreBuscado = String(d.nombre).toLowerCase().trim();
            const pacienteId = pacienteMap.get(nombreBuscado);
            
            if (!pacienteId) return null;

            return {
              paciente_id: pacienteId,
              profesional_id: null,
              fecha_agendada: d.fecha_proxima_llamada ? `${String(d.fecha_proxima_llamada).trim()}${String(d.fecha_proxima_llamada).length <= 10 ? " 00:00:00" : ""}` : null,
              fecha_hora_realizada: d.fecha_ultima_llamada ? `${String(d.fecha_ultima_llamada).trim()}${String(d.fecha_ultima_llamada).length <= 10 ? " 00:00:00" : ""}` : null,
              estado: d.fecha_ultima_llamada ? "realizada" : "agendada",
              motivo: `Seguimiento - Frecuencia: cada ${d.frecuencia_llamada} días`,
              duracion_estimada: 15,
              notas_adicionales: d.frecuencia_llamada ? `Frecuencia programada: ${d.frecuencia_llamada} días` : null,
            };
          })
          .filter(Boolean) as any[];
      }
      // FORMATO ESTÁNDAR: paciente_cedula, profesional_cedula, fecha_agendada
      else if ("paciente_cedula" in firstItem && "fecha_agendada" in firstItem) {
        // FORMATO ESTÁNDAR: resolver IDs por cédula
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

        llamadasToInsert = data
          .filter(d => pacientesMap.has(d.paciente_cedula))
          .map(d => ({
            paciente_id: pacientesMap.get(d.paciente_cedula),
            profesional_id: profesionalesMap.get(d.profesional_cedula) || null,
            fecha_agendada: d.fecha_agendada,
            motivo: d.motivo || null,
            duracion_estimada: d.duracion_estimada ? parseInt(d.duracion_estimada) : null,
            estado: d.estado || "agendada",
            notas_adicionales: d.notas_adicionales || null,
          }));
      } else if ("telefono" in firstItem || "nombre" in firstItem) {
        // FORMATO LEGADO (matcheo por teléfono y/o nombre)
        const sanitize = (t: string = "") => t.replace(/\D/g, "");
        
        // Obtener todos los pacientes para matcheo flexible
        const { data: todosPacientes } = await supabase
          .from("pacientes")
          .select("id, contacto_px, contacto_cuidador, nombre, apellido");

        const pacienteMap = new Map<string, string>();
        
        // Crear mapas por teléfono y por nombre
        (todosPacientes || []).forEach((p: any) => {
          // Mapear por teléfono del paciente
          if (p.contacto_px) {
            pacienteMap.set(sanitize(p.contacto_px), p.id);
          }
          // Mapear por teléfono del cuidador
          if (p.contacto_cuidador) {
            pacienteMap.set(sanitize(p.contacto_cuidador), p.id);
          }
          // Mapear por nombre completo (normalizado)
          const nombreCompleto = `${p.nombre} ${p.apellido}`.toLowerCase().trim();
          pacienteMap.set(nombreCompleto, p.id);
        });

        llamadasToInsert = data
          .map((d: any) => {
            let pacienteId = null;
            
            // Intentar matchear por teléfono primero
            if (d.telefono) {
              const phone = sanitize(d.telefono);
              pacienteId = pacienteMap.get(phone);
            }
            
            // Si no se encontró por teléfono, intentar por nombre
            if (!pacienteId && d.nombre) {
              const nombreBuscado = String(d.nombre).toLowerCase().trim();
              pacienteId = pacienteMap.get(nombreBuscado);
            }
            
            if (!pacienteId) return null; // No se pudo hacer match

            const realizada = Boolean(d.llamadaRealizada);
            const fechaAgendada = d.fechaProximaLlamada || d.fecha_agendada || null;
            const fechaRealizada = d.ultimaLlamada || null;

            return {
              paciente_id: pacienteId,
              profesional_id: null,
              fecha_agendada: fechaAgendada ? `${String(fechaAgendada).trim()}${String(fechaAgendada).length <= 10 ? " 00:00:00" : ""}` : null,
              fecha_hora_realizada: realizada && fechaRealizada ? `${String(fechaRealizada).trim()}${String(fechaRealizada).length <= 10 ? " 00:00:00" : ""}` : null,
              estado: realizada ? "realizada" : "agendada",
              motivo: d.motivo || null,
              duracion_estimada: d.duracion_estimada ? parseInt(d.duracion_estimada) : null,
              notas_adicionales: null,
            };
          })
          .filter(Boolean) as any[];
      } else {
        throw new Error("Formato no reconocido. Use formato estándar (cedula), por nombre+frecuencia, o legado (teléfono)");
      }

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
            <h4 className="font-medium">Formatos Soportados</h4>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium">1. Por Nombre + Frecuencia:</p>
                <ul className="list-disc list-inside text-muted-foreground ml-2">
                  <li><strong>nombre</strong>: Nombre completo (Nombre Apellido)</li>
                  <li><strong>fecha_ultima_llamada</strong>: Fecha última llamada (YYYY-MM-DD)</li>
                  <li><strong>fecha_proxima_llamada</strong>: Próxima llamada (YYYY-MM-DD)</li>
                  <li><strong>frecuencia_llamada</strong>: Días entre llamadas (ej: 30)</li>
                </ul>
              </div>
              <div>
                <p className="font-medium">2. Por Cédula (Formato Estándar):</p>
                <ul className="list-disc list-inside text-muted-foreground ml-2">
                  <li><strong>paciente_cedula</strong>: Cédula del paciente</li>
                  <li><strong>profesional_cedula</strong>: Cédula del profesional</li>
                  <li><strong>fecha_agendada</strong>: Fecha (YYYY-MM-DD HH:MM:SS)</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1 p-3 border rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <FileJson className="h-5 w-5 text-primary" />
                <span className="font-medium text-sm">Ejemplo Nombre + Frecuencia</span>
              </div>
              <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
{`[
  {
    "nombre": "Juan Pérez",
    "fecha_ultima_llamada": "2024-11-01",
    "fecha_proxima_llamada": "2024-12-01",
    "frecuencia_llamada": "30"
  }
]`}
              </pre>
            </div>

            <div className="flex-1 p-3 border rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-success" />
                <span className="font-medium text-sm">Ejemplo CSV</span>
              </div>
              <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
{`nombre,fecha_ultima_llamada,fecha_proxima_llamada,frecuencia_llamada
Juan Pérez,2024-11-01,2024-12-01,30`}
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

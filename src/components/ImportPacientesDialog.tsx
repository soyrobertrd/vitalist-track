import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, FileJson, FileSpreadsheet, AlertCircle } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ImportPacientesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ImportPacientesDialog({ open, onOpenChange, onSuccess }: ImportPacientesDialogProps) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    try {
      const text = await file.text();
      let data: any[] = [];

      if (fileExtension === 'json') {
        data = JSON.parse(text);
      } else if (fileExtension === 'csv') {
        data = parseCSV(text);
      } else {
        toast.error("Formato no soportado. Use JSON o CSV");
        return;
      }

      // Validar estructura
      if (!Array.isArray(data) || data.length === 0) {
        toast.error("El archivo debe contener un array de pacientes");
        return;
      }

      // Validar campos requeridos
      const requiredFields = ['cedula', 'nombre', 'apellido'];
      const hasRequiredFields = data.every(p => 
        requiredFields.every(field => p[field])
      );

      if (!hasRequiredFields) {
        toast.error("Faltan campos requeridos: cédula, nombre, apellido");
        return;
      }

      setPreview(data);
      toast.success(`${data.length} pacientes listos para importar`);
    } catch (error) {
      toast.error("Error al leer el archivo");
      console.error(error);
    }
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || null;
      });
      return obj;
    });
  };

  const handleImport = async () => {
    if (preview.length === 0) {
      toast.error("No hay datos para importar");
      return;
    }

    setLoading(true);

    try {
      // Preparar datos con valores por defecto
      const pacientesData = preview.map(p => ({
        cedula: p.cedula,
        nombre: p.nombre,
        apellido: p.apellido,
        fecha_nacimiento: p.fecha_nacimiento || null,
        contacto_px: p.contacto_px || p.contacto || null,
        direccion_domicilio: p.direccion_domicilio || p.direccion || null,
        nombre_cuidador: p.nombre_cuidador || null,
        contacto_cuidador: p.contacto_cuidador || null,
        historia_medica_basica: p.historia_medica_basica || p.historia_medica || null,
        grado_dificultad: (p.grado_dificultad || 'medio') as 'bajo' | 'medio' | 'alto',
        status_px: 'activo' as const
      }));

      const { data, error } = await supabase
        .from("pacientes")
        .insert(pacientesData)
        .select();

      if (error) throw error;

      toast.success(`${data.length} pacientes importados exitosamente`);
      setPreview([]);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(`Error al importar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Pacientes
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Formato requerido:</strong>
              <br />
              Campos obligatorios: cedula, nombre, apellido
              <br />
              Campos opcionales: fecha_nacimiento, contacto_px, direccion_domicilio, nombre_cuidador, contacto_cuidador, historia_medica_basica, grado_dificultad
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label>Seleccionar Archivo</Label>
            <div className="flex gap-2">
              <input
                type="file"
                accept=".json,.csv"
                onChange={handleFileUpload}
                className="flex-1"
              />
            </div>
            <div className="flex gap-2 text-sm text-muted-foreground">
              <FileJson className="h-4 w-4" /> JSON
              <FileSpreadsheet className="h-4 w-4 ml-2" /> CSV
            </div>
          </div>

          {preview.length > 0 && (
            <div className="space-y-2">
              <Label>Vista Previa ({preview.length} pacientes)</Label>
              <div className="max-h-60 overflow-y-auto border rounded-lg p-4">
                {preview.slice(0, 5).map((p, idx) => (
                  <div key={idx} className="py-2 border-b last:border-0">
                    <p className="font-medium">{p.nombre} {p.apellido}</p>
                    <p className="text-sm text-muted-foreground">Cédula: {p.cedula}</p>
                  </div>
                ))}
                {preview.length > 5 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    ... y {preview.length - 5} pacientes más
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleImport} disabled={loading || preview.length === 0}>
              {loading ? "Importando..." : `Importar ${preview.length} Pacientes`}
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Ejemplo JSON:</Label>
            <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`[
  {
    "cedula": "12345678",
    "nombre": "Juan",
    "apellido": "Pérez",
    "fecha_nacimiento": "1950-05-20",
    "contacto_px": "555-0101",
    "grado_dificultad": "bajo"
  }
]`}
            </pre>
          </div>

          <div className="space-y-2">
            <Label>Ejemplo CSV:</Label>
            <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`cedula,nombre,apellido,fecha_nacimiento,contacto_px,grado_dificultad
12345678,Juan,Pérez,1950-05-20,555-0101,bajo`}
            </pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

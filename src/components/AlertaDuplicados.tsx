import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface DuplicadoEncontrado {
  id: string;
  nombre: string;
  apellido: string;
  cedula: string;
  contacto_px?: string;
  contacto_cuidador?: string;
  zona?: string;
  barrio?: string;
  motivo: string[];
}

interface AlertaDuplicadosProps {
  duplicados: DuplicadoEncontrado[];
}

export function AlertaDuplicados({ duplicados }: AlertaDuplicadosProps) {
  if (duplicados.length === 0) return null;

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>¡Posibles duplicados detectados!</AlertTitle>
      <AlertDescription>
        <p className="mb-2">
          Se encontraron {duplicados.length} paciente(s) similar(es):
        </p>
        <div className="space-y-2">
          {duplicados.map((dup) => (
            <div
              key={dup.id}
              className="bg-background/50 p-2 rounded border border-border text-sm"
            >
              <div className="font-semibold">
                {dup.nombre} {dup.apellido}
              </div>
              <div className="text-xs text-muted-foreground">
                Cédula: {dup.cedula}
                {dup.contacto_px && ` | Tel: ${dup.contacto_px}`}
                {dup.zona && ` | Zona: ${dup.zona}`}
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {dup.motivo.map((motivo, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {motivo}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs">
          Verifique que no está creando un paciente duplicado antes de continuar.
        </p>
      </AlertDescription>
    </Alert>
  );
}

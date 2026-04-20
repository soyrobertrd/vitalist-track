import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Conflicto {
  id: string;
  tipo: "llamada" | "visita";
  fecha: Date;
  paciente: string;
  motivo: string;
}

interface Props {
  conflictos: Conflicto[];
  checking: boolean;
}

/**
 * Banner que se muestra dentro de los diálogos de agendamiento
 * cuando se detectan conflictos en tiempo real con la agenda del profesional.
 */
export function AlertaConflictoEnVivo({ conflictos, checking }: Props) {
  if (checking) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Verificando agenda del profesional...
      </div>
    );
  }

  if (conflictos.length === 0) return null;

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>
        Conflicto de agenda ({conflictos.length})
      </AlertTitle>
      <AlertDescription>
        <ul className="mt-2 space-y-1 text-xs">
          {conflictos.map((c) => (
            <li key={c.id}>
              • <strong>{c.tipo === "llamada" ? "Llamada" : "Visita"}</strong> con{" "}
              {c.paciente} a las{" "}
              {format(c.fecha, "HH:mm 'del' d MMM", { locale: es })} — {c.motivo}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}

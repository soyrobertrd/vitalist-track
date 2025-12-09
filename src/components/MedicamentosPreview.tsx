import { Pill } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Medicamento {
  id: string;
  nombre_medicamento: string;
  dosis: string | null;
  frecuencia: string | null;
  muestra_medica: boolean;
}

interface MedicamentosPreviewProps {
  medicamentos: Medicamento[];
  maxShow?: number;
  className?: string;
}

export function MedicamentosPreview({ medicamentos, maxShow = 3, className = "" }: MedicamentosPreviewProps) {
  if (!medicamentos || medicamentos.length === 0) return null;

  const toShow = medicamentos.slice(0, maxShow);
  const remaining = medicamentos.length - maxShow;

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Pill className="h-3 w-3" />
        <span>Medicamentos</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {toShow.map((med) => (
          <Badge 
            key={med.id} 
            variant="outline" 
            className={`text-xs ${med.muestra_medica ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' : ''}`}
          >
            {med.nombre_medicamento}
            {med.dosis && <span className="text-muted-foreground ml-1">({med.dosis})</span>}
          </Badge>
        ))}
        {remaining > 0 && (
          <Badge variant="secondary" className="text-xs">
            +{remaining} más
          </Badge>
        )}
      </div>
    </div>
  );
}

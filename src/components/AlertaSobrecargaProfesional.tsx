import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X, ChevronDown, ChevronUp } from "lucide-react";
import { useProfessionalWorkload } from "@/hooks/useProfessionalWorkload";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface AlertaSobrecargaProfesionalProps {
  fecha?: Date;
  onDismiss?: () => void;
}

export function AlertaSobrecargaProfesional({ 
  fecha, 
  onDismiss 
}: AlertaSobrecargaProfesionalProps) {
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const { sobrecargados, loading, checkWorkload, maxLlamadasDia, maxVisitasDia, maxTotalDia } = useProfessionalWorkload();

  useEffect(() => {
    if (fecha) {
      checkWorkload(fecha);
    }
  }, [fecha]);

  if (loading || dismissed || sobrecargados.length === 0) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <Alert variant="destructive" className="mb-4 relative">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        <span>Sobrecarga de Citas Detectada</span>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertTitle>
      <AlertDescription>
        <p className="text-sm mb-2">
          {sobrecargados.length} profesional(es) tienen demasiadas citas programadas para{" "}
          {fecha ? format(fecha, "dd/MM/yyyy", { locale: es }) : "hoy"}.
        </p>
        
        {expanded && (
          <div className="mt-3 space-y-2">
            {sobrecargados.map((prof) => (
              <div 
                key={prof.profesionalId} 
                className="bg-background/50 rounded-lg p-3 border border-destructive/20"
              >
                <p className="font-medium text-sm">{prof.profesionalNombre}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge 
                    variant={prof.totalLlamadas > maxLlamadasDia ? "destructive" : "secondary"}
                    className="text-xs"
                  >
                    {prof.totalLlamadas} llamadas (máx: {maxLlamadasDia})
                  </Badge>
                  <Badge 
                    variant={prof.totalVisitas > maxVisitasDia ? "destructive" : "secondary"}
                    className="text-xs"
                  >
                    {prof.totalVisitas} visitas (máx: {maxVisitasDia})
                  </Badge>
                  <Badge 
                    variant={prof.totalCitas > maxTotalDia ? "destructive" : "secondary"}
                    className="text-xs"
                  >
                    {prof.totalCitas} total (máx: {maxTotalDia})
                  </Badge>
                </div>
              </div>
            ))}
            <p className="text-xs text-muted-foreground mt-2">
              Considere redistribuir algunas citas para balancear la carga de trabajo.
            </p>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}

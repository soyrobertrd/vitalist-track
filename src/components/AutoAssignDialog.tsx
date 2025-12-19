import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAutoAssignProfessional } from "@/hooks/useAutoAssignProfessional";
import { Wand2, User, MapPin, Calendar, CheckCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AutoAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacienteId: string;
  pacienteNombre: string;
  pacienteZona: string | null;
  pacienteBarrio: string | null;
  fecha: Date;
  onSelect: (profesionalId: string) => void;
}

export function AutoAssignDialog({
  open,
  onOpenChange,
  pacienteId,
  pacienteNombre,
  pacienteZona,
  pacienteBarrio,
  fecha,
  onSelect,
}: AutoAssignDialogProps) {
  const { suggestProfessional, loading } = useAutoAssignProfessional();
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (open && pacienteZona !== undefined) {
      loadSuggestions();
    }
  }, [open, pacienteZona, pacienteBarrio, fecha]);

  const loadSuggestions = async () => {
    const suggestions = await suggestProfessional(
      pacienteZona,
      pacienteBarrio,
      fecha
    );
    setResult(suggestions);
  };

  const handleSelect = (profesionalId: string) => {
    onSelect(profesionalId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            Asignación Automática
          </DialogTitle>
          <DialogDescription>
            Sugerencias basadas en zona, carga de trabajo y disponibilidad
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Patient info */}
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{pacienteNombre}</span>
            </div>
            {pacienteZona && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <MapPin className="h-3 w-3" />
                <span>
                  {pacienteZona.replace(/_/g, " ")}
                  {pacienteBarrio && ` - ${pacienteBarrio}`}
                </span>
              </div>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : result ? (
            <>
              {/* Recommended */}
              {result.recommended && (
                <Card className="border-primary/50 bg-primary/5">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-primary" />
                          <span className="font-semibold">
                            {result.recommended.nombre}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            Recomendado
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {result.recommended.reasons.map((reason: string, i: number) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="text-xs"
                            >
                              {reason}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Carga actual: {result.recommended.workload.llamadas} llamadas,{" "}
                          {result.recommended.workload.visitas} visitas
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() =>
                          handleSelect(result.recommended.profesionalId)
                        }
                      >
                        Asignar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Alternatives */}
              {result.alternatives.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Otras opciones
                  </p>
                  {result.alternatives.map((alt: any) => (
                    <Card key={alt.profesionalId} className="hover:bg-muted/50">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-medium">{alt.nombre}</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {alt.reasons.slice(0, 3).map((reason: string, i: number) => (
                                <Badge
                                  key={i}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {reason}
                                </Badge>
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {alt.workload.total} citas
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSelect(alt.profesionalId)}
                          >
                            Asignar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {!result.recommended && result.alternatives.length === 0 && (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-3" />
                  <p className="text-muted-foreground">{result.reason}</p>
                </div>
              )}
            </>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button variant="ghost" onClick={loadSuggestions} disabled={loading}>
              Recalcular
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

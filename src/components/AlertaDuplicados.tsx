import { useState } from "react";
import { AlertTriangle, Check, Trash2, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface MotivoCampo {
  campo: string;
  valor: string;
}

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
  motivosCampos?: MotivoCampo[];
}

interface AlertaDuplicadosProps {
  duplicados: DuplicadoEncontrado[];
  onConfirmarDuplicado?: (
    pacienteId: string,
    campo: string,
    valor: string
  ) => Promise<boolean>;
  onEliminarPaciente?: (pacienteId: string) => Promise<void>;
  onRefresh?: () => void;
}

export function AlertaDuplicados({
  duplicados,
  onConfirmarDuplicado,
  onEliminarPaciente,
  onRefresh,
}: AlertaDuplicadosProps) {
  const [confirmingItem, setConfirmingItem] = useState<{
    pacienteId: string;
    campo: string;
    valor: string;
    motivo: string;
  } | null>(null);
  const [deletingPaciente, setDeletingPaciente] = useState<DuplicadoEncontrado | null>(null);
  const [loading, setLoading] = useState(false);

  if (duplicados.length === 0) return null;

  const handleConfirm = async () => {
    if (!confirmingItem || !onConfirmarDuplicado) return;
    
    setLoading(true);
    try {
      const success = await onConfirmarDuplicado(
        confirmingItem.pacienteId,
        confirmingItem.campo,
        confirmingItem.valor
      );
      
      if (success) {
        toast({
          title: "Excepción confirmada",
          description: "Este dato duplicado no volverá a mostrarse como alerta.",
        });
      }
    } finally {
      setLoading(false);
      setConfirmingItem(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingPaciente) return;
    
    setLoading(true);
    try {
      if (onEliminarPaciente) {
        await onEliminarPaciente(deletingPaciente.id);
      } else {
        // Default: mark as inactive
        const { error } = await supabase
          .from("pacientes")
          .update({ status_px: "inactivo" })
          .eq("id", deletingPaciente.id);

        if (error) throw error;
      }

      toast({
        title: "Paciente eliminado",
        description: `${deletingPaciente.nombre} ${deletingPaciente.apellido} ha sido marcado como inactivo.`,
      });
      
      onRefresh?.();
    } catch (error) {
      console.error("Error al eliminar paciente:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el paciente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setDeletingPaciente(null);
    }
  };

  const getMotivoLabel = (campo: string): string => {
    switch (campo) {
      case 'cedula': return 'Misma cédula';
      case 'nombre_completo': return 'Mismo nombre';
      case 'telefono_px': return 'Mismo tel. paciente';
      case 'telefono_cuidador': return 'Mismo tel. cuidador';
      default: return campo;
    }
  };

  return (
    <>
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>¡Posibles duplicados detectados!</AlertTitle>
        <AlertDescription>
          <p className="mb-2">
            Se encontraron {duplicados.length} paciente(s) similar(es):
          </p>
          <div className="space-y-3">
            {duplicados.map((dup) => (
              <div
                key={dup.id}
                className="bg-background/50 p-3 rounded border border-border"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">
                      {dup.nombre} {dup.apellido}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Cédula: {dup.cedula}
                      {dup.contacto_px && ` | Tel: ${dup.contacto_px}`}
                      {dup.zona && ` | Zona: ${dup.zona}`}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeletingPaciente(dup)}
                    title="Eliminar este paciente"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-1 mt-2">
                  {dup.motivosCampos && dup.motivosCampos.length > 0 ? (
                    dup.motivosCampos.map((motivoCampo, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs pr-1">
                          {getMotivoLabel(motivoCampo.campo)}
                          {onConfirmarDuplicado && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 ml-1 text-green-600 hover:text-green-700 hover:bg-green-100"
                              onClick={() => setConfirmingItem({
                                pacienteId: dup.id,
                                campo: motivoCampo.campo,
                                valor: motivoCampo.valor,
                                motivo: getMotivoLabel(motivoCampo.campo)
                              })}
                              title="Confirmar que es correcto"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    dup.motivo.map((motivo, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {motivo}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs">
            Puede confirmar cada dato duplicado (✓) si es correcto, o eliminar el paciente duplicado (🗑).
          </p>
        </AlertDescription>
      </Alert>

      {/* Confirm Exception Dialog */}
      <AlertDialog open={!!confirmingItem} onOpenChange={() => setConfirmingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar dato duplicado</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro de que <strong>{confirmingItem?.motivo}</strong> es correcto y no es un error?
              <br /><br />
              Por ejemplo, dos pacientes pueden ser esposos y compartir el mismo número de teléfono.
              <br /><br />
              Al confirmar, esta alerta no volverá a aparecer para este dato específico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? "Confirmando..." : "Sí, es correcto"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Patient Dialog */}
      <AlertDialog open={!!deletingPaciente} onOpenChange={() => setDeletingPaciente(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar paciente duplicado</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro de que desea eliminar a{" "}
              <strong>{deletingPaciente?.nombre} {deletingPaciente?.apellido}</strong>?
              <br /><br />
              El paciente será marcado como inactivo y no aparecerá en las listas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {loading ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

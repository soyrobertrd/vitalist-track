import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertTriangle, Check, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface UnificarPacientesDialogProps {
  pacientes: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const UnificarPacientesDialog = ({ pacientes, open, onOpenChange, onSuccess }: UnificarPacientesDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [selectedPaciente, setSelectedPaciente] = useState<string>("");
  const [phoneNumbers, setPhoneNumbers] = useState<{
    contacto_px: string[];
    contacto_cuidador: string[];
  }>({ contacto_px: [], contacto_cuidador: [] });
  const [selectedPhones, setSelectedPhones] = useState<{
    contacto_px: string | null;
    contacto_cuidador: string | null;
  }>({ contacto_px: null, contacto_cuidador: null });

  // Collect all unique phone numbers when dialog opens or pacientes change
  useEffect(() => {
    if (pacientes && pacientes.length > 0) {
      const uniquePx = Array.from(new Set(
        pacientes.map(p => p.contacto_px).filter(c => c && c.trim())
      )) as string[];
      const uniqueCuidador = Array.from(new Set(
        pacientes.map(p => p.contacto_cuidador).filter(c => c && c.trim())
      )) as string[];
      
      setPhoneNumbers({
        contacto_px: uniquePx,
        contacto_cuidador: uniqueCuidador
      });
    }
  }, [pacientes]);

  const handleUnificar = async () => {
    if (!selectedPaciente) {
      toast.error("Debe seleccionar el paciente a mantener");
      return;
    }

    setLoading(true);
    try {
      const pacienteAMantener = selectedPaciente;
      const pacientesAEliminar = pacientes.filter(p => p.id !== pacienteAMantener).map(p => p.id);
      const pacientePrincipal = pacientes.find(p => p.id === pacienteAMantener);
      
      // Prepare phone data to update
      const phoneUpdates: any = {};
      
      // Lógica de teléfonos
      if (selectedPhones.contacto_px) {
        phoneUpdates.contacto_px = selectedPhones.contacto_px;
      }
      
      // Si el paciente no tiene cuidador, asignar el segundo teléfono al cuidador
      if (selectedPhones.contacto_cuidador) {
        phoneUpdates.contacto_cuidador = selectedPhones.contacto_cuidador;
      } else if (!pacientePrincipal?.nombre_cuidador && phoneNumbers.contacto_px.length > 1) {
        // Si no hay cuidador y hay múltiples teléfonos de paciente
        const segundoTelefono = phoneNumbers.contacto_px.find(
          tel => tel !== selectedPhones.contacto_px
        );
        if (segundoTelefono) {
          phoneUpdates.contacto_cuidador = segundoTelefono;
        }
      }

      // Transferir llamadas
      const { error: llamadasError } = await supabase
        .from("registro_llamadas")
        .update({ paciente_id: pacienteAMantener })
        .in("paciente_id", pacientesAEliminar);

      if (llamadasError) throw llamadasError;

      // Transferir visitas
      const { error: visitasError } = await supabase
        .from("control_visitas")
        .update({ paciente_id: pacienteAMantener })
        .in("paciente_id", pacientesAEliminar);

      if (visitasError) throw visitasError;

      // Transferir medicamentos
      const { error: medicamentosError } = await supabase
        .from("medicamentos_paciente")
        .update({ paciente_id: pacienteAMantener })
        .in("paciente_id", pacientesAEliminar);

      if (medicamentosError) throw medicamentosError;

      // Transferir parámetros de seguimiento
      const { error: parametrosError } = await supabase
        .from("parametros_seguimiento")
        .update({ paciente_id: pacienteAMantener })
        .in("paciente_id", pacientesAEliminar);

      if (parametrosError) throw parametrosError;

      // Transferir atención
      const { error: atencionError } = await supabase
        .from("atencion_paciente")
        .update({ paciente_id: pacienteAMantener })
        .in("paciente_id", pacientesAEliminar);

      if (atencionError) throw atencionError;

      // Update phone numbers if selected
      if (Object.keys(phoneUpdates).length > 0) {
        const { error: phoneUpdateError } = await supabase
          .from("pacientes")
          .update(phoneUpdates)
          .eq("id", pacienteAMantener);
        
        if (phoneUpdateError) throw phoneUpdateError;
      }

      // Marcar como inactivos los pacientes duplicados (no eliminar)
      const { error: updateError } = await supabase
        .from("pacientes")
        .update({ status_px: "inactivo" })
        .in("id", pacientesAEliminar);

      if (updateError) throw updateError;

      // Obtener el ID del usuario actual
      const { data: { user } } = await supabase.auth.getUser();

      // Registrar en auditoría
      const { error: auditError } = await supabase
        .from("auditoria_unificaciones")
        .insert({
          paciente_principal_id: pacienteAMantener,
          pacientes_eliminados_ids: pacientesAEliminar,
          datos_unificados: {
            telefonos_seleccionados: phoneUpdates,
            pacientes_originales: pacientes.map(p => ({
              id: p.id,
              nombre: p.nombre,
              apellido: p.apellido,
              cedula: p.cedula,
              contacto_px: p.contacto_px,
              contacto_cuidador: p.contacto_cuidador
            }))
          },
          realizado_por: user?.id
        });

      if (auditError) {
        console.error("Error al registrar auditoría:", auditError);
        // No bloqueamos la operación si falla la auditoría
      }

      toast.success(`Pacientes unificados exitosamente. ${pacientesAEliminar.length} registros marcados como inactivos.`);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error al unificar pacientes:", error);
      toast.error("Error al unificar pacientes");
    } finally {
      setLoading(false);
    }
  };

  const renderPacienteOption = (paciente: any) => (
    <div className="flex items-start space-x-3 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors">
      <RadioGroupItem value={paciente.id} id={paciente.id} />
      <Label htmlFor={paciente.id} className="flex-1 cursor-pointer">
        <Card className="border-0 shadow-none">
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-sm font-semibold">
              {paciente.nombre} {paciente.apellido}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-1 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-muted-foreground">Cédula:</span>
                <p className="font-medium">{paciente.cedula || "N/A"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Zona:</span>
                <p className="font-medium">{paciente.zona || "N/A"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Tel. Paciente:</span>
                <p className="font-medium">{paciente.contacto_px || "N/A"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Tel. Cuidador:</span>
                <p className="font-medium">{paciente.contacto_cuidador || "N/A"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Barrio:</span>
                <p className="font-medium">{paciente.barrio || "N/A"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Creado:</span>
                <p className="font-medium">{new Date(paciente.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            {paciente.historia_medica_basica && (
              <div className="mt-2 pt-2 border-t">
                <span className="text-muted-foreground">Historia Médica:</span>
                <p className="font-medium line-clamp-2">{paciente.historia_medica_basica}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </Label>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-primary" />
            Unificar Pacientes Duplicados
          </DialogTitle>
          <DialogDescription>
            Seleccione el registro que desea mantener. Toda la información de los otros registros (llamadas, visitas, medicamentos) será transferida al paciente seleccionado.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4 rounded-lg flex gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
              Advertencia: Esta acción no se puede deshacer
            </p>
            <ul className="text-xs text-amber-800 dark:text-amber-300 space-y-1">
              <li>• Los pacientes no seleccionados serán marcados como "inactivos"</li>
              <li>• Todo el historial (llamadas, visitas, medicamentos) será transferido al paciente seleccionado</li>
              <li>• Revise cuidadosamente la información antes de proceder</li>
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">
              Seleccione el paciente a mantener:
            </Label>
            <Badge variant="outline">
              {pacientes.length} registros duplicados
            </Badge>
          </div>

          <RadioGroup value={selectedPaciente} onValueChange={setSelectedPaciente}>
            <div className="space-y-3">
              {pacientes.map(renderPacienteOption)}
            </div>
          </RadioGroup>

          {/* Phone number selection */}
          {selectedPaciente && (phoneNumbers.contacto_px.length > 1 || phoneNumbers.contacto_cuidador.length > 1) && (
            <div className="mt-6 p-4 border border-primary/20 rounded-lg bg-primary/5 space-y-4">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Seleccionar Teléfonos a Conservar
              </h4>
              
              {phoneNumbers.contacto_px.length > 1 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Teléfono del Paciente</Label>
                  <RadioGroup 
                    value={selectedPhones.contacto_px || ""} 
                    onValueChange={(value) => setSelectedPhones(prev => ({ ...prev, contacto_px: value }))}
                  >
                    {phoneNumbers.contacto_px.map((phone, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <RadioGroupItem value={phone} id={`px-${idx}`} />
                        <Label htmlFor={`px-${idx}`} className="text-sm cursor-pointer">
                          {phone}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {phoneNumbers.contacto_cuidador.length > 1 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Teléfono del Cuidador</Label>
                  <RadioGroup 
                    value={selectedPhones.contacto_cuidador || ""} 
                    onValueChange={(value) => setSelectedPhones(prev => ({ ...prev, contacto_cuidador: value }))}
                  >
                    {phoneNumbers.contacto_cuidador.map((phone, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <RadioGroupItem value={phone} id={`cuidador-${idx}`} />
                        <Label htmlFor={`cuidador-${idx}`} className="text-sm cursor-pointer">
                          {phone}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button 
            onClick={handleUnificar} 
            disabled={loading || !selectedPaciente}
            className="flex-1"
          >
            {loading ? "Unificando..." : "Unificar Pacientes"}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

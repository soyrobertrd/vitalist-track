import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Notificacion {
  id: string;
  visita_id: string;
  paciente_id: string;
  notas_visita: string | null;
  completada: boolean;
  created_at: string;
}

export function NotificacionPlanAccion({ pacienteId }: { pacienteId: string }) {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [selectedNotif, setSelectedNotif] = useState<Notificacion | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [planAccion, setPlanAccion] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotificaciones();
  }, [pacienteId]);

  const fetchNotificaciones = async () => {
    const { data } = await supabase
      .from("notificaciones_plan_accion")
      .select("*")
      .eq("paciente_id", pacienteId)
      .eq("completada", false)
      .order("created_at", { ascending: false });

    if (data) {
      setNotificaciones(data);
    }
  };

  const handleCompletarPlan = async () => {
    if (!selectedNotif) return;
    
    setLoading(true);
    const { error } = await supabase
      .from("notificaciones_plan_accion")
      .update({
        completada: true,
        completed_at: new Date().toISOString(),
      })
      .eq("id", selectedNotif.id);

    if (error) {
      toast.error("Error al completar plan de acción");
    } else {
      toast.success("Plan de acción completado");
      setDialogOpen(false);
      setSelectedNotif(null);
      setPlanAccion("");
      fetchNotificaciones();
    }
    setLoading(false);
  };

  if (notificaciones.length === 0) return null;

  return (
    <div className="space-y-2">
      {notificaciones.map((notif) => (
        <Alert key={notif.id} variant="default" className="border-primary bg-primary/10">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Plan de Acción Pendiente</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>Se realizó una visita a este paciente. Es necesario completar el plan de acción.</p>
            {notif.notas_visita && (
              <div className="mt-2 p-2 bg-background rounded text-sm">
                <strong>Notas de la Visita:</strong>
                <p className="mt-1">{notif.notas_visita}</p>
              </div>
            )}
            <Button
              size="sm"
              className="mt-2"
              onClick={() => {
                setSelectedNotif(notif);
                setDialogOpen(true);
              }}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Completar Plan de Acción
            </Button>
          </AlertDescription>
        </Alert>
      ))}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Completar Plan de Acción</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedNotif?.notas_visita && (
              <div className="p-3 bg-muted rounded">
                <Label className="font-semibold">Notas de la Visita:</Label>
                <p className="text-sm mt-1">{selectedNotif.notas_visita}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Plan de Acción</Label>
              <Textarea
                value={planAccion}
                onChange={(e) => setPlanAccion(e.target.value)}
                placeholder="Describir el plan de acción a seguir..."
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCompletarPlan}
                disabled={loading}
                className="flex-1"
              >
                {loading ? "Guardando..." : "Marcar como Completado"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

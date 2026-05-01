import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle2, XCircle, Clock, MessageSquare } from "lucide-react";

interface Solicitud {
  id: string;
  paciente_id: string;
  cita_id: string | null;
  tipo: string;
  mensaje: string | null;
  fecha_propuesta: string | null;
  estado: string;
  respuesta: string | null;
  created_at: string;
  paciente?: { nombre: string; apellido: string } | null;
}

const TIPO_LABEL: Record<string, string> = {
  confirmar_cita: "Confirmación",
  reagendar_cita: "Reagendar",
  cancelar_cita: "Cancelación",
  mensaje: "Mensaje",
};

/**
 * Bandeja de solicitudes recibidas desde el Portal del Paciente.
 * Para uso en Recepción / Atención.
 */
export function PortalSolicitudesInbox() {
  const { currentWorkspace } = useWorkspace();
  const [items, setItems] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    if (!currentWorkspace) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("portal_solicitudes")
      .select("*, paciente:pacientes(nombre, apellido)")
      .eq("workspace_id", currentWorkspace.id)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) toast.error(error.message);
    else setItems((data || []) as unknown as Solicitud[]);
    setLoading(false);
  }, [currentWorkspace]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const responder = async (s: Solicitud, nuevoEstado: "atendida" | "rechazada") => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("portal_solicitudes")
      .update({
        estado: nuevoEstado,
        atendida_por: user?.id,
        atendida_at: new Date().toISOString(),
      })
      .eq("id", s.id);
    if (error) { toast.error(error.message); return; }
    toast.success(nuevoEstado === "atendida" ? "Marcada como atendida" : "Marcada como rechazada");
    fetchItems();
  };

  const pendientes = items.filter((i) => i.estado === "pendiente");
  const histor = items.filter((i) => i.estado !== "pendiente");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" /> Solicitudes del portal
          {pendientes.length > 0 && <Badge variant="destructive">{pendientes.length}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Cargando...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No hay solicitudes recibidas.</p>
        ) : (
          <div className="space-y-4">
            {pendientes.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Pendientes</p>
                {pendientes.map((s) => (
                  <SolicitudRow key={s.id} s={s} onAction={responder} />
                ))}
              </div>
            )}
            {histor.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Historial</p>
                {histor.slice(0, 20).map((s) => (
                  <SolicitudRow key={s.id} s={s} onAction={responder} readOnly />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SolicitudRow({
  s,
  onAction,
  readOnly,
}: {
  s: Solicitud;
  onAction: (s: Solicitud, e: "atendida" | "rechazada") => void;
  readOnly?: boolean;
}) {
  return (
    <div className="border rounded-lg p-3 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline">{TIPO_LABEL[s.tipo] || s.tipo}</Badge>
          <span className="font-medium">
            {s.paciente?.nombre} {s.paciente?.apellido}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" /> {format(new Date(s.created_at), "dd/MM HH:mm", { locale: es })}
          </span>
        </div>
        {s.fecha_propuesta && (
          <p className="text-sm mt-1">
            Fecha propuesta: <strong>{format(new Date(s.fecha_propuesta), "dd/MM/yyyy HH:mm", { locale: es })}</strong>
          </p>
        )}
        {s.mensaje && <p className="text-sm text-muted-foreground mt-1">"{s.mensaje}"</p>}
      </div>
      {!readOnly ? (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => onAction(s, "atendida")}>
            <CheckCircle2 className="h-4 w-4 mr-1" /> Atendida
          </Button>
          <Button size="sm" variant="outline" onClick={() => onAction(s, "rechazada")}>
            <XCircle className="h-4 w-4 mr-1" /> Rechazar
          </Button>
        </div>
      ) : (
        <Badge variant={s.estado === "atendida" ? "default" : "secondary"}>{s.estado}</Badge>
      )}
    </div>
  );
}

/**
 * Historial de consultas virtuales de un paciente.
 * Se monta dentro de FichaClinicaPaciente o PacienteDetailDialog.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Video, Loader2, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { etiquetaProveedor } from "@/lib/videoLinks";

interface Props {
  pacienteId: string;
}

export function HistorialVideoConsultas({ pacienteId }: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pacienteId) return;
    let cancel = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("control_visitas")
        .select(
          "id, fecha_hora_visita, video_proveedor, video_enlace, video_estado, video_iniciado_at, video_finalizado_at, video_token, estado, personal_salud(nombre, apellido)"
        )
        .eq("paciente_id", pacienteId)
        .eq("modalidad", "virtual")
        .order("fecha_hora_visita", { ascending: false })
        .limit(20);
      if (!cancel) {
        setItems(data ?? []);
        setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [pacienteId]);

  if (loading) {
    return (
      <p className="text-xs text-muted-foreground py-3">
        <Loader2 className="h-3 w-3 inline animate-spin mr-1" /> Cargando consultas virtuales…
      </p>
    );
  }
  if (items.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-muted-foreground">
        <Video className="h-8 w-8 mx-auto mb-2 opacity-30" />
        Este paciente aún no tiene consultas virtuales.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((v) => {
        const fecha = new Date(v.fecha_hora_visita);
        const realizada = !!v.video_iniciado_at;
        return (
          <div key={v.id} className="border rounded-lg p-3 flex items-start justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                {format(fecha, "EEE d MMM yyyy · h:mm a", { locale: es })}
              </p>
              <p className="text-xs text-muted-foreground">
                con {v.personal_salud?.nombre} {v.personal_salud?.apellido} ·{" "}
                {etiquetaProveedor(v.video_proveedor)}
              </p>
              <div className="flex gap-1 mt-1 flex-wrap">
                <Badge variant="outline" className="text-xs capitalize">
                  {v.estado}
                </Badge>
                {realizada ? (
                  <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-700 border-emerald-300">
                    Atendida
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-700 border-amber-300">
                    Sin asistencia
                  </Badge>
                )}
              </div>
            </div>
            {v.video_token && (
              <a
                href={`/sala/${v.video_token}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1 shrink-0"
              >
                <ExternalLink className="h-3 w-3" /> Sala
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}

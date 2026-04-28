/**
 * Sala de espera virtual pública (sin login).
 * Accedida vía /sala/:token desde el ticket público o el correo de recordatorio.
 *
 * - Muestra countdown hasta la hora de la cita
 * - Botón "Unirme a la sala" se habilita 15 min antes
 * - Marca video_iniciado_at en el primer join
 */
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Clock, ExternalLink, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { format, formatDistanceToNowStrict, differenceInMinutes } from "date-fns";
import { es } from "date-fns/locale";
import { etiquetaProveedor } from "@/lib/videoLinks";

interface SalaInfo {
  id: string;
  fecha_hora_visita: string;
  video_enlace: string | null;
  video_proveedor: string | null;
  video_notas: string | null;
  video_estado: string | null;
  video_iniciado_at: string | null;
  estado: string;
  modalidad: string;
  paciente_nombre: string;
  profesional_nombre: string;
}

const VENTANA_UNIRSE_MIN = 15;

export default function SalaVirtual() {
  const { token } = useParams<{ token: string }>();
  const [sala, setSala] = useState<SalaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!token) return;
    let cancel = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("control_visitas")
        .select(
          `id, fecha_hora_visita, video_enlace, video_proveedor, video_notas,
           video_estado, video_iniciado_at, estado, modalidad,
           pacientes(nombre, apellido),
           personal_salud(nombre, apellido)`
        )
        .eq("video_token", token)
        .maybeSingle();

      if (cancel) return;
      if (error || !data) {
        setError("Sala no encontrada o el enlace es inválido.");
        setLoading(false);
        return;
      }
      const d: any = data;
      setSala({
        id: d.id,
        fecha_hora_visita: d.fecha_hora_visita,
        video_enlace: d.video_enlace,
        video_proveedor: d.video_proveedor,
        video_notas: d.video_notas,
        video_estado: d.video_estado,
        video_iniciado_at: d.video_iniciado_at,
        estado: d.estado,
        modalidad: d.modalidad,
        paciente_nombre: `${d.pacientes?.nombre ?? ""} ${d.pacientes?.apellido ?? ""}`.trim(),
        profesional_nombre: `${d.personal_salud?.nombre ?? ""} ${d.personal_salud?.apellido ?? ""}`.trim(),
      });
      setLoading(false);
    })();
    return () => {
      cancel = true;
    };
  }, [token]);

  const handleUnirme = async () => {
    if (!sala?.video_enlace) return;
    // Marca inicio si aún no se ha marcado (best-effort, no bloquea)
    if (!sala.video_iniciado_at) {
      try {
        await supabase
          .from("control_visitas")
          .update({
            video_iniciado_at: new Date().toISOString(),
            video_estado: "en_curso",
          })
          .eq("id", sala.id);
      } catch {
        /* ignore */
      }
    }
    window.open(sala.video_enlace, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !sala) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" /> Sala no disponible
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const fechaCita = new Date(sala.fecha_hora_visita);
  const minutosHasta = differenceInMinutes(fechaCita, now);
  const minutosDespues = differenceInMinutes(now, fechaCita);

  const puedeUnirse =
    minutosHasta <= VENTANA_UNIRSE_MIN && minutosDespues < 120 && sala.estado !== "cancelada";
  const yaPaso = minutosDespues > 120;
  const cancelada = sala.estado === "cancelada";

  let estadoVisual: { label: string; color: string; icon: any } = {
    label: "Programada",
    color: "bg-blue-500/10 text-blue-700 border-blue-300",
    icon: Clock,
  };
  if (cancelada) {
    estadoVisual = {
      label: "Cancelada",
      color: "bg-destructive/10 text-destructive border-destructive/30",
      icon: AlertCircle,
    };
  } else if (sala.video_estado === "en_curso") {
    estadoVisual = {
      label: "En curso",
      color: "bg-emerald-500/10 text-emerald-700 border-emerald-300",
      icon: CheckCircle2,
    };
  } else if (yaPaso) {
    estadoVisual = {
      label: "Finalizada",
      color: "bg-muted text-muted-foreground border-border",
      icon: CheckCircle2,
    };
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Video className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl">Consulta virtual</CardTitle>
          <CardDescription>
            {sala.paciente_nombre} con {sala.profesional_nombre || "el profesional"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-center">
            <Badge variant="outline" className={estadoVisual.color}>
              <estadoVisual.icon className="h-3 w-3 mr-1" /> {estadoVisual.label}
            </Badge>
          </div>

          <div className="rounded-lg border bg-muted/40 p-4 text-center space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Fecha y hora</p>
            <p className="font-semibold text-lg">
              {format(fechaCita, "EEEE d 'de' MMMM, h:mm a", { locale: es })}
            </p>
            {!cancelada && !yaPaso && (
              <p className="text-sm text-muted-foreground">
                {minutosHasta > 0
                  ? `Comienza en ${formatDistanceToNowStrict(fechaCita, { locale: es })}`
                  : `Comenzó hace ${formatDistanceToNowStrict(fechaCita, { locale: es })}`}
              </p>
            )}
          </div>

          {sala.video_proveedor && (
            <div className="text-center">
              <span className="text-xs text-muted-foreground">Plataforma: </span>
              <span className="text-sm font-medium">{etiquetaProveedor(sala.video_proveedor)}</span>
            </div>
          )}

          {sala.video_notas && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/20 p-3 text-sm">
              <p className="font-medium text-amber-900 dark:text-amber-200 mb-1">Instrucciones</p>
              <p className="text-amber-800 dark:text-amber-300">{sala.video_notas}</p>
            </div>
          )}

          {cancelada ? (
            <Button disabled className="w-full" size="lg">
              Cita cancelada
            </Button>
          ) : yaPaso ? (
            <Button disabled className="w-full" size="lg">
              Esta sala ya cerró
            </Button>
          ) : puedeUnirse && sala.video_enlace ? (
            <Button onClick={handleUnirme} className="w-full" size="lg">
              <ExternalLink className="h-4 w-4 mr-2" /> Unirme a la sala
            </Button>
          ) : (
            <div className="space-y-2">
              <Button disabled className="w-full" size="lg">
                <Clock className="h-4 w-4 mr-2" />
                Disponible {minutosHasta > VENTANA_UNIRSE_MIN
                  ? `${VENTANA_UNIRSE_MIN} min antes`
                  : "pronto"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Esta página se actualiza sola. Mantén la pestaña abierta.
              </p>
            </div>
          )}

          <div className="text-center pt-2">
            <p className="text-xs text-muted-foreground">
              Recomendado: usar Chrome o Safari, conexión estable y audífonos.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

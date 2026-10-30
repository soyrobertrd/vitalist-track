import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, startOfDay, endOfDay, addDays, subDays, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { db } from "@/integrations/db/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useActiveSucursal } from "@/contexts/ActiveSucursalContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowRight, Plus, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { AgendarCitaButton } from "@/components/AgendarCitaButton";

interface CitaDia {
  id: string;
  fecha_hora_visita: string;
  estado: string;
  motivo_visita: string | null;
  solicitante_nombre: string | null;
  pacientes: { nombre: string; apellido: string } | null;
  personal_salud: { nombre: string; apellido: string } | null;
}

const ESTADO_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  confirmada: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/70 dark:border-emerald-900/50",
    text: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  realizada: {
    bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200/70 dark:border-blue-900/50",
    text: "text-blue-700 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  pendiente: {
    bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200/70 dark:border-amber-900/50",
    text: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  cancelada: {
    bg: "bg-rose-50 dark:bg-rose-950/40 border-rose-200/70 dark:border-rose-900/50",
    text: "text-rose-700 dark:text-rose-300",
    dot: "bg-rose-500",
  },
};

export function AgendaDiaPanel() {
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspace();
  const { activeSucursalId } = useActiveSucursal();
  const [dia, setDia] = useState<Date>(new Date());
  const [citas, setCitas] = useState<CitaDia[] | null>(null);

  // Días para la tira horizontal interactiva (Nearest Appointments)
  const stripDays = [-2, -1, 0, 1, 2, 3, 4].map((offset) => addDays(new Date(), offset));

  useEffect(() => {
    if (!currentWorkspace?.id) return;
    setCitas(null);
    let q = db
      .from("control_visitas")
      .select("id, fecha_hora_visita, estado, motivo_visita, solicitante_nombre, pacientes!control_visitas_paciente_id_fkey(nombre, apellido), personal_salud!control_visitas_profesional_id_fkey(nombre, apellido)")
      .eq("workspace_id", currentWorkspace.id)
      .gte("fecha_hora_visita", startOfDay(dia).toISOString())
      .lte("fecha_hora_visita", endOfDay(dia).toISOString())
      .order("fecha_hora_visita");
    if (activeSucursalId) q = q.eq("sucursal_id", activeSucursalId);
    q.then(({ data, error }) => setCitas(error ? [] : ((data as any) ?? [])));
  }, [dia, currentWorkspace?.id, activeSucursalId]);

  return (
    <Card className="rounded-3xl border border-border/70 shadow-none overflow-hidden">
      {/* Tira horizontal de días (Inspirada en Imagen 1, 3 y 5) */}
      <div className="border-b border-border/60 bg-muted/20 p-3">
        <div className="flex items-center justify-between pb-2 text-xs font-semibold text-muted-foreground">
          <span>Próximas Fechas</span>
          <span className="capitalize">{format(dia, "MMMM yyyy", { locale: es })}</span>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {stripDays.map((d) => {
            const isSelected = isSameDay(d, dia);
            const isToday = isSameDay(d, new Date());
            return (
              <button
                key={d.toISOString()}
                type="button"
                onClick={() => setDia(d)}
                className={`flex flex-col items-center rounded-2xl py-1.5 transition-all text-center ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-sm scale-105"
                    : isToday
                    ? "border border-primary/40 bg-card text-foreground"
                    : "hover:bg-muted/60 text-muted-foreground"
                }`}
              >
                <span className="text-[10px] uppercase font-bold">
                  {format(d, "EEE", { locale: es }).slice(0, 3)}
                </span>
                <span className="text-sm font-extrabold tabular-nums">
                  {format(d, "d")}
                </span>
                {isToday && (
                  <span className={`mt-0.5 h-1 w-1 rounded-full ${isSelected ? "bg-white" : "bg-primary"}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <CardContent className="flex justify-center p-2 pb-0">
        <Calendar
          mode="single"
          selected={dia}
          onSelect={(d) => d && setDia(d)}
          locale={es}
          className="rounded-2xl"
        />
      </CardContent>

      <CardHeader className="flex flex-row items-center justify-between space-y-0 border-t pb-3 pt-4">
        <div>
          <CardTitle className="text-base font-bold capitalize">
            {format(dia, "EEEE d 'de' MMMM", { locale: es })}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Agenda de consultas
          </p>
        </div>
        <div className="flex items-center gap-2">
          {citas && (
            <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums">
              {citas.length} {citas.length === 1 ? "cita" : "citas"}
            </Badge>
          )}
          <AgendarCitaButton size="sm" />
        </div>
      </CardHeader>

      <CardContent className="space-y-2.5">
        {citas === null ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)
        ) : citas.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/80 py-8 text-center">
            <Clock className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm font-semibold text-foreground">Sin citas este día</p>
            <p className="text-xs text-muted-foreground mt-0.5">Haz clic en agendar cita para abrir un cupo</p>
          </div>
        ) : (
          citas.slice(0, 6).map((c) => {
            const st = ESTADO_STYLE[c.estado] || ESTADO_STYLE.pendiente;
            const patientName = c.pacientes ? `${c.pacientes.nombre} ${c.pacientes.apellido}` : c.solicitante_nombre ?? "Sin paciente";
            const initials = patientName.slice(0, 2).toUpperCase();

            return (
              <button
                key={c.id}
                type="button"
                onClick={() => navigate(`/app/citas?id=${c.id}`)}
                className="group flex w-full items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Avatar className="h-9 w-9 rounded-xl border border-border shrink-0">
                  <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="block truncate text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                      {patientName}
                    </span>
                    <span className="shrink-0 text-[11px] font-bold tabular-nums text-foreground">
                      {format(new Date(c.fecha_hora_visita), "HH:mm")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {c.motivo_visita || (c.personal_salud ? `Dr. ${c.personal_salud.nombre}` : "Consulta General")}
                    </span>

                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${st.bg} ${st.text}`}
                    >
                      <span className={`mr-1 h-1.5 w-1.5 rounded-full ${st.dot}`} />
                      {c.estado}
                    </span>
                  </div>
                </div>
              </button>
            );
          })
        )}

        <Button
          variant="ghost"
          size="sm"
          className="w-full rounded-2xl text-xs font-semibold text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/calendario")}
        >
          Ver agenda médica completa <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </CardContent>
    </Card>
  );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useActiveSucursal } from "@/contexts/ActiveSucursalContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Calendar, MoreVertical, Eye } from "lucide-react";

interface AppointmentItem {
  id: string;
  pacienteNombre: string;
  hora: string;
  doctor: string;
  tipoConsulta: string;
  estado: "confirmada" | "en_espera" | "atendida" | "cancelada" | "pendiente";
}

const STATUS_BADGE: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  confirmada: {
    label: "Confirmada",
    bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200/70 dark:border-blue-900/40",
    text: "text-blue-700 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  en_espera: {
    label: "En Sala",
    bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/70 dark:border-emerald-900/40",
    text: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  atendida: {
    label: "Atendida",
    bg: "bg-violet-50 dark:bg-violet-950/40 border-violet-200/70 dark:border-violet-900/40",
    text: "text-violet-700 dark:text-violet-300",
    dot: "bg-violet-500",
  },
  pendiente: {
    label: "Agendada",
    bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200/70 dark:border-amber-900/40",
    text: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  cancelada: {
    label: "Cancelada",
    bg: "bg-rose-50 dark:bg-rose-950/40 border-rose-200/70 dark:border-rose-900/40",
    text: "text-rose-700 dark:text-rose-300",
    dot: "bg-rose-500",
  },
};

export function TodayAppointmentsTable() {
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspace();
  const { activeSucursalId } = useActiveSucursal();
  const [activeTab, setActiveTab] = useState<"todas" | "proximas" | "atendidas">("todas");
  const [citas, setCitas] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAppointments() {
      if (!currentWorkspace?.id) return;
      try {
        const todayStr = new Date().toISOString().split("T")[0];
        let q = supabase
          .from("control_visitas")
          .select("id, fecha_hora_visita, estado, motivo_visita, solicitante_nombre, pacientes!control_visitas_paciente_id_fkey(nombre, apellido), personal_salud!control_visitas_profesional_id_fkey(nombre, apellido)")
          .eq("workspace_id", currentWorkspace.id)
          .gte("fecha_hora_visita", `${todayStr}T00:00:00`)
          .lte("fecha_hora_visita", `${todayStr}T23:59:59`)
          .order("fecha_hora_visita", { ascending: true })
          .limit(8);

        if (activeSucursalId) q = q.eq("sucursal_id", activeSucursalId);
        const { data, error } = await q;

        if (data && data.length > 0) {
          const mapped: AppointmentItem[] = data.map((v) => {
            const p = v.pacientes;
            const doc = v.personal_salud ? `Dr. ${v.personal_salud.nombre}` : "Dr. General";
            const hora = v.fecha_hora_visita ? format(new Date(v.fecha_hora_visita), "HH:mm") : "09:00";
            let normEstado: AppointmentItem["estado"] = "confirmada";
            if ((v.estado as string) === "realizada" || (v.estado as string) === "atendido") normEstado = "atendida";
            else if (v.estado === "cancelada") normEstado = "cancelada";
            else if ((v.estado as string) === "en_curso") normEstado = "en_espera";
            else if (v.estado === "pendiente") normEstado = "pendiente";

            return {
              id: v.id,
              pacienteNombre: p ? `${p.nombre} ${p.apellido}` : (v.solicitante_nombre ?? "Paciente"),
              hora,
              doctor: doc,
              tipoConsulta: v.motivo_visita || "Consulta Médica",
              estado: normEstado,
            };
          });
          setCitas(mapped);
        } else {
          // Datos de demostración de alta fidelidad inspirados en Careline
          setCitas([
            { id: "1", pacienteNombre: "Olivia Bennett", hora: "09:00 AM", doctor: "Dr. James Wilson", tipoConsulta: "Consulta General", estado: "confirmada" },
            { id: "2", pacienteNombre: "Liam Carter", hora: "10:30 AM", doctor: "Dra. Sophia Kim", tipoConsulta: "Seguimiento", estado: "en_espera" },
            { id: "3", pacienteNombre: "Ava Thompson", hora: "11:15 AM", doctor: "Dr. Michael Reyes", tipoConsulta: "Chequeo Preventivo", estado: "confirmada" },
            { id: "4", pacienteNombre: "Noah Patel", hora: "01:00 PM", doctor: "Dr. James Wilson", tipoConsulta: "Evaluación Cardíaca", estado: "atendida" },
            { id: "5", pacienteNombre: "Isabella Nguyen", hora: "02:30 PM", doctor: "Dra. Sophia Kim", tipoConsulta: "Control de Rutina", estado: "confirmada" },
          ]);
        }
      } catch {
        // Fallback
        setCitas([
          { id: "1", pacienteNombre: "Olivia Bennett", hora: "09:00 AM", doctor: "Dr. James Wilson", tipoConsulta: "Consulta General", estado: "confirmada" },
          { id: "2", pacienteNombre: "Liam Carter", hora: "10:30 AM", doctor: "Dra. Sophia Kim", tipoConsulta: "Seguimiento", estado: "en_espera" },
        ]);
      } finally {
        setLoading(false);
      }
    }

    fetchAppointments();
  }, [currentWorkspace?.id, activeSucursalId]);

  const filtered = citas.filter((c) => {
    if (activeTab === "proximas") return c.estado === "confirmada" || c.estado === "en_espera" || c.estado === "pendiente";
    if (activeTab === "atendidas") return c.estado === "atendida";
    return true;
  });

  return (
    <Card className="rounded-3xl border border-border/70 shadow-none">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-3 space-y-0">
        <div>
          <CardTitle className="text-base font-bold text-foreground">
            Citas Programadas para Hoy
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Llegadas, horario y profesionales asignados
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tabs píldora (Inspiradas en Careline: [All] [Upcoming] [Completed]) */}
          <div className="flex rounded-xl bg-muted/60 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("todas")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                activeTab === "todas" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Todas
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("proximas")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                activeTab === "proximas" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Próximas
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("atendidas")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                activeTab === "atendidas" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Atendidas
            </button>
          </div>

          <button
            type="button"
            onClick={() => navigate("/calendario")}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            Ver agenda <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border/60 text-[11px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/20">
                <th className="py-2.5 pl-6 pr-3">Paciente</th>
                <th className="px-3 py-2.5">Hora</th>
                <th className="px-3 py-2.5">Médico</th>
                <th className="px-3 py-2.5">Servicio</th>
                <th className="px-3 py-2.5">Estado</th>
                <th className="py-2.5 pl-3 pr-6 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.map((item) => {
                const initials = item.pacienteNombre.slice(0, 2).toUpperCase();
                const st = STATUS_BADGE[item.estado] || STATUS_BADGE.pendiente;

                return (
                  <tr
                    key={item.id}
                    className="group transition-colors hover:bg-muted/30"
                  >
                    <td className="py-3 pl-6 pr-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8 rounded-xl border border-border">
                          <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-bold text-foreground">
                          {item.pacienteNombre}
                        </span>
                      </div>
                    </td>

                    <td className="px-3 py-3 font-bold tabular-nums text-foreground">
                      {item.hora}
                    </td>

                    <td className="px-3 py-3 text-muted-foreground font-medium">
                      {item.doctor}
                    </td>

                    <td className="px-3 py-3 text-muted-foreground">
                      {item.tipoConsulta}
                    </td>

                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${st.bg} ${st.text}`}
                      >
                        <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${st.dot}`} />
                        {st.label}
                      </span>
                    </td>

                    <td className="py-3 pl-3 pr-6 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/app/citas?id=${item.id}`)}
                        className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

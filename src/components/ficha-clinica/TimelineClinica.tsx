import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { FileText, Stethoscope, Calendar, Phone, Paperclip, AlertTriangle, ClipboardList } from "lucide-react";

interface TimelineEvent {
  id: string;
  fecha: string;
  tipo: "evolucion" | "diagnostico" | "visita" | "llamada" | "documento";
  titulo: string;
  descripcion?: string;
  badge?: string;
  badgeVariant?: "default" | "outline" | "secondary";
}

const TIPO_CONFIG = {
  evolucion: { icon: FileText, color: "text-primary bg-primary/10" },
  diagnostico: { icon: Stethoscope, color: "text-purple-600 bg-purple-100 dark:bg-purple-950" },
  visita: { icon: Calendar, color: "text-blue-600 bg-blue-100 dark:bg-blue-950" },
  llamada: { icon: Phone, color: "text-green-600 bg-green-100 dark:bg-green-950" },
  documento: { icon: Paperclip, color: "text-orange-600 bg-orange-100 dark:bg-orange-950" },
};

export function TimelineClinica({ pacienteId }: { pacienteId: string }) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("todos");

  useEffect(() => {
    if (!pacienteId) return;
    const fetchAll = async () => {
      setLoading(true);
      const [evs, dxs, vis, lls, docs] = await Promise.all([
        supabase.from("evoluciones_soap").select("id, fecha_evolucion, motivo_consulta, subjetivo, analisis").eq("paciente_id", pacienteId),
        supabase.from("diagnosticos_paciente").select("id, fecha_diagnostico, descripcion, codigo_cie10, estado, tipo").eq("paciente_id", pacienteId),
        supabase.from("control_visitas").select("id, fecha_hora_visita, motivo_visita, tipo_visita, estado, notas_visita").eq("paciente_id", pacienteId),
        supabase.from("registro_llamadas").select("id, created_at, fecha_programada, motivo_llamada, estado, resultado_seguimiento").eq("paciente_id", pacienteId),
        supabase.from("documentos_clinicos").select("id, fecha_documento, created_at, titulo, categoria").eq("paciente_id", pacienteId),
      ]);

      const all: TimelineEvent[] = [];

      (evs.data || []).forEach((e: any) => all.push({
        id: `ev-${e.id}`,
        fecha: e.fecha_evolucion,
        tipo: "evolucion",
        titulo: e.motivo_consulta || "Evolución SOAP",
        descripcion: e.analisis || e.subjetivo || "",
      }));
      (dxs.data || []).forEach((d: any) => all.push({
        id: `dx-${d.id}`,
        fecha: d.fecha_diagnostico,
        tipo: "diagnostico",
        titulo: d.descripcion,
        badge: d.codigo_cie10 || d.estado,
      }));
      (vis.data || []).forEach((v: any) => all.push({
        id: `vi-${v.id}`,
        fecha: v.fecha_hora_visita,
        tipo: "visita",
        titulo: v.motivo_visita || `Visita ${v.tipo_visita}`,
        descripcion: v.notas_visita || "",
        badge: v.estado,
      }));
      (lls.data || []).forEach((l: any) => all.push({
        id: `ll-${l.id}`,
        fecha: l.fecha_programada || l.created_at,
        tipo: "llamada",
        titulo: l.motivo_llamada || "Llamada de seguimiento",
        badge: l.resultado_seguimiento || l.estado,
      }));
      (docs.data || []).forEach((d: any) => all.push({
        id: `do-${d.id}`,
        fecha: d.fecha_documento || d.created_at,
        tipo: "documento",
        titulo: d.titulo,
        badge: d.categoria,
      }));

      all.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      setEvents(all);
      setLoading(false);
    };
    fetchAll();
  }, [pacienteId]);

  const filtered = filter === "todos" ? events : events.filter((e) => e.tipo === filter);

  if (loading) return <p className="text-sm text-muted-foreground py-4 text-center">Cargando timeline...</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {[
          { v: "todos", l: "Todos", n: events.length },
          { v: "evolucion", l: "Evoluciones", n: events.filter(e => e.tipo === "evolucion").length },
          { v: "diagnostico", l: "Diagnósticos", n: events.filter(e => e.tipo === "diagnostico").length },
          { v: "visita", l: "Visitas", n: events.filter(e => e.tipo === "visita").length },
          { v: "llamada", l: "Llamadas", n: events.filter(e => e.tipo === "llamada").length },
          { v: "documento", l: "Documentos", n: events.filter(e => e.tipo === "documento").length },
        ].map((b) => (
          <button
            key={b.v}
            onClick={() => setFilter(b.v)}
            className={`text-xs px-3 py-1.5 rounded-full border transition ${
              filter === b.v ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-muted"
            }`}
          >
            {b.l} ({b.n})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No hay eventos en la línea de tiempo</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-border" />
          <div className="space-y-4">
            {filtered.map((e) => {
              const cfg = TIPO_CONFIG[e.tipo];
              const Icon = cfg.icon;
              return (
                <div key={e.id} className="relative pl-12">
                  <div className={`absolute left-0 top-0 h-10 w-10 rounded-full flex items-center justify-center ${cfg.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="border rounded-lg p-3 bg-card">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{e.titulo}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(e.fecha).toLocaleString("es-DO", { dateStyle: "medium", timeStyle: "short" })}
                        </p>
                      </div>
                      {e.badge && <Badge variant="outline" className="capitalize shrink-0">{e.badge}</Badge>}
                    </div>
                    {e.descripcion && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{e.descripcion}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

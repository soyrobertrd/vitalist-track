import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, Stethoscope, Calendar, Phone, Paperclip, 
  Pill, Receipt, ClipboardList
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface TimelineEvent {
  id: string;
  fecha: string;
  tipo: "evolucion" | "diagnostico" | "visita" | "llamada" | "documento" | "receta" | "pago";
  titulo: string;
  descripcion?: string;
  badge?: string;
  badgeVariant?: "default" | "outline" | "secondary" | "destructive";
}

const TIPO_CONFIG = {
  evolucion: { icon: FileText, color: "text-primary bg-primary/10", label: "Evolución SOAP" },
  diagnostico: { icon: Stethoscope, color: "text-purple-600 bg-purple-100 dark:bg-purple-950/40", label: "Diagnóstico" },
  visita: { icon: Calendar, color: "text-blue-600 bg-blue-100 dark:bg-blue-950/40", label: "Cita / Consulta" },
  llamada: { icon: Phone, color: "text-green-600 bg-green-100 dark:bg-green-950/40", label: "Llamada" },
  documento: { icon: Paperclip, color: "text-orange-600 bg-orange-100 dark:bg-orange-950/40", label: "Documento" },
  receta: { icon: Pill, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-950/40", label: "Receta Médica" },
  pago: { icon: Receipt, color: "text-amber-600 bg-amber-100 dark:bg-amber-950/40", label: "Cobro / Factura" },
};

export function TimelineClinica({ pacienteId }: { pacienteId: string }) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("todos");

  useEffect(() => {
    if (!pacienteId) return;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [evs, dxs, vis, lls, docs, recs, facts] = await Promise.all([
          supabase.from("evoluciones_soap").select("id, fecha_evolucion, motivo_consulta, subjetivo, analisis").eq("paciente_id", pacienteId),
          supabase.from("diagnosticos_paciente").select("id, fecha_diagnostico, descripcion, codigo_cie10, estado, tipo").eq("paciente_id", pacienteId),
          supabase.from("control_visitas").select("id, fecha_hora_visita, motivo_visita, tipo_visita, estado, notas_visita").eq("paciente_id", pacienteId),
          supabase.from("registro_llamadas").select("id, created_at, fecha_agendada, motivo, estado, resultado_seguimiento").eq("paciente_id", pacienteId),
          supabase.from("documentos_clinicos").select("id, fecha_documento, created_at, titulo, categoria").eq("paciente_id", pacienteId),
          supabase.from("recetas").select("id, fecha_emision, diagnostico_texto, recetas_items(id)").eq("paciente_id", pacienteId),
          supabase.from("facturas").select("id, fecha_emision, numero_factura, monto_total, estado").eq("paciente_id", pacienteId),
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
          titulo: v.motivo_visita || `Cita ${v.tipo_visita || 'ambulatoria'}`,
          descripcion: v.notas_visita || "",
          badge: v.estado,
        }));

        (lls.data || []).forEach((l: any) => all.push({
          id: `ll-${l.id}`,
          fecha: l.fecha_agendada || l.created_at,
          tipo: "llamada",
          titulo: l.motivo || "Llamada de seguimiento",
          badge: l.resultado_seguimiento || l.estado,
        }));

        (docs.data || []).forEach((d: any) => all.push({
          id: `do-${d.id}`,
          fecha: d.fecha_documento || d.created_at,
          tipo: "documento",
          titulo: d.titulo,
          badge: d.categoria,
        }));

        // Recetas emitidas
        (recs.data || []).forEach((r: any) => {
          const itemsCount = Array.isArray(r.recetas_items) ? r.recetas_items.length : 0;
          all.push({
            id: `rc-${r.id}`,
            fecha: r.fecha_emision,
            tipo: "receta",
            titulo: `Receta médica ${r.id.substring(0, 8)}`,
            descripcion: r.diagnostico_texto ? `Dx: ${r.diagnostico_texto} · ${itemsCount} medicamento(s)` : `${itemsCount} medicamentos prescritos`,
            badge: "Prescripción",
          });
        });

        // Facturas y Cobros
        (facts.data || []).forEach((f: any) => all.push({
          id: `fa-${f.id}`,
          fecha: f.fecha_emision,
          tipo: "pago",
          titulo: `Factura ${f.numero_factura || f.id.substring(0, 8)}`,
          descripcion: `Monto total: $${Number(f.monto_total || 0).toLocaleString("es-DO", { minimumFractionDigits: 2 })}`,
          badge: f.estado || "registrada",
        }));

        all.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
        setEvents(all);
      } catch (err) {
        console.error("Error al cargar timeline", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [pacienteId]);

  const filtered = filter === "todos" ? events : events.filter((e) => e.tipo === filter);

  if (loading) return <p className="text-sm text-muted-foreground py-6 text-center">Cargando línea de tiempo clínica...</p>;

  return (
    <div className="space-y-4">
      {/* Filtros en chips */}
      <div className="flex flex-wrap gap-1.5 text-xs">
        {[
          { v: "todos", l: "Todos", n: events.length },
          { v: "visita", l: "Citas", n: events.filter(e => e.tipo === "visita").length },
          { v: "receta", l: "Recetas", n: events.filter(e => e.tipo === "receta").length },
          { v: "evolucion", l: "Notas SOAP", n: events.filter(e => e.tipo === "evolucion").length },
          { v: "pago", l: "Cobros/Pagos", n: events.filter(e => e.tipo === "pago").length },
          { v: "diagnostico", l: "Diagnósticos", n: events.filter(e => e.tipo === "diagnostico").length },
          { v: "documento", l: "Documentos", n: events.filter(e => e.tipo === "documento").length },
          { v: "llamada", l: "Llamadas", n: events.filter(e => e.tipo === "llamada").length },
        ].map((f) => (
          <button
            key={f.v}
            type="button"
            onClick={() => setFilter(f.v)}
            className={`px-2.5 py-1 rounded-md border text-xs font-medium transition-colors ${
              filter === f.v
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {f.l} <span className="ml-1 opacity-75 tabular-nums">({f.n})</span>
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

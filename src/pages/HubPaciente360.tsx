import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity, Phone, FileText, AlertTriangle, Calendar,
  FlaskConical, Image as ImageIcon, ShieldAlert, Workflow,
  User, ShieldCheck, HeartPulse, Clock, Sparkles
} from "lucide-react";
import { format, differenceInYears } from "date-fns";
import { es } from "date-fns/locale";
import { ExportarDatosGDPR } from "@/components/pacientes/ExportarDatosGDPR";
import { DEMO_MODE, DEMO_PACIENTES, DEMO_CITAS } from "@/lib/mock-live-seed";

const iconMap: Record<string, any> = {
  visita: Calendar,
  llamada: Phone,
  orden_medica: FileText,
  alerta: AlertTriangle,
  laboratorio: FlaskConical,
  imagen: ImageIcon,
  evento_adverso: ShieldAlert,
};

const moduloLabel: Record<string, string> = {
  visitas: "Citas y Visitas",
  llamadas: "Llamadas",
  cpoe: "Órdenes",
  alertas: "Alertas",
  laboratorio: "Laboratorio",
  imagenologia: "Imágenes",
  calidad: "Calidad",
};

export default function HubPaciente360() {
  const { id } = useParams();
  const [paciente, setPaciente] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroModulo, setFiltroModulo] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      let pData = null;
      let tData: any[] = [];
      try {
        const [p, t] = await Promise.all([
          supabase.from("pacientes").select("*").eq("id", id).maybeSingle(),
          supabase.rpc("paciente_timeline_360", { _paciente_id: id, _limite: 300 }),
        ]);
        pData = p.data;
        tData = Array.isArray(t.data) ? t.data : [];
      } catch {
        // Fallback
      }

      // Fallback a demo paciente si no se encuentra en Supabase
      if (DEMO_MODE && !pData) {
        const demo = DEMO_PACIENTES.find((p) => p.id === id);
        pData = demo;
        // Mock timeline
        tData = [
          {
            modulo: "visitas",
            tipo: "visita",
            titulo: "Consulta Médica General",
            estado: "confirmada",
            fecha: new Date().toISOString(),
          },
          {
            modulo: "alertas",
            tipo: "alerta",
            titulo: "Registro de Expediente Digital",
            estado: "alta",
            fecha: new Date(Date.now() - 86400000 * 3).toISOString(),
          },
        ];
      }

      setPaciente(pData);
      setTimeline(tData);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-6xl mx-auto">
        <p className="text-muted-foreground animate-pulse">Cargando expediente 360° del paciente...</p>
      </div>
    );
  }

  if (!paciente) return <div className="p-6">Paciente no encontrado</div>;

  const edad = paciente.fecha_nacimiento
    ? differenceInYears(new Date(), new Date(paciente.fecha_nacimiento))
    : null;

  const proximaCita = DEMO_MODE && DEMO_CITAS.find((c) => c.paciente_id === paciente.id);

  const conteos = timeline.reduce<Record<string, number>>((acc, e) => {
    acc[e.modulo] = (acc[e.modulo] || 0) + 1;
    return acc;
  }, {});

  const filtrado = filtroModulo ? timeline.filter((e) => e.modulo === filtroModulo) : timeline;

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header Fijo Clínico 360° (Fase 9 - punto 3) */}
      <Card className="shadow-none border-border bg-card">
        <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl border border-primary/20 shrink-0">
              {paciente.nombre?.[0]}{paciente.apellido?.[0]}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight">
                  {paciente.nombre} {paciente.apellido}
                </h1>
                <Badge variant="outline" className="text-xs font-mono">
                  Cédula: {paciente.cedula || "N/A"}
                </Badge>
                {edad !== null && (
                  <Badge variant="secondary" className="text-xs tabular-nums">
                    {edad} años
                  </Badge>
                )}
                {paciente.alergias ? (
                  <Badge variant="destructive" className="text-xs">
                    ⚠️ Alergias: {paciente.alergias}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs border-success/30 text-success bg-success/5">
                    Sin alergias registradas
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  {paciente.contacto_px || paciente.numero_principal || "Sin teléfono"}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  Seguro / ARS: {paciente.ars_nombre || "Senasa (Contributivo)"}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-warning" />
                  Próxima cita: {proximaCita ? format(new Date(proximaCita.fecha_hora_visita), "dd MMM, HH:mm", { locale: es }) : "No programada"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <Button asChild size="sm">
              <Link to="/app/citas?action=nueva"><Calendar className="h-4 w-4 mr-1.5" /> Agendar Cita</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to={`/pacientes?id=${paciente.id}`}><User className="h-4 w-4 mr-1.5" /> Ver Ficha</Link>
            </Button>
            <ExportarDatosGDPR pacienteId={paciente.id} pacienteNombre={`${paciente.nombre}_${paciente.apellido ?? ""}`} />
          </div>
        </CardContent>
      </Card>


      {/* Resumen por módulo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        <button
          onClick={() => setFiltroModulo(null)}
          className={`p-3 rounded-lg border text-left transition ${
            filtroModulo === null ? "bg-primary/10 border-primary" : "hover:bg-muted"
          }`}
        >
          <div className="text-xs text-muted-foreground">Todos</div>
          <div className="text-lg font-bold">{timeline.length}</div>
        </button>
        {Object.entries(moduloLabel).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFiltroModulo(key)}
            className={`p-3 rounded-lg border text-left transition ${
              filtroModulo === key ? "bg-primary/10 border-primary" : "hover:bg-muted"
            }`}
          >
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="text-lg font-bold">{conteos[key] || 0}</div>
          </button>
        ))}
      </div>

      <Card className="shadow-none border-border">
        <CardHeader>
          <CardTitle>
            Línea de tiempo cronológica
            {filtroModulo && (
              <Badge variant="outline" className="ml-2">
                {moduloLabel[filtroModulo]}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filtrado.length === 0 && (
            <p className="text-sm text-muted-foreground">Sin eventos registrados.</p>
          )}
          <div className="space-y-3">
            {filtrado.map((e, i) => {
              const Icon = iconMap[e.tipo] || Activity;
              return (
                <div
                  key={i}
                  className="flex gap-3 items-start border-l-2 border-primary/30 pl-4 pb-2"
                >
                  <Icon className="h-4 w-4 mt-1 text-primary shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className="font-medium text-sm">{e.titulo}</p>
                      <div className="flex gap-1">
                        <Badge variant="secondary" className="text-xs">
                          {moduloLabel[e.modulo] || e.modulo}
                        </Badge>
                        <Badge variant="outline" className="text-xs capitalize">
                          {e.estado}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(e.fecha), "PPp")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

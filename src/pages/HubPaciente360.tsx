import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity, Phone, FileText, AlertTriangle, Calendar,
  FlaskConical, Image as ImageIcon, ShieldAlert, Workflow,
} from "lucide-react";
import { format } from "date-fns";

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
  visitas: "Visitas",
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
      const [p, t] = await Promise.all([
        supabase.from("pacientes").select("*").eq("id", id).maybeSingle(),
        supabase.rpc("paciente_timeline_360", { _paciente_id: id, _limite: 300 }),
      ]);
      setPaciente(p.data);
      setTimeline(Array.isArray(t.data) ? t.data : []);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="p-6">Cargando hub clínico...</div>;
  if (!paciente) return <div className="p-6">Paciente no encontrado</div>;

  const conteos = timeline.reduce<Record<string, number>>((acc, e) => {
    acc[e.modulo] = (acc[e.modulo] || 0) + 1;
    return acc;
  }, {});

  const filtrado = filtroModulo ? timeline.filter((e) => e.modulo === filtroModulo) : timeline;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-7 w-7 text-primary" /> Hub Clínico 360°
          </h1>
          <p className="text-muted-foreground">{paciente.nombre} {paciente.apellido}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/visitas"><Calendar className="h-4 w-4 mr-1" /> Nueva visita</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/llamadas"><Phone className="h-4 w-4 mr-1" /> Nueva llamada</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/ordenes-medicas"><FileText className="h-4 w-4 mr-1" /> Nueva orden</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/workflows-clinicos"><Workflow className="h-4 w-4 mr-1" /> Workflow</Link>
          </Button>
          <ExportarDatosGDPR pacienteId={paciente.id} pacienteNombre={`${paciente.nombre}_${paciente.apellido ?? ""}`} />
        </div>
      </div>


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

      <Card>
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

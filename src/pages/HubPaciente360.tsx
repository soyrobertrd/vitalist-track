import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Phone, FileText, AlertTriangle, Calendar } from "lucide-react";
import { format } from "date-fns";

const iconMap: Record<string, any> = {
  visita: Calendar, llamada: Phone, orden_medica: FileText, alerta: AlertTriangle,
};

export default function HubPaciente360() {
  const { id } = useParams();
  const [paciente, setPaciente] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [p, t] = await Promise.all([
        supabase.from("pacientes").select("*").eq("id", id).maybeSingle(),
        supabase.rpc("paciente_timeline_360", { _paciente_id: id, _limite: 200 }),
      ]);
      setPaciente(p.data);
      setTimeline(Array.isArray(t.data) ? t.data : []);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="p-6">Cargando hub clínico...</div>;
  if (!paciente) return <div className="p-6">Paciente no encontrado</div>;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Activity className="h-7 w-7 text-primary" /> Hub Clínico 360°
        </h1>
        <p className="text-muted-foreground">{paciente.nombre} {paciente.apellido}</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Línea de tiempo cronológica</CardTitle></CardHeader>
        <CardContent>
          {timeline.length === 0 && <p className="text-sm text-muted-foreground">Sin eventos registrados.</p>}
          <div className="space-y-3">
            {timeline.map((e, i) => {
              const Icon = iconMap[e.tipo] || Activity;
              return (
                <div key={i} className="flex gap-3 items-start border-l-2 border-primary/30 pl-4 pb-2">
                  <Icon className="h-4 w-4 mt-1 text-primary shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{e.titulo}</p>
                      <Badge variant="outline" className="text-xs capitalize">{e.estado}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(e.fecha), "PPp")} · {e.tipo.replace("_", " ")}
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

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, Activity } from "lucide-react";

export default function PortalPacientePsico() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    (async () => {
      if (!token) return;
      const { data, error } = await supabase.rpc("leer_portal_paciente_por_token", { _token: token });
      if (error) setError(error.message);
      else setData(data);
      setLoading(false);
    })();
  }, [token]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-destructive p-6">{error}</div>;

  const paciente = data?.paciente || {};
  const sesiones = data?.proximas_sesiones || [];
  const evals = data?.evaluaciones_recientes || [];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <header>
          <h1 className="text-3xl font-bold">Portal del Paciente</h1>
          <p className="text-muted-foreground">{paciente.nombre} {paciente.apellido}</p>
        </header>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5"/>Próximas sesiones</CardTitle></CardHeader>
          <CardContent>
            {sesiones.length === 0 ? <p className="text-muted-foreground">Sin sesiones programadas.</p> :
              <ul className="space-y-2">
                {sesiones.map((s: any, i: number) => (
                  <li key={i} className="flex justify-between border-b pb-2">
                    <span>{s.fecha} · {s.hora}</span>
                    <Badge variant="outline">{s.modalidad}</Badge>
                  </li>
                ))}
              </ul>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5"/>Mis evaluaciones</CardTitle></CardHeader>
          <CardContent>
            {evals.length === 0 ? <p className="text-muted-foreground">Sin evaluaciones registradas.</p> :
              <ul className="space-y-2">
                {evals.map((e: any, i: number) => (
                  <li key={i} className="flex justify-between border-b pb-2">
                    <span>{e.escala} · {e.fecha}</span>
                    <Badge>{e.puntaje_total} ({e.severidad})</Badge>
                  </li>
                ))}
              </ul>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

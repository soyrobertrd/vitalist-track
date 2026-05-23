import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";
import { format } from "date-fns";

type Paciente = { id: string; nombre: string; apellido: string };

export default function GraficasProgresoEmocional({ pacientes }: { pacientes: Paciente[] }) {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const [pacienteId, setPacienteId] = useState<string>("");

  const { data: seguimiento = [] } = useQuery({
    queryKey: ["seg_emo_chart", wsId, pacienteId],
    enabled: !!wsId && !!pacienteId,
    queryFn: async () => {
      const { data } = await (supabase.from("seguimiento_emocional" as any) as any)
        .select("fecha,animo,ansiedad,sueno,estres,crisis_reciente")
        .eq("workspace_id", wsId!).eq("paciente_id", pacienteId)
        .order("fecha", { ascending: true }).limit(180);
      return (data || []) as any[];
    },
  });

  const { data: escalas = [] } = useQuery({
    queryKey: ["escalas_chart", wsId, pacienteId],
    enabled: !!wsId && !!pacienteId,
    queryFn: async () => {
      const { data } = await (supabase.from("evaluaciones_psicometricas" as any) as any)
        .select("fecha_aplicacion,escala,puntaje_total,severidad")
        .eq("workspace_id", wsId!).eq("paciente_id", pacienteId)
        .order("fecha_aplicacion", { ascending: true }).limit(180);
      return (data || []) as any[];
    },
  });

  const segData = useMemo(() => seguimiento.map((s: any) => ({
    fecha: format(new Date(s.fecha + "T12:00:00"), "dd/MM"),
    Ánimo: s.animo, Ansiedad: s.ansiedad, Sueño: s.sueno, Estrés: s.estres,
  })), [seguimiento]);

  const escalaSeries = useMemo(() => {
    const byEscala: Record<string, any[]> = {};
    escalas.forEach((e: any) => {
      const k = e.escala;
      if (!byEscala[k]) byEscala[k] = [];
      byEscala[k].push({ fecha: format(new Date(e.fecha_aplicacion + "T12:00:00"), "dd/MM"), puntaje: e.puntaje_total });
    });
    return byEscala;
  }, [escalas]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Filtros</CardTitle></CardHeader>
        <CardContent>
          <div className="max-w-md">
            <Label>Paciente</Label>
            <Select value={pacienteId} onValueChange={setPacienteId}>
              <SelectTrigger><SelectValue placeholder="Seleccionar paciente..." /></SelectTrigger>
              <SelectContent>{pacientes.map(p => (<SelectItem key={p.id} value={p.id}>{p.nombre} {p.apellido}</SelectItem>))}</SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {!pacienteId ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Selecciona un paciente para ver su progreso emocional</CardContent></Card>
      ) : (
        <>
          <Card>
            <CardHeader><CardTitle className="text-sm">Evolución diaria (ánimo, ansiedad, sueño, estrés)</CardTitle></CardHeader>
            <CardContent>
              {segData.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">Sin registros emocionales</p> : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={segData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="fecha" /><YAxis domain={[0, 10]} /><Tooltip /><Legend />
                    <Line type="monotone" dataKey="Ánimo" stroke="hsl(var(--primary))" strokeWidth={2} />
                    <Line type="monotone" dataKey="Ansiedad" stroke="hsl(var(--destructive))" strokeWidth={2} />
                    <Line type="monotone" dataKey="Sueño" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="Estrés" stroke="#f59e0b" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {Object.entries(escalaSeries).map(([escala, datos]) => (
            <Card key={escala}>
              <CardHeader><CardTitle className="text-sm">Evolución {escala.toUpperCase()}</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={datos}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="fecha" /><YAxis /><Tooltip />
                    <Line type="monotone" dataKey="puntaje" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}

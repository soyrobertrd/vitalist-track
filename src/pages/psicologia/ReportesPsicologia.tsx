import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Download, TrendingUp, Users, XCircle, Activity, BarChart3 } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";

function csv(rows: any[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const text = [
    headers.join(","),
    ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? "")).join(",")),
  ].join("\n");
  const blob = new Blob([text], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const today = new Date().toISOString().slice(0, 10);
const days = (n: number) => {
  const d = new Date(); d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

export default function ReportesPsicologia() {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const [desde, setDesde] = useState(days(90));
  const [hasta, setHasta] = useState(today);
  const [pacienteSel, setPacienteSel] = useState<string>("");

  const { data: pacientes = [] } = useQuery({
    queryKey: ["pac_psico_list", wsId],
    queryFn: async () => {
      const { data } = await supabase
        .from("pacientes_psicologia")
        .select("paciente_id, pacientes:paciente_id(id, nombre, apellido)")
        .eq("workspace_id", wsId);
      return (data || []).map((r: any) => ({
        id: r.pacientes?.id,
        label: `${r.pacientes?.nombre ?? ""} ${r.pacientes?.apellido ?? ""}`.trim(),
      })).filter((p: any) => p.id);
    },
    enabled: !!wsId,
  });

  const { data: asistencia = [] } = useQuery({
    queryKey: ["rep_asistencia", wsId, desde, hasta],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("reporte_asistencia_psicologia" as any, {
        _workspace_id: wsId, _desde: desde, _hasta: hasta,
      });
      if (error) throw error;
      return (data as any[]) || [];
    },
    enabled: !!wsId,
  });

  const { data: evolucion = [] } = useQuery({
    queryKey: ["rep_evolucion", pacienteSel],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("reporte_evolucion_escalas" as any, {
        _paciente_id: pacienteSel,
      });
      if (error) throw error;
      return (data as any[]) || [];
    },
    enabled: !!pacienteSel,
  });

  const { data: inactivos = [] } = useQuery({
    queryKey: ["rep_inactivos", wsId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("reporte_pacientes_inactivos_psico" as any, {
        _workspace_id: wsId, _meses: 3,
      });
      if (error) throw error;
      return (data as any[]) || [];
    },
    enabled: !!wsId,
  });

  const { data: cancelaciones = [] } = useQuery({
    queryKey: ["rep_cancel", wsId, desde, hasta],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("reporte_cancelaciones_psico" as any, {
        _workspace_id: wsId, _desde: desde, _hasta: hasta,
      });
      if (error) throw error;
      return (data as any[]) || [];
    },
    enabled: !!wsId,
  });

  const { data: retencion = [] } = useQuery({
    queryKey: ["rep_retencion", wsId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("reporte_retencion_terapeutica" as any, {
        _workspace_id: wsId, _desde: days(365),
      });
      if (error) throw error;
      return (data as any[]) || [];
    },
    enabled: !!wsId,
  });

  const evolucionData = useMemo(() => {
    const phq9 = evolucion.filter(e => e.escala === "phq9").map(e => ({ fecha: e.fecha?.slice(0,10), PHQ9: Number(e.puntaje) }));
    const gad7 = evolucion.filter(e => e.escala === "gad7").map(e => ({ fecha: e.fecha?.slice(0,10), GAD7: Number(e.puntaje) }));
    const fechas = new Set([...phq9.map(p=>p.fecha), ...gad7.map(g=>g.fecha)]);
    return Array.from(fechas).sort().map(f => ({
      fecha: f,
      PHQ9: phq9.find(p => p.fecha === f)?.PHQ9,
      GAD7: gad7.find(g => g.fecha === f)?.GAD7,
    }));
  }, [evolucion]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" /> Reportes clínicos · Psicología
          </h1>
          <p className="text-sm text-muted-foreground">
            Toda lectura de datos sensibles queda registrada en la bitácora de auditoría.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <Label>Desde</Label>
              <Input type="date" value={desde} onChange={e => setDesde(e.target.value)} className="w-40" />
            </div>
            <div>
              <Label>Hasta</Label>
              <Input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className="w-40" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="asistencia">
        <TabsList>
          <TabsTrigger value="asistencia"><Activity className="h-4 w-4 mr-1" />Asistencia</TabsTrigger>
          <TabsTrigger value="evolucion"><TrendingUp className="h-4 w-4 mr-1" />Evolución escalas</TabsTrigger>
          <TabsTrigger value="inactivos"><Users className="h-4 w-4 mr-1" />Inactivos</TabsTrigger>
          <TabsTrigger value="cancelaciones"><XCircle className="h-4 w-4 mr-1" />Cancelaciones</TabsTrigger>
          <TabsTrigger value="retencion">Retención</TabsTrigger>
        </TabsList>

        <TabsContent value="asistencia">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Asistencia por paciente</CardTitle>
              <Button size="sm" variant="outline" onClick={() => csv(asistencia, "asistencia.csv")}>
                <Download className="h-4 w-4 mr-1" />CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer>
                  <BarChart data={asistencia.slice(0, 15)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="paciente_nombre" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={70} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="asistidas" fill="hsl(var(--primary))" />
                    <Bar dataKey="no_show" fill="hsl(var(--destructive))" />
                    <Bar dataKey="canceladas" fill="hsl(var(--muted-foreground))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 max-h-64 overflow-auto border rounded">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr><th className="text-left p-2">Paciente</th><th>Total</th><th>Asistidas</th><th>No-show</th><th>Canceladas</th><th>% Asist.</th></tr>
                  </thead>
                  <tbody>
                    {asistencia.map((r:any) => (
                      <tr key={r.paciente_id} className="border-t">
                        <td className="p-2">{r.paciente_nombre}</td>
                        <td className="text-center">{r.total}</td>
                        <td className="text-center">{r.asistidas}</td>
                        <td className="text-center">{r.no_show}</td>
                        <td className="text-center">{r.canceladas}</td>
                        <td className="text-center font-medium">{r.pct_asistencia ?? 0}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evolucion">
          <Card>
            <CardHeader>
              <CardTitle>Evolución PHQ-9 / GAD-7</CardTitle>
              <div className="flex gap-2 items-center pt-2">
                <Label className="text-sm">Paciente:</Label>
                <Select value={pacienteSel} onValueChange={setPacienteSel}>
                  <SelectTrigger className="w-64"><SelectValue placeholder="Selecciona paciente" /></SelectTrigger>
                  <SelectContent>
                    {pacientes.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {!pacienteSel ? (
                <p className="text-sm text-muted-foreground">Selecciona un paciente para ver su evolución.</p>
              ) : evolucionData.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin evaluaciones registradas.</p>
              ) : (
                <div className="h-80">
                  <ResponsiveContainer>
                    <LineChart data={evolucionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="fecha" />
                      <YAxis domain={[0, 27]} />
                      <Tooltip />
                      <Legend />
                      <ReferenceLine y={10} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" label="moderado" />
                      <Line type="monotone" dataKey="PHQ9" stroke="hsl(var(--primary))" strokeWidth={2} dot />
                      <Line type="monotone" dataKey="GAD7" stroke="hsl(var(--destructive))" strokeWidth={2} dot />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inactivos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Pacientes inactivos (sin sesión {">"} 3 meses)</CardTitle>
              <Button size="sm" variant="outline" onClick={() => csv(inactivos, "inactivos.csv")}>
                <Download className="h-4 w-4 mr-1" />CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-auto border rounded">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr><th className="text-left p-2">Paciente</th><th>Última sesión</th><th>Días inactivo</th></tr>
                  </thead>
                  <tbody>
                    {inactivos.map((r:any) => (
                      <tr key={r.paciente_id} className="border-t">
                        <td className="p-2">{r.paciente_nombre}</td>
                        <td className="text-center">{r.ultima_sesion?.slice(0,10)}</td>
                        <td className="text-center">
                          <Badge variant={r.dias_sin_sesion > 180 ? "destructive" : "secondary"}>
                            {r.dias_sin_sesion}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cancelaciones">
          <Card>
            <CardHeader><CardTitle>Cancelaciones y no-show</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={cancelaciones}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="estado" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="cantidad" fill="hsl(var(--destructive))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="retencion">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Retención terapéutica (cohortes)</CardTitle>
              <Button size="sm" variant="outline" onClick={() => csv(retencion, "retencion.csv")}>
                <Download className="h-4 w-4 mr-1" />CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer>
                  <LineChart data={retencion}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="cohorte_mes" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="total_nuevos" stroke="hsl(var(--muted-foreground))" />
                    <Line type="monotone" dataKey="activos_30d" stroke="hsl(var(--primary))" />
                    <Line type="monotone" dataKey="activos_90d" stroke="hsl(var(--chart-2, 200 80% 50%))" />
                    <Line type="monotone" dataKey="activos_180d" stroke="hsl(var(--destructive))" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Brain, AlertTriangle, TrendingUp, Plus } from "lucide-react";

interface Props { verticalTipo: string; }

export default function VerticalIAPredictivaTab({ verticalTipo }: Props) {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;

  const { data: modelos = [] } = useQuery({
    queryKey: ["ia_modelos_predictivos", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await supabase
        .from("ia_modelos_predictivos")
        .select("*")
        .eq("workspace_id", wsId!)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: alertas = [] } = useQuery({
    queryKey: ["ia_alertas_tempranas", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await supabase
        .from("ia_alertas_tempranas")
        .select("*, pacientes(nombre, apellido), ia_modelos_predictivos(nombre)")
        .eq("workspace_id", wsId!)
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  const severidadColor: Record<string, string> = {
    baja: "bg-blue-100 text-blue-800",
    media: "bg-yellow-100 text-yellow-800",
    alta: "bg-orange-100 text-orange-800",
    critica: "bg-red-100 text-red-800",
  };

  const tipoModeloLabel: Record<string, string> = {
    riesgo_no_show: "Riesgo No-Show",
    riesgo_complicacion: "Riesgo Complicación",
    tendencia_poblacional: "Tendencia Poblacional",
    prediccion_demanda: "Predicción Demanda",
    abandono_tratamiento: "Abandono Tratamiento",
  };

  return (
    <Tabs defaultValue="modelos" className="space-y-4">
      <TabsList>
        <TabsTrigger value="modelos"><Brain className="h-4 w-4 mr-1" /> Modelos</TabsTrigger>
        <TabsTrigger value="alertas"><AlertTriangle className="h-4 w-4 mr-1" /> Alertas Tempranas</TabsTrigger>
        <TabsTrigger value="tendencias"><TrendingUp className="h-4 w-4 mr-1" /> Tendencias</TabsTrigger>
      </TabsList>

      <TabsContent value="modelos" className="space-y-4">
        <div className="flex justify-end">
          <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nuevo Modelo</Button>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {modelos.map((m: any) => (
            <Card key={m.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{m.nombre}</CardTitle>
                  <Badge className={m.activo ? "bg-green-100 text-green-800" : "bg-muted"}>{m.activo ? "Activo" : "Inactivo"}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <Badge variant="outline">{tipoModeloLabel[m.tipo] || m.tipo}</Badge>
                <p className="text-sm text-muted-foreground">{m.descripcion || "Sin descripción"}</p>
                {m.precision_score && (
                  <p className="text-sm">Precisión: <span className="font-semibold">{(Number(m.precision_score) * 100).toFixed(1)}%</span></p>
                )}
              </CardContent>
            </Card>
          ))}
          {modelos.length === 0 && <p className="text-sm text-muted-foreground col-span-2 py-8 text-center">No hay modelos configurados</p>}
        </div>
      </TabsContent>

      <TabsContent value="alertas" className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Paciente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Severidad</TableHead>
              <TableHead>Probabilidad</TableHead>
              <TableHead>Recomendación</TableHead>
              <TableHead>Revisada</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alertas.map((a: any) => (
              <TableRow key={a.id}>
                <TableCell>{a.pacientes ? `${a.pacientes.nombre} ${a.pacientes.apellido}` : "—"}</TableCell>
                <TableCell>{a.tipo_alerta}</TableCell>
                <TableCell><Badge className={severidadColor[a.severidad] || ""}>{a.severidad}</Badge></TableCell>
                <TableCell>{a.probabilidad ? `${(Number(a.probabilidad) * 100).toFixed(0)}%` : "—"}</TableCell>
                <TableCell className="max-w-[200px] truncate">{a.recomendacion || "—"}</TableCell>
                <TableCell>{a.revisada ? "✓" : "Pendiente"}</TableCell>
              </TableRow>
            ))}
            {alertas.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Sin alertas</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TabsContent>

      <TabsContent value="tendencias">
        <Card><CardContent className="py-8 text-center text-muted-foreground">Análisis de tendencias poblacionales y predicción de demanda — próximamente con dashboards interactivos</CardContent></Card>
      </TabsContent>
    </Tabs>
  );
}

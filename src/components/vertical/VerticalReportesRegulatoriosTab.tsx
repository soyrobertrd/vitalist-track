import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileBarChart, CalendarClock, Plus } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Props { verticalTipo: string; }

export default function VerticalReportesRegulatoriosTab({ verticalTipo }: Props) {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;

  const { data: reportes = [] } = useQuery({
    queryKey: ["reportes_regulatorios", wsId, verticalTipo],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await supabase
        .from("reportes_regulatorios")
        .select("*")
        .eq("workspace_id", wsId!)
        .eq("vertical_tipo", verticalTipo)
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  const { data: calendario = [] } = useQuery({
    queryKey: ["calendario_regulatorio", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await supabase
        .from("calendario_regulatorio")
        .select("*")
        .eq("workspace_id", wsId!)
        .order("entidad");
      return data || [];
    },
  });

  const estadoColor: Record<string, string> = {
    borrador: "bg-muted text-muted-foreground",
    generado: "bg-blue-100 text-blue-800",
    enviado: "bg-yellow-100 text-yellow-800",
    aceptado: "bg-green-100 text-green-800",
    rechazado: "bg-red-100 text-red-800",
  };

  return (
    <Tabs defaultValue="reportes" className="space-y-4">
      <TabsList>
        <TabsTrigger value="reportes"><FileBarChart className="h-4 w-4 mr-1" /> Reportes</TabsTrigger>
        <TabsTrigger value="calendario"><CalendarClock className="h-4 w-4 mr-1" /> Calendario</TabsTrigger>
      </TabsList>

      <TabsContent value="reportes" className="space-y-4">
        <div className="flex justify-end">
          <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nuevo Reporte</Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Entidad</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reportes.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.tipo_reporte}</TableCell>
                <TableCell><Badge variant="outline">{r.entidad_destino}</Badge></TableCell>
                <TableCell>{r.periodo_inicio && r.periodo_fin ? `${r.periodo_inicio} — ${r.periodo_fin}` : "—"}</TableCell>
                <TableCell>{r.fecha_vencimiento || "—"}</TableCell>
                <TableCell><Badge className={estadoColor[r.estado] || ""}>{r.estado}</Badge></TableCell>
              </TableRow>
            ))}
            {reportes.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Sin reportes</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TabsContent>

      <TabsContent value="calendario" className="space-y-4">
        <div className="flex justify-end">
          <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Agregar Vencimiento</Button>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {calendario.map((c: any) => (
            <Card key={c.id}>
              <CardContent className="py-4 space-y-1">
                <p className="font-medium text-sm">{c.nombre}</p>
                <p className="text-xs text-muted-foreground">{c.entidad} · {c.frecuencia}</p>
                <p className="text-xs">Vence día {c.dia_vencimiento} de cada período</p>
                <Badge className={c.activo ? "bg-green-100 text-green-800" : "bg-muted"}>{c.activo ? "Activo" : "Inactivo"}</Badge>
              </CardContent>
            </Card>
          ))}
          {calendario.length === 0 && <p className="text-sm text-muted-foreground col-span-3 py-8 text-center">Sin vencimientos configurados</p>}
        </div>
      </TabsContent>
    </Tabs>
  );
}

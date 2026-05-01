import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { DollarSign, TrendingUp, FileText, BarChart3, PieChart, Calculator } from "lucide-react";

interface Props {
  verticalTipo: "dental" | "estetica" | "recovery" | "vision";
}

const tiposReporte = [
  { value: "estado_resultados", label: "Estado de Resultados" },
  { value: "balance_general", label: "Balance General" },
  { value: "flujo_caja", label: "Flujo de Caja" },
  { value: "conciliacion", label: "Conciliación Bancaria" },
];

export default function VerticalFinanzasAvanzadasTab({ verticalTipo }: Props) {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const qc = useQueryClient();

  const [tipoReporte, setTipoReporte] = useState("estado_resultados");
  const [periodoInicio, setPeriodoInicio] = useState("");
  const [periodoFin, setPeriodoFin] = useState("");

  const { data: reportes = [] } = useQuery({
    queryKey: ["reportes_financieros_vertical", wsId, verticalTipo],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await (supabase.from("reportes_financieros_vertical") as any)
        .select("*").eq("workspace_id", wsId!).eq("vertical_tipo", verticalTipo).order("created_at", { ascending: false }).limit(20);
      return data || [];
    },
  });

  const { data: proyecciones = [] } = useQuery({
    queryKey: ["proyecciones_financieras", wsId, verticalTipo],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await (supabase.from("proyecciones_financieras") as any)
        .select("*").eq("workspace_id", wsId!).eq("vertical_tipo", verticalTipo).order("created_at", { ascending: false }).limit(20);
      return data || [];
    },
  });

  // Live financial summary from pagos_online_vertical
  const { data: resumenVivo } = useQuery({
    queryKey: ["resumen_financiero_vivo", wsId, verticalTipo],
    enabled: !!wsId,
    queryFn: async () => {
      const now = new Date();
      const startMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const startYear = new Date(now.getFullYear(), 0, 1).toISOString();

      const [mesQ, anoQ] = await Promise.all([
        (supabase as any).from("pagos_online_vertical").select("monto").eq("workspace_id", wsId!).eq("vertical_tipo", verticalTipo).eq("estado", "completado").gte("created_at", startMonth),
        (supabase as any).from("pagos_online_vertical").select("monto").eq("workspace_id", wsId!).eq("vertical_tipo", verticalTipo).eq("estado", "completado").gte("created_at", startYear),
      ]);

      const ingresosMes = (mesQ.data || []).reduce((s: number, p: any) => s + (p.monto || 0), 0);
      const ingresosAno = (anoQ.data || []).reduce((s: number, p: any) => s + (p.monto || 0), 0);
      return { ingresosMes, ingresosAno, txMes: (mesQ.data || []).length, txAno: (anoQ.data || []).length };
    },
  });

  const generarReporte = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await (supabase.from("reportes_financieros_vertical") as any).insert({
        workspace_id: wsId, vertical_tipo: verticalTipo, tipo_reporte: tipoReporte,
        periodo_inicio: periodoInicio, periodo_fin: periodoFin,
        datos: { generado: new Date().toISOString() },
        totales: { ingresos: resumenVivo?.ingresosMes || 0 },
        generado_por: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Reporte generado"); qc.invalidateQueries({ queryKey: ["reportes_financieros_vertical"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const stats = resumenVivo || { ingresosMes: 0, ingresosAno: 0, txMes: 0, txAno: 0 };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2"><DollarSign className="h-5 w-5" /> Reportes Financieros Avanzados</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1"><DollarSign className="h-4 w-4 text-green-600" /><span className="text-xs text-muted-foreground">Ingresos mes</span></div>
          <p className="text-2xl font-bold">${stats.ingresosMes.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">{stats.txMes} transacciones</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1"><TrendingUp className="h-4 w-4 text-blue-600" /><span className="text-xs text-muted-foreground">Ingresos año</span></div>
          <p className="text-2xl font-bold">${stats.ingresosAno.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">{stats.txAno} transacciones</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1"><FileText className="h-4 w-4 text-purple-600" /><span className="text-xs text-muted-foreground">Reportes generados</span></div>
          <p className="text-2xl font-bold">{reportes.length}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1"><BarChart3 className="h-4 w-4 text-orange-600" /><span className="text-xs text-muted-foreground">Proyecciones</span></div>
          <p className="text-2xl font-bold">{proyecciones.length}</p>
        </Card>
      </div>

      <Tabs defaultValue="generar">
        <TabsList>
          <TabsTrigger value="generar">Generar reporte</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
          <TabsTrigger value="proyecciones">Proyecciones</TabsTrigger>
        </TabsList>

        <TabsContent value="generar">
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div>
                <Label>Tipo de reporte</Label>
                <Select value={tipoReporte} onValueChange={setTipoReporte}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {tiposReporte.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Desde</Label><Input type="date" value={periodoInicio} onChange={e => setPeriodoInicio(e.target.value)} /></div>
              <div><Label>Hasta</Label><Input type="date" value={periodoFin} onChange={e => setPeriodoFin(e.target.value)} /></div>
              <Button onClick={() => generarReporte.mutate()} disabled={!periodoInicio || !periodoFin}>
                <Calculator className="h-4 w-4 mr-1" /> Generar
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="historial">
          {reportes.length > 0 ? (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead><TableHead>Período</TableHead><TableHead>Totales</TableHead><TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportes.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell><Badge variant="outline">{tiposReporte.find(t => t.value === r.tipo_reporte)?.label || r.tipo_reporte}</Badge></TableCell>
                      <TableCell className="text-sm">{r.periodo_inicio} → {r.periodo_fin}</TableCell>
                      <TableCell className="text-sm font-medium">${(r.totales?.ingresos || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-sm">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <Card className="p-6 text-center"><PieChart className="h-8 w-8 mx-auto mb-2 text-muted-foreground" /><p className="text-muted-foreground">Sin reportes generados aún.</p></Card>
          )}
        </TabsContent>

        <TabsContent value="proyecciones">
          {proyecciones.length > 0 ? (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead><TableHead>Período</TableHead><TableHead>Proyectado</TableHead><TableHead>Real</TableHead><TableHead>Variación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proyecciones.map((p: any) => {
                    const variacion = p.valor_real ? ((p.valor_real - p.valor_proyectado) / p.valor_proyectado * 100).toFixed(1) : null;
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="capitalize">{p.tipo}</TableCell>
                        <TableCell>{p.periodo}</TableCell>
                        <TableCell>${p.valor_proyectado?.toLocaleString()}</TableCell>
                        <TableCell>{p.valor_real ? `$${p.valor_real.toLocaleString()}` : "—"}</TableCell>
                        <TableCell>{variacion ? <span className={Number(variacion) >= 0 ? "text-green-600" : "text-destructive"}>{variacion}%</span> : "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <Card className="p-6 text-center"><TrendingUp className="h-8 w-8 mx-auto mb-2 text-muted-foreground" /><p className="text-muted-foreground">Sin proyecciones financieras.</p></Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

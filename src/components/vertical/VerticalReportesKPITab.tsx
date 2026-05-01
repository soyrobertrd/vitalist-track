import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, Users, DollarSign, Clock, BarChart3, Target } from "lucide-react";

interface Props {
  verticalTipo: "dental" | "estetica" | "recovery" | "vision";
}

const kpiLabels: Record<string, { label: string; icon: typeof TrendingUp; color: string }> = {
  ingresos_mes: { label: "Ingresos del mes", icon: DollarSign, color: "text-green-600" },
  pacientes_nuevos: { label: "Pacientes nuevos", icon: Users, color: "text-blue-600" },
  tasa_retencion: { label: "Tasa retención", icon: Target, color: "text-purple-600" },
  ticket_promedio: { label: "Ticket promedio", icon: DollarSign, color: "text-yellow-600" },
  citas_completadas: { label: "Citas completadas", icon: Clock, color: "text-primary" },
  ocupacion: { label: "Ocupación", icon: BarChart3, color: "text-orange-600" },
  cancelaciones: { label: "Cancelaciones", icon: TrendingUp, color: "text-red-600" },
  productividad_profesional: { label: "Productividad profesional", icon: Users, color: "text-teal-600" },
};

export default function VerticalReportesKPITab({ verticalTipo }: Props) {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;

  const { data: kpis = [] } = useQuery({
    queryKey: ["reportes_kpi_vertical", wsId, verticalTipo],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await (supabase.from("reportes_kpi_vertical") as any)
        .select("*").eq("workspace_id", wsId!).eq("vertical_tipo", verticalTipo)
        .order("created_at", { ascending: false }).limit(100);
      return data || [];
    },
  });

  // Compute live KPIs from existing vertical data
  const { data: liveStats } = useQuery({
    queryKey: ["live_kpis_vertical", wsId, verticalTipo],
    enabled: !!wsId,
    queryFn: async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const citasQ = (supabase as any).from("citas_vertical").select("id, estado", { count: "exact" }).eq("workspace_id", wsId!).eq("vertical_tipo", verticalTipo).gte("created_at", startOfMonth);
      const leadsQ = (supabase as any).from("leads_vertical").select("id", { count: "exact" }).eq("workspace_id", wsId!).eq("vertical_tipo", verticalTipo).gte("created_at", startOfMonth);
      const pagosQ = (supabase as any).from("pagos_online_vertical").select("monto").eq("workspace_id", wsId!).eq("vertical_tipo", verticalTipo).eq("estado", "completado").gte("created_at", startOfMonth);
      const [citas, leads, pagos] = await Promise.all([citasQ, leadsQ, pagosQ] as any[]);

      const totalCitas = citas.count || 0;
      const completadas = (citas.data || []).filter((c: any) => c.estado === "completada").length;
      const canceladas = (citas.data || []).filter((c: any) => c.estado === "cancelada").length;
      const ingresos = (pagos.data || []).reduce((s: number, p: any) => s + (p.monto || 0), 0);

      return {
        totalCitas,
        completadas,
        canceladas,
        leadsNuevos: leads.count || 0,
        ingresos,
        tasaCompletacion: totalCitas > 0 ? Math.round((completadas / totalCitas) * 100) : 0,
        tasaCancelacion: totalCitas > 0 ? Math.round((canceladas / totalCitas) * 100) : 0,
      };
    },
  });

  const stats = liveStats || { totalCitas: 0, completadas: 0, canceladas: 0, leadsNuevos: 0, ingresos: 0, tasaCompletacion: 0, tasaCancelacion: 0 };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Dashboard KPIs — {verticalTipo}</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1"><DollarSign className="h-4 w-4 text-green-600" /><span className="text-xs text-muted-foreground">Ingresos mes</span></div>
          <p className="text-2xl font-bold">${stats.ingresos.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1"><Clock className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Citas mes</span></div>
          <p className="text-2xl font-bold">{stats.totalCitas}</p>
          <p className="text-xs text-muted-foreground">{stats.completadas} completadas</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1"><Target className="h-4 w-4 text-purple-600" /><span className="text-xs text-muted-foreground">Tasa completación</span></div>
          <p className="text-2xl font-bold">{stats.tasaCompletacion}%</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1"><Users className="h-4 w-4 text-blue-600" /><span className="text-xs text-muted-foreground">Leads nuevos</span></div>
          <p className="text-2xl font-bold">{stats.leadsNuevos}</p>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="text-sm font-medium mb-2">Cancelaciones</p>
          <p className="text-3xl font-bold text-destructive">{stats.canceladas}</p>
          <p className="text-xs text-muted-foreground">Tasa: {stats.tasaCancelacion}%</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-medium mb-2">Productividad</p>
          <p className="text-3xl font-bold text-green-600">{stats.completadas}</p>
          <p className="text-xs text-muted-foreground">Citas completadas este mes</p>
        </Card>
      </div>

      {kpis.length > 0 && (
        <>
          <h4 className="text-sm font-semibold mt-6">Histórico KPIs</h4>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>KPI</TableHead><TableHead>Valor</TableHead><TableHead>Período</TableHead><TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kpis.map((k: any) => {
                  const info = kpiLabels[k.tipo_kpi];
                  return (
                    <TableRow key={k.id}>
                      <TableCell className="font-medium">{info?.label || k.tipo_kpi}</TableCell>
                      <TableCell>{k.valor}</TableCell>
                      <TableCell><Badge variant="outline">{k.periodo}</Badge></TableCell>
                      <TableCell className="text-sm">{new Date(k.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}

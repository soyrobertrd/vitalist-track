import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Users, CalendarCheck, DollarSign, Target } from "lucide-react";

interface Props {
  verticalTipo: "dental" | "estetica" | "recovery" | "vision";
}

export default function VerticalBITab({ verticalTipo }: Props) {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;

  const { data: metricas = [] } = useQuery({
    queryKey: ["metricas_bi_vertical", wsId, verticalTipo],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await (supabase.from("metricas_bi_vertical") as any).select("*").eq("workspace_id", wsId!).eq("vertical_tipo", verticalTipo).order("periodo", { ascending: false }).limit(12);
      return data || [];
    },
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["leads_bi_stats", wsId, verticalTipo],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await (supabase.from("leads_vertical") as any).select("estado, valor_estimado").eq("workspace_id", wsId!).eq("vertical_tipo", verticalTipo);
      return data || [];
    },
  });

  const { data: pagos = [] } = useQuery({
    queryKey: ["pagos_bi_stats", wsId, verticalTipo],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await (supabase.from("pagos_online_vertical") as any).select("monto, estado, metodo").eq("workspace_id", wsId!).eq("vertical_tipo", verticalTipo).eq("estado", "completado");
      return data || [];
    },
  });

  const totalIngresos = metricas.reduce((s: number, m: any) => s + parseFloat(m.ingresos || 0), 0);
  const totalGastos = metricas.reduce((s: number, m: any) => s + parseFloat(m.gastos || 0), 0);
  const totalCitas = metricas.reduce((s: number, m: any) => s + (m.citas_completadas || 0), 0);
  const totalPacientesNuevos = metricas.reduce((s: number, m: any) => s + (m.pacientes_nuevos || 0), 0);
  const leadsConvertidos = leads.filter((l: any) => l.estado === "convertido").length;
  const tasaConversion = leads.length > 0 ? ((leadsConvertidos / leads.length) * 100).toFixed(1) : "0";
  const totalPagosOnline = pagos.reduce((s: number, p: any) => s + parseFloat(p.monto || 0), 0);
  const ultimaMetrica = metricas[0];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Dashboard BI</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2"><DollarSign className="h-5 w-5 text-green-500" /><span className="text-sm text-muted-foreground">Ingresos</span></div>
          <div className="text-2xl font-bold">RD${totalIngresos.toLocaleString()}</div>
          {totalGastos > 0 && <div className="text-xs text-muted-foreground mt-1">Margen: RD${(totalIngresos - totalGastos).toLocaleString()}</div>}
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2"><CalendarCheck className="h-5 w-5 text-blue-500" /><span className="text-sm text-muted-foreground">Citas completadas</span></div>
          <div className="text-2xl font-bold">{totalCitas}</div>
          {ultimaMetrica && <div className="text-xs text-muted-foreground mt-1">Ticket prom: RD${parseFloat(ultimaMetrica.ticket_promedio || 0).toLocaleString()}</div>}
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2"><Users className="h-5 w-5 text-purple-500" /><span className="text-sm text-muted-foreground">Pacientes nuevos</span></div>
          <div className="text-2xl font-bold">{totalPacientesNuevos}</div>
          {ultimaMetrica && <div className="text-xs text-muted-foreground mt-1">Retención: {parseFloat(ultimaMetrica.tasa_retencion || 0)}%</div>}
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2"><Target className="h-5 w-5 text-orange-500" /><span className="text-sm text-muted-foreground">Conversión leads</span></div>
          <div className="text-2xl font-bold">{tasaConversion}%</div>
          <div className="text-xs text-muted-foreground mt-1">{leadsConvertidos}/{leads.length} leads</div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h4 className="font-semibold mb-3">Pagos online recibidos</h4>
          <div className="text-3xl font-bold text-green-600">RD${totalPagosOnline.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground mt-1">{pagos.length} transacciones completadas</div>
          {pagos.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {["tarjeta", "transferencia", "efectivo", "stripe"].map(m => {
                const count = pagos.filter((p: any) => p.metodo === m).length;
                if (!count) return null;
                return <Badge key={m} variant="outline">{m}: {count}</Badge>;
              })}
            </div>
          )}
        </Card>
        <Card className="p-4">
          <h4 className="font-semibold mb-3">Métricas por período</h4>
          {metricas.length > 0 ? (
            <div className="space-y-2 max-h-[200px] overflow-auto">
              {metricas.map((m: any) => (
                <div key={m.id} className="flex justify-between items-center text-sm border-b pb-1">
                  <span>{new Date(m.periodo + "T12:00:00").toLocaleDateString("es-DO", { month: "short", year: "numeric" })}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-green-600 inline-flex items-center gap-1"><TrendingUp className="h-3 w-3" />RD${parseFloat(m.ingresos).toLocaleString()}</span>
                    <span className="text-red-500 inline-flex items-center gap-1"><TrendingDown className="h-3 w-3" />RD${parseFloat(m.gastos).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Sin datos de métricas aún</p>
          )}
        </Card>
      </div>
    </div>
  );
}

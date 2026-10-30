import { useEffect, useState } from "react";
import { db } from "@/integrations/db/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, AlertTriangle, Star, Users } from "lucide-react";
import { toast } from "sonner";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";

export default function PerfilValorPacientes() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await db
        .from("perfil_valor_paciente" as any)
        .select("*")
        .order("ltv_total", { ascending: false })
        .limit(50);
      if (error) toast.error(error.message);
      setData((data as any[]) || []);
      setLoading(false);
    })();
  }, []);

  const totalLTV = data.reduce((s, d) => s + Number(d.ltv_total || 0), 0);
  const vips = data.filter(d => d.nivel_engagement === "vip").length;
  const enRiesgo = data.filter(d => d.riesgo_churn === "alto").length;

  return (
    <div className="p-6 space-y-6">
      <ClinicalPageHeader title="Perfil de valor (LTV)" subtitle="Análisis del valor de vida de cada paciente y riesgo de pérdida." icon={TrendingUp} />

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-4"><div className="flex items-center gap-3"><TrendingUp className="h-8 w-8 text-emerald-500" /><div><div className="text-sm text-muted-foreground">LTV total</div><div className="text-2xl font-bold">${totalLTV.toFixed(0)}</div></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><Star className="h-8 w-8 text-amber-500" /><div><div className="text-sm text-muted-foreground">Pacientes VIP</div><div className="text-2xl font-bold">{vips}</div></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><AlertTriangle className="h-8 w-8 text-red-500" /><div><div className="text-sm text-muted-foreground">Riesgo de churn</div><div className="text-2xl font-bold">{enRiesgo}</div></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><Users className="h-8 w-8 text-primary" /><div><div className="text-sm text-muted-foreground">Pacientes analizados</div><div className="text-2xl font-bold">{data.length}</div></div></div></Card>
      </div>

      <Card className="p-4">
        <h2 className="font-semibold mb-3">Top 50 por LTV</h2>
        {loading ? <p className="text-muted-foreground">Cargando…</p> : data.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aún no se han generado perfiles de valor. Se calculan automáticamente al acumular historial de visitas y facturación.</p>
        ) : (
          <div className="space-y-2">
            {data.map(p => (
              <div key={p.paciente_id} className="border rounded-lg p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">Paciente {String(p.paciente_id).slice(0,8)}</div>
                  <div className="text-xs text-muted-foreground">LTV: ${Number(p.ltv_total).toFixed(2)} · {p.visitas_totales} visitas · NPS {p.nps_promedio || "—"}</div>
                </div>
                <div className="flex gap-2">
                  <Badge variant={p.nivel_engagement === "vip" ? "default" : "outline"}>{p.nivel_engagement}</Badge>
                  <Badge variant={p.riesgo_churn === "alto" ? "destructive" : "outline"}>Churn: {p.riesgo_churn}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Activity, AlertTriangle, ArchiveX, BellRing, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

interface Salud {
  alertas_activas: number;
  alertas_criticas: number;
  candidatos_anonimizar: number;
  recordatorios_pendientes: number;
  ultimos_crons: Array<{
    job_name: string;
    exitoso: boolean;
    duracion_ms: number | null;
    resultado: any;
    error: string | null;
    ejecutado_en: string;
  }>;
  generado_en: string;
}

const JOBS_ESPERADOS = [
  { name: "auditoria-deteccion-cron", label: "Detección sospechosos", freq: "1h" },
  { name: "recordatorios-automaticos-cron", label: "Recordatorios automáticos", freq: "30m" },
  { name: "aplicar-retencion-cron", label: "Política de retención", freq: "Diario 03:00" },
];

export function PanelSaludSistema() {
  const [data, setData] = useState<Salud | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);

  const cargar = async () => {
    setLoading(true);
    const { data: r, error } = await supabase.rpc("estadisticas_salud_sistema");
    if (error) toast.error(error.message);
    else setData(r as unknown as Salud);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const ejecutar = async (job: string) => {
    setRunning(job);
    try {
      const { error } = await supabase.functions.invoke(job, { body: {} });
      if (error) throw error;
      toast.success(`Ejecutado: ${job}`);
      await cargar();
    } catch (e: any) {
      toast.error(`Error: ${e.message}`);
    } finally {
      setRunning(null);
    }
  };

  const ultimoPorJob = (job: string) =>
    data?.ultimos_crons?.find((c) => c.job_name === job);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Salud del sistema</h3>
          <p className="text-sm text-muted-foreground">Monitoreo de procesos automáticos</p>
        </div>
        <Button variant="outline" size="sm" onClick={cargar} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> Alertas activas</CardDescription>
            <CardTitle className="text-3xl">{data?.alertas_activas ?? "—"}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {data?.alertas_criticas ?? 0} críticas
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><BellRing className="h-4 w-4" /> Recordatorios 24h</CardDescription>
            <CardTitle className="text-3xl">{data?.recordatorios_pendientes ?? "—"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><ArchiveX className="h-4 w-4" /> Para anonimizar</CardDescription>
            <CardTitle className="text-3xl">{data?.candidatos_anonimizar ?? "—"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><Activity className="h-4 w-4" /> Crons saludables</CardDescription>
            <CardTitle className="text-3xl">
              {data?.ultimos_crons?.filter((c) => c.exitoso).length ?? 0}/{JOBS_ESPERADOS.length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Procesos programados</CardTitle>
          <CardDescription>Ejecuta manualmente o revisa la última corrida</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {JOBS_ESPERADOS.map((j) => {
            const ult = ultimoPorJob(j.name);
            return (
              <div key={j.name} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{j.label}</span>
                    <Badge variant="outline" className="text-xs">{j.freq}</Badge>
                    {ult ? (
                      ult.exitoso
                        ? <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30"><CheckCircle2 className="h-3 w-3 mr-1" />OK</Badge>
                        : <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Falla</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">Sin ejecuciones</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ult
                      ? `Última: ${format(new Date(ult.ejecutado_en), "dd/MM HH:mm", { locale: es })} · ${ult.duracion_ms ?? 0}ms`
                      : "Aún no se ha ejecutado"}
                    {ult?.error && <span className="text-destructive"> · {ult.error}</span>}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={running === j.name}
                  onClick={() => ejecutar(j.name)}
                >
                  {running === j.name ? "Ejecutando…" : "Ejecutar ahora"}
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

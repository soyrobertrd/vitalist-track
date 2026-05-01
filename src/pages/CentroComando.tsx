import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity, AlertTriangle, FileText, BedDouble, Video, ShieldAlert,
  Network, CloudOff, RefreshCw,
} from "lucide-react";
import { Link } from "react-router-dom";

interface Metricas {
  alertas: Record<string, number>;
  ordenes_medicas: { pendientes: number; urgentes: number; total_hoy: number };
  camas: { ocupadas?: number; disponibles?: number; mantenimiento?: number };
  telemedicina_activa: number;
  eventos_adversos_abiertos: number;
  fhir_jobs_pendientes: number;
  sync_offline_pendiente: number;
  generado_at: string;
}

export default function CentroComando() {
  const { currentWorkspace } = useWorkspace();
  const [data, setData] = useState<Metricas | null>(null);
  const [loading, setLoading] = useState(true);

  const cargar = async () => {
    if (!currentWorkspace) return;
    setLoading(true);
    const { data, error } = await supabase.rpc("centro_comando_metricas", {
      _workspace_id: currentWorkspace.id,
    });
    if (!error && data) setData(data as unknown as Metricas);
    setLoading(false);
  };

  useEffect(() => {
    cargar();
    const t = setInterval(cargar, 30000);
    return () => clearInterval(t);
  }, [currentWorkspace?.id]);

  if (!currentWorkspace) return <div className="p-6">Selecciona un workspace</div>;
  if (loading && !data) return <div className="p-6">Cargando centro de comando...</div>;

  const totalAlertas = data ? Object.values(data.alertas || {}).reduce((a, b) => a + Number(b), 0) : 0;
  const criticas = Number(data?.alertas?.critica || 0);

  const tiles = [
    {
      title: "Alertas activas", value: totalAlertas, sub: `${criticas} críticas`,
      icon: AlertTriangle, to: "/alertas-clinicas",
      tone: criticas > 0 ? "border-destructive/60 bg-destructive/5" : "",
    },
    {
      title: "Órdenes pendientes", value: data?.ordenes_medicas?.pendientes ?? 0,
      sub: `${data?.ordenes_medicas?.urgentes ?? 0} urgentes`,
      icon: FileText, to: "/ordenes-medicas",
    },
    {
      title: "Camas ocupadas",
      value: data?.camas?.ocupadas ?? 0,
      sub: `${data?.camas?.disponibles ?? 0} disponibles`,
      icon: BedDouble, to: "/censo-camas",
    },
    {
      title: "Telemedicina", value: data?.telemedicina_activa ?? 0,
      sub: "sesiones activas / programadas", icon: Video, to: "/centro-telemedicina",
    },
    {
      title: "Eventos adversos", value: data?.eventos_adversos_abiertos ?? 0,
      sub: "abiertos / en investigación", icon: ShieldAlert, to: "/gestion-calidad",
    },
    {
      title: "FHIR jobs", value: data?.fhir_jobs_pendientes ?? 0,
      sub: "exportaciones pendientes", icon: Network, to: "/interoperabilidad",
    },
    {
      title: "Sync offline", value: data?.sync_offline_pendiente ?? 0,
      sub: "operaciones por sincronizar", icon: CloudOff, to: "/pwa-offline",
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-7 w-7 text-primary" /> Centro de Comando Clínico
          </h1>
          <p className="text-sm text-muted-foreground">
            Vista unificada en tiempo real · actualiza cada 30s
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={cargar}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refrescar
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <Link key={t.title} to={t.to}>
              <Card className={`hover:shadow-md transition cursor-pointer ${t.tone || ""}`}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{t.title}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{t.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{t.sub}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader><CardTitle>Distribución de alertas por severidad</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {Object.keys(data?.alertas || {}).length === 0 && (
            <p className="text-sm text-muted-foreground">Sin alertas activas.</p>
          )}
          {Object.entries(data?.alertas || {}).map(([sev, cnt]) => (
            <Badge
              key={sev}
              variant={sev === "critica" ? "destructive" : "outline"}
              className="text-sm py-1 px-3"
            >
              {sev}: {String(cnt)}
            </Badge>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

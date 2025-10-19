import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Phone, CheckCircle2, TrendingUp, Clock, AlertCircle } from "lucide-react";

interface Indicadores {
  total_llamadas: number;
  llamadas_realizadas: number;
  llamadas_contactadas: number;
  tasa_contacto: number;
  duracion_promedio: number;
  requieren_seguimiento: number;
  llamadas_pendientes: number;
  llamadas_canceladas: number;
}

export function IndicadoresLlamadas() {
  const [indicadores, setIndicadores] = useState<Indicadores | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIndicadores();
  }, []);

  const fetchIndicadores = async () => {
    try {
      const { data, error } = await supabase.rpc('calcular_indicadores_llamadas', {
        profesional_uuid: null, // null para todos los profesionales
        fecha_inicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // últimos 30 días
        fecha_fin: new Date().toISOString(),
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setIndicadores(data[0]);
      }
    } catch (error) {
      console.error("Error al obtener indicadores:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!indicadores) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Llamadas</CardTitle>
          <Phone className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{indicadores.total_llamadas}</div>
          <p className="text-xs text-muted-foreground">Últimos 30 días</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Realizadas</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{indicadores.llamadas_realizadas}</div>
          <p className="text-xs text-muted-foreground">
            {indicadores.llamadas_contactadas} contactadas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tasa de Contacto</CardTitle>
          <TrendingUp className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{indicadores.tasa_contacto || 0}%</div>
          <p className="text-xs text-muted-foreground">De llamadas realizadas</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Duración Promedio</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {indicadores.duracion_promedio || 0} min
          </div>
          <p className="text-xs text-muted-foreground">Por llamada</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Seguimiento</CardTitle>
          <AlertCircle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{indicadores.requieren_seguimiento}</div>
          <p className="text-xs text-muted-foreground">
            {indicadores.llamadas_pendientes} pendientes
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

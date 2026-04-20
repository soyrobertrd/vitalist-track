import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { optimizarRutas, generarGoogleMapsUrl, VisitaPunto } from "@/lib/routeOptimizer";
import {
  MapPin,
  Route,
  Navigation2,
  Clock,
  User,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

const RutasOptimizadas = () => {
  const [fecha, setFecha] = useState(format(new Date(), "yyyy-MM-dd"));
  const [profesionalId, setProfesionalId] = useState<string>("all");
  const [profesionales, setProfesionales] = useState<any[]>([]);
  const [visitas, setVisitas] = useState<VisitaPunto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase
      .from("personal_salud")
      .select("id, nombre, apellido")
      .eq("activo", true)
      .order("nombre")
      .then(({ data }) => setProfesionales(data || []));
  }, []);

  useEffect(() => {
    cargarVisitas();
  }, [fecha, profesionalId]);

  const cargarVisitas = async () => {
    setLoading(true);
    let query = supabase
      .from("control_visitas")
      .select(
        "id, fecha_hora_visita, motivo_visita, tipo_visita, estado, pacientes(nombre, apellido, zona, barrio, direccion_domicilio, latitud, longitud)"
      )
      .gte("fecha_hora_visita", `${fecha}T00:00:00`)
      .lt("fecha_hora_visita", `${fecha}T23:59:59`)
      .eq("tipo_visita", "Domicilio")
      .neq("estado", "cancelada");

    if (profesionalId !== "all") {
      query = query.eq("profesional_id", profesionalId);
    }

    const { data, error } = await query;
    setLoading(false);
    if (error) {
      toast.error("Error cargando visitas");
      return;
    }

    const mapped: VisitaPunto[] = (data || []).map((v: any) => ({
      id: v.id,
      paciente: v.pacientes ? `${v.pacientes.nombre} ${v.pacientes.apellido}` : "Sin paciente",
      zona: v.pacientes?.zona || null,
      barrio: v.pacientes?.barrio || null,
      direccion: v.pacientes?.direccion_domicilio || null,
      latitud: v.pacientes?.latitud ?? null,
      longitud: v.pacientes?.longitud ?? null,
      hora: v.fecha_hora_visita,
      motivo: v.motivo_visita || "Visita domiciliaria",
    }));

    setVisitas(mapped);
  };

  const rutas = useMemo(() => optimizarRutas(visitas), [visitas]);

  const totalParadas = visitas.length;
  const totalConCoords = visitas.filter((v) => v.latitud && v.longitud).length;
  const distanciaTotal = rutas.reduce((sum, r) => sum + r.distanciaTotalKm, 0);

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Route className="h-7 w-7 text-primary" />
          Rutas Optimizadas
        </h1>
        <p className="text-muted-foreground">
          Visitas domiciliarias agrupadas por zona y ordenadas por proximidad geográfica
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Fecha</Label>
            <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Profesional</Label>
            <Select value={profesionalId} onValueChange={setProfesionalId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {profesionales.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nombre} {p.apellido}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1 grid grid-cols-3 gap-2">
              <div className="text-center p-2 rounded bg-muted">
                <div className="text-xl font-bold">{totalParadas}</div>
                <div className="text-xs text-muted-foreground">Paradas</div>
              </div>
              <div className="text-center p-2 rounded bg-muted">
                <div className="text-xl font-bold">{rutas.length}</div>
                <div className="text-xs text-muted-foreground">Zonas</div>
              </div>
              <div className="text-center p-2 rounded bg-muted">
                <div className="text-xl font-bold">{distanciaTotal.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">km total</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {totalConCoords < totalParadas && totalParadas > 0 && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="pt-4 text-sm">
            <Sparkles className="h-4 w-4 inline mr-1 text-amber-600" />
            <strong>{totalParadas - totalConCoords}</strong> visita(s) sin coordenadas geográficas — no se incluirán en la optimización por distancia. Edita el paciente para agregar latitud/longitud.
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : rutas.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground py-12">
            <Route className="h-12 w-12 mx-auto mb-3 opacity-30" />
            No hay visitas domiciliarias agendadas para esta fecha.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {rutas.map((ruta) => (
            <Card key={ruta.zona}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    {ruta.zona}
                  </CardTitle>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary">{ruta.paradas.length} paradas</Badge>
                    {ruta.distanciaTotalKm > 0 && (
                      <Badge variant="outline">
                        {ruta.distanciaTotalKm} km recorrido
                      </Badge>
                    )}
                  </div>
                </div>
                {ruta.paradas.some((p) => p.latitud && p.longitud) && (
                  <Button
                    variant="default"
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      const url = generarGoogleMapsUrl(ruta.paradas);
                      if (url) window.open(url, "_blank");
                    }}
                  >
                    <Navigation2 className="h-4 w-4" />
                    Abrir en Maps
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <ol className="space-y-2">
                  {ruta.paradas.map((p, idx) => (
                    <li
                      key={p.id}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{p.paciente}</span>
                          <Badge variant="outline" className="gap-1 text-xs">
                            <Clock className="h-3 w-3" />
                            {format(new Date(p.hora), "HH:mm")}
                          </Badge>
                          {!p.latitud && (
                            <Badge variant="destructive" className="text-xs">
                              Sin coordenadas
                            </Badge>
                          )}
                        </div>
                        {p.barrio && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {p.barrio} {p.direccion ? `· ${p.direccion}` : ""}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground italic mt-0.5">
                          {p.motivo}
                        </p>
                      </div>
                      {p.latitud && p.longitud && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            window.open(
                              `https://www.google.com/maps/dir/?api=1&destination=${p.latitud},${p.longitud}`,
                              "_blank"
                            )
                          }
                        >
                          <Navigation2 className="h-4 w-4" />
                        </Button>
                      )}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default RutasOptimizadas;

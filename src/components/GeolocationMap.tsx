import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Users, Route, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PacienteCercano {
  id: string;
  nombre: string;
  apellido: string;
  direccion_domicilio: string | null;
  barrio: string | null;
  zona: string | null;
  distancia?: number;
}

interface GeolocationMapProps {
  profesionalId?: string;
  fecha?: Date;
}

export function GeolocationMap({ profesionalId, fecha = new Date() }: GeolocationMapProps) {
  const [pacientes, setPacientes] = useState<PacienteCercano[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    fetchVisitasDelDia();
    getUserLocation();
  }, [profesionalId, fecha]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log("Geolocation not available:", error);
        }
      );
    }
  };

  const fetchVisitasDelDia = async () => {
    setLoading(true);
    const startOfDay = new Date(fecha);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(fecha);
    endOfDay.setHours(23, 59, 59, 999);

    let query = supabase
      .from("control_visitas")
      .select(`
        id,
        fecha_hora_visita,
        tipo_visita,
        estado,
        pacientes!control_visitas_paciente_id_fkey(
          id, nombre, apellido, direccion_domicilio, barrio, zona
        )
      `)
      .gte("fecha_hora_visita", startOfDay.toISOString())
      .lte("fecha_hora_visita", endOfDay.toISOString())
      .eq("estado", "pendiente")
      .eq("tipo_visita", "domicilio");

    if (profesionalId) {
      query = query.eq("profesional_id", profesionalId);
    }

    const { data, error } = await query;

    if (error) {
      toast.error("Error al cargar visitas");
    } else {
      const pacientesUnicos = (data || [])
        .filter((v: any) => v.pacientes)
        .map((v: any) => ({
          id: v.pacientes.id,
          nombre: v.pacientes.nombre,
          apellido: v.pacientes.apellido,
          direccion_domicilio: v.pacientes.direccion_domicilio,
          barrio: v.pacientes.barrio,
          zona: v.pacientes.zona
        }));
      
      // Eliminar duplicados
      const uniqueMap = new Map();
      pacientesUnicos.forEach((p: PacienteCercano) => uniqueMap.set(p.id, p));
      setPacientes(Array.from(uniqueMap.values()));
    }
    setLoading(false);
  };

  const openInGoogleMaps = (direccion: string) => {
    const encodedAddress = encodeURIComponent(direccion + ", Santo Domingo, República Dominicana");
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  };

  const openRouteInGoogleMaps = () => {
    if (pacientes.length === 0) return;
    
    const addresses = pacientes
      .filter(p => p.direccion_domicilio)
      .map(p => encodeURIComponent(p.direccion_domicilio + ", Santo Domingo, RD"))
      .join('/');
    
    let url = 'https://www.google.com/maps/dir/';
    if (userLocation) {
      url += `${userLocation.lat},${userLocation.lng}/`;
    }
    url += addresses;
    
    window.open(url, '_blank');
  };

  const zonaLabels: Record<string, string> = {
    "santo_domingo_oeste": "Santo Domingo Oeste",
    "santo_domingo_este": "Santo Domingo Este", 
    "santo_domingo_norte": "Santo Domingo Norte",
    "distrito_nacional": "Distrito Nacional"
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Visitas del Día - Geolocalización
          </CardTitle>
          <div className="flex gap-2">
            {userLocation && (
              <Badge variant="outline" className="gap-1">
                <Navigation className="h-3 w-3" />
                Ubicación activa
              </Badge>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={openRouteInGoogleMaps}
              disabled={pacientes.length === 0}
            >
              <Route className="h-4 w-4 mr-1" />
              Optimizar Ruta
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : pacientes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No hay visitas domiciliarias pendientes para hoy</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Users className="h-4 w-4" />
              <span>{pacientes.length} visitas programadas</span>
            </div>
            
            <div className="grid gap-3">
              {pacientes.map((paciente, index) => (
                <div 
                  key={paciente.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{paciente.nombre} {paciente.apellido}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{paciente.direccion_domicilio || 'Sin dirección'}</span>
                      </div>
                      {(paciente.barrio || paciente.zona) && (
                        <div className="flex gap-2 mt-1">
                          {paciente.barrio && (
                            <Badge variant="outline" className="text-xs">{paciente.barrio}</Badge>
                          )}
                          {paciente.zona && (
                            <Badge variant="secondary" className="text-xs">
                              {zonaLabels[paciente.zona] || paciente.zona}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {paciente.direccion_domicilio && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openInGoogleMaps(paciente.direccion_domicilio!)}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

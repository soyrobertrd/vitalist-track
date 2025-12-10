import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Navigation, Users, Route, ExternalLink, Calendar, AlertCircle, Edit2, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface VisitaConPaciente {
  id: string;
  visitaId: string;
  nombre: string;
  apellido: string;
  direccion_domicilio: string | null;
  barrio: string | null;
  zona: string | null;
  hora: string;
  latitud?: number | null;
  longitud?: number | null;
}

interface GeolocationMapProps {
  profesionalId?: string;
  fecha?: Date;
}

export function GeolocationMap({ profesionalId, fecha: initialFecha }: GeolocationMapProps) {
  const [fecha, setFecha] = useState<Date>(initialFecha || new Date());
  const [visitas, setVisitas] = useState<VisitaConPaciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [editingCoords, setEditingCoords] = useState<string | null>(null);
  const [coordsForm, setCoordsForm] = useState<{ lat: string; lng: string }>({ lat: '', lng: '' });

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
      .eq("tipo_visita", "domicilio")
      .order("fecha_hora_visita", { ascending: true });

    if (profesionalId) {
      query = query.eq("profesional_id", profesionalId);
    }

    const { data, error } = await query;

    if (error) {
      toast.error("Error al cargar visitas");
      console.error(error);
    } else {
      const visitasFormateadas = (data || [])
        .filter((v: any) => v.pacientes)
        .map((v: any) => ({
          id: v.pacientes.id,
          visitaId: v.id,
          nombre: v.pacientes.nombre,
          apellido: v.pacientes.apellido,
          direccion_domicilio: v.pacientes.direccion_domicilio,
          barrio: v.pacientes.barrio,
          zona: v.pacientes.zona,
          hora: format(new Date(v.fecha_hora_visita), "HH:mm"),
          latitud: null,
          longitud: null,
        }));
      
      setVisitas(visitasFormateadas);
    }
    setLoading(false);
  };

  const openInGoogleMaps = (visita: VisitaConPaciente) => {
    if (visita.latitud && visita.longitud) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${visita.latitud},${visita.longitud}`, '_blank');
    } else if (visita.direccion_domicilio) {
      const encodedAddress = encodeURIComponent(visita.direccion_domicilio + ", Santo Domingo, República Dominicana");
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
    }
  };

  const openRouteInGoogleMaps = () => {
    if (visitas.length === 0) return;
    
    const waypoints = visitas
      .filter(v => v.direccion_domicilio || (v.latitud && v.longitud))
      .map(v => {
        if (v.latitud && v.longitud) {
          return `${v.latitud},${v.longitud}`;
        }
        return encodeURIComponent(v.direccion_domicilio + ", Santo Domingo, RD");
      })
      .join('/');
    
    let url = 'https://www.google.com/maps/dir/';
    if (userLocation) {
      url += `${userLocation.lat},${userLocation.lng}/`;
    }
    url += waypoints;
    
    window.open(url, '_blank');
  };

  const handleEditCoords = (visita: VisitaConPaciente) => {
    setEditingCoords(visita.id);
    setCoordsForm({
      lat: visita.latitud?.toString() || '',
      lng: visita.longitud?.toString() || ''
    });
  };

  const handleSaveCoords = (pacienteId: string) => {
    const lat = parseFloat(coordsForm.lat);
    const lng = parseFloat(coordsForm.lng);
    
    if (coordsForm.lat && coordsForm.lng && (isNaN(lat) || isNaN(lng))) {
      toast.error("Las coordenadas deben ser números válidos");
      return;
    }

    setVisitas(prev => prev.map(v => 
      v.id === pacienteId 
        ? { ...v, latitud: lat || null, longitud: lng || null }
        : v
    ));
    
    setEditingCoords(null);
    toast.success("Coordenadas actualizadas");
  };

  const zonaLabels: Record<string, string> = {
    "santo_domingo_oeste": "Santo Domingo Oeste",
    "santo_domingo_este": "Santo Domingo Este", 
    "santo_domingo_norte": "Santo Domingo Norte",
    "distrito_nacional": "Distrito Nacional"
  };

  const hasVisitas = visitas.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Visitas del Día - Geolocalización
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  {format(fecha, "d MMM yyyy", { locale: es })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarPicker
                  mode="single"
                  selected={fecha}
                  onSelect={(date) => date && setFecha(date)}
                  locale={es}
                />
              </PopoverContent>
            </Popover>
            
            {userLocation && (
              <Badge variant="outline" className="gap-1">
                <Navigation className="h-3 w-3" />
                Ubicación activa
              </Badge>
            )}
            
            <Button 
              variant="default" 
              size="sm"
              onClick={openRouteInGoogleMaps}
              disabled={!hasVisitas}
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
        ) : !hasVisitas ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-lg font-medium text-muted-foreground">
              No hay visitas domiciliarias programadas
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              para el {format(fecha, "EEEE d 'de' MMMM", { locale: es })}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{visitas.length} visita{visitas.length > 1 ? 's' : ''} programada{visitas.length > 1 ? 's' : ''}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {format(fecha, "EEEE d 'de' MMMM", { locale: es })}
              </p>
            </div>
            
            <div className="grid gap-3">
              {visitas.map((visita, index) => (
                <div 
                  key={visita.visitaId}
                  className="flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{visita.nombre} {visita.apellido}</p>
                        <Badge variant="secondary" className="text-xs">{visita.hora}</Badge>
                      </div>
                      
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span>{visita.direccion_domicilio || 'Sin dirección registrada'}</span>
                      </div>
                      
                      {(visita.barrio || visita.zona) && (
                        <div className="flex flex-wrap gap-2">
                          {visita.barrio && (
                            <Badge variant="outline" className="text-xs">{visita.barrio}</Badge>
                          )}
                          {visita.zona && (
                            <Badge variant="secondary" className="text-xs">
                              {zonaLabels[visita.zona] || visita.zona}
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      {/* Coordenadas */}
                      {editingCoords === visita.id ? (
                        <div className="flex items-center gap-2 mt-2">
                          <Input
                            placeholder="Latitud"
                            value={coordsForm.lat}
                            onChange={(e) => setCoordsForm(prev => ({ ...prev, lat: e.target.value }))}
                            className="w-28 h-7 text-xs"
                          />
                          <Input
                            placeholder="Longitud"
                            value={coordsForm.lng}
                            onChange={(e) => setCoordsForm(prev => ({ ...prev, lng: e.target.value }))}
                            className="w-28 h-7 text-xs"
                          />
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleSaveCoords(visita.id)}>
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingCoords(null)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mt-1">
                          {visita.latitud && visita.longitud ? (
                            <Badge variant="outline" className="text-xs gap-1">
                              <Navigation className="h-3 w-3" />
                              {visita.latitud.toFixed(4)}, {visita.longitud.toFixed(4)}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">Sin coordenadas</span>
                          )}
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-6 px-2 text-xs"
                            onClick={() => handleEditCoords(visita)}
                          >
                            <Edit2 className="h-3 w-3 mr-1" />
                            {visita.latitud ? 'Editar' : 'Agregar'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {(visita.direccion_domicilio || (visita.latitud && visita.longitud)) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openInGoogleMaps(visita)}
                      className="flex-shrink-0"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Ver mapa
                    </Button>
                  )}
                </div>
              ))}
            </div>
            
            <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <Navigation className="h-4 w-4" />
                <strong>Tip:</strong> Agrega coordenadas para obtener direcciones más precisas en Google Maps.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

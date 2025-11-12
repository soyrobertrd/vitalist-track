import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Phone } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

interface NearbyPatient {
  id: string;
  nombre: string;
  apellido: string;
  barrio: string;
  zona: string;
  fecha_proxima_visita: string;
  contacto_px: string;
  numero_principal: string;
  daysUntilVisit: number;
}

interface NearbyPatientsRecommendationProps {
  currentPatientId: string;
  barrio?: string;
  zona?: string;
  onSelectPatient: (patientId: string) => void;
}

export function NearbyPatientsRecommendation({
  currentPatientId,
  barrio,
  zona,
  onSelectPatient,
}: NearbyPatientsRecommendationProps) {
  const [nearbyPatients, setNearbyPatients] = useState<NearbyPatient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNearbyPatients = async () => {
      if (!barrio && !zona) {
        setLoading(false);
        return;
      }

      try {
        const today = new Date();
        const tenDaysFromNow = new Date();
        tenDaysFromNow.setDate(today.getDate() + 10);

        let query = supabase
          .from("pacientes")
          .select(`
            id,
            nombre,
            apellido,
            barrio,
            zona,
            contacto_px,
            numero_principal,
            parametros_seguimiento!inner(fecha_proxima_visita_prog)
          `)
          .neq("id", currentPatientId)
          .eq("status_px", "activo")
          .lte("parametros_seguimiento.fecha_proxima_visita_prog", tenDaysFromNow.toISOString());

        if (barrio) {
          query = query.eq("barrio", barrio);
        } else if (zona) {
          query = query.eq("zona", zona as any);
        }

        const { data, error } = await query.limit(5);

        if (error) throw error;

        const patientsWithDays = data?.map((patient: any) => {
          const nextVisit = new Date(patient.parametros_seguimiento[0]?.fecha_proxima_visita_prog);
          return {
            id: patient.id,
            nombre: patient.nombre,
            apellido: patient.apellido,
            barrio: patient.barrio,
            zona: patient.zona,
            contacto_px: patient.contacto_px,
            numero_principal: patient.numero_principal,
            fecha_proxima_visita: patient.parametros_seguimiento[0]?.fecha_proxima_visita_prog,
            daysUntilVisit: differenceInDays(nextVisit, today),
          };
        }) || [];

        patientsWithDays.sort((a, b) => a.daysUntilVisit - b.daysUntilVisit);
        setNearbyPatients(patientsWithDays);
      } catch (error) {
        console.error("Error fetching nearby patients:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNearbyPatients();
  }, [currentPatientId, barrio, zona]);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Cargando recomendaciones...</div>;
  }

  if (nearbyPatients.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Pacientes Cercanos
        </CardTitle>
        <CardDescription>
          Pacientes en {barrio || zona} con visitas próximas (próximos 10 días)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {nearbyPatients.map((patient) => (
          <div
            key={patient.id}
            className="flex items-center justify-between p-3 bg-background rounded-lg border hover:border-primary/50 transition-colors"
          >
            <div className="flex-1">
              <div className="font-medium text-foreground">
                {patient.nombre} {patient.apellido}
              </div>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{patient.barrio || patient.zona}</span>
                {patient.numero_principal && (
                  <>
                    <Phone className="h-3 w-3 ml-2" />
                    <a 
                      href={`tel:${patient.numero_principal}`}
                      className="hover:text-primary"
                    >
                      {patient.numero_principal}
                    </a>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={patient.daysUntilVisit <= 3 ? "destructive" : "secondary"}>
                <Calendar className="h-3 w-3 mr-1" />
                {patient.daysUntilVisit === 0
                  ? "Hoy"
                  : patient.daysUntilVisit === 1
                  ? "Mañana"
                  : `${patient.daysUntilVisit} días`}
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onSelectPatient(patient.id)}
              >
                Ver
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

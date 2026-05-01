import { CalendarView } from "@/components/CalendarView";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { GeolocationMap } from "@/components/GeolocationMap";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin } from "lucide-react";
import { AgendarCitaButton } from "@/components/AgendarCitaButton";
import { useVertical } from "@/contexts/VerticalContext";

const VERTICALES_DOMICILIO = new Set(["clinica", "recovery", "todas"]);

const Calendario = () => {
  const { verticalActiva } = useVertical();
  const mostrarMapa = VERTICALES_DOMICILIO.has(verticalActiva);

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Calendario</h1>
          <p className="text-muted-foreground">Vista de citas semanales y mensuales{mostrarMapa ? " con geolocalización" : ""}</p>
        </div>
        <AgendarCitaButton />
      </div>

      <Tabs defaultValue="calendario" className="w-full">
        <TabsList>
          <TabsTrigger value="calendario" className="gap-2">
            <Calendar className="h-4 w-4" />
            Calendario
          </TabsTrigger>
          {mostrarMapa && (
            <TabsTrigger value="mapa" className="gap-2">
              <MapPin className="h-4 w-4" />
              Mapa de Visitas
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="calendario" className="mt-4">
          <CalendarView
            onEventClick={(event) => {
              console.log("Event clicked:", event);
            }}
          />
        </TabsContent>

        {mostrarMapa && (
          <TabsContent value="mapa" className="mt-4">
            <GeolocationMap />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Calendario;

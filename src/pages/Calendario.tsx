import { CalendarView } from "@/components/CalendarView";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { GeolocationMap } from "@/components/GeolocationMap";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin } from "lucide-react";

const Calendario = () => {
  return (
    <div className="space-y-6">
      <Breadcrumbs />
      
      <div>
        <h1 className="text-3xl font-bold">Calendario</h1>
        <p className="text-muted-foreground">Vista de citas semanales y mensuales con geolocalización</p>
      </div>

      <Tabs defaultValue="calendario" className="w-full">
        <TabsList>
          <TabsTrigger value="calendario" className="gap-2">
            <Calendar className="h-4 w-4" />
            Calendario
          </TabsTrigger>
          <TabsTrigger value="mapa" className="gap-2">
            <MapPin className="h-4 w-4" />
            Mapa de Visitas
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="calendario" className="mt-4">
          <CalendarView
            onEventClick={(event) => {
              console.log("Event clicked:", event);
            }}
          />
        </TabsContent>
        
        <TabsContent value="mapa" className="mt-4">
          <GeolocationMap />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Calendario;

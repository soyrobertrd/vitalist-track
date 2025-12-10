import { CalendarView } from "@/components/CalendarView";
import { Breadcrumbs } from "@/components/Breadcrumbs";

const Calendario = () => {
  return (
    <div className="space-y-6">
      <Breadcrumbs />
      
      <div>
        <h1 className="text-3xl font-bold">Calendario</h1>
        <p className="text-muted-foreground">Vista de citas semanales y mensuales</p>
      </div>

      <CalendarView
        onEventClick={(event) => {
          console.log("Event clicked:", event);
        }}
      />
    </div>
  );
};

export default Calendario;

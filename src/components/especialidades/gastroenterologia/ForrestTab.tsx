import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Flame } from "lucide-react";
import { toast } from "sonner";

export type ForrestClass = "Ia" | "Ib" | "IIa" | "IIb" | "IIc" | "III";

interface ForrestTabProps {
  selForrest: ForrestClass;
  setSelForrest: (f: ForrestClass) => void;
  infoForrest: {
    recidiva: string;
    descripcion: string;
    conducta: string;
    badgeColor: string;
  };
  onAsignarConsulta: (f: ForrestClass) => void;
}

export function ForrestTab({
  selForrest,
  setSelForrest,
  infoForrest,
  onAsignarConsulta,
}: ForrestTabProps) {
  return (
    <Card className="rounded-2xl border-border/80 bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Flame className="h-5 w-5 text-amber-600" />
          Clasificación de Forrest para Úlcera Péptica Sangrante
        </CardTitle>
        <CardDescription>
          Estratificación endoscópica del riesgo de resangrado y necesidad de terapéutica endoscópica combinada.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {(["Ia", "Ib", "IIa", "IIb", "IIc", "III"] as const).map((f) => (
            <Button
              key={f}
              variant={selForrest === f ? "default" : "outline"}
              className={`rounded-xl text-xs font-bold py-5 ${
                selForrest === f ? "bg-amber-600 hover:bg-amber-700 text-white" : ""
              }`}
              onClick={() => setSelForrest(f)}
            >
              Forrest {f}
            </Button>
          ))}
        </div>

        {/* Detalle de Forrest Seleccionado */}
        <div className="p-6 rounded-2xl border border-border/80 bg-muted/20 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-extrabold text-foreground">Forrest {selForrest}</span>
              <Badge className={infoForrest.badgeColor}>{infoForrest.recidiva}</Badge>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <strong className="text-foreground block text-sm">Descripción Macroscópica Endoscópica:</strong>
              <p className="text-muted-foreground mt-0.5 text-xs">{infoForrest.descripcion}</p>
            </div>

            <div className="p-3.5 bg-background rounded-xl border border-border/80 space-y-1">
              <strong className="text-foreground block text-sm">Conducta Médica & Endoscópica:</strong>
              <p className="text-muted-foreground leading-relaxed text-xs">{infoForrest.conducta}</p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="rounded-xl text-xs"
            onClick={() => {
              onAsignarConsulta(selForrest);
              toast.info(`Clasificación Forrest ${selForrest} seleccionada para nueva consulta.`);
            }}
          >
            Asignar a Formulario de Consulta
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
